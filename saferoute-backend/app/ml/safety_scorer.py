import numpy as np
from datetime import datetime
from geopy.distance import geodesic
from sqlalchemy.orm import Session
from sklearn.neighbors import BallTree
from app.models import CrimeIncident, SafeSpot
from app.osm.geojson_osm import get_osm_geo_data

# Severity weights (higher = more impact on perceived risk)
CRIME_WEIGHTS = {
    "assault": 1.4,
    "robbery": 1.2,
    "harassment": 1.0,
    "theft": 0.7,
}


class SafetyScorer:
    """
    Route safety model: weighted crime proximity, time-of-day risk, lighting,
    foot-traffic proxy, DB safe spots, and OSM GeoJSON context (street lamps,
    surveillance/CCTV, police station polygons) when data/export.geojson is present.
    """

    def __init__(self, db: Session):
        self.db = db
        self._osm = get_osm_geo_data()
        self._build_indices()

    def _build_indices(self):
        incidents = self.db.query(CrimeIncident).all()
        self._crime_rows = [
            {
                "lat": inc.latitude,
                "lng": inc.longitude,
                "type": (inc.incident_type or "theft").lower(),
                "hour": int(inc.time_of_day.split(":")[0]) if inc.time_of_day else 12,
            }
            for inc in incidents
        ]
        if self._crime_rows:
            rad = np.radians([[r["lat"], r["lng"]] for r in self._crime_rows])
            self._crime_tree = BallTree(rad, metric="haversine")
        else:
            self._crime_tree = None

        spots = self.db.query(SafeSpot).all()
        self._spot_coords = [(s.latitude, s.longitude) for s in spots]
        if self._spot_coords:
            self._spot_tree = BallTree(
                np.radians(self._spot_coords), metric="haversine"
            )
        else:
            self._spot_tree = None

    def calculate_route_safety(self, route_coords, time_of_day=None):
        """
        Calculate safety score for a route (0-100, higher = safer).
        """
        if time_of_day is None:
            time_of_day = datetime.now().hour

        sampled_points = self._sample_route(route_coords, interval_meters=50)
        scores = [self._calculate_point_safety(p, time_of_day) for p in sampled_points]

        if not scores:
            return 72.0

        return round(float(np.mean(scores)), 1)

    def get_route_heatmap_data(self, route_coords, time_of_day=None):
        if time_of_day is None:
            time_of_day = datetime.now().hour

        sampled_points = self._sample_route(route_coords, interval_meters=100)
        heatmap = []
        for point in sampled_points:
            score = self._calculate_point_safety(point, time_of_day)
            heatmap.append(
                {
                    "lat": point[1],
                    "lng": point[0],
                    "safety_score": score,
                    "intensity": max(0.0, min(1.0, 1.0 - (score / 100.0))),
                }
            )
        return heatmap

    def _sample_route(self, coords, interval_meters=50):
        if not coords:
            return []

        sampled = [coords[0]]
        total_distance = 0.0
        for i in range(1, len(coords)):
            p1 = (coords[i - 1][1], coords[i - 1][0])
            p2 = (coords[i][1], coords[i][0])
            total_distance += geodesic(p1, p2).meters
            if total_distance >= interval_meters:
                sampled.append(coords[i])
                total_distance = 0.0
        sampled.append(coords[-1])
        return sampled

    def _weighted_crime_load(self, lat, lng, radius_meters=200):
        """Sum of distance-weighted severities for crimes within radius."""
        if not self._crime_tree or not self._crime_rows:
            return 0.0

        # Haversine BallTree: radius in radians (Earth radius ≈ 6371000 m)
        r_rad = radius_meters / 6371000.0
        q = np.radians([[lat, lng]])
        idx = self._crime_tree.query_radius(q, r=r_rad)[0]

        load = 0.0
        for j in idx:
            row = self._crime_rows[j]
            dist_m = geodesic((lat, lng), (row["lat"], row["lng"])).meters
            w = CRIME_WEIGHTS.get(row["type"], 1.0)
            # Smoother decay than hard count: full weight inside ~50m, taper by distance
            decay = 1.0 / (1.0 + (dist_m / 80.0) ** 2)
            load += w * decay
        return load

    def _safe_spot_bonus(self, lat, lng, radius_meters=180):
        """Small safety boost near police / 24h stores / hospitals."""
        if not self._spot_tree or not self._spot_coords:
            return 0.0

        r_rad = radius_meters / 6371000.0
        q = np.radians([[lat, lng]])
        n = len(self._spot_tree.query_radius(q, r=r_rad)[0])
        return min(18.0, n * 5.5)

    def _osm_lamp_lighting_factor(self, lat, lng, radius_meters=90):
        """
        Scale lighting penalty down when many street lamps are nearby (OSM).
        Returns 1.0 = no relief, down to ~0.28 when lamps are dense.
        """
        if not self._osm.lamp_tree or not self._osm.lamp_coords:
            return 1.0
        r_rad = radius_meters / 6371000.0
        q = np.radians([[lat, lng]])
        idx = self._osm.lamp_tree.query_radius(q, r=r_rad)[0]
        if len(idx) == 0:
            return 1.0
        density = min(1.0, len(idx) / 8.0)
        return max(0.28, 1.0 - 0.72 * density)

    def _osm_surveillance_bonus(self, lat, lng, radius_meters=100):
        """
        Distance-weighted bonus near mapped surveillance (CCTV, guards, etc.).
        Uses surveillance:type from OSM when present (camera vs guard).
        """
        if not self._osm.surveillance_tree or not self._osm.surveillance_rows:
            return 0.0
        r_rad = radius_meters / 6371000.0
        q = np.radians([[lat, lng]])
        idx = self._osm.surveillance_tree.query_radius(q, r=r_rad)[0]
        total = 0.0
        for j in idx:
            row = self._osm.surveillance_rows[j]
            dist_m = geodesic((lat, lng), (row["lat"], row["lng"])).meters
            decay = 1.0 / (1.0 + (dist_m / 45.0) ** 2)
            total += row["weight"] * decay
        return min(14.0, total * 4.2)

    def _osm_police_bonus(self, lat, lng, radius_meters=200):
        """Extra boost near police polygons from OSM (centroids), capped to limit overlap with DB spots."""
        if not self._osm.police_tree or not self._osm.police_centroids:
            return 0.0
        r_rad = radius_meters / 6371000.0
        q = np.radians([[lat, lng]])
        n = len(self._osm.police_tree.query_radius(q, r=r_rad)[0])
        return min(8.0, n * 4.0)

    def _lighting_penalty(self, hour):
        """Night = poorer lighting / visibility context."""
        if 22 <= hour or hour <= 5:
            return 14.0
        if 18 <= hour <= 21:
            return 9.0
        return 4.0

    def _foot_traffic_proxy(self, hour):
        """More people around during day and early evening."""
        if 7 <= hour <= 20:
            return 3.0
        if 21 <= hour <= 22:
            return 5.0
        return 8.0

    def _calculate_point_safety(self, point, hour):
        lng, lat = point

        crime_load = self._weighted_crime_load(lat, lng, radius_meters=200)
        crime_penalty = min(42.0, crime_load * 9.0)

        # Time-of-day base risk (night travel)
        if 22 <= hour or hour <= 5:
            time_penalty = 26.0
        elif 18 <= hour <= 21:
            time_penalty = 14.0
        else:
            time_penalty = 6.0

        lighting_penalty = self._lighting_penalty(hour)
        lighting_penalty *= self._osm_lamp_lighting_factor(lat, lng)
        traffic_penalty = self._foot_traffic_proxy(hour)

        total_penalty = crime_penalty + time_penalty + lighting_penalty + traffic_penalty
        bonus = (
            self._safe_spot_bonus(lat, lng)
            + self._osm_surveillance_bonus(lat, lng)
            + self._osm_police_bonus(lat, lng)
        )

        score = 100.0 - total_penalty + bonus
        return float(max(5.0, min(99.0, score)))

    @staticmethod
    def score_to_color(score):
        if score >= 70:
            return "green"
        if score >= 40:
            return "yellow"
        return "red"

    @staticmethod
    def score_to_label(score):
        if score >= 70:
            return "Safe"
        if score >= 40:
            return "Moderate Risk"
        return "High Risk"


if __name__ == "__main__":
    from app.database import SessionLocal

    db = SessionLocal()
    scorer = SafetyScorer(db)
    test_coords = [[121.0720, 14.6402], [121.0650, 14.6450], [121.0580, 14.6500]]
    s_night = scorer.calculate_route_safety(test_coords, time_of_day=22)
    s_day = scorer.calculate_route_safety(test_coords, time_of_day=14)
    print(f"Night (22:00): {s_night}/100 -> {SafetyScorer.score_to_label(s_night)}")
    print(f"Day (14:00):   {s_day}/100 -> {SafetyScorer.score_to_label(s_day)}")
    db.close()
