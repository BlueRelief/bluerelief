import math
import os
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from db_utils.db import Disaster
import requests
from dotenv import load_dotenv
load_dotenv()
import os

GEONAMES_USERNAME = os.getenv("GEONAMES_USERNAME")


class PopulationEstimator:
    """Estimate affected population based on various factors"""

    # Base estimates by disaster type and severity
    BASE_ESTIMATES = {
        "earthquake": {5: 50000, 4: 10000, 3: 2000, 2: 500, 1: 100},
        "flood": {5: 30000, 4: 8000, 3: 1500, 2: 400, 1: 80},
        "fire": {5: 20000, 4: 5000, 3: 1000, 2: 200, 1: 50},
        "hurricane": {5: 100000, 4: 25000, 3: 5000, 2: 1000, 1: 200},
        "tornado": {5: 15000, 4: 4000, 3: 800, 2: 150, 1: 30},
        "default": {5: 10000, 4: 5000, 3: 1000, 2: 200, 1: 50},
    }

    @staticmethod
    def calculate_impact_radius_km(severity: int, disaster_type: str = None) -> float:
        """Calculate estimated impact radius in kilometers"""
        base_radius = {
            5: 50,   # 50km radius for catastrophic
            4: 20,   # 20km radius for severe
            3: 10,   # 10km radius for moderate
            2: 5,    # 5km radius for minor
            1: 2,    # 2km radius for minimal
        }

        radius = base_radius.get(severity, 10)

        # Adjust by disaster type
        if disaster_type == "earthquake":
            radius *= 1.5
        elif disaster_type == "hurricane":
            radius *= 2.0
        elif disaster_type == "fire":
            radius *= 0.5

        return radius

    @staticmethod
    def estimate_population(
        longitude: int,
        latitude: int,
        disaster_type: str = None,
        severity: int = 3
    ) -> Optional[int]:
        """
        Estimate affected population for a disaster
        Priority:
        1. Use existing affected_population if available
        2. Calculate based on coordinates and radius (TODO: integrate with population API)
        3. Fall back to severity-based estimates
        """
        # If coordinates available and GeoNames configured, query population API
        if GEONAMES_USERNAME and longitude is not None and latitude is not None and severity is not None and disaster_type is not None:
            try:
                radius = PopulationEstimator.calculate_impact_radius_km(
                    severity, disaster_type
                )
                population = PopulationEstimator.query_population_in_radius(
                    latitude, longitude, radius
                )
                if population and population > 0:
                    return int(population)
            except Exception as e:
                # If external lookup fails, fall back to base estimates
                print(f"⚠️ GeoNames lookup failed: {e}")
        else:
            return None

        # Fall back to base estimates
        disaster_type = (disaster_type or "default").lower()
        severity = severity or 3

        estimates = PopulationEstimator.BASE_ESTIMATES.get(
            disaster_type,
            PopulationEstimator.BASE_ESTIMATES["default"]
        )

        return estimates.get(severity, 1000)

    @staticmethod
    def query_population_in_radius(lat: float, lon: float, radius_km: float) -> Optional[int]:
        """Query GeoNames for nearby populated places and sum their populations.

        Uses GEONAMES_USERNAME from environment. Returns sum of populations (ints) or None on failure.
        """
        url = "http://api.geonames.org/findNearbyJSON"
        params = {
            "lat": lat,
            "lng": lon,
            "radius": int(max(1, round(radius_km))),
            "featureClass": "P",
            "maxRows": 100,
            "username": GEONAMES_USERNAME,
        }

        try:
            resp = requests.get(url, params=params, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            geonames = data.get("geonames", [])
            total_pop = 0
            for g in geonames:
                pop = g.get("population")
                try:
                    if pop is None:
                        continue
                    p = int(pop)
                except Exception:
                    # population may be string or non-numeric
                    try:
                        p = int(float(pop))
                    except Exception:
                        p = 0
                if p > 0:
                    total_pop += p

            return total_pop if total_pop > 0 else None
        except Exception as e:
            print(f"⚠️ Error querying GeoNames: {e}")
            return None

    @staticmethod
    def calculate_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two coordinates using Haversine formula"""
        R = 6371  # Earth's radius in kilometers

        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)

        a = (math.sin(delta_lat / 2) ** 2 + 
             math.cos(lat1_rad) * math.cos(lat2_rad) * 
             math.sin(delta_lon / 2) ** 2)
        c = 2 * math.asin(math.sqrt(a))

        return R * c

    @staticmethod
    def find_nearby_disasters(
        db: Session,
        latitude: float,
        longitude: float,
        radius_km: float = 50
    ) -> list:
        """Find disasters within radius of coordinates"""
        disasters = db.query(Disaster).filter(
            Disaster.latitude.isnot(None),
            Disaster.longitude.isnot(None)
        ).all()

        nearby = []
        for d in disasters:
            distance = PopulationEstimator.calculate_distance_km(
                latitude, longitude, d.latitude, d.longitude
            )
            if distance <= radius_km:
                nearby.append((d, distance))

        return sorted(nearby, key=lambda x: x[1])  # Sort by distance


# Helper function for dashboard
def backfill_population_estimates(db: Session):
    """Backfill population estimates for existing disasters without them"""
    disasters = db.query(Disaster).filter(
        Disaster.affected_population.is_(None)
    ).all()

    updated = 0
    for disaster in disasters:
        estimate = PopulationEstimator.estimate_population(disaster)
        disaster.affected_population = estimate
        updated += 1

    db.commit()
    return updated
