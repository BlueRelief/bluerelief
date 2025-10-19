#!/usr/bin/env python3
"""
Migration generator for BlueRelief
Creates new migrations with proper timestamp naming format
"""

import sys
from datetime import datetime
from pathlib import Path


def create_migration(description):
    """Create a new migration file with timestamp format"""
    
    if not description or len(description.strip()) == 0:
        print("❌ Error: Migration description required")
        print("Usage: python create_migration.py 'your migration description'")
        sys.exit(1)
    
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    
    description = description.strip().lower()
    description = description.replace(" ", "_")
    description = "".join(c for c in description if c.isalnum() or c == "_")
    
    filename = f"{timestamp}_{description}.sql"
    filepath = Path(__file__).parent / "migrations" / filename
    
    if filepath.exists():
        print(f"❌ Error: Migration file already exists: {filename}")
        sys.exit(1)
    
    template = f"""-- Migration: {description}
-- Created: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

-- Add your SQL migration here
"""
    
    filepath.write_text(template)
    
    print(f"✅ Created migration: {filename}")
    print(f"📝 Location: {filepath}")
    print(f"\nEdit the file and add your SQL migration.")
    print(f"Format: {timestamp}_{description}.sql")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("❌ Error: Migration description required")
        print("Usage: python create_migration.py 'your migration description'")
        print("\nExamples:")
        print("  python create_migration.py 'add user roles table'")
        print("  python create_migration.py 'add index to posts'")
        sys.exit(1)
    
    description = " ".join(sys.argv[1:])
    create_migration(description)
