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

def save_posts(posts_data: list, run_id: int) -> int:
    """Save posts to database with deduplication"""
    db = SessionLocal()
    saved_count = 0

    try:
        for post_data in posts_data:
            bluesky_id = post_data.get("uri", "")

            existing = db.query(Post).filter(Post.bluesky_id == bluesky_id).first()
            if existing:
                continue

            # use indexedAt (server timestamp) over createdAt (client-set, can be unreliable)
            indexed_at = post_data.get(
                "indexedAt", post_data.get("record", {}).get("createdAt", "")
            )
            if indexed_at:
                indexed_at = indexed_at.replace("Z", "+00:00")
                created_at = datetime.fromisoformat(indexed_at)
            else:
                created_at = datetime.utcnow()

            post = Post(
                bluesky_id=bluesky_id,
                author_handle=post_data.get("author", {}).get("handle", ""),
                text=post_data.get("record", {}).get("text", ""),
                created_at=created_at,
                raw_data=post_data,
                collection_run_id=run_id,
            )
            db.add(post)
            saved_count += 1

        db.commit()
        return saved_count
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()

def save_analysis(analysis_text: str, run_id: int):
    """Parse and save disaster data from AI analysis"""
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
            
            for disaster_data in disasters:
                disaster = Disaster(
                    location=disaster_data.get("location"),
                    event_time=disaster_data.get("event_time"),
                    severity=disaster_data.get("severity"),
                    magnitude=disaster_data.get("magnitude"),
                    description=disaster_data.get("description"),
                    collection_run_id=run_id
                )
                db.add(disaster)
            
            db.commit()
            print(f"Saved {len(disasters)} disasters from AI analysis")
            
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
