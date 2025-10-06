from fastapi import APIRouter

router = APIRouter()


@router.get("/api/incidents")
async def list_incidents():
    # Sample data returned as geo-aware points. Replace with DB queries as needed.
    return [
        {"region": "Coastal Region", "incidents": 120, "severity": "High", "coordinates": [-74.006, 40.7128]},
        {"region": "Inland Valley", "incidents": 85, "severity": "Medium", "coordinates": [-118.2437, 34.0522]},
        {"region": "Northern Highlands", "incidents": 45, "severity": "Medium", "coordinates": [-122.6765, 45.5231]},
        {"region": "Southern Basin", "incidents": 170, "severity": "Critical", "coordinates": [-95.3698, 29.7604]},
    ]
