from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_
from datetime import datetime, timedelta
from typing import Optional
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
    search: str = Query(default="", description="Search crises by name, location, or disaster type"),
    db: Session = Depends(get_db),
):
    """Get recent crisis events with pagination and search (default last 7 days)"""
    cutoff_date = datetime.utcnow() - timedelta(days=days)

    query = (
        db.query(Disaster)
        .join(Post, Disaster.post_id == Post.id, isouter=True)
        .filter(Disaster.extracted_at >= cutoff_date)
    )

    # Apply search filter if provided
    if search and search.strip():
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Disaster.description.ilike(search_term),
                Disaster.location_name.ilike(search_term),
                Post.disaster_type.ilike(search_term)
            )
        )
    
    query = query.order_by(desc(Disaster.extracted_at))

    total_count = query.count()
    total_pages = (total_count + page_size - 1) // page_size

    offset = (page - 1) * page_size
    disasters = query.offset(offset).limit(page_size).all()

    severity_map = {5: "Critical", 4: "High", 3: "Medium", 2: "Low", 1: "Low"}

    crises = []
    for d in disasters:
        sev = int(d.severity) if d.severity else 1
        severity_label = severity_map.get(sev, "Low")

        crisis_name = d.description or f"{d.location_name}" if d.location_name else "Unknown Event"

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
            "region": d.location_name or "Unknown",
            "severity": severity_label,
            "tweets_analyzed": tweets_count,
            "status": status,
            "description": d.description or "",
            "disaster_type": disaster_type,
            "bluesky_url": bluesky_url,
            "sentiment": d.post.sentiment if d.post else None,
            "sentiment_score": d.post.sentiment_score if d.post else None,
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

@router.get("/posts")
def get_posts(
    min_relevancy: Optional[int] = Query(default=50, ge=0, le=100),
    disaster_type: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Get relevant posts with filtering and pagination."""
    query = db.query(Post)
    
    # Base filters
    filters = [Post.relevancy_score >= min_relevancy]
    if disaster_type:
        filters.append(Post.disaster_type == disaster_type)
    
    # Apply filters
    query = query.filter(and_(*filters))
    
    # Get total count for pagination
    total_count = query.count()
    total_pages = (total_count + page_size - 1) // page_size
    
    # Add sorting and pagination
    query = (
        query.order_by(desc(Post.created_at), desc(Post.relevancy_score))
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    
    posts = query.all()
    
    # Format response
    formatted_posts = []
    for post in posts:
        bluesky_url = None
        if post.bluesky_id and post.author_handle:
            post_id = post.bluesky_id.split("/")[-1] if "/" in post.bluesky_id else post.bluesky_id
            bluesky_url = f"https://bsky.app/profile/{post.author_handle}/post/{post_id}"
            
        formatted_posts.append({
            "id": post.id,
            "author": {
                "handle": post.author_handle,
                "display_name": post.author_display_name,
                "description": post.author_description,
                "avatar_url": post.author_avatar_url
            },
            "content": {
                "text": post.text,
                "hashtags": post.hashtags or [],
                "mentions": post.mentions or [],
                "external_urls": post.external_urls or []
            },
            "engagement": {
                "likes": post.like_count,
                "reposts": post.repost_count,
                "replies": post.reply_count
            },
            "media": {
                "has_media": post.has_media,
                "count": post.media_count,
                "urls": post.media_urls or []
            },
            "relevancy": {
                "score": post.relevancy_score,
                "breakdown": post.relevancy_breakdown,
                "flags": post.relevancy_flags
            },
            "metadata": {
                "created_at": post.created_at.isoformat(),
                "collected_at": post.collected_at.isoformat(),
                "disaster_type": post.disaster_type,
                "language": post.language,
                "bluesky_url": bluesky_url
            }
        })
    
    return {
        "posts": formatted_posts,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_count": total_count,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1
        }
    }

@router.get("/relevancy-stats")
def get_relevancy_stats(
    timeframe_days: Optional[int] = Query(default=7, ge=1, le=90),
    db: Session = Depends(get_db)
):
    """Get relevancy score statistics for posts."""
    cutoff_date = datetime.utcnow() - timedelta(days=timeframe_days)
    
    # Get score distribution
    score_ranges = {
        "critical": db.query(func.count(Post.id))
        .filter(Post.relevancy_score >= 80)
        .filter(Post.created_at >= cutoff_date)
        .scalar(),
        
        "high": db.query(func.count(Post.id))
        .filter(Post.relevancy_score.between(60, 79))
        .filter(Post.created_at >= cutoff_date)
        .scalar(),
        
        "medium": db.query(func.count(Post.id))
        .filter(Post.relevancy_score.between(40, 59))
        .filter(Post.created_at >= cutoff_date)
        .scalar(),
        
        "low": db.query(func.count(Post.id))
        .filter(Post.relevancy_score < 40)
        .filter(Post.created_at >= cutoff_date)
        .scalar()
    }
    
    # Get average score by disaster type
    avg_by_type = (
        db.query(
            Post.disaster_type,
            func.avg(Post.relevancy_score).label("avg_score"),
            func.count(Post.id).label("count")
        )
        .filter(Post.created_at >= cutoff_date)
        .filter(Post.disaster_type.isnot(None))
        .group_by(Post.disaster_type)
        .all()
    )
    
    disaster_stats = [
        {
            "type": dtype,
            "average_score": round(float(avg), 2),
            "post_count": count
        }
        for dtype, avg, count in avg_by_type
    ]
    
    # Get rejection reasons using LATERAL join
    from sqlalchemy import text
    rejection_counts = db.execute(
        text("""
            SELECT flag, COUNT(*) AS count 
            FROM posts 
            CROSS JOIN LATERAL jsonb_array_elements_text(
                COALESCE(posts.relevancy_flags::jsonb, '[]'::jsonb)
            ) AS flag 
            WHERE posts.created_at >= :cutoff 
            GROUP BY flag 
            ORDER BY count DESC
        """),
        {"cutoff": cutoff_date},
    ).fetchall()
    
    return {
        "score_distribution": score_ranges,
        "disaster_type_stats": disaster_stats,
        "rejection_reasons": [
            {"reason": flag, "count": count}
            for flag, count in rejection_counts
        ],
        "timeframe_days": timeframe_days
    }
