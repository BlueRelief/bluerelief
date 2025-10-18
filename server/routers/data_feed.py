from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from db_utils.db import SessionLocal, DataFeed, Post, Disaster, CollectionRun

router = APIRouter(prefix="/api/data-feed", tags=["data-feed"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/status")
def get_feed_status(db: Session = Depends(get_db)):
    """Get status of all data collection feeds"""
    feeds = db.query(DataFeed).all()
    
    return {
        "feeds": [
            {
                "id": feed.id,
                "name": feed.name,
                "status": feed.status,
                "last_run": feed.last_run_at.isoformat() if feed.last_run_at else None,
                "next_run": feed.next_run_at.isoformat() if feed.next_run_at else None,
            }
            for feed in feeds
        ]
    }


@router.get("/overview")
def get_crisis_overview(db: Session = Depends(get_db)):
    """Get crisis detection overview metrics"""
    total_tweets = db.query(Post).count()
    total_crises = db.query(Disaster).count()
    
    most_recent = (
        db.query(Disaster)
        .join(Post, Disaster.post_id == Post.id, isouter=True)
        .order_by(desc(Disaster.extracted_at))
        .first()
    )
    
    most_recent_crisis = None
    if most_recent:
        severity_map = {5: "Critical", 4: "High", 3: "Medium", 2: "Low", 1: "Low"}
        severity_label = severity_map.get(int(most_recent.severity) if most_recent.severity else 1, "Low")
        
        bluesky_url = None
        if most_recent.post:
            author_handle = most_recent.post.author_handle
            bluesky_id = most_recent.post.bluesky_id
            if bluesky_id and author_handle:
                post_id = bluesky_id.split("/")[-1] if "/" in bluesky_id else bluesky_id
                bluesky_url = f"https://bsky.app/profile/{author_handle}/post/{post_id}"
        
        crisis_name = f"{most_recent.description or most_recent.location or 'Unknown Event'}"
        
        most_recent_crisis = {
            "name": crisis_name,
            "date": most_recent.extracted_at.isoformat(),
            "bluesky_url": bluesky_url,
            "severity": severity_label,
        }
    
    return {
        "total_tweets_processed": total_tweets,
        "total_crises_detected": total_crises,
        "most_recent_crisis": most_recent_crisis,
    }


@router.get("/weekly-crises")
def get_weekly_crises(
    days: int = Query(default=7, ge=1, le=90),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Get recent crisis events with pagination (default last 7 days)"""
    cutoff_date = datetime.utcnow() - timedelta(days=days)

    query = (
        db.query(Disaster)
        .join(Post, Disaster.post_id == Post.id, isouter=True)
        .filter(Disaster.extracted_at >= cutoff_date)
        .order_by(desc(Disaster.extracted_at))
    )

    total_count = query.count()
    total_pages = (total_count + page_size - 1) // page_size

    offset = (page - 1) * page_size
    disasters = query.offset(offset).limit(page_size).all()

    severity_map = {5: "Critical", 4: "High", 3: "Medium", 2: "Low", 1: "Low"}

    crises = []
    for d in disasters:
        sev = int(d.severity) if d.severity else 1
        severity_label = severity_map.get(sev, "Low")

        crisis_name = d.description or f"{d.location}" if d.location else "Unknown Event"

        bluesky_url = None
        if d.post:
            author_handle = d.post.author_handle
            bluesky_id = d.post.bluesky_id
            if bluesky_id and author_handle:
                post_id = bluesky_id.split("/")[-1] if "/" in bluesky_id else bluesky_id
                bluesky_url = f"https://bsky.app/profile/{author_handle}/post/{post_id}"

        disaster_type = "Unknown"
        if d.post and d.post.disaster_type:
            disaster_type = d.post.disaster_type

        tweets_count = (
            db.query(Post)
            .filter(Post.disaster_type == disaster_type)
            .filter(Post.created_at >= cutoff_date)
            .count()
        ) if disaster_type != "Unknown" else 1

        status = "Active" if sev >= 4 else "Ongoing" if sev >= 2 else "Resolved"

        crises.append({
            "id": d.id,
            "crisis_name": crisis_name,
            "date": d.extracted_at.isoformat(),
            "region": d.location or "Unknown",
            "severity": severity_label,
            "tweets_analyzed": tweets_count,
            "status": status,
            "description": d.description or "",
            "disaster_type": disaster_type,
            "bluesky_url": bluesky_url,
        })

    return {
        "crises": crises,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_count": total_count,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        },
    }
