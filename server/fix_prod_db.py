#!/usr/bin/env python3
"""
Production database fixer for BlueRelief
Handles migration name conversions and applies pending migrations
Safe and idempotent for production environments
"""

import os
import sys
from pathlib import Path
from sqlalchemy import text
from db_utils.db import engine
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def create_migrations_table(conn):
    """Create schema_migrations table if it doesn't exist"""
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
    """
    conn.execute(text(create_table_sql))
    conn.commit()
    logger.info("✅ Migrations tracking table ready")


def get_applied_migrations(conn):
    """Get list of already applied migrations"""
    result = conn.execute(
        text("SELECT migration_name FROM schema_migrations ORDER BY applied_at")
    )
    return {row[0] for row in result}


def update_migration_names_to_timestamps(conn):
    """Update old numbered migration names to timestamp format"""
    legacy_renames = {
        "001_create_base_schema.sql": "20251016090000_create_base_schema.sql",
        "002_add_disaster_type_to_posts.sql": "20251016091500_add_disaster_type_to_posts.sql",
        "003_add_sentiment_to_posts.sql": "20251016093000_add_sentiment_to_posts.sql",
        "004_add_affected_population.sql": "20251016094500_add_affected_population.sql",
        "005_add_post_id_to_disasters.sql": "20251016100000_add_post_id_to_disasters.sql",
        "006_add_notifications_tables.sql": "20251017090000_add_notifications_tables.sql",
        "20251018333000_fix_location_schema.sql": "20251018150000_fix_location_schema.sql",
    }

    result = conn.execute(text("SELECT migration_name FROM schema_migrations"))
    existing_migrations = {row[0] for row in result}

    updated = []
    for old_name, new_name in legacy_renames.items():
        if old_name in existing_migrations:
            logger.info(f"🔄 Updating migration: {old_name} → {new_name}")
            try:
                conn.execute(
                    text(
                        "UPDATE schema_migrations SET migration_name = :new_name WHERE migration_name = :old_name"
                    ),
                    {"old_name": old_name, "new_name": new_name},
                )
                conn.commit()
                updated.append(old_name)
            except Exception as e:
                logger.error(f"❌ Failed to update {old_name}: {str(e)}")
                conn.rollback()

    if updated:
        logger.info(f"✅ Successfully updated {len(updated)} migration name(s)")
    else:
        logger.info("ℹ️  No legacy migrations to update")

    return len(updated)


def record_migration(conn, migration_name):
    """Record a successfully applied migration"""
    conn.execute(
        text("INSERT INTO schema_migrations (migration_name) VALUES (:name)"),
        {"name": migration_name},
    )
    conn.commit()


def fix_prod_db():
    """Main function to fix production database"""
    logger.info("🔧 Starting production database fix...")

    migrations_dir = Path(__file__).parent / "migrations"

    if not migrations_dir.exists():
        logger.error(f"❌ Migrations directory not found: {migrations_dir}")
        return False

    try:
        with engine.connect() as conn:
            logger.info("📍 Creating migrations table...")
            create_migrations_table(conn)

            logger.info("📍 Updating legacy migration names...")
            update_migration_names_to_timestamps(conn)

            applied_migrations = get_applied_migrations(conn)
            logger.info(f"📊 Already applied: {len(applied_migrations)} migration(s)")

            migration_files = sorted(migrations_dir.glob("*.sql"))
            if not migration_files:
                logger.warning("⚠️  No migration files found")
                return True

            pending_migrations = [
                f for f in migration_files if f.name not in applied_migrations
            ]

            if not pending_migrations:
                logger.info("✨ All migrations already applied - database is up to date!")
                return True

            logger.info(f"📋 Found {len(pending_migrations)} pending migration(s)")

            for migration_file in pending_migrations:
                try:
                    logger.info(f"⚙️  Running migration: {migration_file.name}")

                    with open(migration_file, 'r') as f:
                        migration_sql = f.read()

                    conn.execute(text(migration_sql))
                    conn.commit()

                    record_migration(conn, migration_file.name)
                    logger.info(f"✅ Completed: {migration_file.name}")

                except Exception as e:
                    logger.error(f"❌ Failed to run {migration_file.name}: {str(e)}")
                    conn.rollback()
                    return False

        logger.info("🎉 Production database fix completed successfully!")
        return True

    except Exception as e:
        logger.error(f"❌ Fatal error during database fix: {str(e)}")
        return False


if __name__ == "__main__":
    success = fix_prod_db()
    sys.exit(0 if success else 1)
