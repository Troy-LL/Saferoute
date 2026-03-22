from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import SafeSpot
from app.services.sms import send_buddy_alert
from pydantic import BaseModel
from typing import List, Optional
from geopy.distance import geodesic

router = APIRouter()


class SafeSpotResponse(BaseModel):
    id: int
    name: str
    type: str
    lat: float
    lng: float
    hours: Optional[str]
    address: Optional[str]
    city: Optional[str]
    distance_km: Optional[float] = None


class BuddyAlertRequest(BaseModel):
    user_name: str
    current_lat: float
    current_lng: float
    current_address: str
    destination: str
    buddy_phone: str


@router.get("/safe-spots", response_model=List[SafeSpotResponse])
def get_safe_spots(
    lat: float = Query(..., description="Center latitude"),
    lng: float = Query(..., description="Center longitude"),
    radius_km: float = Query(1.0, description="Search radius in km"),
    spot_type: Optional[str] = Query(None, description="Filter by type"),
    db: Session = Depends(get_db)
):
    """
    Get safe spots (police stations, 24/7 stores, security posts) near a location.
    """
    query = db.query(SafeSpot)
    if spot_type:
        query = query.filter(SafeSpot.type == spot_type)
    
    all_spots = query.all()
    nearby = []

    for spot in all_spots:
        dist = geodesic((lat, lng), (spot.latitude, spot.longitude)).km
        if dist <= radius_km:
            nearby.append(SafeSpotResponse(
                id=spot.id,
                name=spot.name,
                type=spot.type,
                lat=spot.latitude,
                lng=spot.longitude,
                hours=spot.hours,
                address=spot.address,
                city=spot.city,
                distance_km=round(dist, 3)
            ))

    # Sort by distance
    nearby.sort(key=lambda x: x.distance_km)
    return nearby


@router.post("/buddy-alert")
def trigger_buddy_alert(request: BuddyAlertRequest):
    """
    Send an emergency SMS to a designated buddy with current location.
    """
    try:
        tracking_url = f"https://saferoute-ph.vercel.app/track/{request.current_lat:.4f},{request.current_lng:.4f}"
        
        sid = send_buddy_alert(
            user_name=request.user_name,
            current_location={
                'lat': request.current_lat,
                'lng': request.current_lng,
                'address': request.current_address
            },
            destination=request.destination,
            buddy_phone=request.buddy_phone,
            tracking_url=tracking_url
        )

        return {"success": True, "message_sid": sid, "message": "Buddy alert sent!"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send buddy alert: {str(e)}")
