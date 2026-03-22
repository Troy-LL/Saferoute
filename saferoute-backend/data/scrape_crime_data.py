import pandas as pd
import random
from datetime import datetime, timedelta

def generate_synthetic_crime_data(n=500):
    """Generate synthetic Metro Manila crime data for demo.
    Replace with real PNP/barangay data before final submission."""
    
    # Metro Manila bounding box
    lat_min, lat_max = 14.4, 14.8
    lng_min, lng_max = 120.9, 121.2
    
    incident_types = ['robbery', 'harassment', 'assault', 'theft']
    cities = ['Quezon City', 'Manila', 'Makati', 'Pasig', 'Mandaluyong', 'Marikina']
    
    # Higher-risk hotspot clusters (based on known Metro Manila crime areas)
    hotspots = [
        (14.6010, 120.9820, 0.3),  # Quiapo, Manila
        (14.5995, 120.9831, 0.2),  # Binondo, Manila
        (14.6042, 121.0023, 0.15), # Sta. Cruz
        (14.5400, 120.9900, 0.15), # Divisoria area
    ]
    
    data = []
    for i in range(n):
        # 40% chance of being near a hotspot
        if random.random() < 0.4 and hotspots:
            hotspot = random.choice(hotspots)
            lat = hotspot[0] + random.gauss(0, 0.01)
            lng = hotspot[1] + random.gauss(0, 0.01)
        else:
            lat = random.uniform(lat_min, lat_max)
            lng = random.uniform(lng_min, lng_max)
        
        # Clamp to bounds
        lat = max(lat_min, min(lat_max, lat))
        lng = max(lng_min, min(lng_max, lng))
        
        # Time bias: more incidents at night
        hour = random.choices(
            range(24),
            weights=[1,1,1,1,1,1,2,3,3,3,3,3,3,3,3,3,4,5,6,6,5,5,4,2],
            k=1
        )[0]
        minute = random.randint(0, 59)
        
        data.append({
            'incident_id': i + 1,
            'latitude': round(lat, 6),
            'longitude': round(lng, 6),
            'incident_type': random.choice(incident_types),
            'date': (datetime.now() - timedelta(days=random.randint(0, 365))).strftime('%Y-%m-%d'),
            'time_of_day': f"{hour:02d}:{minute:02d}",
            'city': random.choice(cities),
            'barangay': f"Brgy. Sample {random.randint(1, 50)}",
            'description': ''
        })
    
    df = pd.DataFrame(data)
    df.to_csv('data/crime_incidents.csv', index=False)
    print(f"✅ Generated {n} synthetic crime incidents → data/crime_incidents.csv")
    return df

if __name__ == "__main__":
    import os
    os.makedirs('data', exist_ok=True)
    generate_synthetic_crime_data(500)
