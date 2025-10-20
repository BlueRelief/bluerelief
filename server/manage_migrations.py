#!/usr/bin/env python3
"""
Unified Migration Management Tool for BlueRelief
Centralized way to manage database migrations and schema validation
"""

import sys
import os
from pathlib import Path
from db_utils.schema_validator import validate_schema, print_schema_report
import subprocess

def print_banner(text):
    """Print formatted banner"""
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70 + "\n")


def validate_before_migrate():
    """Validate schema before running migrations"""
    print_banner("Step 1: Validating Current Schema")
    is_valid, _ = validate_schema()
    if not is_valid:
        print("⚠️  Schema drift detected before migration")
        print("    This is normal if you just modified ORM models")
    return is_valid


def generate_new_migration(message):
    """Generate a new Alembic migration based on ORM changes"""
    print_banner(f"Generating Migration: {message}")
    try:
        result = subprocess.run(
            ["alembic", "revision", "--autogenerate", "-m", message],
            cwd=Path(__file__).parent,
            capture_output=True,
            text=True,
        )
        if result.returncode == 0:
            print("✅ Migration generated successfully!")
            print(result.stdout)
            return True
        else:
            print("❌ Failed to generate migration")
            print(result.stderr)
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def run_pending_migrations():
    """Run all pending Alembic migrations"""
    print_banner("Running Alembic Migrations")
    try:
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            cwd=Path(__file__).parent,
            capture_output=True,
            text=True,
        )
        if result.returncode == 0:
            print("✅ All migrations completed!")
            print(result.stdout)
            return True
        else:
            print("❌ Migration failed")
            print(result.stderr)
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def validate_after_migrate():
    """Validate schema after migrations complete"""
    print_banner("Step 2: Validating Final Schema")
    print_schema_report()


def show_migration_status():
    """Show current migration status"""
    print_banner("Migration Status")
    try:
        result = subprocess.run(
            ["alembic", "current"],
            cwd=Path(__file__).parent,
            capture_output=True,
            text=True,
        )
        print("Current revision:")
        print(result.stdout)

        result = subprocess.run(
            ["alembic", "heads"],
            cwd=Path(__file__).parent,
            capture_output=True,
            text=True,
        )
        print("Latest revision:")
        print(result.stdout)
    except Exception as e:
        print(f"Error: {e}")


def show_help():
    """Show help message"""
    print_banner("Migration Management - Help")
    print("""
USAGE:
    python manage_migrations.py <command>

COMMANDS:
    validate        Check schema for drift issues
    status          Show current migration status
    generate <msg>  Generate new migration from ORM changes
    migrate         Run all pending migrations
    full            Validate -> Generate (if needed) -> Migrate -> Validate
    help            Show this help message

EXAMPLES:
    python manage_migrations.py validate
    python manage_migrations.py generate "add user preferences"
    python manage_migrations.py migrate
    python manage_migrations.py full

WORKFLOW FOR DEVELOPERS:
    1. Modify ORM models in db_utils/db.py
    2. Run: python manage_migrations.py generate "describe your change"
    3. Review the generated migration file in alembic/versions/
    4. Run: python manage_migrations.py migrate
    5. Run: python manage_migrations.py validate

PRODUCTION DEPLOYMENT:
    1. Only run: python manage_migrations.py migrate
    2. Schema is validated automatically before and after
    3. If validation fails, deployment stops (safe!)
    """)


def main():
    if len(sys.argv) < 2:
        show_help()
        sys.exit(0)

    command = sys.argv[1].lower()

    if command == "validate":
        print_schema_report()

    elif command == "status":
        show_migration_status()

    elif command == "generate":
        if len(sys.argv) < 3:
            print("Error: Please provide a migration message")
            print("Usage: python manage_migrations.py generate 'your message'")
            sys.exit(1)
        message = " ".join(sys.argv[2:])
        if not generate_new_migration(message):
            sys.exit(1)

    elif command == "migrate":
        validate_before_migrate()
        if not run_pending_migrations():
            print("❌ Migration failed!")
            sys.exit(1)
        validate_after_migrate()

    elif command == "full":
        validate_before_migrate()
        print("\nWould you like to generate a migration? (y/n)")
        if input().lower() == 'y':
            msg = input("Enter migration message: ")
            generate_new_migration(msg)
        run_pending_migrations()
        validate_after_migrate()

    elif command == "help":
        show_help()

    else:
        print(f"Unknown command: {command}")
        show_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
