from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from tasks import collect_and_analyze
from services.database_service import get_recent_disasters, get_collection_stats
from db_utils.db import SessionLocal, Post, Disaster, CollectionRun
from celery_app import celery_app

router = APIRouter(prefix="/api/bluesky", tags=["bluesky"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/")
def read_root():
    return {
        "status": "running",
        "service": "BlueSky Data Collection",
        "endpoints": {
            "/health": "Health check",
            "/stats": "Collection statistics",
            "/trigger": "Manually trigger data collection (async)",
            "/task/{task_id}": "Get task status",
            "/disasters": "Get recent disasters",
            "/disasters/{disaster_id}": "Get specific disaster",
            "/posts/recent": "Get recent posts",
            "/runs": "Get collection runs"
        }
    }

@router.get("/health")
def health_check():
    return {"status": "healthy"}

@router.get("/stats")
def get_stats():
    """Get collection statistics"""
    return get_collection_stats()

@router.post("/trigger")
def trigger_collection():
    """Trigger data collection asynchronously"""
    task = collect_and_analyze.delay()
    return {
        "status": "accepted",
        "message": "Data collection task started",
        "task_id": task.id
    }

@router.get("/task/{task_id}")
def get_task_status(task_id: str):
    """Get status of a task"""
    task = celery_app.AsyncResult(task_id)
    return {
        "task_id": task_id,
        "status": task.status,
        "result": task.result if task.ready() else None
    }

@router.get("/disasters")
def get_disasters(limit: int = 50):
    """Get recent disasters"""
    return {"disasters": get_recent_disasters(limit)}

@router.get("/disasters/{disaster_id}")
def get_disaster(disaster_id: int, db: Session = Depends(get_db)):
    """Get specific disaster by ID"""
    disaster = db.query(Disaster).filter(Disaster.id == disaster_id).first()
    if not disaster:
        return {"error": "Disaster not found"}
    
    return {
        "id": disaster.id,
        "location": disaster.location,
        "event_time": disaster.event_time,
        "severity": disaster.severity,
        "magnitude": disaster.magnitude,
        "description": disaster.description,
        "extracted_at": disaster.extracted_at.isoformat()
    }

@router.get("/posts/recent")
def get_recent_posts(limit: int = 50, db: Session = Depends(get_db)):
    """Get recent posts"""
    posts = db.query(Post).order_by(Post.collected_at.desc()).limit(limit).all()
    return {
        "posts": [
            {
                "id": p.id,
                "bluesky_id": p.bluesky_id,
                "author": p.author_handle,
                "text": p.text,
                "created_at": p.created_at.isoformat(),
                "collected_at": p.collected_at.isoformat()
            }
            for p in posts
        ]
    }

@router.get("/runs")
def get_runs(limit: int = 10, db: Session = Depends(get_db)):
    """Get collection runs"""
    runs = db.query(CollectionRun).order_by(CollectionRun.started_at.desc()).limit(limit).all()
    return {
        "runs": [
            {
                "id": r.id,
                "started_at": r.started_at.isoformat(),
                "completed_at": r.completed_at.isoformat() if r.completed_at else None,
                "status": r.status,
                "posts_collected": r.posts_collected,
                "error_message": r.error_message
            }
            for r in runs
        ]
    }

