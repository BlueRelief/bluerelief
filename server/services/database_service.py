from datetime import datetime
from sqlalchemy.orm import Session
from db_utils.db import CollectionRun, Post, Disaster, SessionLocal
import json
import re
from services.population_estimator import PopulationEstimator


def extract_post_timestamp(post_data: dict) -> datetime:
    """Extract and normalize post timestamp using Bluesky's sortAt logic

    Bluesky recommends using sortAt = earlier of (createdAt, indexedAt) to handle
    clock skews in distributed systems. Both timestamps are ISO 8601 format strings.

    Args:
        post_data: Post object from Bluesky API

    Returns:
        Parsed datetime object
    """
    # Try to get both timestamps - they're ISO 8601 strings like "2023-08-07T05:31:12.156888Z"
    indexed_at = post_data.get("indexedAt")  # Top-level timestamp
    created_at_str = post_data.get("record", {}).get(
        "createdAt"
    )  # Nested in record object

    timestamps = []

    # Parse indexedAt if available
    if indexed_at:
        try:
            ts = indexed_at.replace("Z", "+00:00")
            timestamps.append(datetime.fromisoformat(ts))
        except (ValueError, AttributeError) as e:
            print(f"Warning: Failed to parse indexedAt '{indexed_at}': {e}")

    # Parse createdAt if available
    if created_at_str:
        try:
            ts = created_at_str.replace("Z", "+00:00")
            timestamps.append(datetime.fromisoformat(ts))
        except (ValueError, AttributeError) as e:
            print(f"Warning: Failed to parse createdAt '{created_at_str}': {e}")

    # Use sortAt logic: pick the earlier timestamp (handles clock skews)
    if timestamps:
        sorted_timestamp = min(timestamps)
        print(f"✓ Extracted timestamp: {sorted_timestamp.isoformat()}")
        return sorted_timestamp

    # Fallback to current time if no valid timestamp found
    print(f"⚠️  No valid timestamp found in post, using current time")
    return datetime.utcnow()


def create_collection_run() -> CollectionRun:
    """Create a new collection run"""
    db = SessionLocal()
    try:
        run = CollectionRun(status="running")
        db.add(run)
        db.commit()
        db.refresh(run)
        return run
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()

def complete_collection_run(run_id: int, posts_count: int, status: str = "completed", error: str = None):
    """Mark collection run as complete"""
    db = SessionLocal()
    try:
        run = db.query(CollectionRun).filter(CollectionRun.id == run_id).first()
        if run:
            run.completed_at = datetime.utcnow()
            run.status = status
            run.posts_collected = posts_count
            if error:
                run.error_message = error
            db.commit()
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


def get_existing_post_ids(post_uris: list) -> set:
    """Get set of existing post IDs from database
    
    Args:
        post_uris: List of Bluesky post URIs to check
        
    Returns:
        Set of existing post URIs
    """
    db = SessionLocal()
    try:
        return set(id_tuple[0] for id_tuple in 
                  db.query(Post.bluesky_id)
                  .filter(Post.bluesky_id.in_(post_uris))
                  .all())
    finally:
        db.close()

