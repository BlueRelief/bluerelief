"""
Helper functions for creating and querying logs in the BlueRelief system.
"""

from typing import Optional, Dict, List, Any
from datetime import datetime, timedelta
from sqlalchemy import and_, or_, desc
from sqlalchemy.orm import Session
import logging
import traceback
import uuid

from .db import get_db_session
from .logging_models import (
    SystemLog,
    ApiRequestLog,
    ErrorLog,
    AuditLog,
    PerformanceLog,
)

logger = logging.getLogger(__name__)


def create_system_log(
    log_category: str,
    action: str,
    message: str,
    log_level: str = "INFO",
    user_id: Optional[str] = None,
    status: Optional[str] = None,
    details: Optional[Dict] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    request_method: Optional[str] = None,
    request_path: Optional[str] = None,
    response_status: Optional[int] = None,
    duration_ms: Optional[int] = None,
    error_type: Optional[str] = None,
    error_message: Optional[str] = None,
    stack_trace: Optional[str] = None,
    correlation_id: Optional[uuid.UUID] = None,
    db: Optional[Session] = None,
) -> Optional[int]:
    """
    Create a system log entry.
    
    Args:
        log_category: Category of log (auth, api, error, audit, data, alert, email, performance, task)
        action: Action being performed (LOGIN_SUCCESS, API_REQUEST, etc.)
        message: Human-readable log message
        log_level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        user_id: User ID if applicable
        status: Status of the action (success, failure, pending, error)
        details: Additional structured metadata as JSON
        ip_address: IP address of the requester
        user_agent: User agent string
        request_method: HTTP method if applicable
        request_path: Request path if applicable
        response_status: HTTP response status
        duration_ms: Duration in milliseconds
        error_type: Error type if applicable
        error_message: Error message if applicable
        stack_trace: Stack trace if applicable
        correlation_id: UUID for tracing across services
        db: Database session (optional, will create new if not provided)
        
    Returns:
        Log entry ID if successful, None otherwise
    """
    close_db = False
    if db is None:
        db = get_db_session()
        close_db = True
        
    if db is None:
        logger.error("Could not establish database session for system log")
        return None

    try:
        log_entry = SystemLog(
            log_category=log_category,
            log_level=log_level,
            user_id=user_id,
            action=action,
            status=status,
            message=message,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
            request_method=request_method,
            request_path=request_path,
            response_status=response_status,
            duration_ms=duration_ms,
            error_type=error_type,
            error_message=error_message,
            stack_trace=stack_trace,
            correlation_id=correlation_id or uuid.uuid4(),
            created_at=datetime.utcnow(),
        )
        
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        
        return log_entry.id
        
    except Exception as e:
        logger.error(f"Error creating system log: {e}")
        if db:
            db.rollback()
        return None
    finally:
        if close_db and db:
            db.close()


def create_api_log(
    endpoint: str,
    method: str,
    status_code: int,
    duration_ms: int,
    user_id: Optional[str] = None,
    request_body: Optional[Dict] = None,
    response_body: Optional[Dict] = None,
    query_params: Optional[Dict] = None,
    headers: Optional[Dict] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    memory_usage_mb: Optional[float] = None,
    db_queries_count: Optional[int] = None,
    db_query_time_ms: Optional[int] = None,
    correlation_id: Optional[uuid.UUID] = None,
    db: Optional[Session] = None,
) -> Optional[int]:
    """
    Create an API request log entry.
    
    Returns:
        Log entry ID if successful, None otherwise
    """
    close_db = False
    if db is None:
        db = get_db_session()
        close_db = True
        
    if db is None:
        logger.error("Could not establish database session for API log")
        return None

    try:
        log_entry = ApiRequestLog(
            user_id=user_id,
            endpoint=endpoint,
            method=method,
            status_code=status_code,
            request_body=request_body,
            response_body=response_body,
            query_params=query_params,
            headers=headers,
            ip_address=ip_address,
            user_agent=user_agent,
            duration_ms=duration_ms,
            memory_usage_mb=memory_usage_mb,
            db_queries_count=db_queries_count,
            db_query_time_ms=db_query_time_ms,
            correlation_id=correlation_id or uuid.uuid4(),
            created_at=datetime.utcnow(),
        )
        
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        
        return log_entry.id
        
    except Exception as e:
        logger.error(f"Error creating API log: {e}")
        if db:
            db.rollback()
        return None
    finally:
        if close_db and db:
            db.close()


