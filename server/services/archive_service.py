from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy import func
from db_utils.db import SessionLocal, Disaster, Post, Alert
import logging

logger = logging.getLogger(__name__)

class ArchiveService:
    def __init__(self):
        self.db = SessionLocal()

    def get_completed_disasters(self, days_threshold: int = 7) -> List[Disaster]:
        """Get disasters that are completed and ready for archival."""
        try:
            threshold_date = datetime.utcnow() - timedelta(days=days_threshold)
            disasters = (
                self.db.query(Disaster)
                .filter(
                    Disaster.event_time.isnot(None),
                    Disaster.event_time < threshold_date,
                )
                .all()
            )
            return disasters
        except Exception as e:
            logger.error(f"Error fetching completed disasters: {str(e)}")
            return []

    def archive_disaster(self, disaster_id: int) -> bool:
        """Archive a disaster and its related data."""
        try:
            # Get the disaster to archive
            disaster = (
                self.db.query(Disaster).filter(Disaster.id == disaster_id).first()
            )
            if not disaster:
                logger.warning(f"Disaster {disaster_id} not found")
                return False

            # Archive related posts
            self._archive_disaster_posts(disaster_id)

            # Archive related alerts
            self._archive_disaster_alerts(disaster_id)

            # Update original disaster to mark as archived
            disaster.archived = True
            self.db.commit()

            logger.info(f"Successfully archived disaster {disaster_id}")
            return True
        except Exception as e:
            logger.error(f"Error archiving disaster {disaster_id}: {str(e)}")
            self.db.rollback()
            return False

    def _archive_disaster_posts(self, disaster_id: int) -> bool:
        """Archive related posts to archive table."""
        try:
            posts = self.db.query(Post).filter(Post.id == disaster_id).all()

            for post in posts:
                insert_query = """
                    INSERT INTO archived_posts (
                        original_id, disaster_id, content, post_id, 
                        platform, event_time, location, sentiment, metadata, created_at
                    )
                    VALUES (:original_id, :disaster_id, :content, :post_id, 
                            :platform, :event_time, :location, :sentiment, :metadata, :created_at)
                """
                self.db.execute(
                    insert_query,
                    {
                        "original_id": post.id,
                        "disaster_id": disaster_id,
                        "content": post.text,
                        "post_id": post.bluesky_id,
                        "platform": "bluesky",
                        "event_time": post.created_at,
                        "location": None,
                        "sentiment": post.sentiment,
                        "metadata": post.raw_data,
                        "created_at": post.collected_at,
                    },
                )

            self.db.commit()
            return True
        except Exception as e:
            logger.error(f"Error archiving posts for disaster {disaster_id}: {str(e)}")
            self.db.rollback()
            return False

    def _archive_disaster_alerts(self, disaster_id: int) -> bool:
        """Archive related alerts to archive table."""
        try:
            alerts = self.db.query(Alert).filter(Alert.disaster_id == disaster_id).all()

            for alert in alerts:
                insert_query = """
                    INSERT INTO archived_alerts (
                        original_id, disaster_id, alert_type, severity,
                        message, location, metadata, created_at
                    )
                    VALUES (:original_id, :disaster_id, :alert_type, :severity,
                            :message, :location, :metadata, :created_at)
                """
                self.db.execute(
                    insert_query,
                    {
                        "original_id": alert.id,
                        "disaster_id": disaster_id,
                        "alert_type": alert.alert_type,
                        "severity": alert.severity,
                        "message": alert.message,
                        "location": None,
                        "metadata": alert.alert_metadata,
                        "created_at": alert.created_at,
                    },
                )

            self.db.commit()
            return True
        except Exception as e:
            logger.error(f"Error archiving alerts for disaster {disaster_id}: {str(e)}")
            self.db.rollback()
            return False

    def get_archived_disaster_stats(self) -> Dict[str, Any]:
        """Get statistics about archived disasters."""
        try:
            query = """
                SELECT 
                    COUNT(*) as total_archived,
                    COUNT(DISTINCT disaster_type) as disaster_types
                FROM archived_disasters
            """
            result = self.db.execute(query).fetchone()
            return {
                "total_archived": result[0] if result else 0,
                "disaster_types": result[1] if result else 0,
            }
        except Exception as e:
            logger.error(f"Error fetching archive statistics: {str(e)}")
            return {}

    def search_archived_disasters(
        self,
        start_date: datetime = None,
        end_date: datetime = None,
        disaster_type: str = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[Any, Any]]:
        """Search archived disasters with various filters."""
        try:
            conditions = []
            params = {}

            if start_date:
                conditions.append("start_time >= :start_date")
                params["start_date"] = start_date

            if end_date:
                conditions.append("end_time <= :end_date")
                params["end_date"] = end_date

            if disaster_type:
                conditions.append("disaster_type = :disaster_type")
                params["disaster_type"] = disaster_type

            where_clause = " AND ".join(conditions) if conditions else "1=1"

            query = f"""
                SELECT * FROM archived_disasters
                WHERE {where_clause}
                ORDER BY end_time DESC NULLS LAST
                LIMIT :limit OFFSET :offset
            """
            params["limit"] = limit
            params["offset"] = offset

            results = self.db.execute(query, params).fetchall()
            return results if results else []
        except Exception as e:
            logger.error(f"Error searching archived disasters: {str(e)}")
            return []

    def close(self):
        """Close database connection"""
        if self.db:
            self.db.close()

    def __del__(self):
        """Cleanup on deletion"""
        self.close()