def save_posts(posts_data: list, run_id: int, sentiment_data: dict = None, disaster_type: str = None) -> tuple[int, list]:
    """Save posts to database with deduplication, disaster type, and optional sentiment data

    Args:
        posts_data: List of posts to save
        run_id: ID of the collection run
        sentiment_data: Optional sentiment analysis results
        disaster_type: Type of disaster for these posts

    Returns:
        Tuple of (number of posts saved, list of new posts WITH database post IDs)
    """
    db = SessionLocal()
    saved_count = 0
    new_posts = []
    posts_with_db_ids = []  # Track posts with their DB IDs

    # Prepare all posts for batch insertion
    posts_to_add = []
    seen_ids = set()

    try:
        # First get all existing bluesky_ids in one query
        existing_ids = get_existing_post_ids([p.get("uri", "") for p in posts_data])

        for post_data in posts_data:
            bluesky_id = post_data.get("uri", "")

            # Skip if we've seen this post in this batch or if it exists in DB
            if not bluesky_id or bluesky_id in seen_ids or bluesky_id in existing_ids:
                continue

            seen_ids.add(bluesky_id)

            # Use proper timestamp extraction with sortAt logic
            created_at = extract_post_timestamp(post_data)

            sentiment = None
            sentiment_score = None
            if sentiment_data and bluesky_id in sentiment_data:
                sentiment_info = sentiment_data[bluesky_id]
                sentiment = sentiment_info.get("sentiment")
                sentiment_score = sentiment_info.get("sentiment_score")

            # Get disaster type from post data or use provided default
            post_disaster_type = post_data.get("disaster_type") or disaster_type

            try:
                # Extract engagement metrics
                engagement = post_data.get("engagement", {})
                author_info = post_data.get("author", {})
                media_info = post_data.get("media", {})
                content_info = post_data.get("content", {})
                location_info = post_data.get("location", {})
                thread_info = post_data.get("thread", {})
                moderation_info = post_data.get("moderation", {})
                
                # Prepare post object
                post = Post(
                    # Basic post info
                    bluesky_id=bluesky_id,
                    author_handle=post_data.get("author", {}).get("handle", ""),
                    text=post_data.get("record", {}).get("text", ""),
                    created_at=created_at,
                    raw_data=post_data,
                    collection_run_id=run_id,
                    sentiment=sentiment,
                    sentiment_score=sentiment_score,
                    disaster_type=post_disaster_type,

                    # Engagement metrics
                    like_count=engagement.get("likes", 0),
                    repost_count=engagement.get("reposts", 0),
                    reply_count=engagement.get("replies", 0),

                    # Author profile info
                    author_display_name=author_info.get("display_name"),
                    author_description=author_info.get("description"),
                    author_followers_count=author_info.get("followers_count"),
                    author_following_count=author_info.get("following_count"),
                    author_posts_count=author_info.get("posts_count"),
                    author_avatar_url=author_info.get("avatar_url"),

                    # Media information
                    has_media=media_info.get("has_media", False),
                    media_count=media_info.get("count", 0),
                    media_urls=media_info.get("urls", []),

                    # Content analysis
                    hashtags=content_info.get("hashtags", []),
                    mentions=content_info.get("mentions", []),
                    external_urls=content_info.get("external_urls", []),
                    language=content_info.get("language"),

                    # Location data
                    post_location=location_info.get("name"),
                    post_latitude=location_info.get("latitude"),
                    post_longitude=location_info.get("longitude"),

                    # Temporal data
                    indexed_at=post_data.get("indexed_at"),
                    last_modified_at=datetime.utcnow(),

                    # Thread context
                    reply_to_post_id=thread_info.get("reply_to"),
                    reply_root_post_id=thread_info.get("root"),
                    thread_depth=thread_info.get("depth", 0),

                    # Moderation
                    moderation_status=moderation_info.get("status", "active"),
                    content_labels=moderation_info.get("labels", []),
                    content_warnings=moderation_info.get("warnings", [])
                )
                posts_to_add.append(post)
                saved_count += 1
            except Exception as e:
                print(f"Error preparing post {bluesky_id}: {str(e)}")
                continue

        try:
            # Bulk insert all posts at once
            if posts_to_add:
                print("Saving posts to database...")
                db.bulk_save_objects(posts_to_add)
                db.commit()
                
                # After successful bulk save, fetch posts from DB to get their IDs
                for post in posts_to_add:
                    original_data = next(
                        p for p in posts_data if p.get("uri") == post.bluesky_id
                    )
                    new_posts.append(original_data)
                    
                    # Query the saved post to get the actual database ID
                    saved_post = db.query(Post).filter(Post.bluesky_id == post.bluesky_id).first()
                    if saved_post:
                        post_with_id = dict(original_data)
                        post_with_id["db_post_id"] = saved_post.id
                        posts_with_db_ids.append(post_with_id)
                    else:
                        # Fallback: add without ID
                        post_with_id = dict(original_data)
                        post_with_id["db_post_id"] = None
                        posts_with_db_ids.append(post_with_id)
        except Exception as e:
            print(f"Error during bulk save: {str(e)}")
            db.rollback()
            # Try one by one as fallback
            saved_count = 0
            new_posts = []
            posts_with_db_ids = []
            for post in posts_to_add:
                try:
                    db.add(post)
                    db.commit()
                    saved_count += 1
                    # Find original post data
                    original_data = next(p for p in posts_data if p.get("uri") == post.bluesky_id)
                    new_posts.append(original_data)
                    # Add post with DB ID for AI analysis
                    post_with_id = dict(original_data)
                    post_with_id["db_post_id"] = post.id
                    posts_with_db_ids.append(post_with_id)
                except Exception:
                    db.rollback()
                    continue

        return saved_count, posts_with_db_ids
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


