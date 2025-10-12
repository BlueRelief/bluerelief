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

    disasters = (
        db.query(
            Disaster.location,
            func.count(Disaster.id).label("incident_count"),
            func.max(Disaster.severity).label("max_severity"),
        )
        .filter(Disaster.location.isnot(None))
        .group_by(Disaster.location)
        .all()
    )

    severity_map = {5: "Critical", 4: "High", 3: "Medium", 2: "Low", 1: "Info"}

    result = []
    for location, count, max_sev in disasters:
        coords = extract_coordinates(location)

        # For now, skip disasters without coordinates
        # TODO: Add geocoding service to convert location names to coordinates
        if not coords:
            print(f"⚠️ Location '{location}' has no coordinates - needs geocoding")
            continue

        clean_location = re.sub(r"\s*\([^)]*\)", "", location).strip()

        severity_label = severity_map.get(int(max_sev) if max_sev else 1, "Info")

        result.append(
            {
                "region": clean_location,
                "incidents": int(count),
                "severity": severity_label,
                "coordinates": coords,
            }
        )

    return result
