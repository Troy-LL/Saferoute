import numpy as np
from datetime import datetime
from geopy.distance import geodesic
from sqlalchemy.orm import Session
from app.models import CrimeIncident


class SafetyScorer:
    def __init__(self, db: Session):
        self.db = db
        self.crime_data = self._load_crime_data()

    def _load_crime_data(self):
        """Load all crime incidents from database"""
        incidents = self.db.query(CrimeIncident).all()
        return [
            {
                'lat': inc.latitude,
                'lng': inc.longitude,
                'type': inc.incident_type,
                'hour': int(inc.time_of_day.split(':')[0]) if inc.time_of_day else 12
            }
            for inc in incidents
        ]

    def calculate_route_safety(self, route_coords, time_of_day=None):
        """
        Calculate safety score for a route

        Args:
            route_coords: List of [lng, lat] coordinates along route
            time_of_day: Hour (0-23), defaults to current hour

        Returns:
            Safety score (0-100), 100 = safest
        """
        if time_of_day is None:
            time_of_day = datetime.now().hour

        # Sample route at intervals (every 50m for performance)
        sampled_points = self._sample_route(route_coords, interval_meters=50)

        scores = []
        for point in sampled_points:
            score = self._calculate_point_safety(point, time_of_day)
            scores.append(score)

        if not scores:
            return 75.0  # Default safe score

        # Average safety across route
        return round(float(np.mean(scores)), 1)

    def get_route_heatmap_data(self, route_coords, time_of_day=None):
        """Get safety data for each point on the route for heatmap visualization"""
        if time_of_day is None:
            time_of_day = datetime.now().hour

        sampled_points = self._sample_route(route_coords, interval_meters=100)
        heatmap = []
        for point in sampled_points:
            score = self._calculate_point_safety(point, time_of_day)
            heatmap.append({
                'lat': point[1],
                'lng': point[0],
                'safety_score': score,
                'intensity': 1 - (score / 100)  # Higher intensity = more dangerous
            })
        return heatmap

    def _sample_route(self, coords, interval_meters=50):
        """Sample points along route at regular intervals"""
        if not coords:
            return []

        sampled = [coords[0]]  # Start point

        total_distance = 0
        for i in range(1, len(coords)):
            p1 = (coords[i - 1][1], coords[i - 1][0])  # (lat, lng)
            p2 = (coords[i][1], coords[i][0])

            distance = geodesic(p1, p2).meters
            total_distance += distance

            if total_distance >= interval_meters:
                sampled.append(coords[i])
                total_distance = 0

        sampled.append(coords[-1])  # End point
        return sampled

    def _calculate_point_safety(self, point, hour):
        """Calculate safety score for a single point"""
        lng, lat = point

        # Factor 1: Crime density (40% weight)
        crimes_nearby = self._count_crimes_in_radius(lat, lng, radius_meters=200)
        crime_penalty = min(crimes_nearby * 10, 40)  # Cap at 40

        # Factor 2: Time of day (30% weight)
        time_penalty = self._time_penalty(hour)

        # Factor 3: Lighting (20% weight) - Simplified for MVP
        lighting_penalty = 10  # Default assumption for MVP

        # Factor 4: Foot traffic (10% weight) - Simplified
        traffic_penalty = 5  # Default assumption

        # Calculate final score
        total_penalty = crime_penalty + time_penalty + lighting_penalty + traffic_penalty
        safety_score = max(0, 100 - total_penalty)

        return safety_score

    def _count_crimes_in_radius(self, lat, lng, radius_meters):
        """Count crime incidents within radius"""
        count = 0
        point = (lat, lng)

        for crime in self.crime_data:
            crime_point = (crime['lat'], crime['lng'])
            distance = geodesic(point, crime_point).meters

            if distance <= radius_meters:
                count += 1

        return count

    def _time_penalty(self, hour):
        """Calculate time-based penalty (higher at night)"""
        # Night hours (10pm-5am) = high risk
        if 22 <= hour <= 23 or 0 <= hour <= 5:
            return 30
        # Evening (6pm-10pm) = medium risk
        elif 18 <= hour <= 21:
            return 15
        # Daytime (6am-6pm) = low risk
        else:
            return 5

    @staticmethod
    def score_to_color(score):
        """Convert safety score to traffic-light color"""
        if score >= 70:
            return "green"
        elif score >= 40:
            return "yellow"
        else:
            return "red"

    @staticmethod
    def score_to_label(score):
        """Convert safety score to human-readable label"""
        if score >= 70:
            return "Safe"
        elif score >= 40:
            return "Moderate Risk"
        else:
            return "High Risk"


# Test function
if __name__ == "__main__":
    from app.database import SessionLocal

    db = SessionLocal()
    scorer = SafetyScorer(db)

    # Test route: Simple straight line
    test_coords = [
        [121.0720, 14.6402],
        [121.0650, 14.6450],
        [121.0580, 14.6500],
    ]

    score = scorer.calculate_route_safety(test_coords, time_of_day=22)
    print(f"Safety score at 10pm: {score}/100 → {SafetyScorer.score_to_label(score)}")

    score = scorer.calculate_route_safety(test_coords, time_of_day=14)
    print(f"Safety score at 2pm: {score}/100 → {SafetyScorer.score_to_label(score)}")
