import requests
import os
from dotenv import load_dotenv
from geopy.distance import geodesic

from cachetools import cached, TTLCache

load_dotenv()

ORS_API_KEY = os.getenv("OPENROUTESERVICE_API_KEY")
# POST on directions expects the profile, NO '/json' at the end.
ORS_BASE_URL = "https://api.openrouteservice.org/v2/directions/foot-walking"

# Cache for 1 hour, max 500 routes — saves ORS quota and handles "spammed" requests.
route_cache = TTLCache(maxsize=500, ttl=3600)
MAX_STRAIGHT_FOR_MULTI_ROUTE_M = 50_000

@cached(cache=route_cache, key=lambda start, end, alternatives=2: (tuple(start), tuple(end), alternatives))
def get_walking_routes(start_coords, end_coords, alternatives=2):
    """
    Get walking routes from OpenRouteService from Cache or API
    """
    if not ORS_API_KEY:
        raise Exception("OPENROUTESERVICE_API_KEY not set in environment")

    # Use GET — proven to work via direct URL test.
    # Format: start=lng,lat&end=lng,lat
    start_str = f"{start_coords[0]},{start_coords[1]}"
    end_str = f"{end_coords[0]},{end_coords[1]}"
    
    params = {
        'api_key': ORS_API_KEY,
        'start': start_str,
        'end': end_str
    }
    
    # Optional: fetch a single alternative if requested (GET supports basic alternatives)
    # response = requests.get(ORS_BASE_URL, params=params)
    # Actually, many profiles don't support alternatives on GET. We'll start with the safest path.
    
    response = requests.get(ORS_BASE_URL, params=params)

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
