from typing import Optional, Dict, Any
from db_utils.db import SessionLocal
from sqlalchemy import text
from datetime import datetime
import json
import logging

logger = logging.getLogger(__name__)


def log_admin_activity(admin_id: Optional[str], action: str, target_user_id: Optional[str] = None, details: Optional[Dict[str, Any]] = None, ip_address: Optional[str] = None, user_agent: Optional[str] = None):
    """Log admin activity to admin_activity_log table"""
    db = SessionLocal()
    try:
        details_json = json.dumps(details or {})
        sql = text("""
        INSERT INTO admin_activity_log (admin_id, action, target_user_id, details, ip_address, user_agent, created_at)
        VALUES (:admin_id, :action, :target_user_id, :details, :ip_address, :user_agent, :created_at)
        """)
        params = {
            'admin_id': admin_id,
            'action': action,
            'target_user_id': target_user_id,
            'details': details_json,
            'ip_address': ip_address,
            'user_agent': user_agent,
            'created_at': datetime.utcnow(),
        }
        db.execute(sql, params)
        db.commit()
    except Exception as e:
        db.rollback()
        # Only log as error if it's a real database issue, not a missing table
        error_msg = str(e)
        if "relation" in error_msg.lower() and "does not exist" in error_msg.lower():
            # Table doesn't exist yet - log debug level instead of error
            logger.debug(f"admin_activity_log table not found, skipping log entry")
        else:
            logger.error(f"Failed to log admin activity: {e}")
    finally:
        db.close()
