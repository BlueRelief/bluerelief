from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db_utils.db import SessionLocal, User
from middleware.admin_auth import get_current_admin
from tasks import archive_completed_disasters
from celery_app import celery_app

router = APIRouter(prefix="/api/archive", tags=["archive"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/")
def archive_root(current_admin: User = Depends(get_current_admin)):
    """Archive management endpoints"""
    return {
        "status": "running",
        "service": "Archive Management",
        "endpoints": {
            "/trigger": "Manually trigger disaster archiving",
            "/task/{task_id}": "Get archiving task status",
        },
    }


@router.post("/trigger")
def trigger_archive(
    days_threshold: int = 2,
    current_admin: User = Depends(get_current_admin)
):
    """
    Manually trigger the archive process for completed disasters.
    
    Args:
        days_threshold: Days after completion before archiving (default: 2)
    
    Returns:
        Task info with ID and status
    """
    try:
        task = archive_completed_disasters.delay(days_threshold=days_threshold)
        return {
            "status": "accepted",
            "message": "Archive process triggered successfully",
            "task_id": task.id,
            "days_threshold": days_threshold,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to trigger archive process: {str(e)}"
        )


@router.get("/task/{task_id}")
def get_archive_task_status(
    task_id: str,
    current_admin: User = Depends(get_current_admin)
):
    """Get status of an archive task"""
    try:
        task = celery_app.AsyncResult(task_id)
        return {
            "task_id": task_id,
            "status": task.status,
            "result": task.result if task.successful() else None,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve task status: {str(e)}"
        )
