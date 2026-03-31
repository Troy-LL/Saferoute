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

def _cache_key(start, end, alternatives=2):
    return (tuple(start), tuple(end), alternatives)

@cached(cache=route_cache, key=_cache_key)
def get_walking_routes(start_coords, end_coords, alternatives=2):
    """
    Get walking routes from OpenRouteService from Cache or API.
    ORS v2 GET /directions returns a GeoJSON FeatureCollection:
      { type: "FeatureCollection", features: [ { geometry: <encoded polyline>, properties: { summary: {distance, duration}, segments: [...] } } ] }
    """
    if not ORS_API_KEY:
        raise Exception("OPENROUTESERVICE_API_KEY not set in environment")

    headers = {
        'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
        'Authorization': ORS_API_KEY,
        'Content-Type': 'application/json; charset=utf-8'
    }

    body = {
        "coordinates": [[start_coords[0], start_coords[1]], [end_coords[0], end_coords[1]]],
        "alternative_routes": {
            "target_count": alternatives,
            "weight_factor": 1.4,
            "share_factor": 0.6
        }
    }

    # Use the /geojson POST endpoint for multiple routes
    url = f"{ORS_BASE_URL}/geojson"
    response = requests.post(url, headers=headers, json=body)

    if response.status_code != 200:
        raise _ors_routing_error(response)

    data = response.json()
    routes = []

    # ORS v2 GET returns a GeoJSON FeatureCollection — NOT {routes:[]}
    features = data.get('features', [])
    for feature in features:
        props = feature.get('properties', {})
        summary = props.get('summary', {})
        geometry = feature.get('geometry')  # This is the encoded polyline string

        if not geometry or not summary:
            continue

        # geometry may be a dict {"type":"LineString","coordinates":[...]} or an encoded string
        # ORS v2 GET with format=json returns encoded polyline as a string by default
        if isinstance(geometry, dict):
            # GeoJSON LineString — convert coordinates directly
            coords = geometry.get('coordinates', [])
            # Re-encode to polyline for consistent handling downstream
            import polyline as polyline_lib
            encoded = polyline_lib.encode([(lat, lng) for lng, lat in coords])
            geometry_str = encoded
        else:
            geometry_str = geometry

        routes.append({
            'geometry': geometry_str,  # Encoded polyline string
            'distance': summary.get('distance', 0),  # meters
            'duration': summary.get('duration', 0),  # seconds
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
