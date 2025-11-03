from datetime import datetime
import time
from celery_app import celery_app
from services.bluesky import fetch_posts
from services.analysis import analyze_posts, analyze_sentiment
from services.database_service import (
    create_collection_run, 
    complete_collection_run, 
    save_posts, 
    save_analysis,
    get_existing_post_ids
)
from services.archive_service import ArchiveService
from services.alert_generator import generate_alerts as generate_alerts_service
from services.alert_queue_manager import (
    manage_alert_queue as manage_alert_queue_service,
)
from services.alert_cleanup import cleanup_old_alerts as cleanup_old_alerts_service
from services.logging_service import logging_service
import json
import re
import os
import asyncio
from typing import Dict, List

# Disaster type configuration with hashtags
DISASTER_CONFIG: Dict[str, List[str]] = {
    "earthquake": ["#earthquake", "#quake", "#seismic"],
    "hurricane": ["#hurricane", "#cyclone", "#tropicalstorm"],
    "flood": ["#flood", "#flooding", "#flashflood"],
    "wildfire": ["#wildfire", "#forestfire", "#bushfire"],
    "tornado": ["#tornado", "#twister"]
}


def _log_task_async(coro):
    """Helper to run async logging in sync context"""
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(coro)
    except Exception as e:
        print(f"Failed to log task: {e}")

@celery_app.task(name="tasks.collect_and_analyze")
def collect_and_analyze(include_enhanced: bool = True):
    """Main task to collect and analyze BlueSky data for multiple disaster types
    
    Args:
        include_enhanced: Whether to collect enhanced post data (profile info, engagement, etc.)
    """
    start_time = time.time()
    task_name = "collect_and_analyze"
    
    print(f"\n{'='*50}")
    print(f"Starting Multi-Disaster BlueSky collection - {datetime.now()}")
    if include_enhanced:
        print("Enhanced data collection enabled")
    print(f"{'='*50}\n")

    # Log task start
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(
        logging_service.log_task_execution(
            task_name=task_name,
            status="started",
            duration_ms=0,
            result={"include_enhanced": include_enhanced},
        )
    )

    run = create_collection_run()
    total_posts = []
    posts_by_disaster = {}

    try:
        # Collect posts for each disaster type
        seen_post_ids = set()  # Track unique posts across all disaster types
        session_data = None  # Reuse session across requests

        for disaster_type, hashtags in DISASTER_CONFIG.items():
            print(f"\n🔍 Monitoring {disaster_type.upper()} events...")
            disaster_posts = []

            for hashtag in hashtags:
                try:
                    # Pass our set of seen IDs and session for global deduplication
                    posts, seen_post_ids, session_data = fetch_posts(hashtag, seen_post_ids, session_data, include_enhanced)
                    # Tag posts with disaster type
                    for post in posts:
                        post["disaster_type"] = disaster_type
                    disaster_posts.extend(posts)
                    print(f"✓ Found {len(posts)} unique posts for {hashtag}")
                except Exception as e:
                    print(f"⚠️ Error fetching {hashtag}: {str(e)}")
                    continue

            posts_by_disaster[disaster_type] = disaster_posts
            total_posts.extend(disaster_posts)
            print(f"Total {disaster_type} posts: {len(disaster_posts)}")

        # First check which posts are new
        all_post_uris = [post.get("uri", "") for post in total_posts]
        existing_ids = get_existing_post_ids(all_post_uris)

        # Filter out posts that already exist
        new_posts = [post for post in total_posts if post.get("uri") not in existing_ids]
        print(f"\n🔍 Found {len(new_posts)} new posts out of {len(total_posts)} total fetched")

        # Only run sentiment analysis on new posts
        sentiment_data = {}
        if new_posts:
            print(f"\n🧠 Running sentiment analysis on {len(new_posts)} new posts...")
            sentiment_response = analyze_sentiment(new_posts)
            try:
                cleaned = re.sub(r"^```json\s*", "", sentiment_response)
                cleaned = re.sub(r"\s*```$", "", cleaned)
                sentiment_data = json.loads(cleaned.strip())
                print(f"✅ Sentiment analysis completed for {len(sentiment_data)} posts")
            except json.JSONDecodeError as e:
                print(f"⚠️ Failed to parse sentiment data: {e}")
                sentiment_data = {}

        # Save posts for each disaster type
        total_saved = 0
        saved_posts = []
        for disaster_type, posts in posts_by_disaster.items():
            # Only process posts that are new
            new_disaster_posts = [p for p in posts if p.get("uri") not in existing_ids]
            if new_disaster_posts:
                saved_count, new_saved_posts = save_posts(new_disaster_posts, run.id, sentiment_data, disaster_type)
                total_saved += saved_count
                saved_posts.extend(new_saved_posts)
                print(f"📝 Saved {saved_count} new {disaster_type} posts (from {len(posts)} fetched)")

        print(f"\nTotal saved: {total_saved} new posts (from {len(total_posts)} fetched)")

        # Run analysis if we have new posts
        if saved_posts:
            print(f"🤖 Running disaster analysis on {len(saved_posts)} new posts...")
            analysis = analyze_posts(saved_posts)
            if analysis:
                save_analysis(analysis, run.id, saved_posts)
                print(f"✅ Disaster analysis completed")
            else:
                print(f"⚠️ Disaster analysis returned no results")
        else:
            print(f"⏭️ Skipped disaster analysis - no new posts")
            analysis = None

        complete_collection_run(run.id, total_saved, "completed")

        print(f"\n[{datetime.now()}] Multi-Disaster job completed successfully!")

        # Return detailed results
        results = {
            "status": "success",
            "run_id": run.id,
            "total_posts_fetched": len(total_posts),
            "total_posts_saved": total_saved,
            "sentiment_analyzed": len(sentiment_data),
            "posts_by_disaster": {
                disaster: len(posts) for disaster, posts in posts_by_disaster.items()
            },
            "ai_analysis_ran": total_saved > 0,
            "analysis_preview": (
                analysis[:200] if analysis else "Skipped - no new posts"
            ),
        }

        # Log successful completion
        duration_ms = int((time.time() - start_time) * 1000)
        loop.run_until_complete(
            logging_service.log_task_execution(
                task_name=task_name,
                status="completed",
                duration_ms=duration_ms,
                result=results,
            )
        )
        
        # Log data collection metrics
        loop.run_until_complete(
            logging_service.log_data_collection(
                collection_type="bluesky_multi_disaster",
                status="completed",
                items_collected=total_saved,
                duration_ms=duration_ms,
                details={
                    "total_fetched": len(total_posts),
                    "posts_by_disaster": results["posts_by_disaster"],
                },
            )
        )

        return results
    except Exception as e:
        error_msg = f"Error in multi-disaster collection: {str(e)}"
        complete_collection_run(run.id, 0, "failed", error_msg)
        print(f"\n[{datetime.now()}] {error_msg}")
        
        # Log task failure
        duration_ms = int((time.time() - start_time) * 1000)
        loop.run_until_complete(
            logging_service.log_task_execution(
                task_name=task_name,
                status="failed",
                duration_ms=duration_ms,
                error=str(e),
            )
        )
        
        raise


