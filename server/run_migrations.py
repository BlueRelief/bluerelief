"""
Database migration runner for BlueRelief
Executes SQL migrations from the migrations directory
"""
import os
import sys
from pathlib import Path
from sqlalchemy import text
from db_utils.db import engine
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def run_migrations():
    """Run all SQL migrations from the migrations directory"""
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
            for migration_file in migration_files:
                logger.info(f"Running migration: {migration_file.name}")
                
                with open(migration_file, 'r') as f:
                    migration_sql = f.read()
                
                statements = [s.strip() for s in migration_sql.split(';') if s.strip()]
                
                for statement in statements:
                    if statement:
                        conn.execute(text(statement))
                
                conn.commit()
                logger.info(f"✅ Completed: {migration_file.name}")
        
        logger.info("🎉 All migrations completed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    run_migrations()

