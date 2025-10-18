"""
One-time script to update migration names in schema_migrations table
Run this once on production to rename old migration entries to new numbered format
"""
import sys
from sqlalchemy import text
from db_utils.db import engine
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MIGRATION_RENAMES = {
    "add_disaster_type_to_posts.sql": "002_add_disaster_type_to_posts.sql",
    "add_sentiment_to_posts.sql": "003_add_sentiment_to_posts.sql",
    "add_affected_population.sql": "004_add_affected_population.sql",
    "add_post_id_to_disasters.sql": "005_add_post_id_to_disasters.sql",
    "add_notifications_tables.sql": "006_add_notifications_tables.sql",
}


def fix_migration_names():
    """Update old migration names to new numbered format"""
    try:
        with engine.connect() as conn:
            table_exists = conn.execute(
                text(
                    "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'schema_migrations')"
                )
            ).scalar()

            if not table_exists:
                logger.info("✨ No schema_migrations table found - nothing to fix!")
                return True

            result = conn.execute(
                text("SELECT migration_name FROM schema_migrations")
            )
            existing_migrations = [row[0] for row in result]

            logger.info(
                f"Found {len(existing_migrations)} migration(s) in database: {existing_migrations}"
            )

            if not existing_migrations:
                logger.info("✨ No migrations to rename")
                return True

            renamed_count = 0
            for old_name, new_name in MIGRATION_RENAMES.items():
                if old_name in existing_migrations:
                    logger.info(f"Renaming: {old_name} → {new_name}")
                    conn.execute(
                        text(
                            "UPDATE schema_migrations SET migration_name = :new_name WHERE migration_name = :old_name"
                        ),
                        {"old_name": old_name, "new_name": new_name},
                    )
                    renamed_count += 1

            conn.commit()

            if renamed_count > 0:
                logger.info(f"✅ Renamed {renamed_count} migration(s)")
            else:
                logger.info("✨ All migration names already up to date")

            result = conn.execute(
                text("SELECT migration_name FROM schema_migrations ORDER BY applied_at")
            )
            updated_migrations = [row[0] for row in result]
            logger.info(f"Current migrations: {updated_migrations}")

            return True

    except Exception as e:
        logger.error(f"❌ Failed to fix migration names: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    logger.info("🔧 Fixing migration names in schema_migrations table...")
    fix_migration_names()
    logger.info("🎉 Done!")