@celery_app.task(name="tasks.generate_alerts")
def generate_alerts():
    """Celery task wrapper for alert generation"""
    start_time = time.time()
    _log_task_async(logging_service.log_task_execution("generate_alerts", "started", 0))
    
    try:
        result = generate_alerts_service()
        duration_ms = int((time.time() - start_time) * 1000)
        _log_task_async(logging_service.log_task_execution("generate_alerts", "completed", duration_ms, result=result))
        return result
    except Exception as e:
        duration_ms = int((time.time() - start_time) * 1000)
        _log_task_async(logging_service.log_task_execution("generate_alerts", "failed", duration_ms, error=str(e)))
        raise


@celery_app.task(name="tasks.manage_alert_queue")
def manage_alert_queue():
    """Celery task wrapper for alert queue management"""
    start_time = time.time()
    _log_task_async(logging_service.log_task_execution("manage_alert_queue", "started", 0))
    
    try:
        result = manage_alert_queue_service()
        duration_ms = int((time.time() - start_time) * 1000)
        _log_task_async(logging_service.log_task_execution("manage_alert_queue", "completed", duration_ms, result=result))
        return result
    except Exception as e:
        duration_ms = int((time.time() - start_time) * 1000)
        _log_task_async(logging_service.log_task_execution("manage_alert_queue", "failed", duration_ms, error=str(e)))
        raise


