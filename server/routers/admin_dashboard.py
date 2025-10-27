from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from sqlalchemy import func, text
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime, timedelta
from db_utils.db import SessionLocal, User, Disaster, Post
from middleware.admin_auth import get_current_admin

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def is_table_not_found_error(error: Exception) -> bool:
    """Check if error is due to missing table"""
    error_str = str(error).lower()
    pgcode = getattr(getattr(error, "orig", None), "pgcode", None)
    
    # PostgreSQL specific: error code 42P01 (relation does not exist)
    if pgcode == "42P01" or pgcode == "42p01":
        return True
    
    # PostgreSQL specific: "does not exist" message pattern
    if "does not exist" in error_str:
        return True
    
    # SQLite specific: "no such table" message pattern
    if "no such table" in error_str:
        return True
    
    return False


@router.get('/api/admin/stats')
async def get_admin_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Get admin dashboard statistics"""
    # Total users count
    total_users = db.query(func.count(User.id)).scalar() or 0
    
    # Active admins count
    active_admins = db.query(func.count(User.id)).filter(User.is_admin.is_(True)).scalar() or 0
    
    # System health checks
    total_crises = db.query(func.count(Disaster.id)).filter(Disaster.archived.is_(False)).scalar() or 0
    urgent_alerts = (
        db.query(func.count(func.distinct(Post.id)))
        .join(Disaster, Post.id == Disaster.post_id)
        .filter(Post.sentiment == "urgent")
        .filter(Disaster.archived.is_(False))
        .scalar() or 0
    )
    
    # Recent admin activities count (last 24 hours)
    recent_activities = 0
    try:
        twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
        recent_activities_sql = text("""
        SELECT COUNT(*) FROM admin_activity_log 
        WHERE created_at >= :since_param
        """)
        recent_activities = db.execute(recent_activities_sql.bindparams(since_param=twenty_four_hours_ago)).scalar() or 0
    except Exception as e:
        if not is_table_not_found_error(e):
            raise  # Re-raise if it's not a table-not-found error
    
    # Active/inactive users
    active_users = db.query(func.count(User.id)).filter(User.last_login.isnot(None)).scalar() or 0
    inactive_users = total_users - active_users
    
    # System health status
    health_status = "operational"
    health_issues = []
    
    if urgent_alerts > 10:
        health_status = "degraded"
        health_issues.append("High urgent alert count")
    
    if total_users == 0:
        health_status = "initialization"
        health_issues.append("No users registered")
    
    return {
        "users": {
            "total": total_users,
            "active": active_users,
            "inactive": inactive_users,
            "admins": active_admins,
        },
        "system": {
            "total_crises": total_crises,
            "urgent_alerts": urgent_alerts,
            "recent_activities": recent_activities,
            "status": health_status,
            "issues": health_issues,
        },
    }


@router.get('/api/admin/recent-activities')
async def get_recent_activities(
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin)
):
    """Get recent admin activities"""
    try:
        sql = text("""
        SELECT 
            aal.admin_id,
            aal.action,
            aal.target_user_id,
            aal.details,
            aal.created_at,
            u.email as admin_email
        FROM admin_activity_log aal
        LEFT JOIN users u ON aal.admin_id = u.id
        ORDER BY aal.created_at DESC
        LIMIT :limit_param
        """)
        result = db.execute(sql.bindparams(limit_param=limit))
        activities = []
        for row in result.mappings():
            created = row["created_at"]
            activities.append({
                "admin_id": row["admin_id"],
                "action": row["action"],
                "target_user_id": row["target_user_id"],
                "details": row["details"],
                "created_at": created.isoformat() if created else None,
                "admin_email": row["admin_email"],
            })
        
        return {"activities": activities}
    except Exception as e:
        msg = str(e).lower()
        pgcode = getattr(getattr(e, "orig", None), "pgcode", None)
        if pgcode == "42P01" or "no such table" in msg or "does not exist" in msg:
            return {"activities": []}
        raise


@router.get('/api/admin/recent-users')
async def get_recent_users(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Get recently registered users"""
    recent_users = db.query(User)\
        .order_by(User.created_at.desc())\
        .limit(limit)\
        .all()
    
    users = []
    for user in recent_users:
        users.append({
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "is_admin": user.is_admin,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "last_login": user.last_login.isoformat() if user.last_login else None,
        })
    
    return {"users": users}
