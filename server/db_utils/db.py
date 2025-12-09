from sqlalchemy import (
    create_engine,
    Column,
    Boolean,
    String,
    DateTime,
    Integer,
    BigInteger,
    Text,
    ForeignKey,
    Float,
    JSON,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from datetime import datetime
import os
from typing import Optional, Dict
import logging

logger = logging.getLogger(__name__)

# Database URL - using PostgreSQL
DATABASE_URL = os.getenv("DATABASE_URL")

# SQLAlchemy setup
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# User model
class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    picture = Column(String, nullable=True)
    password = Column(String(255), nullable=True)
    password_reset_token = Column(String(255), nullable=True)
    password_reset_expires = Column(DateTime, nullable=True)
    location = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    role = Column(String(50), default='user', nullable=False, index=True)
    is_admin = Column(Boolean, default=False, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    deleted_at = Column(DateTime, nullable=True, index=True)
    last_login = Column(DateTime, nullable=True)
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    account_locked_until = Column(DateTime, nullable=True)
    onboarding_completed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class UserNotificationPreference(Base):
    __tablename__ = "user_notification_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    email_opt_in = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class UserMapPreferences(Base):
    __tablename__ = "user_map_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        String,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    light_style = Column(String(100), nullable=False, default="standard")
    dark_style = Column(String(100), nullable=False, default="standard-satellite")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    user = relationship("User")


class EmailLog(Base):
    __tablename__ = "email_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    crisis_id = Column(Integer, ForeignKey("disasters.id"), nullable=True, index=True)
    email_status = Column(String(50), nullable=True)
    provider_message_id = Column(String(255), nullable=True)
    sent_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    opened_at = Column(DateTime, nullable=True)
    payload = Column(JSON, nullable=True)


# BlueSky models
class CollectionRun(Base):
    __tablename__ = "collection_runs"

    id = Column(Integer, primary_key=True, index=True)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    status = Column(String(50), nullable=False, default="running")
    posts_collected = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)

    posts = relationship("Post", back_populates="collection_run")
    disasters = relationship("Disaster", back_populates="collection_run")


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    bluesky_id = Column(String(255), unique=True, nullable=False, index=True)
    author_handle = Column(String(255), nullable=False)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False)
    collected_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    raw_data = Column(JSON, nullable=True)
    collection_run_id = Column(Integer, ForeignKey("collection_runs.id"), nullable=False)
    sentiment = Column(String(50), nullable=True)
    sentiment_score = Column(Float, nullable=True)
    disaster_type = Column(String(50), nullable=True, index=True)
    
    # Relevancy scoring
    relevancy_score = Column(Integer, nullable=False, default=0, index=True)
    relevancy_breakdown = Column(JSON, nullable=True)
    relevancy_flags = Column(JSONB, nullable=True)
    is_relevant = Column(Boolean, nullable=False, default=True, index=True)

    # Post engagement metrics
    like_count = Column(Integer, default=0)
    repost_count = Column(Integer, default=0)
    reply_count = Column(Integer, default=0)

    # Author profile info
    author_display_name = Column(String(255))
    author_description = Column(Text)
    author_followers_count = Column(Integer)
    author_following_count = Column(Integer)
    author_posts_count = Column(Integer)
    author_avatar_url = Column(Text)

    # Post metadata
    has_media = Column(Boolean, default=False)
    media_count = Column(Integer, default=0)
    media_urls = Column(JSON)  # Store as JSON array
    hashtags = Column(JSON)    # Store as JSON array
    mentions = Column(JSON)    # Store as JSON array
    external_urls = Column(JSON)  # Store as JSON array
    language = Column(String(10))

    # Location data
    post_location = Column(String(500))
    post_latitude = Column(Float)
    post_longitude = Column(Float)

    # Temporal data
    indexed_at = Column(DateTime(timezone=True))
    last_modified_at = Column(DateTime(timezone=True))

    # Labels and categorization
    content_labels = Column(JSON)  # Store as JSON array
    content_warnings = Column(JSON)  # Store as JSON array
    moderation_status = Column(String(50))

    # Reply context
    reply_to_post_id = Column(String(255))
    reply_root_post_id = Column(String(255))
    thread_depth = Column(Integer, default=0)

    # Relationships
    collection_run = relationship("CollectionRun", back_populates="posts")
    disasters = relationship("Disaster", back_populates="post")