def create_error_log(
    error_type: str,
    error_message: str,
    user_id: Optional[str] = None,
    error_code: Optional[str] = None,
    stack_trace: Optional[str] = None,
    context: Optional[Dict] = None,
    severity: str = "MEDIUM",
    source_file: Optional[str] = None,
    source_function: Optional[str] = None,
    source_line: Optional[int] = None,
    db: Optional[Session] = None,
) -> Optional[int]:
    """
    Create an error log entry or increment occurrence count if similar error exists.
    
    Returns:
        Log entry ID if successful, None otherwise
    """
    close_db = False
    if db is None:
        db = get_db_session()
        close_db = True
        
    if db is None:
        logger.error("Could not establish database session for error log")
        return None

    try:
        # Check for existing unresolved error with same type and message
        existing_error = (
            db.query(ErrorLog)
            .filter(
                and_(
                    ErrorLog.error_type == error_type,
                    ErrorLog.error_message == error_message,
                    ErrorLog.is_resolved == False,
                )
            )
            .first()
        )
        
        if existing_error:
            # Increment occurrence count and update last_occurred_at
            existing_error.occurrence_count += 1
            existing_error.last_occurred_at = datetime.utcnow()
            db.commit()
            return existing_error.id
        
        # Create new error log
        log_entry = ErrorLog(
            user_id=user_id,
            error_type=error_type,
            error_code=error_code,
            error_message=error_message,
            stack_trace=stack_trace,
            context=context,
            severity=severity,
            source_file=source_file,
            source_function=source_function,
            source_line=source_line,
            is_resolved=False,
            occurrence_count=1,
            first_occurred_at=datetime.utcnow(),
            last_occurred_at=datetime.utcnow(),
        )
        
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        
        return log_entry.id
        
    except Exception as e:
        logger.error(f"Error creating error log: {e}")
        if db:
            db.rollback()
        return None
    finally:
        if close_db and db:
            db.close()


def create_audit_log(
    user_id: str,
    action: str,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    old_value: Optional[Dict] = None,
    new_value: Optional[Dict] = None,
    change_summary: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    is_admin_action: bool = False,
    db: Optional[Session] = None,
) -> Optional[int]:
    """
    Create an audit log entry for tracking user/admin actions.
    
    Returns:
        Log entry ID if successful, None otherwise
    """
    close_db = False
    if db is None:
        db = get_db_session()
        close_db = True
        
    if db is None:
        logger.error("Could not establish database session for audit log")
        return None

    try:
        log_entry = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            old_value=old_value,
            new_value=new_value,
            change_summary=change_summary,
            ip_address=ip_address,
            user_agent=user_agent,
            is_admin_action=is_admin_action,
            created_at=datetime.utcnow(),
        )
        
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        
        return log_entry.id
        
    except Exception as e:
        logger.error(f"Error creating audit log: {e}")
        if db:
            db.rollback()
        return None
    finally:
        if close_db and db:
            db.close()


def create_performance_log(
    metric_type: str,
    metric_name: str,
    metric_value: float,
    threshold: Optional[float] = None,
    context: Optional[Dict] = None,
    duration_ms: Optional[int] = None,
    memory_mb: Optional[float] = None,
    cpu_percent: Optional[float] = None,
    db: Optional[Session] = None,
) -> Optional[int]:
    """
    Create a performance log entry.
    
    Args:
        metric_type: Type of metric (db_query, api_latency, memory_usage, celery_task)
        metric_name: Name of the metric
        metric_value: Value of the metric
        threshold: Alert threshold
        context: Additional context as JSON
        duration_ms: Duration in milliseconds
        memory_mb: Memory usage in MB
        cpu_percent: CPU usage percentage
        db: Database session (optional)
        
    Returns:
        Log entry ID if successful, None otherwise
    """
    close_db = False
    if db is None:
        db = get_db_session()
        close_db = True
        
    if db is None:
        logger.error("Could not establish database session for performance log")
        return None

    try:
        is_exceeded = None
        if threshold is not None:
            is_exceeded = metric_value > threshold
            
        log_entry = PerformanceLog(
            metric_type=metric_type,
            metric_name=metric_name,
            metric_value=metric_value,
            threshold=threshold,
            is_exceeded=is_exceeded,
            context=context,
            duration_ms=duration_ms,
            memory_mb=memory_mb,
            cpu_percent=cpu_percent,
            created_at=datetime.utcnow(),
        )
        
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        
        return log_entry.id
        
    except Exception as e:
        logger.error(f"Error creating performance log: {e}")
        if db:
            db.rollback()
        return None
    finally:
        if close_db and db:
            db.close()


