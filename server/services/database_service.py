from datetime import datetime
from sqlalchemy.orm import Session
from db_utils.db import CollectionRun, Post, Disaster, SessionLocal
import json
import re

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
        Tuple of (number of posts saved, list of new posts)
    """
    db = SessionLocal()
    saved_count = 0
    new_posts = []

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

            indexed_at = post_data.get(
                "indexedAt", post_data.get("record", {}).get("createdAt", "")
            )
            if indexed_at:
                indexed_at = indexed_at.replace("Z", "+00:00")
                created_at = datetime.fromisoformat(indexed_at)
            else:
                created_at = datetime.utcnow()

            sentiment = None
            sentiment_score = None
            if sentiment_data and bluesky_id in sentiment_data:
                sentiment_info = sentiment_data[bluesky_id]
                sentiment = sentiment_info.get("sentiment")
                sentiment_score = sentiment_info.get("sentiment_score")

            # Get disaster type from post data or use provided default
            post_disaster_type = post_data.get("disaster_type") or disaster_type

            try:
                # Prepare post object
                post = Post(
                    bluesky_id=bluesky_id,
                    author_handle=post_data.get("author", {}).get("handle", ""),
                    text=post_data.get("record", {}).get("text", ""),
                    created_at=created_at,
                    raw_data=post_data,
                    collection_run_id=run_id,
                    sentiment=sentiment,
                    sentiment_score=sentiment_score,
                    disaster_type=post_disaster_type,
                )
                posts_to_add.append(post)
                saved_count += 1
            except Exception as e:
                print(f"Error preparing post {bluesky_id}: {str(e)}")
                continue

        try:
            # Bulk insert all posts at once
            if posts_to_add:
                db.bulk_save_objects(posts_to_add)
                db.commit()
                # After successful bulk save, populate new_posts list
                for post in posts_to_add:
                    original_data = next(
                        p for p in posts_data if p.get("uri") == post.bluesky_id
                    )
                    new_posts.append(original_data)
        except Exception as e:
            print(f"Error during bulk save: {str(e)}")
            db.rollback()
            # Try one by one as fallback
            saved_count = 0
            new_posts = []
            for post in posts_to_add:
                try:
                    db.add(post)
                    db.commit()
                    saved_count += 1
                    # Find original post data
                    original_data = next(p for p in posts_data if p.get("uri") == post.bluesky_id)
                    new_posts.append(original_data)
                except Exception:
                    db.rollback()
                    continue

        return saved_count, new_posts
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


def save_analysis(analysis_text: str, run_id: int, posts: list = None):
    """Parse and save disaster data from AI analysis, linking to source posts when possible"""
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

            # Get all posts from this run to link disasters
            post_map = {}
            if posts:
                for post_data in posts:
                    post_uri = post_data.get("uri")
                    if post_uri:
                        post_db = (
                            db.query(Post).filter(Post.bluesky_id == post_uri).first()
                        )
                        if post_db:
                            post_map[post_uri] = post_db.id

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

                # Try to find matching post based on location/magnitude
                post_id = None
                if posts:
                    location = disaster_data.get("location") or ""
                    location = location.lower() if location else ""
                    magnitude = disaster_data.get("magnitude")

                    for post_data in posts:
                        post_text = post_data.get("record", {}).get("text", "").lower()
                        if location and location in post_text:
                            post_id = post_map.get(post_data.get("uri"))
                            break
                        elif magnitude and str(magnitude) in post_text:
                            post_id = post_map.get(post_data.get("uri"))
                            break

                disaster = Disaster(
                    location=disaster_data.get("location"),
                    event_time=disaster_data.get("event_time"),
                    severity=disaster_data.get("severity"),
                    magnitude=magnitude_value,
                    description=disaster_data.get("description"),
                    affected_population=(
                        int(disaster_data.get("affected_population"))
                        if disaster_data.get("affected_population") is not None
                        else None
                    ),
                    collection_run_id=run_id,
                    post_id=post_id,
                )
                db.add(disaster)

            db.commit()
            linked = sum(1 for d in disasters if post_id is not None)
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
