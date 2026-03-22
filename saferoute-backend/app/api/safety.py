from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import CrimeIncident
from app.ml.safety_scorer import SafetyScorer
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


class HeatmapPoint(BaseModel):
    lat: float
    lng: float
    intensity: float  # 0.0-1.0 (1.0 = most dangerous)
    incident_count: int


@router.get("/heatmap", response_model=List[HeatmapPoint])
def get_heatmap_data(
    lat_min: float = Query(14.4, description="Min latitude"),
    lat_max: float = Query(14.8, description="Max latitude"),
    lng_min: float = Query(120.9, description="Min longitude"),
    lng_max: float = Query(121.2, description="Max longitude"),
    db: Session = Depends(get_db)
):
    """
    Get crime heatmap data for a geographic bounding box.
    Returns aggregated crime points for Leaflet.heat visualization.
    """
    incidents = db.query(CrimeIncident).filter(
        CrimeIncident.latitude.between(lat_min, lat_max),
        CrimeIncident.longitude.between(lng_min, lng_max)
    ).all()

    # Return individual crime points for heatmap
    return [
        HeatmapPoint(
            lat=inc.latitude,
            lng=inc.longitude,
            intensity=0.8,  # Default intensity; can be varied by incident type
            incident_count=1
        )
        for inc in incidents
    ]


@router.get("/incidents")
def get_incidents(
    lat: float = Query(...),
    lng: float = Query(...),
    radius_km: float = Query(1.0, description="Search radius in km"),
    db: Session = Depends(get_db)
):
    """Get crime incidents near a location"""
    from geopy.distance import geodesic

    all_incidents = db.query(CrimeIncident).all()
    nearby = []

    for inc in all_incidents:
        dist = geodesic((lat, lng), (inc.latitude, inc.longitude)).km
        if dist <= radius_km:
            nearby.append({
                "id": inc.id,
                "lat": inc.latitude,
                "lng": inc.longitude,
                "type": inc.incident_type,
                "date": inc.date.strftime("%Y-%m-%d") if inc.date else None,
                "time": inc.time_of_day,
                "city": inc.city,
                "distance_km": round(dist, 3)
            })

    nearby.sort(key=lambda x: x["distance_km"])
    return {"incidents": nearby, "count": len(nearby)}


@router.get("/safety-score")
def get_point_safety(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    hour: Optional[int] = Query(None, description="Hour of day 0-23"),
    db: Session = Depends(get_db)
):
    """Get safety score for a specific location"""
    scorer = SafetyScorer(db)
    coords = [[lng, lat]]
    score = scorer.calculate_route_safety(coords, time_of_day=hour)

    return {
        "lat": lat,
        "lng": lng,
        "safety_score": score,
        "color": SafetyScorer.score_to_color(score),
        "label": SafetyScorer.score_to_label(score),
        "hour": hour or datetime.now().hour
    }
