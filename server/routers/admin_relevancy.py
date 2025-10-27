from fastapi import APIRouter, Depends, HTTPException
from typing import Dict
from services.relevancy_service import RelevancyService
from middleware.admin_auth import get_current_admin
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
relevancy_service = RelevancyService()

@router.get("/api/admin/relevancy/config")
async def get_relevancy_config(current_user = Depends(get_current_admin)):
    """Get current relevancy scoring configuration."""
    try:
        config = {
            "min_threshold": 50,  # TODO: Make configurable
            "scoring_weights": {
                "author_credibility": 30,
                "engagement": 25,
                "content_quality": 25,
                "context": 20
            },
            "author_credibility": {
                "follower_thresholds": [10, 100, 500, 1000, 5000],
                "posts_thresholds": [10, 50, 100, 500],
                "ratio_thresholds": [0.1, 0.5, 2.0, 10.0]
            },
            "engagement": {
                "thresholds": [1, 5, 10, 25, 50],
                "velocity_threshold": {
                    "time_window_hours": 1,
                    "min_engagement": 10
                }
            }
        }
        return config
    except Exception as e:
        logger.error(f"Error getting relevancy config: {e}")
        raise HTTPException(status_code=500, detail="Error getting configuration")

@router.put("/api/admin/relevancy/config")
async def update_relevancy_config(
    config: Dict,
    current_user = Depends(get_current_admin)
):
    """Update relevancy scoring configuration."""
    try:
        # TODO: Implement configuration persistence
        # For now, just validate the config structure
        required_keys = ["min_threshold", "scoring_weights"]
        if not all(key in config for key in required_keys):
            raise HTTPException(status_code=400, detail="Invalid configuration format")
            
        # TODO: Apply new configuration to RelevancyScorer
        
        return {"status": "success", "message": "Configuration updated"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating relevancy config: {e}")
        raise HTTPException(status_code=500, detail="Error updating configuration")

@router.post("/api/admin/relevancy/recalculate")
async def recalculate_relevancy_scores():
    """Recalculate relevancy scores for all existing posts."""
    try:
        result = relevancy_service.recalculate_all_posts()
        if result["success"]:
            return {
                "status": "success",
                "total_posts": result["total"],
                "processed": result["processed"],
                "failed": result["failed"]
            }
        else:
            raise HTTPException(status_code=500, detail=result["message"])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error recalculating relevancy scores: {e}")
        raise HTTPException(status_code=500, detail="Error recalculating scores")