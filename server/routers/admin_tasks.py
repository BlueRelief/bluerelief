from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from db_utils.db import (
    SessionLocal,
    User,
    Disaster,
    AlertQueue,
    Alert,
    UserAlertPreferences,
    CollectionRun,
    engine,
)
from middleware.admin_auth import get_current_admin
from celery_app import celery_app
from tasks import (
    collect_and_analyze,
    generate_alerts,
    manage_alert_queue,
    cleanup_old_alerts,
    archive_completed_disasters,
    send_alert_emails,
)
from services.admin_logger import log_admin_activity
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


class TriggerTestAlertRequest(BaseModel):
    user_id: str
    disaster_type: str = "test"
    severity: int = 4
    description: Optional[str] = "Test alert triggered by admin"
    send_email: bool = True


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


@router.post("/trigger-test-alert")
def trigger_test_alert(
    req: TriggerTestAlertRequest, current_admin: User = Depends(get_current_admin)
):
    """
    Trigger a test alert for a specific user at their location.
    Creates a test disaster near the user and queues an alert for them.
    """
    db = SessionLocal()
    try:
        user = (
            db.query(User)
            .filter(User.id == req.user_id, User.deleted_at == None)
            .first()
        )
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        prefs = (
            db.query(UserAlertPreferences)
            .filter(UserAlertPreferences.user_id == req.user_id)
            .first()
        )

        if not prefs:
            raise HTTPException(
                status_code=400, detail="User has no alert preferences configured"
            )

        lat = user.latitude if user.latitude else 0.0
        lon = user.longitude if user.longitude else 0.0
        location_name = user.location or "Test Location"

        last_run = db.query(CollectionRun).order_by(CollectionRun.id.desc()).first()
        collection_run_id = last_run.id if last_run else 1

        disaster = Disaster(
            location_name=f"{location_name} (Test Alert)",
            latitude=lat,
            longitude=lon,
            severity=req.severity,
            disaster_type=req.disaster_type,
            description=req.description,
            extracted_at=datetime.utcnow(),
            collection_run_id=collection_run_id,
            archived=False,
        )
        db.add(disaster)
        db.flush()

        alert = Alert(
            disaster_id=disaster.id,
            alert_type="test_alert",
            severity=req.severity,
            title=f"🧪 Test Alert: {location_name}",
            message=req.description
            or "This is a test alert triggered by an administrator.",
            alert_metadata={
                "location": location_name,
                "latitude": lat,
                "longitude": lon,
                "is_test": True,
                "triggered_by": current_admin.id,
            },
        )
        db.add(alert)
        db.flush()

        queue_entry = AlertQueue(
            alert_id=alert.id,
            user_id=user.id,
            recipient_email=user.email,
            recipient_name=user.name,
            priority=1,
            status="pending",
        )
        db.add(queue_entry)
        db.commit()

        log_admin_activity(
            admin_id=current_admin.id,
            action="TEST_ALERT_TRIGGERED",
            target_user_id=user.id,
            details={
                "disaster_id": disaster.id,
                "alert_id": alert.id,
                "severity": req.severity,
                "location": location_name,
            },
        )

        result = {
            "status": "success",
            "disaster_id": disaster.id,
            "alert_id": alert.id,
            "queue_entry_id": queue_entry.id,
            "user_email": user.email,
            "location": location_name,
        }

        if req.send_email:
            try:
                task = send_alert_emails.delay()
                result["email_task_id"] = task.id
            except Exception as e:
                result["email_error"] = str(e)

        return result

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Failed to trigger test alert: {e}"
        )
    finally:
        db.close()
