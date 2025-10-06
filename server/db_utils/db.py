from sqlalchemy import create_engine, Column, String, DateTime, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
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
    
    id = Column(String, primary_key=True, index=True)  # Google user ID
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    picture = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

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
            # Update existing user
            existing_user.id = user_id  # Update ID in case it changed
            existing_user.name = name
            existing_user.picture = picture
            existing_user.updated_at = datetime.utcnow()
            user = existing_user
            logger.info(f"Updated existing user: {email}")
        else:
            # Create new user
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
            "created_at": user.created_at,
            "updated_at": user.updated_at
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
        
        user = db.query(User).filter(User.email == email).first()
        
        if user:
            return {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "picture": user.picture,
                "created_at": user.created_at,
                "updated_at": user.updated_at
            }
        return None
        
    except Exception as e:
        logger.error(f"Error in get_user_by_email: {e}")
        return None
    finally:
        if db:
            db.close()
