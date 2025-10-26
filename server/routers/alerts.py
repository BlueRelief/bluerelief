from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from db_utils.db import Alert, AlertQueue, UserAlertPreferences, User, SessionLocal, get_db_session
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


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


class UserAlertPreferencesRequest(BaseModel):
    alert_types: List[str] = ["new_crisis", "severity_change", "update"]
    min_severity: int = 3
    email_enabled: bool = True
    email_min_severity: int = 3
    regions: Optional[List[str]] = None
    disaster_types: Optional[List[str]] = None


class UserAlertPreferencesResponse(BaseModel):
    id: int
    user_id: str
    alert_types: List[str]
    min_severity: int
    email_enabled: bool
    email_min_severity: int
    regions: Optional[List[str]]
    disaster_types: Optional[List[str]]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


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
            prefs.alert_types = prefs_data.alert_types
            prefs.min_severity = prefs_data.min_severity
            prefs.email_enabled = prefs_data.email_enabled
            prefs.email_min_severity = prefs_data.email_min_severity
            prefs.regions = prefs_data.regions
            prefs.disaster_types = prefs_data.disaster_types
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
