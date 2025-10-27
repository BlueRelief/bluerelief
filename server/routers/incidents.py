from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from db_utils.db import SessionLocal, Disaster
from datetime import datetime, timedelta
import re

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def parse_time_range(time_range: str) -> int:
    """Parse time range string to hours

    Args:
        time_range: String like "6h", "12h", "24h", "48h"

    Returns:
        Hours as integer
    """
    time_map = {
        "6h": 6,
        "12h": 12,
        "24h": 24,
        "48h": 48,
    }
    return time_map.get(time_range, 24)  # Default to 24 hours


def get_severity_label(severity: int) -> str:
    """Convert severity number to label"""
    severity_map = {5: "Critical", 4: "High", 3: "Medium", 2: "Low", 1: "Info"}
    return severity_map.get(int(severity) if severity else 1, "Info")


@router.get("/api/incidents")
async def list_incidents(time_range: str = "24h", db: Session = Depends(get_db)):
    """Return recent disasters for the map"""
    # Parse time range and calculate cutoff time
    hours = parse_time_range(time_range)
    cutoff_time = datetime.utcnow() - timedelta(hours=hours)

    disasters = (
        db.query(Disaster)
        .filter(Disaster.archived == False)
        .filter(Disaster.extracted_at >= cutoff_time)
        .order_by(Disaster.extracted_at.desc())
        .limit(100)
        .all()
    )
    
    result = []
    for d in disasters:
        result.append({
            "id": d.id,
            "region": d.location_name or "Unknown",
            "incidents": 1,
            "severity": get_severity_label(d.severity),
            "coordinates": [d.longitude, d.latitude] if d.latitude and d.longitude else None,
            "crisis_description": d.description or "No description available",
        })
    
    return result



@router.get("/api/incidents/nearby")
async def get_nearby_disasters(lat: float, lon: float, radius_km: float = 50, db: Session = Depends(get_db)):
    """Get disasters within radius of coordinates"""
    from services.population_estimator import PopulationEstimator

    nearby = PopulationEstimator.find_nearby_disasters(db, lat, lon, radius_km)

    return [
        {
            "id": d.id,
            "location_name": d.location_name,
            "latitude": d.latitude,
            "longitude": d.longitude,
            "distance_km": round(distance, 2),
            "severity": d.severity,
            "affected_population": d.affected_population,
            "disaster_type": getattr(d, "disaster_type", None),
            "description": d.description,
        }
        for d, distance in nearby
    ]
