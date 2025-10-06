from fastapi import APIRouter

router = APIRouter()


@router.get("/api/incidents")
async def list_incidents():
    return [
        {
            "region": "New Orleans - Hurricane Zone",
            "incidents": 245,
            "severity": "Critical",
            "coordinates": [-90.0715, 29.9511],
        },
        {
            "region": "Miami Beach - Coastal Flooding",
            "incidents": 178,
            "severity": "Critical",
            "coordinates": [-80.1300, 25.7907],
        },
        {
            "region": "California Wildfire Belt",
            "incidents": 156,
            "severity": "High",
            "coordinates": [-121.4944, 38.5816],
        },
        {
            "region": "Puerto Rico - Storm Damage",
            "incidents": 198,
            "severity": "Critical",
            "coordinates": [-66.1057, 18.4655],
        },
        {
            "region": "Houston - Flood Risk Area",
            "incidents": 134,
            "severity": "High",
            "coordinates": [-95.3698, 29.7604],
        },
        {
            "region": "San Francisco - Earthquake Zone",
            "incidents": 89,
            "severity": "Medium",
            "coordinates": [-122.4194, 37.7749],
        },
        {
            "region": "Tornado Alley - Oklahoma",
            "incidents": 167,
            "severity": "High",
            "coordinates": [-97.5164, 35.4676],
        },
        {
            "region": "Florida Keys - Hurricane Path",
            "incidents": 142,
            "severity": "High",
            "coordinates": [-81.7800, 24.5551],
        },
        {
            "region": "Los Angeles - Wildfire Risk",
            "incidents": 103,
            "severity": "High",
            "coordinates": [-118.2437, 34.0522],
        },
        {
            "region": "Bangladesh - Monsoon Floods",
            "incidents": 312,
            "severity": "Critical",
            "coordinates": [90.4125, 23.8103],
        },
        {
            "region": "Haiti - Seismic Activity",
            "incidents": 221,
            "severity": "Critical",
            "coordinates": [-72.2852, 18.5944],
        },
        {
            "region": "Philippines - Typhoon Belt",
            "incidents": 267,
            "severity": "Critical",
            "coordinates": [120.9842, 14.5995],
        },
        {
            "region": "Nepal - Landslide Zone",
            "incidents": 145,
            "severity": "High",
            "coordinates": [85.3240, 27.7172],
        },
        {
            "region": "Indonesia - Volcanic Activity",
            "incidents": 189,
            "severity": "High",
            "coordinates": [106.8456, -6.2088],
        },
        {
            "region": "Caribbean - Hurricane Season",
            "incidents": 156,
            "severity": "High",
            "coordinates": [-61.5240, 10.6918],
        },
        {
            "region": "Japan - Tsunami Risk Coast",
            "incidents": 98,
            "severity": "Medium",
            "coordinates": [139.6917, 35.6895],
        },
        {
            "region": "Australia - Bushfire Region",
            "incidents": 127,
            "severity": "High",
            "coordinates": [151.2093, -33.8688],
        },
        {
            "region": "Mozambique - Cyclone Path",
            "incidents": 203,
            "severity": "Critical",
            "coordinates": [32.5732, -25.9655],
        },
        {
            "region": "Pakistan - Flood Plains",
            "incidents": 176,
            "severity": "High",
            "coordinates": [67.0099, 24.8607],
        },
        {
            "region": "Yemen - Humanitarian Crisis",
            "incidents": 289,
            "severity": "Critical",
            "coordinates": [44.2075, 15.5527],
        },
    ]
