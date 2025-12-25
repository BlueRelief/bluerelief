from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import os
from db_utils.db import Alert, AlertQueue, UserAlertPreferences, User, SessionLocal, get_db_session
from services.geocoding_service import geocode_region
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

# SHOWCASE_MODE: When enabled, disables geocoding API calls
SHOWCASE_MODE = os.getenv("SHOWCASE_MODE", "true").lower() == "true"


class AlertResponse(BaseModel):
    id: int
    disaster_id: Optional[int]
    alert_type: str
    severity: int
    title: str
    message: str
    created_at: datetime
    is_read: bool
    alert_metadata: Optional[dict] = None

    class Config:
        from_attributes = True


class WatchedRegion(BaseModel):
    name: str
    lat: float
    lng: float
    bounds: Optional[dict] = None
    place_id: Optional[str] = None


class UserAlertPreferencesRequest(BaseModel):
    min_severity: int = 3
    email_enabled: bool = True
    watched_regions: Optional[List[WatchedRegion]] = None


class UserAlertPreferencesResponse(BaseModel):
    id: int
    user_id: str
    min_severity: int
    email_enabled: bool
    watched_regions: Optional[List[dict]]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RegionSearchResult(BaseModel):
    name: str
    lat: float
    lng: float
    bounds: Optional[dict] = None
    place_id: Optional[str] = None


class UserLocationRequest(BaseModel):
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None


@router.get("", response_model=List[AlertResponse])
def get_user_alerts(
    user_id: str = Query(...),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db_session)
):
    """Get user's alerts with pagination"""
    if not db:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        alerts = (
            db.query(Alert)
            .join(AlertQueue, Alert.id == AlertQueue.alert_id)
            .filter(AlertQueue.user_id == user_id)
            .order_by(Alert.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

        return alerts
    finally:
        db.close()


@router.get("/unread-count")
def get_unread_count(
    user_id: str = Query(...),
    db: Session = Depends(get_db_session)
):
    """Get unread alert count for user"""
    if not db:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        count = (
            db.query(Alert)
            .join(AlertQueue, Alert.id == AlertQueue.alert_id)
            .filter(
                AlertQueue.user_id == user_id,
                Alert.is_read == False
            )
            .count()
        )

        return {"unread_count": count}
    finally:
        db.close()


@router.put("/{alert_id}/read")
def mark_alert_as_read(
    alert_id: int,
    user_id: str = Query(...),
    db: Session = Depends(get_db_session)
):
    """Mark a specific alert as read"""
    if not db:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        alert.is_read = True
        db.commit()
        
        return {"status": "success", "message": "Alert marked as read"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.put("/mark-all-read")
def mark_all_alerts_as_read(
    user_id: str = Query(...),
    db: Session = Depends(get_db_session)
):
    """Mark all alerts as read for user"""
    if not db:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        updated = (
            db.query(Alert)
            .filter(
                Alert.id.in_(
                    db.query(AlertQueue.alert_id).filter(AlertQueue.user_id == user_id)
                )
            )
            .update({"is_read": True})
        )
        db.commit()

        return {"status": "success", "alerts_marked": updated}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.get("/preferences", response_model=UserAlertPreferencesResponse)
def get_alert_preferences(
    user_id: str = Query(...),
    db: Session = Depends(get_db_session)
):
    """Get user's alert preferences"""
    if not db:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        prefs = db.query(UserAlertPreferences).filter(
            UserAlertPreferences.user_id == user_id
        ).first()
        
        if not prefs:
            raise HTTPException(status_code=404, detail="Preferences not found")
        
        return prefs
    finally:
        db.close()


@router.put("/preferences", response_model=UserAlertPreferencesResponse)
def update_alert_preferences(
    user_id: str = Query(...),
    prefs_data: UserAlertPreferencesRequest = None,
    db: Session = Depends(get_db_session)
):
    """Update user's alert preferences"""
    if not db:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        prefs = db.query(UserAlertPreferences).filter(
            UserAlertPreferences.user_id == user_id
        ).first()

        if not prefs:
            prefs = UserAlertPreferences(user_id=user_id)
            db.add(prefs)

        if prefs_data:
            prefs.min_severity = prefs_data.min_severity
            prefs.email_enabled = prefs_data.email_enabled
            prefs.watched_regions = (
                [r.model_dump() for r in prefs_data.watched_regions]
                if prefs_data.watched_regions
                else None
            )
            prefs.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(prefs)

        return prefs
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.put("/location")
def update_user_location(
    user_id: str = Query(...),
    location_data: UserLocationRequest = None,
    db: Session = Depends(get_db_session)
):
    """Update user's primary location"""
    if not db:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if location_data:
            user.location = location_data.location
            user.latitude = location_data.latitude
            user.longitude = location_data.longitude
            user.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(user)

        return {
            "status": "success",
            "location": user.location,
            "latitude": user.latitude,
            "longitude": user.longitude,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.get("/regions/search", response_model=RegionSearchResult)
def search_region(query: str = Query(..., min_length=2)):
    """Search for a region using Google Geocoding API"""
    # SHOWCASE MODE: Geocoding disabled to prevent API costs
    if SHOWCASE_MODE:
        raise HTTPException(
            status_code=403,
            detail="🎭 Showcase Mode: Region search disabled. This app is in portfolio/demo mode."
        )
    
    result = geocode_region(query)

    if not result:
        raise HTTPException(status_code=404, detail="Region not found")

    return RegionSearchResult(
        name=result["name"],
        lat=result["lat"],
        lng=result["lng"],
        bounds=result.get("bounds"),
        place_id=result.get("place_id"),
    )
