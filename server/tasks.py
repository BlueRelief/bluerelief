from datetime import datetime
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
import json
import re
import os
from typing import Dict, List

# Disaster type configuration with hashtags
DISASTER_CONFIG: Dict[str, List[str]] = {
    "earthquake": ["#earthquake", "#quake", "#seismic"],
    "hurricane": ["#hurricane", "#cyclone", "#tropicalstorm"],
    "flood": ["#flood", "#flooding", "#flashflood"],
    "wildfire": ["#wildfire", "#forestfire", "#bushfire"],
    "tornado": ["#tornado", "#twister"]
}

@celery_app.task(name="tasks.collect_and_analyze")
def collect_and_analyze(include_enhanced: bool = True):
    """Main task to collect and analyze BlueSky data for multiple disaster types
    
    Args:
        include_enhanced: Whether to collect enhanced post data (profile info, engagement, etc.)
    """
    print(f"\n{'='*50}")
    print(f"Starting Multi-Disaster BlueSky collection - {datetime.now()}")
    if include_enhanced:
        print("Enhanced data collection enabled")
    print(f"{'='*50}\n")

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
                    posts, seen_post_ids, session_data = fetch_posts(hashtag, seen_post_ids, session_data)
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

        return results
    except Exception as e:
        error_msg = f"Error in multi-disaster collection: {str(e)}"
        complete_collection_run(run.id, 0, "failed", error_msg)
        print(f"\n[{datetime.now()}] {error_msg}")
        raise


@celery_app.task(name="tasks.generate_alerts")
def generate_alerts():
    """Celery task wrapper for alert generation"""
    return generate_alerts_service()


@celery_app.task(name="tasks.manage_alert_queue")
def manage_alert_queue():
    """Celery task wrapper for alert queue management"""
    return manage_alert_queue_service()


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
