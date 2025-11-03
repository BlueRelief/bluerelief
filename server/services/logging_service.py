"""
Centralized logging service for BlueRelief backend.
Provides comprehensive logging for auth, API requests, errors, audit trails, and performance.
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
import logging
import traceback
import uuid
import asyncio
from functools import wraps
import json

from db_utils.logging_helpers import (
    create_system_log,
    create_api_log,
    create_error_log,
    create_audit_log,
    create_performance_log,
)

logger = logging.getLogger(__name__)


class LoggingService:
    """Centralized logging service for all backend operations"""

    def __init__(self):
        self.batch_queue = []
        self.batch_size = 50
        self.batch_interval = 5.0
        self._batch_task = None

    def _sanitize_data(self, data: Any) -> Any:
        """
        Sanitize sensitive data from logs.
        Removes passwords, tokens, API keys, and PII.
        """
        if data is None:
            return None

        if isinstance(data, dict):
            sanitized = {}
            sensitive_keys = {
                'password', 'token', 'api_key', 'secret', 'authorization',
                'auth', 'bearer', 'credentials', 'access_token', 'refresh_token',
                'api_secret', 'private_key', 'ssn', 'credit_card'
            }
            
            for key, value in data.items():
                key_lower = key.lower()
                if any(sensitive in key_lower for sensitive in sensitive_keys):
                    sanitized[key] = '[REDACTED]'
                elif isinstance(value, (dict, list)):
                    sanitized[key] = self._sanitize_data(value)
                else:
                    sanitized[key] = value
            return sanitized
        elif isinstance(data, list):
            return [self._sanitize_data(item) for item in data]
        else:
            return data

    def _generate_correlation_id(self) -> uuid.UUID:
        """Generate a unique correlation ID for request tracing"""
        return uuid.uuid4()

    async def log_auth_event(
        self,
        user_id: Optional[str],
        action: str,
        status: str,
        details: Optional[Dict] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        error_message: Optional[str] = None,
    ) -> Optional[int]:
        """
        Log authentication events.
        
        Args:
            user_id: User ID (None for failed login attempts)
            action: Action performed (LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, etc.)
            status: Status (success, failure)
            details: Additional details (OAuth provider, reason for failure, etc.)
            ip_address: Client IP address
            user_agent: Client user agent
            error_message: Error message if applicable
            
        Returns:
            Log entry ID if successful
        """
        try:
            log_level = "INFO" if status == "success" else "WARNING"
            message = f"Auth event: {action} - {status}"
            
            sanitized_details = self._sanitize_data(details) if details else {}
            
            return create_system_log(
                log_category="auth",
                action=action,
                message=message,
                log_level=log_level,
                user_id=user_id,
                status=status,
                details=sanitized_details,
                ip_address=ip_address,
                user_agent=user_agent,
                error_message=error_message,
            )
        except Exception as e:
            logger.error(f"Failed to log auth event: {e}")
            return None

    async def log_api_request(
        self,
        user_id: Optional[str],
        endpoint: str,
        method: str,
        status_code: int,
        duration_ms: int,
        request_data: Optional[Dict] = None,
        response_data: Optional[Dict] = None,
        query_params: Optional[Dict] = None,
        headers: Optional[Dict] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        db_queries_count: Optional[int] = None,
        db_query_time_ms: Optional[int] = None,
        correlation_id: Optional[uuid.UUID] = None,
    ) -> Optional[int]:
        """
        Log API request with full details.
        
        Returns:
            Log entry ID if successful
        """
        try:
            sanitized_request = self._sanitize_data(request_data)
            sanitized_response = self._sanitize_data(response_data)
            sanitized_headers = self._sanitize_data(headers)
            
            return create_api_log(
                endpoint=endpoint,
                method=method,
                status_code=status_code,
                duration_ms=duration_ms,
                user_id=user_id,
                request_body=sanitized_request,
                response_body=sanitized_response,
                query_params=query_params,
                headers=sanitized_headers,
                ip_address=ip_address,
                user_agent=user_agent,
                db_queries_count=db_queries_count,
                db_query_time_ms=db_query_time_ms,
                correlation_id=correlation_id or self._generate_correlation_id(),
            )
        except Exception as e:
            logger.error(f"Failed to log API request: {e}")
            return None

    async def log_error(
        self,
        error: Exception,
        user_id: Optional[str] = None,
        context: Optional[Dict] = None,
        severity: str = "MEDIUM",
        source_file: Optional[str] = None,
        source_function: Optional[str] = None,
    ) -> Optional[int]:
        """
        Log error with full context and stack trace.
        
        Args:
            error: Exception object
            user_id: User ID if applicable
            context: Additional context (request data, function args, etc.)
            severity: Severity level (LOW, MEDIUM, HIGH, CRITICAL)
            source_file: File where error occurred
            source_function: Function where error occurred
            
        Returns:
            Log entry ID if successful
        """
        try:
            error_type = type(error).__name__
            error_message = str(error)
            stack_trace = traceback.format_exc()
            
            sanitized_context = self._sanitize_data(context) if context else {}
            
            # Extract source info from stack trace if not provided
            if not source_file or not source_function:
                tb = traceback.extract_tb(error.__traceback__)
                if tb:
                    last_frame = tb[-1]
                    source_file = source_file or last_frame.filename
                    source_function = source_function or last_frame.name
                    source_line = last_frame.lineno
                else:
                    source_line = None
            else:
                source_line = None
            
            return create_error_log(
                error_type=error_type,
                error_message=error_message,
                user_id=user_id,
                stack_trace=stack_trace,
                context=sanitized_context,
                severity=severity,
                source_file=source_file,
                source_function=source_function,
                source_line=source_line,
            )
        except Exception as e:
            logger.error(f"Failed to log error: {e}")
            return None

    async def log_audit(
        self,
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
    ) -> Optional[int]:
        """
        Log audit trail for user/admin actions.
        
        Args:
            user_id: User performing the action
            action: Action performed (USER_CREATED, ALERT_UPDATED, etc.)
            resource_type: Type of resource (user, alert, disaster, settings)
            resource_id: ID of the resource
            old_value: Previous state
            new_value: New state
            change_summary: Human-readable summary of changes
            ip_address: Client IP
            user_agent: Client user agent
            is_admin_action: Whether this is an admin action
            
        Returns:
            Log entry ID if successful
        """
        try:
            sanitized_old = self._sanitize_data(old_value) if old_value else None
            sanitized_new = self._sanitize_data(new_value) if new_value else None
            
            return create_audit_log(
                user_id=user_id,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                old_value=sanitized_old,
                new_value=sanitized_new,
                change_summary=change_summary,
                ip_address=ip_address,
                user_agent=user_agent,
                is_admin_action=is_admin_action,
            )
        except Exception as e:
            logger.error(f"Failed to log audit: {e}")
            return None

    async def log_performance(
        self,
        metric_type: str,
        metric_name: str,
        value: float,
        context: Optional[Dict] = None,
        threshold: Optional[float] = None,
        duration_ms: Optional[int] = None,
        memory_mb: Optional[float] = None,
        cpu_percent: Optional[float] = None,
    ) -> Optional[int]:
        """
        Log performance metrics.
        
        Args:
            metric_type: Type of metric (db_query, api_latency, memory_usage, celery_task)
            metric_name: Name of the metric
            value: Metric value
            context: Additional context (query SQL, endpoint, etc.)
            threshold: Alert threshold
            duration_ms: Duration in milliseconds
            memory_mb: Memory usage in MB
            cpu_percent: CPU usage percentage
            
        Returns:
            Log entry ID if successful
        """
        try:
            sanitized_context = self._sanitize_data(context) if context else {}
            
            return create_performance_log(
                metric_type=metric_type,
                metric_name=metric_name,
                metric_value=value,
                threshold=threshold,
                context=sanitized_context,
                duration_ms=duration_ms,
                memory_mb=memory_mb,
                cpu_percent=cpu_percent,
            )
        except Exception as e:
            logger.error(f"Failed to log performance: {e}")
            return None

    async def log_task_execution(
        self,
        task_name: str,
        status: str,
        duration_ms: int,
        result: Optional[Any] = None,
        error: Optional[str] = None,
        retry_count: int = 0,
        correlation_id: Optional[uuid.UUID] = None,
    ) -> Optional[int]:
        """
        Log Celery task execution.
        
        Args:
            task_name: Name of the Celery task
            status: Status (started, completed, failed, retry)
            duration_ms: Execution duration in milliseconds
            result: Task result (sanitized)
            error: Error message if failed
            retry_count: Number of retries attempted
            correlation_id: Correlation ID for tracing
            
        Returns:
            Log entry ID if successful
        """
        try:
            message = f"Task {task_name} - {status}"
            log_level = "INFO" if status == "completed" else "WARNING"
            
            details = {
                "task_name": task_name,
                "duration_ms": duration_ms,
                "retry_count": retry_count,
            }
            
            if result:
                details["result"] = self._sanitize_data(result)
            
            return create_system_log(
                log_category="task",
                action=f"TASK_{status.upper()}",
                message=message,
                log_level=log_level,
                status=status,
                details=details,
                error_message=error,
                duration_ms=duration_ms,
                correlation_id=correlation_id or self._generate_correlation_id(),
            )
        except Exception as e:
            logger.error(f"Failed to log task execution: {e}")
            return None

    async def log_data_collection(
        self,
        collection_type: str,
        status: str,
        items_collected: int,
        duration_ms: int,
        details: Optional[Dict] = None,
        error: Optional[str] = None,
    ) -> Optional[int]:
        """
        Log data collection operations (BlueSky, etc.).
        
        Args:
            collection_type: Type of collection (bluesky_posts, etc.)
            status: Status (started, completed, failed)
            items_collected: Number of items collected
            duration_ms: Collection duration
            details: Additional details
            error: Error message if failed
            
        Returns:
            Log entry ID if successful
        """
        try:
            message = f"Data collection {collection_type} - {status}: {items_collected} items"
            log_level = "INFO" if status == "completed" else "WARNING"
            
            log_details = {
                "collection_type": collection_type,
                "items_collected": items_collected,
                "duration_ms": duration_ms,
            }
            
            if details:
                log_details.update(self._sanitize_data(details))
            
            return create_system_log(
                log_category="data",
                action=f"COLLECTION_{status.upper()}",
                message=message,
                log_level=log_level,
                status=status,
                details=log_details,
                duration_ms=duration_ms,
                error_message=error,
            )
        except Exception as e:
            logger.error(f"Failed to log data collection: {e}")
            return None

    async def log_alert_event(
        self,
        action: str,
        alert_id: Optional[int],
        disaster_id: Optional[int],
        severity: Optional[int],
        status: str,
        user_id: Optional[str] = None,
        details: Optional[Dict] = None,
        error: Optional[str] = None,
    ) -> Optional[int]:
        """
        Log alert system events.
        
        Args:
            action: Action performed (ALERT_GENERATED, ALERT_QUEUED, ALERT_SENT, etc.)
            alert_id: Alert ID
            disaster_id: Associated disaster ID
            severity: Alert severity
            status: Status (success, failure, pending)
            user_id: User ID if applicable
            details: Additional details
            error: Error message if failed
            
        Returns:
            Log entry ID if successful
        """
        try:
            message = f"Alert {action}: alert_id={alert_id}, severity={severity}"
            log_level = "INFO" if status == "success" else "WARNING"
            
            log_details = {
                "alert_id": alert_id,
                "disaster_id": disaster_id,
                "severity": severity,
            }
            
            if details:
                log_details.update(self._sanitize_data(details))
            
            return create_system_log(
                log_category="alert",
                action=action,
                message=message,
                log_level=log_level,
                user_id=user_id,
                status=status,
                details=log_details,
                error_message=error,
            )
        except Exception as e:
            logger.error(f"Failed to log alert event: {e}")
            return None

    async def log_email_event(
        self,
        action: str,
        recipient: str,
        status: str,
        user_id: Optional[str] = None,
        alert_id: Optional[int] = None,
        details: Optional[Dict] = None,
        error: Optional[str] = None,
    ) -> Optional[int]:
        """
        Log email service events.
        
        Args:
            action: Action performed (EMAIL_SENT, EMAIL_FAILED, etc.)
            recipient: Email recipient
            status: Status (success, failure, pending)
            user_id: User ID if applicable
            alert_id: Alert ID if applicable
            details: Additional details (provider, template, etc.)
            error: Error message if failed
            
        Returns:
            Log entry ID if successful
        """
        try:
            message = f"Email {action}: to={recipient}, status={status}"
            log_level = "INFO" if status == "success" else "WARNING"
            
            log_details = {
                "recipient": recipient,
                "alert_id": alert_id,
            }
            
            if details:
                log_details.update(self._sanitize_data(details))
            
            return create_system_log(
                log_category="email",
                action=action,
                message=message,
                log_level=log_level,
                user_id=user_id,
                status=status,
                details=log_details,
                error_message=error,
            )
        except Exception as e:
            logger.error(f"Failed to log email event: {e}")
            return None


# Global logging service instance
logging_service = LoggingService()


def log_errors(severity: str = "MEDIUM"):
    """
    Decorator to automatically log errors in functions.
    
    Usage:
        @log_errors(severity="HIGH")
        async def my_function():
            pass
    """
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                # Extract user_id from request if available
                user_id = None
                for arg in args:
                    if hasattr(arg, 'state') and hasattr(arg.state, 'user_id'):
                        user_id = arg.state.user_id
                        break
                
                context = {
                    "function": func.__name__,
                    "args": str(args),
                    "kwargs": str(kwargs),
                }
                
                await logging_service.log_error(
                    error=e,
                    user_id=user_id,
                    context=context,
                    severity=severity,
                    source_function=func.__name__,
                )
                raise
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                # For sync functions, create an event loop if needed
                try:
                    loop = asyncio.get_event_loop()
                except RuntimeError:
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                
                user_id = None
                for arg in args:
                    if hasattr(arg, 'state') and hasattr(arg.state, 'user_id'):
                        user_id = arg.state.user_id
                        break
                
                context = {
                    "function": func.__name__,
                    "args": str(args),
                    "kwargs": str(kwargs),
                }
                
                loop.run_until_complete(
                    logging_service.log_error(
                        error=e,
                        user_id=user_id,
                        context=context,
                        severity=severity,
                        source_function=func.__name__,
                    )
                )
                raise
        
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator

