from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.routing import get_walking_routes
from app.ml.safety_scorer import SafetyScorer
from pydantic import BaseModel
from typing import List, Optional
import polyline as polyline_lib

router = APIRouter()


class RouteRequest(BaseModel):
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float
    time_of_day: Optional[int] = None  # Hour (0-23)


class RouteOption(BaseModel):
    route_id: int
    geometry: List[List[float]]  # [[lng, lat], ...]
    distance_km: float
    duration_minutes: int
    safety_score: float
    color: str  # 'green', 'yellow', 'red'
    safety_label: str


@router.post("/calculate-route", response_model=List[RouteOption])
def calculate_route(request: RouteRequest, db: Session = Depends(get_db)):
    """
    Calculate 2-3 walking routes with safety scores.
    Returns routes sorted by safety score (safest first).
    """
    try:
        # Get routes from OpenRouteService
        start_coords = [request.start_lng, request.start_lat]
        end_coords = [request.end_lng, request.end_lat]

        ors_routes = get_walking_routes(start_coords, end_coords, alternatives=2)

        # Initialize safety scorer
        scorer = SafetyScorer(db)

        # Calculate safety for each route
        route_options = []
        for i, route in enumerate(ors_routes):
            # Decode polyline geometry
            decoded = polyline_lib.decode(route['geometry'])  # Returns [(lat, lng), ...]
            coords_lnglat = [[lng, lat] for lat, lng in decoded]  # Convert to [lng, lat]

            # Calculate safety score
            safety_score = scorer.calculate_route_safety(
                coords_lnglat,
                time_of_day=request.time_of_day
            )

            route_options.append(RouteOption(
                route_id=i + 1,
                geometry=coords_lnglat,
                distance_km=round(route['distance'] / 1000, 2),
                duration_minutes=round(route['duration'] / 60),
                safety_score=safety_score,
                color=SafetyScorer.score_to_color(safety_score),
                safety_label=SafetyScorer.score_to_label(safety_score)
            ))

        # Sort by safety score (safest first)
        route_options.sort(key=lambda r: r.safety_score, reverse=True)

        return route_options

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/geocode")
def geocode_address(address: str):
    """
    Geocode an address using OpenRouteService Geocoding API
    Returns lat/lng for a given address string
    """
    import requests
    import os
    
    api_key = os.getenv("OPENROUTESERVICE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="ORS API key not configured")

    url = "https://api.openrouteservice.org/geocode/search"
    params = {
        "api_key": api_key,
        "text": address,
        "boundary.country": "PH",
        "size": 5
    }

    response = requests.get(url, params=params)
    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="Geocoding service error")

    data = response.json()
    features = data.get("features", [])

    results = []
    for f in features:
        coords = f["geometry"]["coordinates"]
        results.append({
            "label": f["properties"].get("label", ""),
            "lat": coords[1],
            "lng": coords[0]
        })

    return {"results": results}
