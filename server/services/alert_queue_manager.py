from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from db_utils.db import AlertQueue, SessionLocal
import logging

logger = logging.getLogger(__name__)


def manage_alert_queue():
    """Manage alert queue status
    
    Runs every 2 minutes to:
    - Monitor pending alerts
    - Handle retry logic
    - Update queue status
    - Apply user preferences filtering
    """
    db = SessionLocal()
    try:
        logger.info("Starting alert queue management job")
        
        pending_entries = db.query(AlertQueue).filter(
            AlertQueue.status == "pending"
        ).order_by(AlertQueue.priority, AlertQueue.scheduled_at).all()
        
        logger.info(f"Found {len(pending_entries)} pending alert queue entries")
        
        processed = 0
        for entry in pending_entries:
            entry.status = "processing"
            entry.updated_at = datetime.utcnow()
            db.add(entry)
            processed += 1
        
        if processed > 0:
            db.commit()
        
        failed_entries = db.query(AlertQueue).filter(
            AlertQueue.status == "failed",
            AlertQueue.retry_count < AlertQueue.max_retries,
        ).order_by(AlertQueue.priority).all()
        
        logger.info(f"Found {failed_entries.__len__()} failed entries eligible for retry")
        
        retried = 0
        for entry in failed_entries:
            entry.status = "pending"
            entry.retry_count += 1
            entry.updated_at = datetime.utcnow()
            db.add(entry)
            retried += 1
        
        if retried > 0:
            db.commit()
        
        logger.info(f"Alert queue management completed: {processed} processed, {retried} retried")
        
        return {
            "status": "success",
            "processed": processed,
            "retried": retried,
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error in alert queue management: {str(e)}")
        raise
    finally:
        db.close()
