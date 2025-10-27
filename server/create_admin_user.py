#!/usr/bin/env python3
"""
Script to create an initial admin user in the database.
Run this once to set up your first admin user.

NOTE: This system currently uses placeholder authentication.
The password verification is temporary and uses a hardcoded value.
For production deployment, implement proper password hashing.
"""

import os
import sys
import time
import secrets
import string
import logging
from datetime import datetime
from sqlalchemy.exc import SQLAlchemyError
from db_utils.db import SessionLocal, User

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# You can customize these values
DEFAULT_ADMIN_EMAIL = 'admin@bluerelief.com'
DEFAULT_ADMIN_NAME = 'Administrator'

def generate_secure_password(length: int = 24) -> str:
    """Generate a cryptographically secure random password"""
    alphabet = string.ascii_letters + string.digits + string.punctuation
    password = ''.join(secrets.choice(alphabet) for _ in range(length))
    return password

def create_admin_user():
    """Create an admin user in the database"""
    
    # Get database URL from environment
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("Error: DATABASE_URL environment variable is not set")
        print("Please set DATABASE_URL before running this script")
        logger.error("DATABASE_URL environment variable is not set")
        sys.exit(1)
    
    db = SessionLocal()
    try:
        # Check if admin user already exists
        existing = db.query(User).filter(User.email == DEFAULT_ADMIN_EMAIL).first()
        
        if existing:
            # Update existing user to be admin
            if not existing.is_admin:
                existing.is_admin = True
                existing.is_active = True
                existing.role = 'admin'
                db.commit()
                print(f"✓ Updated existing user '{DEFAULT_ADMIN_EMAIL}' to admin")
            else:
                print(f"✓ Admin user '{DEFAULT_ADMIN_EMAIL}' already exists")
        else:
            # Create new admin user
            user = User(
                id=f'admin-{int(time.time())}',
                email=DEFAULT_ADMIN_EMAIL,
                name=DEFAULT_ADMIN_NAME,
                role='admin',
                is_admin=True,
                is_active=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"✓ Created admin user: {DEFAULT_ADMIN_EMAIL}")
        
        print("\n" + "="*70)
        print("⚠️  ADMIN AUTHENTICATION SYSTEM")
        print("="*70)
        print("\nCurrent System Status:")
        print("  This system uses PLACEHOLDER authentication for admin login.")
        print("  The password verification is hardcoded in the backend.")
        print("\n  Database Note:")
        print("  - User model does NOT include a password field")
        print("  - Password verification uses hardcoded placeholder")
        print("  - This is a temporary development authentication method")
        print("\nAdmin Login Credentials:")
        print(f"  Email:    {DEFAULT_ADMIN_EMAIL}")
        print(f"  Password: admin-placeholder")
        print("\n⚠️  PRODUCTION DEPLOYMENT:")
        print("  1. Add password hash field to User model")
        print("  2. Implement proper password hashing (bcrypt/argon2)")
        print("  3. Update admin_auth.py to verify hashed passwords")
        print("  4. Add password change functionality")
        print("  5. Consider implementing OAuth for admin users")
        print("="*70)
        print("\n⚠️  SECURITY WARNING:")
        print("  - This is development/placeholder auth only")
        print("  - Do NOT use this in production without modification")
        print("  - Consider implementing proper SSO/OAuth for admin access\n")
        
    except SQLAlchemyError as e:
        logger.exception("Database error occurred while creating admin user")
        db.rollback()
        print(f"\n✗ Database error: {e}")
        sys.exit(1)
    except (TypeError, ValueError) as e:
        logger.exception(f"Type or value error: {e}")
        print(f"\n✗ Invalid data: {e}")
        sys.exit(1)
    except Exception as e:
        logger.exception("Unexpected error occurred while creating admin user")
        db.rollback()
        print(f"\n✗ Unexpected error: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()

