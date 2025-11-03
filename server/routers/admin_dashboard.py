from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any, Optional
from sqlalchemy import func, text, and_, or_
from sqlalchemy.orm import Session
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


@router.get("/stats")
async def get_admin_stats(
    current_admin: User = Depends(get_current_admin),
) -> Dict[str, Any]:
    """Return dashboard statistics: user metrics, system metrics and health status."""
    db = SessionLocal()
    try:
        users_total = db.query(User).count()
        users_active = db.query(User).filter(User.is_active == True).count()
        users_inactive = users_total - users_active
        users_admins = db.query(User).filter(User.is_admin == True).count()

        total_crises = db.query(Disaster).count()
        # urgent alerts: severity >= 4 and not read
        try:
            urgent_alerts = db.query(Alert).filter(Alert.severity >= 4, Alert.is_read == False).count()
        except Exception:
            # If alerts table missing or schema different, degrade gracefully
            urgent_alerts = 0

        # recent activities - try to get a quick count from admin_activity_log if exists
        recent_activities = 0
        try:
            with engine.connect() as conn:
                res = conn.execute(sqlalchemy.text("SELECT COUNT(1) AS cnt FROM admin_activity_log WHERE created_at >= now() - interval '7 days'"))
                row = res.fetchone()
                recent_activities = int(row['cnt']) if row and 'cnt' in row else 0
        except Exception:
            recent_activities = 0

        # DB health check
        db_health = True
        issues: List[str] = []
        try:
            with engine.connect() as conn:
                conn.execute(sqlalchemy.text("SELECT 1"))
        except Exception as e:
            db_health = False
            issues.append(f"db_error: {str(e)[:200]}")

        status = "operational" if db_health else "degraded"

        return {
            "users": {
                "total": users_total,
                "active": users_active,
                "inactive": users_inactive,
                "admins": users_admins,
            },
            "system": {
                "total_crises": total_crises,
                "urgent_alerts": urgent_alerts,
                "recent_activities": recent_activities,
                "status": status,
                "issues": issues,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compute stats: {e}")
    finally:
        db.close()


@router.get("/recent-activities")
async def get_recent_activities(
    limit: int = Query(10, ge=1, le=100),
    current_admin: User = Depends(get_current_admin),
):
    """Fetch recent admin activities from admin_activity_log (graceful if table missing)."""
    try:
        with engine.connect() as conn:
            stmt = sqlalchemy.text(
                "SELECT a.id, a.admin_id, u.email as admin_email, a.action, a.target_user_id, a.details, a.ip_address, a.user_agent, a.created_at "
                "FROM admin_activity_log a LEFT JOIN users u ON a.admin_id = u.id "
                "ORDER BY a.created_at DESC LIMIT :limit"
            )
            res = conn.execute(stmt, {"limit": limit})
            rows = [dict(r) for r in res.fetchall()]
            # Normalize rows
            activities = []
            for r in rows:
                activities.append({
                    "id": r.get("id"),
                    "admin_id": r.get("admin_id"),
                    "admin_email": r.get("admin_email"),
                    "action": r.get("action"),
                    "target_user_id": r.get("target_user_id"),
                    "details": r.get("details"),
                    "ip_address": r.get("ip_address"),
                    "user_agent": r.get("user_agent"),
                    "created_at": r.get("created_at"),
                })
            return {"activities": activities}
    except sqlalchemy.exc.ProgrammingError:
        # Table doesn't exist or query invalid - return empty list gracefully
        return {"activities": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch activities: {e}")


@router.get("/recent-users")
async def get_recent_users(
    limit: int = Query(5, ge=1, le=100),
    current_admin: User = Depends(get_current_admin),
):
    """Return recently created users (newest first)."""
    db = SessionLocal()
    try:
        users = db.query(User).order_by(User.created_at.desc()).limit(limit).all()
        result = []
        for u in users:
            result.append({
                "id": u.id,
                "email": u.email,
                "name": u.name,
                "role": u.role,
                "is_admin": bool(u.is_admin),
                "is_active": bool(u.is_active),
                "last_login": u.last_login,
                "created_at": u.created_at,
            })
        return {"users": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch recent users: {e}")
    finally:
        db.close()


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
