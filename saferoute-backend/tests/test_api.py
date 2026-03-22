"""
Phase 3.4 API tests — ORS calls are mocked so tests run without OPENROUTESERVICE_API_KEY.
"""
from unittest.mock import patch
from fastapi.testclient import TestClient
import polyline

from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@patch("app.api.routes.get_walking_routes")
def test_calculate_route(mock_ors):
    latlngs = [(14.6402, 121.0720), (14.6504, 121.0506)]
    encoded = polyline.encode(latlngs, geojson=False)
    mock_ors.return_value = [
        {"geometry": encoded, "distance": 2000, "duration": 1200},
    ]
    payload = {
        "start_lat": 14.6402,
        "start_lng": 121.0720,
        "end_lat": 14.6504,
        "end_lng": 121.0506,
        "time_of_day": 14,
    }
    response = client.post("/api/calculate-route", json=payload)
    assert response.status_code == 200
    routes = response.json()
    assert len(routes) >= 1
    assert 0 <= routes[0]["safety_score"] <= 100


def test_danger_heatmap():
    response = client.get("/api/danger-heatmap")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        assert "lat" in data[0]
        assert "lng" in data[0]
        assert "intensity" in data[0]


def test_safe_spots():
    response = client.get(
        "/api/safe-spots", params={"lat": 14.6507, "lng": 121.1029, "radius_km": 2}
    )
    assert response.status_code == 200
    spots = response.json()
    assert isinstance(spots, list)
    if len(spots) > 0:
        assert "name" in spots[0]
        assert "type" in spots[0]
        assert "distance_km" in spots[0]