def save_analysis(analysis_text: str, run_id: int, posts: list = None):
    """Parse and save disaster data from AI analysis, linking to source posts when possible"""
    from services.analysis import normalize_event_time

    db = SessionLocal()

    try:
        cleaned_text = analysis_text.strip()

        json_match = re.search(r'\[.*\]', cleaned_text, re.DOTALL)
        if json_match:
            cleaned_text = json_match.group(0)

        cleaned_text = re.sub(r'^```json\s*', '', cleaned_text)
        cleaned_text = re.sub(r'\s*```$', '', cleaned_text)
        cleaned_text = cleaned_text.strip()

        try:
            disasters = json.loads(cleaned_text)

            if isinstance(disasters, dict):
                disasters = [disasters]

            print("Saving disasters to database...")
            for disaster_data in disasters:
                magnitude_value = disaster_data.get("magnitude")

                if magnitude_value is not None:
                    if isinstance(magnitude_value, str):
                        magnitude_match = re.search(r"(\d+\.?\d*)", magnitude_value)
                        if magnitude_match:
                            magnitude_value = float(magnitude_match.group(1))
                        else:
                            magnitude_value = None
                    else:
                        try:
                            magnitude_value = float(magnitude_value)
                        except (ValueError, TypeError):
                            magnitude_value = None

                # Get post_id directly from AI response (much more reliable!)
                post_id = disaster_data.get("post_id")
                # Handle cases where AI returns "None" as a string or other non-numeric values
                if post_id and post_id != "None" and post_id != "none":
                    try:
                        post_id = int(post_id)
                    except (ValueError, TypeError):
                        post_id = None
                else:
                    post_id = None

                # Normalize event_time to proper datetime format
                event_time = disaster_data.get("event_time")
                normalized_event_time = (
                    normalize_event_time(event_time) if event_time else None
                )

                affected_population = PopulationEstimator.estimate_population(
                    longitude=disaster_data.get("longitude"),
                    latitude=disaster_data.get("latitude"),
                    disaster_type=disaster_data.get("disaster_type"),
                    severity=disaster_data.get("severity")
                )

                disaster = Disaster(
                    location_name=disaster_data.get("location_name"),
                    latitude=disaster_data.get("latitude"),
                    longitude=disaster_data.get("longitude"),
                    event_time=normalized_event_time,
                    severity=disaster_data.get("severity"),
                    magnitude=magnitude_value,
                    description=disaster_data.get("description"),
                    affected_population=affected_population,
                    disaster_type=disaster_data.get("disaster_type", None),
                    collection_run_id=run_id,
                    post_id=post_id,
                )
                
                db.add(disaster)

            db.commit()
            linked = sum(1 for d in disasters if d.get("post_id") is not None)
            print(
                f"Saved {len(disasters)} disasters from AI analysis ({linked} linked to posts)"
            )

        except json.JSONDecodeError as e:
            print(f"Failed to parse JSON from AI response: {e}")
            print(f"Response text: {cleaned_text}")
            db.rollback()

    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


def get_recent_disasters(limit: int = 50):
    """Get recent disasters"""
    db = SessionLocal()
    try:
        disasters = db.query(Disaster).order_by(Disaster.extracted_at.desc()).limit(limit).all()
        return [
            {
                "id": d.id,
                "location": d.location,
                "event_time": d.event_time,
                "severity": d.severity,
                "magnitude": d.magnitude,
                "description": d.description,
                "extracted_at": d.extracted_at.isoformat()
            }
            for d in disasters
        ]
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()

def get_collection_stats():
    """Get collection statistics"""
    db = SessionLocal()
    try:
        total_runs = db.query(CollectionRun).count()
        total_posts = db.query(Post).count()
        total_disasters = db.query(Disaster).count()
        
        recent_runs = db.query(CollectionRun).order_by(CollectionRun.started_at.desc()).limit(5).all()
        
        return {
            "total_runs": total_runs,
            "total_posts": total_posts,
            "total_disasters": total_disasters,
            "recent_runs": [
                {
                    "id": r.id,
                    "started_at": r.started_at.isoformat(),
                    "completed_at": r.completed_at.isoformat() if r.completed_at else None,
                    "status": r.status,
                    "posts_collected": r.posts_collected
                }
                for r in recent_runs
            ]
        }
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()
