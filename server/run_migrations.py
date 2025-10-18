"""
Database migration runner for BlueRelief
Executes SQL migrations from the migrations directory
Tracks applied migrations to prevent re-running
"""

import os
import sys
from pathlib import Path
from sqlalchemy import text
from db_utils.db import engine
import logging

logging.basicConfig(level=logging.INFO)
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


def record_migration(conn, migration_name):
    """Record a successfully applied migration"""
    conn.execute(
        text("INSERT INTO schema_migrations (migration_name) VALUES (:name)"),
        {"name": migration_name},
    )
    conn.commit()


def fix_legacy_migration_names(conn):
    """Auto-fix old migration names to new numbered format"""
    legacy_renames = {
        "add_disaster_type_to_posts.sql": "002_add_disaster_type_to_posts.sql",
        "add_sentiment_to_posts.sql": "003_add_sentiment_to_posts.sql",
        "add_affected_population.sql": "004_add_affected_population.sql",
        "add_post_id_to_disasters.sql": "005_add_post_id_to_disasters.sql",
        "add_notifications_tables.sql": "006_add_notifications_tables.sql",
    }

    result = conn.execute(text("SELECT migration_name FROM schema_migrations"))
    existing_migrations = {row[0] for row in result}

    renamed_count = 0
    for old_name, new_name in legacy_renames.items():
        if old_name in existing_migrations:
            logger.info(f"Updating legacy migration: {old_name} → {new_name}")
            conn.execute(
                text(
                    "UPDATE schema_migrations SET migration_name = :new_name WHERE migration_name = :old_name"
                ),
                {"old_name": old_name, "new_name": new_name},
            )
            renamed_count += 1

    if renamed_count > 0:
        conn.commit()
        logger.info(f"✅ Updated {renamed_count} legacy migration name(s)")

    return renamed_count


def run_migrations():
    """Run all pending SQL migrations from the migrations directory"""
    migrations_dir = Path(__file__).parent / "migrations"

    if not migrations_dir.exists():
        logger.warning(f"Migrations directory not found: {migrations_dir}")
        return

    migration_files = sorted(migrations_dir.glob("*.sql"))

    if not migration_files:
        logger.info("No migration files found")
        return

    logger.info(f"Found {len(migration_files)} migration file(s)")

    try:
        with engine.connect() as conn:
            create_migrations_table(conn)
            fix_legacy_migration_names(conn)
            applied_migrations = get_applied_migrations(conn)

            logger.info(f"Already applied: {len(applied_migrations)} migration(s)")

            pending_migrations = [
                f for f in migration_files if f.name not in applied_migrations
            ]

            if not pending_migrations:
                logger.info("✨ No pending migrations - database is up to date!")
                return True

            logger.info(f"Pending migrations: {len(pending_migrations)}")

            for migration_file in pending_migrations:
                logger.info(f"Running migration: {migration_file.name}")

                with open(migration_file, 'r') as f:
                    migration_sql = f.read()

                conn.execute(text(migration_sql))
                conn.commit()

                record_migration(conn, migration_file.name)
                logger.info(f"✅ Completed: {migration_file.name}")

        logger.info("🎉 All migrations completed successfully!")
        return True

    except Exception as e:
        logger.error(f"❌ Migration failed: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    run_migrations()
