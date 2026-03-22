import requests
import os
from dotenv import load_dotenv

load_dotenv()

ORS_API_KEY = os.getenv("OPENROUTESERVICE_API_KEY")
ORS_BASE_URL = "https://api.openrouteservice.org/v2/directions/foot-walking"

def get_walking_routes(start_coords, end_coords, alternatives=2):
    """
    Get walking routes from OpenRouteService
    
    Args:
        start_coords: [longitude, latitude]
        end_coords: [longitude, latitude]
        alternatives: Number of alternative routes (max 3)
    
    Returns:
        List of route geometries and metadata
    """
    if not ORS_API_KEY:
        raise Exception("OPENROUTESERVICE_API_KEY not set in environment")
    
    headers = {
        'Authorization': ORS_API_KEY,
        'Content-Type': 'application/json'
    }
    
    body = {
        'coordinates': [start_coords, end_coords],
        'alternative_routes': {
            'target_count': alternatives,
            'share_factor': 0.6,
            'weight_factor': 1.4
        },
        'geometry': True,
        'instructions': True,
        'elevation': False
    }
    
    response = requests.post(ORS_BASE_URL, json=body, headers=headers)
    
    if response.status_code != 200:
        raise Exception(f"ORS API error {response.status_code}: {response.text}")
    
    data = response.json()
    routes = []
    
    for route in data.get('routes', []):
        routes.append({
            'geometry': route['geometry'],  # Encoded polyline
            'distance': route['summary']['distance'],  # meters
            'duration': route['summary']['duration'],  # seconds
        })
    
    return routes


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
