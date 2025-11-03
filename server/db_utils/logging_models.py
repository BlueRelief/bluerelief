from sqlalchemy import (
    Column,
    String,
    DateTime,
    Integer,
    Text,
    ForeignKey,
    Float,
    Boolean,
    BigInteger,
    Index,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from datetime import datetime
from .db import Base
import uuid


class SystemLog(Base):
    """Main logging table for all system activities"""
    __tablename__ = "system_logs"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    log_category = Column(String(50), nullable=False, index=True)
    log_level = Column(String(20), nullable=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    status = Column(String(50), nullable=True)
    message = Column(Text, nullable=False)
    details = Column(JSONB, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    request_method = Column(String(10), nullable=True)
    request_path = Column(String(500), nullable=True)
    response_status = Column(Integer, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    error_type = Column(String(100), nullable=True)
    error_message = Column(Text, nullable=True)
    stack_trace = Column(Text, nullable=True)
    correlation_id = Column(UUID(as_uuid=True), default=uuid.uuid4, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    indexed_at = Column(DateTime, nullable=True)

    __table_args__ = (
        Index('idx_system_logs_composite', 'log_category', 'created_at', 'user_id'),
        Index('idx_system_logs_details', 'details', postgresql_using='gin'),
    )


class ApiRequestLog(Base):
    """Detailed API request tracking"""
    __tablename__ = "api_request_logs"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    endpoint = Column(String(500), nullable=False, index=True)
    method = Column(String(10), nullable=False)
    status_code = Column(Integer, nullable=False, index=True)
    request_body = Column(JSONB, nullable=True)
    response_body = Column(JSONB, nullable=True)
    query_params = Column(JSONB, nullable=True)
    headers = Column(JSONB, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    duration_ms = Column(Integer, nullable=False)
    memory_usage_mb = Column(Float, nullable=True)
    db_queries_count = Column(Integer, nullable=True)
    db_query_time_ms = Column(Integer, nullable=True)
    correlation_id = Column(UUID(as_uuid=True), default=uuid.uuid4, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    __table_args__ = (
        Index('idx_api_logs_slow', 'duration_ms', postgresql_where='duration_ms > 1000'),
    )


class ErrorLog(Base):
    """Detailed error tracking and management"""
    __tablename__ = "error_logs"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    error_type = Column(String(100), nullable=False, index=True)
    error_code = Column(String(50), nullable=True)
    error_message = Column(Text, nullable=False)
    stack_trace = Column(Text, nullable=True)
    context = Column(JSONB, nullable=True)
    severity = Column(String(20), nullable=True, index=True)
    source_file = Column(String(255), nullable=True)
    source_function = Column(String(100), nullable=True)
    source_line = Column(Integer, nullable=True)
    is_resolved = Column(Boolean, default=False, nullable=False, index=True)
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(String, ForeignKey("users.id"), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    occurrence_count = Column(Integer, default=1, nullable=False)
    first_occurred_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    last_occurred_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)


class AuditLog(Base):
    """Enhanced admin and user activity audit trail"""
    __tablename__ = "audit_logs"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    action = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(50), nullable=True)
    resource_id = Column(String(100), nullable=True)
    old_value = Column(JSONB, nullable=True)
    new_value = Column(JSONB, nullable=True)
    change_summary = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    is_admin_action = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    __table_args__ = (
        Index('idx_audit_logs_resource', 'resource_type', 'resource_id'),
    )


class PerformanceLog(Base):
    """System performance metrics and monitoring"""
    __tablename__ = "performance_logs"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    metric_type = Column(String(50), nullable=False, index=True)
    metric_name = Column(String(100), nullable=False)
    metric_value = Column(Float, nullable=False)
    threshold = Column(Float, nullable=True)
    is_exceeded = Column(Boolean, nullable=True)
    context = Column(JSONB, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    memory_mb = Column(Float, nullable=True)
    cpu_percent = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    __table_args__ = (
        Index('idx_perf_logs_exceeded', 'is_exceeded', postgresql_where='is_exceeded = true'),
    )

