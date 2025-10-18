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


def get_severity_label(severity: int) -> str:
    """Convert severity number to label"""
    severity_map = {5: "Critical", 4: "High", 3: "Medium", 2: "Low", 1: "Info"}
    return severity_map.get(int(severity) if severity else 1, "Info")


@router.get("/api/incidents")
async def list_incidents(db: Session = Depends(get_db)):
    """Return recent disasters for the map"""
    disasters = db.query(Disaster).order_by(Disaster.extracted_at.desc()).limit(100).all()
    
    result = []
    for d in disasters:
        result.append({
            "id": d.id,
            "region": d.location_name or d.location,  # Use new field, fallback to old
            "incidents": 1,
            "severity": get_severity_label(d.severity),
            "coordinates": [d.longitude, d.latitude] if d.latitude and d.longitude else None
        })
    
    return result
