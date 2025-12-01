import math
import os
from typing import Optional
from sqlalchemy.orm import Session
from db_utils.db import Disaster
import requests
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")


class PopulationEstimator:
    """Estimate affected population based on various factors"""

    # Base estimates by disaster type and severity (matches DISASTER_CONFIG)
    BASE_ESTIMATES = {
        "earthquake": {5: 50000, 4: 10000, 3: 2000, 2: 500, 1: 100},
        "flood": {5: 30000, 4: 8000, 3: 1500, 2: 400, 1: 80},
        "wildfire": {5: 20000, 4: 5000, 3: 1000, 2: 200, 1: 50},
        "hurricane": {5: 100000, 4: 25000, 3: 5000, 2: 1000, 1: 200},
        "tornado": {5: 15000, 4: 4000, 3: 800, 2: 150, 1: 30},
        "tsunami": {5: 100000, 4: 30000, 3: 8000, 2: 1500, 1: 300},
        "volcano": {5: 50000, 4: 15000, 3: 3000, 2: 600, 1: 100},
        "heatwave": {5: 500000, 4: 100000, 3: 20000, 2: 5000, 1: 1000},
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
        type_multipliers = {
            "earthquake": 1.5,
            "hurricane": 2.0,
            "wildfire": 0.5,
            "tsunami": 2.5,
            "volcano": 1.0,
            "heatwave": 3.0,  # Heatwaves affect large areas
            "flood": 1.2,
            "tornado": 0.3,  # Tornadoes have narrow paths
        }

        multiplier = type_multipliers.get(disaster_type, 1.0)
        return radius * multiplier

    @staticmethod
    def estimate_population(
        longitude: float = None,
        latitude: float = None,
        disaster_type: str = None,
        severity: int = 3,
    ) -> Optional[int]:
        """
        Estimate affected population for a disaster.

        Priority:
        1. Query Google Places API for nearby population data
        2. Fall back to severity-based estimates
        """
        # Normalize inputs
        disaster_type = (disaster_type or "default").lower()
        severity = severity if severity and 1 <= severity <= 5 else 3

        # Try Google Places API if configured and we have coordinates
        if GOOGLE_API_KEY and longitude is not None and latitude is not None:
            try:
                radius = PopulationEstimator.calculate_impact_radius_km(
                    severity, disaster_type
                )
                population = PopulationEstimator.query_population_google(
                    latitude, longitude, radius
                )
                if population and population > 0:
                    return int(population)
            except Exception as e:
                print(f"⚠️ Google population lookup failed: {e}")

        # Fall back to base estimates
        estimates = PopulationEstimator.BASE_ESTIMATES.get(
            disaster_type,
            PopulationEstimator.BASE_ESTIMATES["default"]
        )

        return estimates.get(severity, 1000)

    @staticmethod
    def query_population_google(
        lat: float, lon: float, radius_km: float
    ) -> Optional[int]:
        """Get population using Google reverse geocoding + Data Commons API.

        1. Use Google Geocoding to get city/region name from coordinates
        2. Query Data Commons API (free) for real census population data
        """
        if not GOOGLE_API_KEY:
            return None

        try:
            # Step 1: Reverse geocode to get location name
            geocode_url = "https://maps.googleapis.com/maps/api/geocode/json"
            params = {
                "latlng": f"{lat},{lon}",
                "key": GOOGLE_API_KEY,
                "result_type": "locality|administrative_area_level_2|administrative_area_level_1",
            }

            resp = requests.get(geocode_url, params=params, timeout=10)
            resp.raise_for_status()
            data = resp.json()

            if data.get("status") != "OK" or not data.get("results"):
                return None

            # Extract location components
            result = data["results"][0]
            components = result.get("address_components", [])

            city = None
            region = None
            country = None
            country_code = None

            for comp in components:
                types = comp.get("types", [])
                if "locality" in types:
                    city = comp.get("long_name")
                elif "administrative_area_level_1" in types:
                    region = comp.get("long_name")
                elif "country" in types:
                    country = comp.get("long_name")
                    country_code = comp.get("short_name")

            # Step 2: Query population database
            # Try city first, then region (for places like Tokyo where locality is a ward)
            population = None

            if city:
                population = PopulationEstimator._query_world_cities_population(
                    city, country_code
                )

            # If city lookup failed, try region (e.g., "Tokyo" when locality is "Suginami City")
            if not population and region:
                population = PopulationEstimator._query_world_cities_population(
                    region, country_code
                )

            if population:
                # Adjust based on impact radius vs city size
                city_radius_estimate = 15  # Assume avg city is ~15km radius
                if radius_km < city_radius_estimate:
                    adjustment = (radius_km / city_radius_estimate) ** 2
                    population = int(population * adjustment)

                return max(population, 100)

            return None

        except Exception as e:
            print(f"⚠️ Error in Google population lookup: {e}")
            return None

    @staticmethod
    def _query_data_commons(city: str, region: str, country_code: str) -> Optional[int]:
        """Query Google Data Commons API for real population data (free, no key needed)."""
        if not city and not region:
            return None

        try:
            # Data Commons API endpoint
            url = "https://api.datacommons.org/v2/observation"

            # Build the place query - try city first, then region
            search_term = f"{city}, {region}" if city else region
            if country_code:
                search_term += f", {country_code}"

            # First, resolve the place name to a DCID
            resolve_url = "https://api.datacommons.org/v2/resolve"
            resolve_params = {"nodes": [search_term], "property": "<-description"}

            # Try a simpler approach - use the node search
            search_url = "https://api.datacommons.org/v2/node"

            # Actually, Data Commons requires specific DCIDs which are hard to get
            # Let's use a simpler population database approach

            # Use OpenDataSoft's world cities population API (free)
            pop = PopulationEstimator._query_world_cities_population(city, country_code)
            if pop:
                return pop

            return None

        except Exception as e:
            print(f"⚠️ Data Commons query failed: {e}")
            return None

    @staticmethod
    def _query_world_cities_population(
        city: str, country_code: str = None
    ) -> Optional[int]:
        """Query world cities population database (free API)."""
        if not city:
            return None

        try:
            # Use OpenDataSoft's geonames cities dataset (free, no key)
            url = "https://public.opendatasoft.com/api/records/1.0/search/"
            params = {
                "dataset": "geonames-all-cities-with-a-population-1000",
                "q": city,
                "rows": 5,
            }

            if country_code:
                params["refine.country_code"] = country_code

            resp = requests.get(url, params=params, timeout=10)
            resp.raise_for_status()
            data = resp.json()

            records = data.get("records", [])
            if records:
                # Get the most populated matching city
                max_pop = 0
                for record in records:
                    fields = record.get("fields", {})
                    pop = fields.get("population", 0)
                    name = fields.get("name", "").lower()

                    # Check if city name matches
                    if city.lower() in name or name in city.lower():
                        if pop > max_pop:
                            max_pop = pop

                if max_pop > 0:
                    return max_pop

            return None

        except Exception as e:
            print(f"⚠️ World cities query failed: {e}")
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
