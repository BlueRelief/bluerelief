"""
Backfill missing coordinates for disasters using Google Geocoding API.

Run directly (connects to port-forwarded prod DB):
    DATABASE_URL="postgresql://dev:devpassword@localhost:5432/bluerelief" \
    GOOGLE_API_KEY="your-key" \
    python scripts/backfill_coordinates.py

Or via docker (uses docker network):
    docker exec bluerelief-backend python scripts/backfill_coordinates.py
"""

import os
import sys
import time
import requests
from sqlalchemy import create_engine, Column, Integer, Float, String, text
from sqlalchemy.orm import sessionmaker, declarative_base

# Get database URL from env or use default
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://dev:devpassword@localhost:5432/bluerelief")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    print("❌ GOOGLE_API_KEY environment variable required")
    sys.exit(1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


def geocode_location(query: str) -> dict:
    """Geocode a location using Google API."""
    try:
        url = "https://maps.googleapis.com/maps/api/geocode/json"
        params = {"address": query, "key": GOOGLE_API_KEY}
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if data.get("status") == "OK" and data.get("results"):
            location = data["results"][0]["geometry"]["location"]
            return {"lat": location["lat"], "lng": location["lng"]}
    except Exception as e:
        print(f"   Geocoding error: {e}")
    return None


def backfill_coordinates(dry_run: bool = True, limit: int = None):
    """
    Find disasters with location_name but missing lat/lng and geocode them.
    """
    db = SessionLocal()
    
    try:
        # Find disasters that have location_name but no coordinates
        query = text("""
            SELECT id, location_name 
            FROM disasters 
            WHERE latitude IS NULL 
              AND location_name IS NOT NULL 
              AND location_name != ''
            ORDER BY id DESC
        """)
        
        if limit:
            query = text(f"""
                SELECT id, location_name 
                FROM disasters 
                WHERE latitude IS NULL 
                  AND location_name IS NOT NULL 
                  AND location_name != ''
                ORDER BY id DESC
                LIMIT {limit}
            """)
        
        result = db.execute(query)
        disasters = result.fetchall()
        
        print(f"Found {len(disasters)} disasters to geocode")
        if dry_run:
            print("🔍 DRY RUN - no changes will be made\n")
        else:
            print("⚠️  APPLYING CHANGES\n")
        
        success = 0
        failed = 0
        skipped = 0
        
        for i, (disaster_id, location) in enumerate(disasters):
            location = location.strip()
            
            # Skip vague locations
            if any(x in location.lower() for x in ['worldwide', 'global', 'various']):
                print(f"⏭️  [{disaster_id}] Skipping vague: {location[:50]}")
                skipped += 1
                continue
            
            # Skip multi-location (multiple countries)
            if location.count(',') > 3 or ';' in location or ' and ' in location.lower():
                print(f"⏭️  [{disaster_id}] Skipping multi-location: {location[:50]}")
                skipped += 1
                continue
            
            result = geocode_location(location)
            
            if result:
                print(f"✅ [{disaster_id}] {location[:40]:<40} → ({result['lat']:.4f}, {result['lng']:.4f})")
                
                if not dry_run:
                    update_query = text("""
                        UPDATE disasters 
                        SET latitude = :lat, longitude = :lng 
                        WHERE id = :id
                    """)
                    db.execute(update_query, {"lat": result['lat'], "lng": result['lng'], "id": disaster_id})
                
                success += 1
            else:
                print(f"❌ [{disaster_id}] Failed: {location[:50]}")
                failed += 1
            
            # Rate limiting
            if (i + 1) % 50 == 0:
                print(f"\n⏳ Processed {i + 1}/{len(disasters)}, waiting 1s...\n")
                time.sleep(1)
        
        if not dry_run:
            db.commit()
            print(f"\n💾 Changes committed to database")
        
        print(f"\n📊 Summary:")
        print(f"   ✅ Geocoded: {success}")
        print(f"   ❌ Failed: {failed}")
        print(f"   ⏭️  Skipped: {skipped}")
        print(f"   Total processed: {len(disasters)}")
        
    finally:
        db.close()


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='Backfill disaster coordinates')
    parser.add_argument('--apply', action='store_true', help='Actually apply changes (default is dry run)')
    parser.add_argument('--limit', type=int, help='Limit number of records to process')
    args = parser.parse_args()
    
    backfill_coordinates(dry_run=not args.apply, limit=args.limit)
