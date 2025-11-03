"""
FastAPI middleware for logging all API requests and responses.
"""

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.datastructures import Headers
import time
import uuid
from typing import Callable
import logging

from services.logging_service import logging_service

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log all API requests and responses.
    Tracks duration, status, and generates correlation IDs for distributed tracing.
    """

    # Endpoints to exclude from logging (health checks, etc.)
    EXCLUDE_PATHS = {
        "/health",
        "/",
        "/docs",
        "/redoc",
        "/openapi.json",
    }

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process and log the request"""
        
        # Skip logging for excluded paths
        if request.url.path in self.EXCLUDE_PATHS:
            return await call_next(request)

        # Generate correlation ID
        correlation_id = uuid.uuid4()
        request.state.correlation_id = correlation_id

        # Extract request metadata
        start_time = time.time()
        user_id = getattr(request.state, "user_id", None)
        
        # Get client IP (consider X-Forwarded-For for proxied requests)
        client_ip = request.client.host if request.client else None
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        
        # Get user agent
        user_agent = request.headers.get("User-Agent")

        # Extract request body for POST/PUT/PATCH (with size limit)
        request_body = None
        if request.method in ["POST", "PUT", "PATCH"]:
            try:
                # Read body once and store it
                body = await request.body()
                if len(body) < 10000:  # Only log if less than 10KB
                    try:
                        request_body = body.decode('utf-8')
                        # Try to parse as JSON
                        import json
                        request_body = json.loads(request_body)
                    except:
                        request_body = {"raw": body.decode('utf-8', errors='ignore')[:500]}
                else:
                    request_body = {"note": "Body too large to log"}
            except Exception as e:
                logger.error(f"Failed to read request body: {e}")

        # Extract query parameters
        query_params = dict(request.query_params) if request.query_params else None

        # Extract headers (sanitized)
        headers = dict(request.headers)

        try:
            # Call the actual endpoint
            response = await call_next(request)
            
            # Calculate duration
            duration_ms = int((time.time() - start_time) * 1000)
            
            # Log the request asynchronously (non-blocking)
            try:
                await logging_service.log_api_request(
                    user_id=user_id,
                    endpoint=request.url.path,
                    method=request.method,
                    status_code=response.status_code,
                    duration_ms=duration_ms,
                    request_data=request_body,
                    response_data=None,  # We don't capture response body to avoid performance impact
                    query_params=query_params,
                    headers=headers,
                    ip_address=client_ip,
                    user_agent=user_agent,
                    correlation_id=correlation_id,
                )
                
                # Log performance metrics for slow requests
                if duration_ms > 1000:  # 1 second threshold
                    await logging_service.log_performance(
                        metric_type="api_latency",
                        metric_name=f"{request.method} {request.url.path}",
                        value=duration_ms,
                        threshold=1000,
                        duration_ms=duration_ms,
                        context={
                            "endpoint": request.url.path,
                            "method": request.method,
                            "status_code": response.status_code,
                            "user_id": user_id,
                        }
                    )
            except Exception as e:
                # Don't let logging failures break the request
                logger.error(f"Failed to log request: {e}")
            
            # Add correlation ID to response headers
            response.headers["X-Correlation-ID"] = str(correlation_id)
            
            return response

        except Exception as e:
            # Log the error
            duration_ms = int((time.time() - start_time) * 1000)
            
            try:
                await logging_service.log_error(
                    error=e,
                    user_id=user_id,
                    context={
                        "endpoint": request.url.path,
                        "method": request.method,
                        "duration_ms": duration_ms,
                        "query_params": query_params,
                    },
                    severity="HIGH",
                )
            except Exception as log_error:
                logger.error(f"Failed to log error: {log_error}")
            
            # Re-raise the exception
            raise

