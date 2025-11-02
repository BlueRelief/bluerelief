from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from sqlalchemy import func, text
from sqlalchemy.orm import Session, joinedload
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
    try:
        # Total users count
        total_users = db.query(func.count(User.id)).scalar() or 0
        
        # Active admins count
        active_admins = db.query(func.count(User.id)).filter(User.is_admin.is_(True)).scalar() or 0
        
        # System health checks
        total_crises = 0
        try:
            total_crises = db.query(func.count(Disaster.id)).filter(Disaster.archived.is_(False)).scalar() or 0
        except Exception:
            db.rollback()
        
        urgent_alerts = 0
        try:
            urgent_alerts = (
                db.query(func.count(func.distinct(Post.id)))
                .join(Disaster, Post.id == Disaster.post_id)
                .filter(Post.sentiment == "urgent")
                .filter(Disaster.archived.is_(False))
                .scalar() or 0
            )
        except Exception:
            db.rollback()
        
        # Recent crises count (last 24 hours)
        recent_crises = 0
        try:
            twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
            recent_crises = db.query(func.count(Disaster.id)).filter(
                Disaster.archived.is_(False)
            ).filter(
                Disaster.extracted_at >= twenty_four_hours_ago
            ).scalar() or 0
        except Exception:
            db.rollback()
        
        # Active/inactive users
        active_users = 0
        try:
            active_users = db.query(func.count(User.id)).filter(User.last_login.isnot(None)).scalar() or 0
        except Exception:
            db.rollback()
        
        inactive_users = total_users - active_users
        
        # System health status
        health_status = "operational"
        health_issues = []
        
        if urgent_alerts > 10:
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
                "recent_crises": recent_crises,
                "status": health_status,
                "issues": health_issues,
            },
        }
    except Exception as e:
        db.rollback()
        raise


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


@router.get('/api/admin/recent-crises')
async def get_recent_crises(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Get recent crises/disasters for admin dashboard"""
    try:
        cutoff_time = datetime.utcnow() - timedelta(hours=24)
        disasters = (
            db.query(Disaster)
            .options(joinedload(Disaster.post))
            .filter(Disaster.archived == False)
            .filter(Disaster.extracted_at >= cutoff_time)
            .order_by(Disaster.extracted_at.desc())
            .limit(limit)
            .all()
        )
        
        crises = []
        for d in disasters:
            sev = int(d.severity) if d.severity is not None else 1
            severity_map = {5: "Critical", 4: "High", 3: "Medium", 2: "Low", 1: "Low"}
            severity_label = severity_map.get(sev, "Low")
            
            # Get event time
            event_time = d.extracted_at
            if d.post_id and d.post and d.post.created_at:
                event_time = d.post.created_at
            
            # Create description
            description = d.description or f"Crisis detected at {d.location_name or 'Unknown location'}"
            
            crises.append({
                "id": d.id,
                "description": description,
                "location_name": d.location_name,
                "severity": severity_label,
                "severity_level": sev,
                "extracted_at": d.extracted_at.isoformat() if d.extracted_at else None,
                "event_time": event_time.isoformat() if event_time else None,
                "latitude": d.latitude,
                "longitude": d.longitude,
            })
        
        return {"crises": crises}
    except Exception as e:
        db.rollback()
        return {"crises": []}


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
