import os
import requests
import logging
from typing import Optional

logger = logging.getLogger(__name__)

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")


def geocode_region(query: str) -> Optional[dict]:
    """
    Geocode a region name to get its coordinates and bounds.
    
    Returns dict with:
    - name: formatted place name
    - lat: center latitude
    - lng: center longitude  
    - bounds: {ne_lat, ne_lng, sw_lat, sw_lng} for the region
    - place_id: Google place ID
    """
    if not GOOGLE_API_KEY:
        logger.error("GOOGLE_API_KEY not configured")
        return None
    
    try:
        url = "https://maps.googleapis.com/maps/api/geocode/json"
        params = {
            "address": query,
            "key": GOOGLE_API_KEY,
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if data.get("status") != "OK" or not data.get("results"):
            logger.warning(f"Geocoding failed for '{query}': {data.get('status')}")
            return None
        
        result = data["results"][0]
        geometry = result.get("geometry", {})
        location = geometry.get("location", {})
        
        region_data = {
            "name": result.get("formatted_address", query),
            "lat": location.get("lat"),
            "lng": location.get("lng"),
            "place_id": result.get("place_id"),
        }
        
        # Get bounds if available (for regions like states/countries)
        bounds = geometry.get("bounds") or geometry.get("viewport")
        if bounds:
            region_data["bounds"] = {
                "ne_lat": bounds["northeast"]["lat"],
                "ne_lng": bounds["northeast"]["lng"],
                "sw_lat": bounds["southwest"]["lat"],
                "sw_lng": bounds["southwest"]["lng"],
            }
        
        return region_data
        
    except requests.RequestException as e:
        logger.error(f"Geocoding request failed: {e}")
        return None
    except (KeyError, TypeError) as e:
        logger.error(f"Error parsing geocoding response: {e}")
        return None


def is_point_in_bounds(lat: float, lng: float, bounds: dict) -> bool:
    """Check if a point falls within region bounds."""
    if not bounds or lat is None or lng is None:
        return False
    
    return (
        bounds["sw_lat"] <= lat <= bounds["ne_lat"] and
        bounds["sw_lng"] <= lng <= bounds["ne_lng"]
    )

