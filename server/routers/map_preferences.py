from fastapi import APIRouter, HTTPException, Cookie
from pydantic import BaseModel
from typing import Optional
from db_utils.db import SessionLocal, UserMapPreferences, User
from routers.auth import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/map-preferences", tags=["Map Preferences"])


class MapPreferencesUpdate(BaseModel):
    light_style: Optional[str] = None
    dark_style: Optional[str] = None


# Available map styles
AVAILABLE_STYLES = {
    "standard": "Mapbox Standard",
    "standard-satellite": "Mapbox Standard Satellite",
    "streets-v12": "Streets (Legacy)",
    "outdoors-v12": "Outdoors (Legacy)",
    "light-v11": "Light (Legacy)",
    "dark-v11": "Dark (Legacy)",
    "satellite-v9": "Satellite (Legacy)",
    "satellite-streets-v12": "Satellite Streets (Legacy)",
    "navigation-day-v1": "Navigation Day (Legacy)",
    "navigation-night-v1": "Navigation Night (Legacy)",
}


@router.get("/styles")
async def get_available_styles():
    """Get list of available map styles"""
    return {
        "styles": AVAILABLE_STYLES,
        "recommended": {
            "light": "standard",
            "dark": "standard-satellite"
        }
    }


@router.get("")
async def get_map_preferences(token: str = Cookie(None)):
    """Get user's map style preferences"""
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        user = get_current_user(token)
        user_id = user["user_id"]
    except HTTPException:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    db = SessionLocal()
    try:
        preferences = db.query(UserMapPreferences).filter(
            UserMapPreferences.user_id == user_id
        ).first()
        
        if not preferences:
            # Create default preferences
            preferences = UserMapPreferences(
                user_id=user_id,
                light_style="standard",
                dark_style="standard-satellite"
            )
            db.add(preferences)
            db.commit()
            db.refresh(preferences)
        
        return {
            "light_style": preferences.light_style,
            "dark_style": preferences.dark_style,
            "created_at": preferences.created_at,
            "updated_at": preferences.updated_at,
        }
    
    except Exception as e:
        logger.error(f"Error fetching map preferences: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch preferences")
    finally:
        db.close()


@router.put("")
async def update_map_preferences(
    preferences: MapPreferencesUpdate,
    token: str = Cookie(None)
):
    """Update user's map style preferences"""
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        user = get_current_user(token)
        user_id = user["user_id"]
    except HTTPException:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Validate styles
    if preferences.light_style and preferences.light_style not in AVAILABLE_STYLES:
        raise HTTPException(status_code=400, detail=f"Invalid light_style: {preferences.light_style}")
    
    if preferences.dark_style and preferences.dark_style not in AVAILABLE_STYLES:
        raise HTTPException(status_code=400, detail=f"Invalid dark_style: {preferences.dark_style}")
    
    db = SessionLocal()
    try:
        user_prefs = db.query(UserMapPreferences).filter(
            UserMapPreferences.user_id == user_id
        ).first()
        
        if not user_prefs:
            # Create new preferences
            user_prefs = UserMapPreferences(
                user_id=user_id,
                light_style=preferences.light_style or "standard",
                dark_style=preferences.dark_style or "standard-satellite"
            )
            db.add(user_prefs)
        else:
            # Update existing preferences
            if preferences.light_style:
                user_prefs.light_style = preferences.light_style
            if preferences.dark_style:
                user_prefs.dark_style = preferences.dark_style
        
        db.commit()
        db.refresh(user_prefs)
        
        logger.info(f"Updated map preferences for user {user_id}")
        
        return {
            "message": "Preferences updated successfully",
            "light_style": user_prefs.light_style,
            "dark_style": user_prefs.dark_style,
        }
    
    except Exception as e:
        logger.error(f"Error updating map preferences: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update preferences")
    finally:
        db.close()


@router.delete("")
async def reset_map_preferences(token: str = Cookie(None)):
    """Reset user's map preferences to defaults"""
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        user = get_current_user(token)
        user_id = user["user_id"]
    except HTTPException:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    db = SessionLocal()
    try:
        user_prefs = db.query(UserMapPreferences).filter(
            UserMapPreferences.user_id == user_id
        ).first()
        
        if user_prefs:
            user_prefs.light_style = "standard"
            user_prefs.dark_style = "standard-satellite"
            db.commit()
        
        return {
            "message": "Preferences reset to defaults",
            "light_style": "standard",
            "dark_style": "standard-satellite",
        }
    
    except Exception as e:
        logger.error(f"Error resetting map preferences: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to reset preferences")
    finally:
        db.close()


