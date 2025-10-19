from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from db_utils.db import Alert, AlertQueue, SessionLocal
import logging

logger = logging.getLogger(__name__)


def cleanup_old_alerts():
    """Cleanup old alerts and queue records
    
    Runs daily at 2 AM to:
    - Mark old alerts as read
    - Archive old queue records
    - Clean up orphaned records
    """
    db = SessionLocal()
    try:
        logger.info("Starting alert cleanup job")
        
        cutoff_30_days = datetime.utcnow() - timedelta(days=30)
        cutoff_7_days = datetime.utcnow() - timedelta(days=7)
        
        old_unread = db.query(Alert).filter(
            Alert.created_at < cutoff_30_days,
            Alert.is_read == False
        ).update({"is_read": True})
        db.commit()
        logger.info(f"Marked {old_unread} old unread alerts as read")
        
        old_queue_entries = db.query(AlertQueue).filter(
            AlertQueue.created_at < cutoff_7_days,
            AlertQueue.status.in_(["sent", "failed"])
        ).delete()
        db.commit()
        logger.info(f"Deleted {old_queue_entries} old queue entries")
        
        logger.info("Alert cleanup completed")
        
        return {
            "status": "success",
            "old_alerts_marked_read": old_unread,
            "old_queue_entries_deleted": old_queue_entries,
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error in alert cleanup: {str(e)}")
        raise
    finally:
        db.close()