@celery_app.task(name="tasks.send_alert_emails")
def send_alert_emails():
    """Process alert queue and send emails for pending alerts

    Runs every 2 minutes to:
    - Find pending alerts with email_enabled users
    - Send email notifications
    - Update queue status (sent/failed)
    """
    from db_utils.db import AlertQueue, Alert, UserAlertPreferences, SessionLocal
    from services.email_service import send_alert_email
    import logging

    logger = logging.getLogger(__name__)
    db = SessionLocal()

    try:
        logger.info("Starting alert email processing job")

        # Claim a batch of pending alerts with row-level locking to prevent duplicate sends
        pending_entries = (
            db.query(AlertQueue)
            .join(Alert, AlertQueue.alert_id == Alert.id)
            .join(
                UserAlertPreferences, AlertQueue.user_id == UserAlertPreferences.user_id
            )
            .filter(
                AlertQueue.status == "pending",
                UserAlertPreferences.email_enabled == True,
                AlertQueue.retry_count < AlertQueue.max_retries,
            )
            .order_by(AlertQueue.priority, AlertQueue.scheduled_at)
            .limit(50)
            .with_for_update(skip_locked=True)
            .all()
        )
        
        # Mark claimed entries as processing before sending
        for entry in pending_entries:
            entry.status = "processing"
            entry.updated_at = datetime.utcnow()
            db.add(entry)
        
        if pending_entries:
            db.flush()

        logger.info(f"Found {len(pending_entries)} pending alerts with email enabled")

        sent_count = 0
        failed_count = 0

        for entry in pending_entries:
            try:
                # Get alert details
                alert = db.query(Alert).filter(Alert.id == entry.alert_id).first()
                if not alert:
                    logger.warning(f"Alert {entry.alert_id} not found, skipping")
                    continue

                # Get user preferences to check email_min_severity
                user_prefs = (
                    db.query(UserAlertPreferences)
                    .filter(UserAlertPreferences.user_id == entry.user_id)
                    .first()
                )

                # Check if alert severity meets email threshold
                if user_prefs and alert.severity < user_prefs.email_min_severity:
                    logger.info(
                        f"Skipping email for alert {alert.id}: severity {alert.severity} < email_min_severity {user_prefs.email_min_severity}"
                    )
                    entry.status = "skipped"
                    entry.updated_at = datetime.utcnow()
                    db.add(entry)
                    continue

                # Extract metadata
                metadata = alert.alert_metadata or {}
                location = metadata.get("location", "Unknown Location")
                latitude = metadata.get("latitude")
                longitude = metadata.get("longitude")

                # Send email
                result = send_alert_email(
                    to_email=entry.recipient_email,
                    recipient_name=entry.recipient_name or "User",
                    alert_title=alert.title,
                    alert_message=alert.message,
                    alert_type=alert.alert_type,
                    severity=alert.severity,
                    location=location,
                    latitude=latitude,
                    longitude=longitude,
                    user_id=entry.user_id,
                    alert_id=alert.id,
                )

                if result.get("success"):
                    entry.status = "sent"
                    entry.sent_at = datetime.utcnow()
                    sent_count += 1
                    logger.info(f"✅ Sent alert email user_id={entry.user_id} alert_id={alert.id}")
                else:
                    entry.status = "failed"
                    entry.retry_count += 1
                    entry.error_message = result.get("error", "Unknown error")
                    
                    # Mark as dead if max retries exceeded
                    if entry.retry_count >= entry.max_retries:
                        entry.status = "dead"
                    
                    failed_count += 1
                    logger.error(
                        "❌ Failed to send alert email user_id=%s alert_id=%s error=%s",
                        entry.user_id, alert.id, result.get("error")
                    )

                entry.updated_at = datetime.utcnow()
                db.add(entry)

            except Exception as e:
                logger.exception("Error processing alert entry_id=%s", entry.id)
                entry.status = "failed"
                entry.retry_count += 1
                entry.error_message = str(e)
                
                # Mark as dead if max retries exceeded
                if entry.retry_count >= entry.max_retries:
                    entry.status = "dead"
                
                entry.updated_at = datetime.utcnow()
                db.add(entry)
                failed_count += 1
                continue

        db.commit()
        logger.info("Alert email processing completed: sent=%d failed=%d", sent_count, failed_count)

        return {
            "status": "success",
            "sent": sent_count,
            "failed": failed_count,
            "total_processed": len(pending_entries),
        }

    except Exception as e:
        db.rollback()
        logger.error(f"Error in alert email processing: {str(e)}")
        raise
    finally:
        db.close()


@celery_app.task(name="tasks.cleanup_old_alerts")
def cleanup_old_alerts():
    """Celery task wrapper for alert cleanup"""
    return cleanup_old_alerts_service()


@celery_app.task(name="tasks.archive_completed_disasters")
def archive_completed_disasters(days_threshold: int = 2):
    """
    Archive disasters that have been completed for more than the specified number of days.
    
    Args:
        days_threshold: Number of days after completion before a disaster is archived.
                       Default is 2 days to keep the dashboard focused on current events
                       while allowing time for final updates and verifications.
    """
    archive_service = None
    try:
        archive_service = ArchiveService()
        completed_disasters = archive_service.get_completed_disasters(days_threshold)

        results = {
            "total_disasters": len(completed_disasters),
            "archived": 0,
            "failed": 0,
            "details": []
        }

        for disaster in completed_disasters:
            try:
                success = archive_service.archive_disaster(disaster.id)
                if success:
                    results["archived"] += 1
                    results["details"].append(
                        {"disaster_id": disaster.id, "status": "archived"}
                    )
                else:
                    results["failed"] += 1
                    results["details"].append(
                        {"disaster_id": disaster.id, "status": "failed"}
                    )
            except Exception as e:
                results["failed"] += 1
                results["details"].append(
                    {"disaster_id": disaster.id, "status": "failed", "error": str(e)}
                )
                print(f"Failed to archive disaster {disaster.id}: {str(e)}")
                continue

        print(f"Archive job completed: {results['archived']} archived, {results['failed']} failed")
        return results

    except Exception as e:
        error_msg = f"Error in disaster archival process: {str(e)}"
        print(error_msg)
        raise
    finally:
        if archive_service is not None:
            archive_service.close()