def get_logs_by_user(
    user_id: str,
    log_type: str = "system",
    limit: int = 100,
    offset: int = 0,
    db: Optional[Session] = None,
) -> List[Any]:
    """
    Get logs for a specific user.
    
    Args:
        user_id: User ID
        log_type: Type of log (system, api, error, audit)
        limit: Maximum number of results
        offset: Offset for pagination
        db: Database session (optional)
        
    Returns:
        List of log entries
    """
    close_db = False
    if db is None:
        db = get_db_session()
        close_db = True
        
    if db is None:
        logger.error("Could not establish database session for get_logs_by_user")
        return []

    try:
        model_map = {
            "system": SystemLog,
            "api": ApiRequestLog,
            "error": ErrorLog,
            "audit": AuditLog,
        }
        
        model = model_map.get(log_type, SystemLog)
        
        logs = (
            db.query(model)
            .filter(model.user_id == user_id)
            .order_by(desc(model.created_at))
            .limit(limit)
            .offset(offset)
            .all()
        )
        
        return logs
        
    except Exception as e:
        logger.error(f"Error getting logs by user: {e}")
        return []
    finally:
        if close_db and db:
            db.close()


def get_logs_by_date_range(
    start_date: datetime,
    end_date: datetime,
    log_type: str = "system",
    limit: int = 100,
    offset: int = 0,
    db: Optional[Session] = None,
) -> List[Any]:
    """
    Get logs within a date range.
    
    Args:
        start_date: Start date
        end_date: End date
        log_type: Type of log (system, api, error, audit, performance)
        limit: Maximum number of results
        offset: Offset for pagination
        db: Database session (optional)
        
    Returns:
        List of log entries
    """
    close_db = False
    if db is None:
        db = get_db_session()
        close_db = True
        
    if db is None:
        logger.error("Could not establish database session for get_logs_by_date_range")
        return []

    try:
        model_map = {
            "system": SystemLog,
            "api": ApiRequestLog,
            "error": ErrorLog,
            "audit": AuditLog,
            "performance": PerformanceLog,
        }
        
        model = model_map.get(log_type, SystemLog)
        
        logs = (
            db.query(model)
            .filter(
                and_(
                    model.created_at >= start_date,
                    model.created_at <= end_date,
                )
            )
            .order_by(desc(model.created_at))
            .limit(limit)
            .offset(offset)
            .all()
        )
        
        return logs
        
    except Exception as e:
        logger.error(f"Error getting logs by date range: {e}")
        return []
    finally:
        if close_db and db:
            db.close()


def search_logs(
    query: str,
    log_type: str = "system",
    category: Optional[str] = None,
    log_level: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Optional[Session] = None,
) -> List[Any]:
    """
    Search logs by message content and filters.
    
    Args:
        query: Search query for message field
        log_type: Type of log (system, api, error, audit, performance)
        category: Filter by log category (for system logs)
        log_level: Filter by log level (for system logs)
        limit: Maximum number of results
        offset: Offset for pagination
        db: Database session (optional)
        
    Returns:
        List of log entries
    """
    close_db = False
    if db is None:
        db = get_db_session()
        close_db = True
        
    if db is None:
        logger.error("Could not establish database session for search_logs")
        return []

    try:
        if log_type == "system":
            query_filter = SystemLog.message.ilike(f"%{query}%")
            
            if category:
                query_filter = and_(query_filter, SystemLog.log_category == category)
            if log_level:
                query_filter = and_(query_filter, SystemLog.log_level == log_level)
                
            logs = (
                db.query(SystemLog)
                .filter(query_filter)
                .order_by(desc(SystemLog.created_at))
                .limit(limit)
                .offset(offset)
                .all()
            )
        elif log_type == "error":
            logs = (
                db.query(ErrorLog)
                .filter(ErrorLog.error_message.ilike(f"%{query}%"))
                .order_by(desc(ErrorLog.last_occurred_at))
                .limit(limit)
                .offset(offset)
                .all()
            )
        else:
            logs = []
        
        return logs
        
    except Exception as e:
        logger.error(f"Error searching logs: {e}")
        return []
    finally:
        if close_db and db:
            db.close()


def resolve_error(
    error_id: int,
    resolved_by: str,
    resolution_notes: str,
    db: Optional[Session] = None,
) -> bool:
    """
    Mark an error as resolved.
    
    Args:
        error_id: Error log ID
        resolved_by: User ID who resolved the error
        resolution_notes: Notes about the resolution
        db: Database session (optional)
        
    Returns:
        True if successful, False otherwise
    """
    close_db = False
    if db is None:
        db = get_db_session()
        close_db = True
        
    if db is None:
        logger.error("Could not establish database session for resolve_error")
        return False

    try:
        error_log = db.query(ErrorLog).filter(ErrorLog.id == error_id).first()
        
        if not error_log:
            logger.error(f"Error log {error_id} not found")
            return False
            
        error_log.is_resolved = True
        error_log.resolved_at = datetime.utcnow()
        error_log.resolved_by = resolved_by
        error_log.resolution_notes = resolution_notes
        
        db.commit()
        return True
        
    except Exception as e:
        logger.error(f"Error resolving error log: {e}")
        if db:
            db.rollback()
        return False
    finally:
        if close_db and db:
            db.close()

