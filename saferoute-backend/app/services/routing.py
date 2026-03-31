import requests
import os
from dotenv import load_dotenv
from geopy.distance import geodesic

load_dotenv()

ORS_API_KEY = os.getenv("OPENROUTESERVICE_API_KEY")
ORS_BASE_URL = "https://api.openrouteservice.org/v2/directions/foot-walking"

# ORS foot-walking rejects routes whose approximated distance exceeds ~150 km.
# We no longer hard-fail on a local straight-line check, since bad geocoding
# can incorrectly trigger "too far apart" for nearby points. Instead, we let
# ORS enforce its own limits and surface its 400 error via _ors_routing_error.
MAX_STRAIGHT_FOR_MULTI_ROUTE_M = 50_000


def get_walking_routes(start_coords, end_coords, alternatives=2):
    """
    Get walking routes from OpenRouteService
    
    Args:
        start_coords: [longitude, latitude]
        end_coords: [longitude, latitude]
        alternatives: Desired alternative route count (may be reduced for long trips)
    
    Returns:
        List of route geometries and metadata
    """
    if not ORS_API_KEY:
        raise Exception("OPENROUTESERVICE_API_KEY not set in environment")

    lng1, lat1 = start_coords
    lng2, lat2 = end_coords
    straight_m = geodesic((lat1, lng1), (lat2, lng2)).meters

    # Long trips: single route only — avoids ORS 400 "approximated route distance > 150000 m"
    target_count = 1 if straight_m > MAX_STRAIGHT_FOR_MULTI_ROUTE_M else min(
        max(1, alternatives), 3
    )

    # ORS usually expects the raw key, but some JWT-based keys require 'Bearer '
    auth_header = ORS_API_KEY if ORS_API_KEY.startswith("Bearer ") or len(ORS_API_KEY) < 70 else f"Bearer {ORS_API_KEY}"
    
    headers = {
        'Authorization': auth_header,
        'Content-Type': 'application/json'
    }

    body = {
        'coordinates': [start_coords, end_coords],
        'geometry': True,
        'instructions': True,
        'elevation': False
    }
    if target_count > 1:
        body['alternative_routes'] = {
            'target_count': target_count,
            'share_factor': 0.6,
            'weight_factor': 1.4
        }

    response = requests.post(ORS_BASE_URL, json=body, headers=headers)

    if response.status_code != 200:
        raise _ors_routing_error(response)
    
    data = response.json()
    routes = []
    
    for route in data.get('routes', []):
        routes.append({
            'geometry': route['geometry'],  # Encoded polyline
            'distance': route['summary']['distance'],  # meters
            'duration': route['summary']['duration'],  # seconds
        })
    
    return routes


def _ors_routing_error(response: requests.Response) -> Exception:
    """Map ORS HTTP errors to friendly messages (e.g. 150 km walking limit)."""
    from fastapi import HTTPException
    
    try:
        j = response.json()
        raw_msg = j.get("error")
        msg = ""
        if isinstance(raw_msg, dict):
            msg = raw_msg.get("message", "")
        elif isinstance(raw_msg, str):
            msg = raw_msg
            
        if response.status_code == 403:
            return HTTPException(
                status_code=403, 
                detail=f"OpenRouteService: Access Disallowed (403). Verify key status on openrouteservice.org. Detail: {msg}"
            )
            
        if response.status_code == 400 and isinstance(raw_msg, dict) and raw_msg.get("code") == 2004:
            return HTTPException(
                status_code=400,
                detail="Walking route is too long for the routing service (max ~150 km). "
            )
            
        if msg:
            return HTTPException(status_code=response.status_code, detail=f"ORS API error: {msg}")
    except Exception:
        pass
        
    return HTTPException(status_code=response.status_code, detail=f"ORS returned {response.status_code}: {response.text}")


# Test function
if __name__ == "__main__":
    # Test: UP Diliman to Quezon Memorial Circle
    start = [121.0720, 14.6402]  # [lng, lat]
    end = [121.0506, 14.6504]
    
    try:
        routes = get_walking_routes(start, end, alternatives=2)
        print(f"Found {len(routes)} routes")
        for i, route in enumerate(routes):
            print(f"Route {i+1}: {route['distance']}m, {route['duration']}s")
    except Exception as e:
        print(f"Error: {e}")