class Disaster(Base):
    __tablename__ = "disasters"

    id = Column(Integer, primary_key=True, index=True)
    location_name = Column(String(500), index=True)
    latitude = Column(Float, index=True)
    longitude = Column(Float, index=True)
    event_time = Column(DateTime, nullable=True, index=True)
    severity = Column(Integer)
    magnitude = Column(Float)
    description = Column(Text)
    affected_population = Column(Integer, nullable=True)
    extracted_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    collection_run_id = Column(Integer, ForeignKey("collection_runs.id"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=True)
    disaster_type = Column(String(50), nullable=True)
    archived = Column(Boolean, default=False, nullable=False, index=True)

    collection_run = relationship("CollectionRun", back_populates="disasters")
    post = relationship("Post", back_populates="disasters")


class DataFeed(Base):
    __tablename__ = "data_feeds"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    feed_type = Column(String(100), nullable=False)
    status = Column(String(50), default="active", nullable=False)
    last_run_at = Column(DateTime, nullable=True)
    next_run_at = Column(DateTime, nullable=True)
    total_runs = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    disaster_id = Column(
        Integer,
        ForeignKey("disasters.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    alert_type = Column(String(50), nullable=False)
    severity = Column(Integer, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    alert_metadata = Column(JSON, nullable=True)

    disaster = relationship("Disaster")
    queue_entries = relationship("AlertQueue", back_populates="alert")


class AlertQueue(Base):
    __tablename__ = "alert_queue"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(
        Integer, ForeignKey("alerts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id = Column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    recipient_email = Column(String(255), nullable=False)
    recipient_name = Column(String(255), nullable=True)
    priority = Column(Integer, default=3, nullable=False, index=True)
    status = Column(String(50), default="pending", nullable=False, index=True)
    scheduled_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    sent_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0, nullable=False)
    max_retries = Column(Integer, default=3, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    alert = relationship("Alert", back_populates="queue_entries")


class UserAlertPreferences(Base):
    __tablename__ = "user_alert_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    min_severity = Column(Integer, default=3, nullable=False)
    email_enabled = Column(Boolean, default=True, nullable=False)
    watched_regions = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    user = relationship("User")


class ArchivedDisaster(Base):
    __tablename__ = "archived_disasters"

    id = Column(Integer, primary_key=True, index=True)
    original_id = Column(Integer, nullable=False, index=True)
    disaster_type = Column(String(100), nullable=False)
    location = Column(JSON, nullable=False)
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=True, index=True)
    severity = Column(Integer, nullable=True)
    affected_population = Column(Integer, nullable=True)
    archive_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    archived_at = Column(DateTime, default=datetime.utcnow)


class ArchivedPost(Base):
    __tablename__ = "archived_posts"

    id = Column(Integer, primary_key=True, index=True)
    original_id = Column(Integer, nullable=False, index=True)
    disaster_id = Column(Integer, nullable=False, index=True)
    content = Column(Text, nullable=False)
    post_id = Column(String(255), nullable=False)
    platform = Column(String(50), nullable=False)
    event_time = Column(DateTime, nullable=False, index=True)
    location = Column(JSON, nullable=True)
    sentiment = Column(Float, nullable=True)
    archive_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    archived_at = Column(DateTime, default=datetime.utcnow)


class ArchivedAlert(Base):
    __tablename__ = "archived_alerts"

    id = Column(Integer, primary_key=True, index=True)
    original_id = Column(Integer, nullable=False, index=True)
    disaster_id = Column(Integer, nullable=False, index=True)
    alert_type = Column(String(50), nullable=False)
    severity = Column(Integer, nullable=False)
    message = Column(Text, nullable=False)
    location = Column(JSON, nullable=True)
    archive_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    archived_at = Column(DateTime, default=datetime.utcnow)


class AdminActivityLog(Base):
    __tablename__ = "admin_activity_log"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    admin_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    action = Column(String(100), nullable=False)
    target_user_id = Column(String, nullable=True)
    details = Column(JSONB, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # relationship to admin user (optional)
    admin = relationship("User")


def get_db_session():
    """Get database session"""
    db = SessionLocal()
    try:
        return db
    except Exception as e:
        logger.error(f"Error creating database session: {e}")
        return None

def init_db():
    """Initialize database tables"""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise

def upsert_user(user_id: str, email: str, name: str, picture: str) -> Optional[Dict]:
    """Insert or update user in database"""
    try:
        db = get_db_session()
        if db is None:
            logger.error("Could not establish database session")
            return None

        # Check if user exists by email (since email is unique)
        existing_user = db.query(User).filter(User.email == email).first()

        if existing_user:
            # If user was deleted, restore them (clear deleted_at and set is_active)
            if existing_user.deleted_at is not None:
                existing_user.deleted_at = None
                existing_user.is_active = True
                logger.info(f"Restored previously deleted user: {email}")
            
            # Update existing user
            existing_user.id = user_id  # Update ID in case it changed
            existing_user.name = name
            existing_user.picture = picture
            existing_user.updated_at = datetime.utcnow()
            user = existing_user
            logger.info(f"Updated existing user: {email}")
        else:
            # No user exists at all - create brand new user
            user = User(
                id=user_id,
                email=email,
                name=name,
                picture=picture
            )
            db.add(user)
            logger.info(f"Created new user: {email}")

        db.commit()
        db.refresh(user)

        return {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "picture": user.picture,
            "location": user.location,
            "latitude": user.latitude,
            "longitude": user.longitude,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
        }

    except Exception as e:
        logger.error(f"Error in upsert_user: {e}")
        if db:
            db.rollback()
        return None
    finally:
        if db:
            db.close()

def get_user_by_email(email: str) -> Optional[Dict]:
    """Get user by email from database"""
    try:
        db = get_db_session()
        if db is None:
            logger.error("Could not establish database session")
            return None

        user = db.query(User).filter(
            User.email == email,
            User.deleted_at == None
        ).first()

        if user:
            return {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "picture": user.picture,
                "location": user.location,
                "latitude": user.latitude,
                "longitude": user.longitude,
                "role": user.role,
                "created_at": user.created_at,
                "updated_at": user.updated_at,
                "onboarding_completed": user.onboarding_completed,
            }
        return None

    except Exception as e:
        logger.error(f"Error in get_user_by_email: {e}")
        return None
    finally:
        if db:
            db.close()


# Import logging models to register them with SQLAlchemy
from .logging_models import (
    SystemLog,
    ApiRequestLog,
    ErrorLog,
    AuditLog,
    PerformanceLog,
)
