from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
from datetime import datetime, timedelta
from db_utils.db import SessionLocal, Post, Disaster
from services import database_service


router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Return aggregated dashboard stat cards"""
    from sqlalchemy import func

    total_crises = db.query(Disaster).count()
    active_regions = db.query(func.count(func.distinct(Disaster.location))).scalar() or 0

    # urgent alerts: posts with sentiment == "urgent"
    urgent_alerts = db.query(Post).filter(Post.sentiment == "urgent").count()

    # Prefer AI-extracted affected_population where available
    affected_people = db.query(func.sum(Disaster.affected_population))
    affected_people = (
        affected_people.filter(Disaster.affected_population.isnot(None)).scalar() or 0
    )

    # If no AI-extracted data exists yet, fall back to severity-based estimate
    if not affected_people:
        severity_map = {5: 10000, 4: 5000, 3: 1000, 2: 200, 1: 50}
        severity_rows = (
            db.query(Disaster.severity, func.count(Disaster.id).label("cnt"))
            .group_by(Disaster.severity)
            .all()
        )

        for sev, cnt in severity_rows:
            if sev is None:
                continue
            affected_people += severity_map.get(int(sev), 0) * int(cnt)

    return {
        "total_crises": total_crises,
        "affected_people": affected_people,
        "urgent_alerts": urgent_alerts,
        "active_regions": int(active_regions),
    }


@router.get("/sentiment-trends")
def get_sentiment_trends(hours: int = 48, bucket_hours: int = 4, db: Session = Depends(get_db)):
    """Return sentiment trends over time in bucketed intervals (default last 48 hours, 4h buckets)"""
    from sqlalchemy import func

    now = datetime.utcnow()
    start_time = now - timedelta(hours=hours)

    # Build 4-hour buckets between start_time and now
    bucket_size = timedelta(hours=bucket_hours)
    buckets = []
    current = start_time
    while current < now:
        buckets.append(current)
        current += bucket_size

    trends = []
    for b_start in buckets:
        b_end = b_start + bucket_size
        avg_score = (
            db.query(func.avg(Post.sentiment_score))
            .filter(Post.created_at >= b_start, Post.created_at < b_end)
            .scalar()
        )
        if avg_score is None:
            value = None
        else:
            # convert -1..1 to 0..100
            value = round((float(avg_score) + 1) * 50, 2)

        trends.append({
            "time": b_start.isoformat(),
            "sentiment": value,
        })

    return {"trends": trends}


@router.get("/recent-events")
def get_recent_events(limit: int = 10, db: Session = Depends(get_db)):
    """Return recent disasters formatted for UI events list"""
    
    
    disasters = (
        db.query(Disaster)
        .options(joinedload(Disaster.post))
        .order_by(Disaster.extracted_at.desc())
        .limit(limit)
        .all()
    )

    severity_labels = {5: ("Critical", "bg-red-100 text-red-800"),
                       4: ("High", "bg-orange-100 text-orange-800"),
                       3: ("Medium", "bg-yellow-100 text-yellow-800"),
                       2: ("Low", "bg-green-100 text-green-800"),
                       1: ("Info", "bg-blue-100 text-blue-800")}

    events = []
    for d in disasters:
        sev = int(d.severity) if d.severity is not None else 1
        label, color = severity_labels.get(sev, ("Info", "bg-blue-100 text-blue-800"))

        # Use post's created_at if disaster is linked to a post, otherwise use extracted_at
        try:
            if d.post_id and d.post:
                event_time = d.post.created_at
            else:
                event_time = d.extracted_at

            delta = datetime.utcnow() - event_time
            seconds = int(delta.total_seconds())
            if seconds < 0:
                rel = "just now"
            elif seconds < 60:
                rel = f"{seconds}s ago"
            elif seconds < 3600:
                rel = f"{seconds//60}m ago"
            elif seconds < 86400:
                rel = f"{seconds//3600}h ago"
            else:
                rel = f"{seconds//86400}d ago"
        except Exception:
            rel = "unknown"

        # Create title and separate description
        if d.description:
            # Use first part of description as title, full description as description
            words = d.description.split()
            if len(words) > 8:
                title = " ".join(words[:8]) + "..."
            else:
                title = d.description
            description = d.description
        else:
            title = f"Event at {d.location}"
            description = f"Crisis event detected at {d.location}"

        # Get Bluesky URL if disaster is linked to a post
        bluesky_url = None
        if d.post_id and d.post and d.post.bluesky_id:
            # Convert bluesky_id to full URL
            # bluesky_id format is usually: at://did:plc:xxx/app.bsky.feed.post/xxx
            # We need to convert it to: https://bsky.app/profile/{handle}/post/{post_id}
            bluesky_id = d.post.bluesky_id
            if bluesky_id.startswith("at://"):
                # Extract the post ID from the AT URI
                post_parts = bluesky_id.split("/")
                if len(post_parts) >= 4 and post_parts[3] == "app.bsky.feed.post":
                    post_id = post_parts[4] if len(post_parts) > 4 else ""
                    handle = d.post.author_handle
                    if post_id and handle:
                        bluesky_url = f"https://bsky.app/profile/{handle}/post/{post_id}"

        events.append(
            {
                "id": d.id,
                "title": title,
                "description": description,
                "location": d.location,
                "time": rel,
                "severity": label,
                "severityColor": color,
                "bluesky_url": bluesky_url,
            }
        )

    return {"events": events}
