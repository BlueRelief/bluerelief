from fastapi import APIRouter, Depends
from typing import List, Optional
from sqlalchemy import func, text
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


@router.get('/api/admin/stats')
async def get_admin_stats(current_admin: User = Depends(get_current_admin)):
    """Get admin dashboard statistics"""
    db = SessionLocal()
    try:
        # Total users count
        total_users = db.query(func.count(User.id)).scalar() or 0
        
        # Active admins count
        active_admins = db.query(func.count(User.id)).filter(User.is_admin == True).scalar() or 0
        
        # System health checks
        total_crises = db.query(func.count(Disaster.id)).filter(Disaster.archived == False).scalar() or 0
        urgent_alerts = (
            db.query(func.count(Post.id))
            .join(Disaster)
            .filter(Post.sentiment == "urgent")
            .filter(Disaster.archived == False)
            .scalar() or 0
        )
        
        # Recent admin activities count (last 24 hours)
        try:
            twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
            recent_activities_sql = text("""
            SELECT COUNT(*) FROM admin_activity_log 
            WHERE created_at >= :since_param
            """)
            recent_activities = db.execute(recent_activities_sql.bindparams(since_param=twenty_four_hours_ago)).scalar() or 0
        except Exception:
            # Table doesn't exist yet
            recent_activities = 0
        
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
    finally:
        db.close()


@router.get('/api/admin/recent-activities')
async def get_recent_activities(
    limit: int = 10,
    current_admin: User = Depends(get_current_admin)
):
    """Get recent admin activities"""
    db = SessionLocal()
    try:
        # Try to query the table, if it doesn't exist return empty list
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
            rows = result.fetchall()
            
            activities = []
            for row in rows:
                activities.append({
                    "admin_id": row[0],
                    "action": row[1],
                    "target_user_id": row[2],
                    "details": row[3],
                    "created_at": row[4].isoformat() if row[4] else None,
                    "admin_email": row[5],
                })
            
            return {"activities": activities}
        except Exception as e:
            # Table doesn't exist yet, return empty list
            return {"activities": []}
    finally:
        db.close()


@router.get('/api/admin/recent-users')
async def get_recent_users(
    limit: int = 5,
    current_admin: User = Depends(get_current_admin)
):
    """Get recently registered users"""
    db = SessionLocal()
    try:
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
    finally:
        db.close()

