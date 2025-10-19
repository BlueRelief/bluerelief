from datetime import datetime, timedelta
from typing import List, Dict, Any
from db_utils.db import SessionLocal, Disaster, Post, Alert

class ArchiveService:
    def __init__(self):
        self.db = SessionLocal()

    async def get_completed_disasters(self, days_threshold: int = 7) -> List[Dict[Any, Any]]:
        """Get disasters that are completed and ready for archival."""
        threshold_date = datetime.utcnow() - timedelta(days=days_threshold)
        query = """
            SELECT id FROM disasters 
            WHERE end_time IS NOT NULL 
            AND end_time < $1 
            AND archived = FALSE
        """
        return await self.db.fetch_all(query, threshold_date)

    async def archive_disaster(self, disaster_id: int) -> bool:
        """Archive a disaster and its related data."""
        async with self.db.transaction():
            try:
                # Archive the disaster
                await self._archive_disaster_record(disaster_id)
                # Archive related posts
                await self._archive_disaster_posts(disaster_id)
                # Archive related alerts
                await self._archive_disaster_alerts(disaster_id)
                # Mark original disaster as archived
                await self._mark_disaster_archived(disaster_id)
                return True
            except Exception as e:
                print(f"Error archiving disaster {disaster_id}: {str(e)}")
                return False

    async def _archive_disaster_record(self, disaster_id: int):
        """Move disaster record to archive table."""
        query = """
            INSERT INTO archived_disasters (
                original_id, disaster_type, location, start_time, 
                end_time, severity, affected_population, metadata
            )
            SELECT 
                id, disaster_type, location, start_time, 
                end_time, severity, affected_population, metadata
            FROM disasters
            WHERE id = $1
        """
        await self.db.execute(query, disaster_id)

    async def _archive_disaster_posts(self, disaster_id: int):
        """Move related posts to archive table."""
        query = """
            INSERT INTO archived_posts (
                original_id, disaster_id, content, post_id, 
                platform, event_time, location, sentiment, metadata
            )
            SELECT 
                id, disaster_id, content, post_id, 
                platform, event_time, location, sentiment, metadata
            FROM posts
            WHERE disaster_id = $1
        """
        await self.db.execute(query, disaster_id)

    async def _archive_disaster_alerts(self, disaster_id: int):
        """Move related alerts to archive table."""
        query = """
            INSERT INTO archived_alerts (
                original_id, disaster_id, alert_type, severity,
                message, location, metadata
            )
            SELECT 
                id, disaster_id, alert_type, severity,
                message, location, metadata
            FROM alerts
            WHERE disaster_id = $1
        """
        await self.db.execute(query, disaster_id)

    async def _mark_disaster_archived(self, disaster_id: int):
        """Mark the original disaster as archived."""
        query = """
            UPDATE disasters 
            SET archived = TRUE 
            WHERE id = $1
        """
        await self.db.execute(query, disaster_id)

    async def get_archived_disaster_stats(self) -> Dict[str, Any]:
        """Get statistics about archived disasters."""
        query = """
            SELECT 
                COUNT(*) as total_archived,
                MIN(start_time) as oldest_disaster,
                MAX(end_time) as most_recent_disaster,
                COUNT(DISTINCT disaster_type) as disaster_types
            FROM archived_disasters
        """
        return await self.db.fetch_one(query)

    async def search_archived_disasters(
        self,
        start_date: datetime = None,
        end_date: datetime = None,
        disaster_type: str = None,
        location: Dict = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[Any, Any]]:
        """Search archived disasters with various filters."""
        conditions = ["1=1"]
        params = []
        param_count = 1

        if start_date:
            conditions.append(f"start_time >= ${param_count}")
            params.append(start_date)
            param_count += 1

        if end_date:
            conditions.append(f"end_time <= ${param_count}")
            params.append(end_date)
            param_count += 1

        if disaster_type:
            conditions.append(f"disaster_type = ${param_count}")
            params.append(disaster_type)
            param_count += 1

        if location:
            conditions.append(f"location @> ${param_count}")
            params.append(location)
            param_count += 1

        query = f"""
            SELECT * FROM archived_disasters
            WHERE {" AND ".join(conditions)}
            ORDER BY end_time DESC
            LIMIT ${param_count} OFFSET ${param_count + 1}
        """
        params.extend([limit, offset])
        
        return await self.db.fetch_all(query, *params)