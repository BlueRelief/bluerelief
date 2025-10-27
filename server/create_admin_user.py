#!/usr/bin/env python3
"""
Script to create an initial admin user in the database.
Run this once to set up your first admin user.
"""

import os
from sqlalchemy import create_engine
from datetime import datetime
from db_utils.db import SessionLocal, User

# You can customize these values
DEFAULT_ADMIN_EMAIL = 'admin@bluerelief.com'
DEFAULT_ADMIN_NAME = 'Administrator'

def create_admin_user():
    """Create an admin user in the database"""
    
    # Get database URL from environment
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("Error: DATABASE_URL environment variable is not set")
        print("Please set DATABASE_URL before running this script")
        return
    
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
            import time
            user = User(
                id=f'user-{int(time.time())}',
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
        
        print("\nAdmin Login Credentials:")
        print(f"  Email:    {DEFAULT_ADMIN_EMAIL}")
        print(f"  Password: admin-placeholder")
        print("\n⚠️  IMPORTANT: Change the password in production!")
        
    except Exception as e:
        print(f"Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()

