from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any, Optional
from sqlalchemy import func, text, and_, or_
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime, timedelta
from db_utils.db import SessionLocal, User, Disaster, Alert, Post, engine
from db_utils.logging_models import SystemLog, ApiRequestLog, ErrorLog, PerformanceLog
from middleware.admin_auth import get_current_admin
import sqlalchemy

router = APIRouter(prefix="/api/admin", tags=["admin"])


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


@router.get('/stats')
async def get_admin_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
) -> Dict[str, Any]:
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


@router.get('/recent-activities')
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


@router.get('/recent-crises')
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


@router.get('/recent-users')
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


@router.get("/logs/stats")
async def get_log_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Get comprehensive logging statistics for the admin dashboard"""
    try:
        # Calculate today's date range
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = datetime.utcnow()

        # Total logs today (from api_request_logs)
        total_today = db.query(func.count(ApiRequestLog.id)).filter(
            ApiRequestLog.created_at >= today_start
        ).scalar() or 0

        # Total API requests today
        total_api_requests_today = db.query(func.count(ApiRequestLog.id)).filter(
            ApiRequestLog.created_at >= today_start
        ).scalar() or 0

        # Error requests today (status >= 400)
        error_requests_today = db.query(func.count(ApiRequestLog.id)).filter(
            and_(
                ApiRequestLog.created_at >= today_start,
                ApiRequestLog.status_code >= 400
            )
        ).scalar() or 0

        # Calculate error rate
        error_rate = (error_requests_today / total_api_requests_today) if total_api_requests_today > 0 else 0.0

        # Average response time today
        avg_response_time = db.query(func.avg(ApiRequestLog.duration_ms)).filter(
            ApiRequestLog.created_at >= today_start
        ).scalar() or 0
        avg_response_time = int(avg_response_time)

        # Failed logins today (from system_logs)
        failed_logins = db.query(func.count(SystemLog.id)).filter(
            and_(
                SystemLog.created_at >= today_start,
                SystemLog.log_category == 'auth',
                SystemLog.action.in_(['LOGIN_FAILED', 'OAUTH_TOKEN_FAILED']),
                SystemLog.status == 'failure'
            )
        ).scalar() or 0

        # Slow queries today (duration > 1000ms from api_request_logs or performance_logs)
        slow_api_queries = db.query(func.count(ApiRequestLog.id)).filter(
            and_(
                ApiRequestLog.created_at >= today_start,
                ApiRequestLog.duration_ms > 1000
            )
        ).scalar() or 0

        slow_db_queries = db.query(func.count(PerformanceLog.id)).filter(
            and_(
                PerformanceLog.created_at >= today_start,
                PerformanceLog.metric_type == 'db_query',
                PerformanceLog.is_exceeded == True
            )
        ).scalar() or 0

        slow_queries = slow_api_queries + slow_db_queries

        # Active users today (unique users in api_request_logs)
        active_users = db.query(func.count(func.distinct(ApiRequestLog.user_id))).filter(
            and_(
                ApiRequestLog.created_at >= today_start,
                ApiRequestLog.user_id.isnot(None)
            )
        ).scalar() or 0

        return {
            "total_today": total_today,
            "error_rate": round(error_rate, 4),
            "avg_response_time": avg_response_time,
            "failed_logins": failed_logins,
            "slow_queries": slow_queries,
            "active_users": active_users,
        }

    except SQLAlchemyError as e:
        if is_table_not_found_error(e):
            # Logging tables not yet created, return zeros
            return {
                "total_today": 0,
                "error_rate": 0.0,
                "avg_response_time": 0,
                "failed_logins": 0,
                "slow_queries": 0,
                "active_users": 0,
            }
        raise


@router.get("/logs")
async def get_logs(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    category: Optional[str] = Query(None),
    level: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
):
    """Get paginated system logs with optional filters"""
    try:
        # Build query for system_logs
        query = db.query(SystemLog)
        
        # Apply filters
        if category:
            query = query.filter(SystemLog.log_category == category)
        if level:
            query = query.filter(SystemLog.log_level == level)
        if user_id:
            query = query.filter(SystemLog.user_id == user_id)
        if action:
            query = query.filter(SystemLog.action.ilike(f"%{action}%"))
        if status:
            query = query.filter(SystemLog.status == status)
        
        # Get total count
        total = query.count()
        
        # Calculate pagination
        offset = (page - 1) * limit
        total_pages = (total + limit - 1) // limit
        
        # Get paginated logs
        logs = query.order_by(SystemLog.created_at.desc()).offset(offset).limit(limit).all()
        
        # Format logs
        formatted_logs = []
        for log in logs:
            # Get user info if available
            user_email = None
            user_name = None
            if log.user_id:
                user = db.query(User).filter(User.id == log.user_id).first()
                if user:
                    user_email = user.email
                    user_name = user.name
            
            formatted_logs.append({
                "id": str(log.id),
                "log_category": log.log_category,
                "log_level": log.log_level or "INFO",
                "user_id": log.user_id,
                "user_email": user_email,
                "user_name": user_name,
                "action": log.action,
                "status": log.status or "unknown",
                "message": log.message,
                "details": log.details,
                "ip_address": log.ip_address,
                "user_agent": log.user_agent,
                "request_method": log.request_method,
                "request_path": log.request_path,
                "response_status": log.response_status,
                "duration_ms": log.duration_ms,
                "error_type": log.error_type,
                "error_message": log.error_message,
                "stack_trace": log.stack_trace,
                "correlation_id": str(log.correlation_id) if log.correlation_id else None,
                "created_at": log.created_at.isoformat() if log.created_at else None,
            })
        
        return {
            "logs": formatted_logs,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages,
        }
    
    except SQLAlchemyError as e:
        if is_table_not_found_error(e):
            return {
                "logs": [],
                "total": 0,
                "page": 1,
                "limit": limit,
                "total_pages": 0,
            }
        raise
