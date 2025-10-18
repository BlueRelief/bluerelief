from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from db_utils.db import SessionLocal, Disaster
import re

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def extract_coordinates(location: str):
    """Extract coordinates from location string if available"""
    coord_pattern = r"\((-?\d+\.?\d*),\s*(-?\d+\.?\d*)\)"
    match = re.search(coord_pattern, location)
    if match:
        return [float(match.group(2)), float(match.group(1))]
    return None


@router.get("/api/incidents")
async def list_incidents(db: Session = Depends(get_db)):
    """Return incidents grouped by location for the map"""

    # First get all disasters to create a mapping of location to descriptions
    all_disasters = (
        db.query(Disaster.location, Disaster.description, Disaster.severity)
        .filter(Disaster.location.isnot(None))
        .all()
    )
    
    # Group by location manually to handle descriptions properly
    location_data = {}
    for location, description, severity in all_disasters:
        if location not in location_data:
            location_data[location] = {
                'count': 0,
                'max_severity': 0,
                'descriptions': []
            }
        
        location_data[location]['count'] += 1
        location_data[location]['max_severity'] = max(
            location_data[location]['max_severity'], 
            severity or 0
        )
        if description and description not in location_data[location]['descriptions']:
            location_data[location]['descriptions'].append(description)

    severity_map = {5: "Critical", 4: "High", 3: "Medium", 2: "Low", 1: "Info"}

    result = []
    for location, data in location_data.items():
        coords = extract_coordinates(location)

        # For now, skip disasters without coordinates
        # TODO: Add geocoding service to convert location names to coordinates
        if not coords:
            print(f"⚠️ Location '{location}' has no coordinates - needs geocoding")
            continue

        clean_location = re.sub(r"\s*\([^)]*\)", "", location).strip()
        
        # Use the actual crisis description(s) instead of categorizing
        # If multiple descriptions, use the first one or combine them
        if data['descriptions']:
            crisis_description = data['descriptions'][0]  # Use first/primary description
            # Limit length to keep popup readable
            if len(crisis_description) > 150:
                crisis_description = crisis_description[:150] + "..."
        else:
            crisis_description = "No description available"

        severity_label = severity_map.get(int(data['max_severity']), "Info")

        result.append(
            {
                "region": clean_location,
                "incidents": data['count'],
                "severity": severity_label,
                "coordinates": coords,
                "crisis_description": crisis_description,
            }
        )

    return result
