from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from db_utils.db import SessionLocal, User, Disaster, AlertQueue, CollectionRun, engine
from middleware.admin_auth import get_current_admin
from celery_app import celery_app
from tasks import (
    collect_and_analyze,
    generate_alerts,
    manage_alert_queue,
    cleanup_old_alerts,
    archive_completed_disasters,
)
import sqlalchemy

router = APIRouter(prefix="/api/admin/tasks", tags=["admin-tasks"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class CollectRequest(BaseModel):
    include_enhanced: bool = True
    disaster_types: Optional[List[str]] = None


@router.post("/collect")
def trigger_collection(req: CollectRequest, current_admin: User = Depends(get_current_admin)):
    """Trigger the BlueSky collection task (wrapper around Celery task).

    Accepts JSON body: { "include_enhanced": bool, "disaster_types": ["earthquake","flood"] }
    Note: disaster_types is currently accepted for future use but not passed to the Celery task.
    """
    try:
        task = collect_and_analyze.delay(include_enhanced=req.include_enhanced)
        return {"task_id": task.id, "status": "started"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start collection: {e}")


@router.post("/generate-alerts")
def trigger_alert_generation(current_admin: User = Depends(get_current_admin)):
    try:
        task = generate_alerts.delay()
        return {"task_id": task.id, "status": "started"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start alert generation: {e}")


@router.post("/process-queue")
def trigger_queue_processing(current_admin: User = Depends(get_current_admin)):
    try:
        task = manage_alert_queue.delay()
        return {"task_id": task.id, "status": "started"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start queue processing: {e}")


@router.post("/cleanup-alerts")
def trigger_alert_cleanup(current_admin: User = Depends(get_current_admin)):
    try:
        task = cleanup_old_alerts.delay()
        return {"task_id": task.id, "status": "started"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start alert cleanup: {e}")


@router.post("/archive")
def trigger_archive(days_threshold: int = 2, current_admin: User = Depends(get_current_admin)):
    try:
        task = archive_completed_disasters.delay(days_threshold=days_threshold)
        return {"task_id": task.id, "status": "started", "days_threshold": days_threshold}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start archive: {e}")

@router.get("/metrics")
def get_system_metrics(current_admin: User = Depends(get_current_admin)):
    """Return simple system metrics useful for the admin UI"""
    db = SessionLocal()
    try:
        total_users = db.query(User).count()
        active_disasters = db.query(Disaster).filter(Disaster.archived == False).count()
        pending_alerts = db.query(AlertQueue).filter(AlertQueue.status == "pending").count()
        last_run = db.query(CollectionRun).order_by(CollectionRun.started_at.desc()).first()

        # DB health check: simple select 1
        db_health = True
        try:
            with engine.connect() as conn:
                conn.execute(sqlalchemy.text("SELECT 1"))
        except Exception:
            db_health = False
        return {
            "total_users": total_users,
            "active_disasters": active_disasters,
            "pending_alerts": pending_alerts,
            "last_collection_run": last_run.started_at.isoformat() if last_run and last_run.started_at else None,
            "db_health": db_health,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compute metrics: {e}")
    finally:
        db.close()

@router.get("/{task_id}")
def get_task_status(task_id: str, current_admin: User = Depends(get_current_admin)):
    try:
        task = celery_app.AsyncResult(task_id)
        return {"task_id": task_id, "status": task.status, "result": task.result if task.ready() else None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve task status: {e}")
