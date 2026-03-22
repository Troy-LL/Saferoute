import pandas as pd
import random
from pathlib import Path

def generate_synthetic_safe_spots(n=60):
    """Generate synthetic safe spots for Metro Manila demo."""
    
    # Known real-world reference points in Metro Manila
    real_spots = [
        # Police Stations
        {"name": "Manila Police District HQ", "type": "police_station", "lat": 14.5995, "lng": 120.9842, "city": "Manila"},
        {"name": "QCPD Station 9 - Diliman", "type": "police_station", "lat": 14.6512, "lng": 121.0681, "city": "Quezon City"},
        {"name": "Makati Police Station", "type": "police_station", "lat": 14.5547, "lng": 121.0244, "city": "Makati"},
        {"name": "Pasig City Police Station", "type": "police_station", "lat": 14.5764, "lng": 121.0854, "city": "Pasig"},
        # 24/7 Stores
        {"name": "7-Eleven Katipunan", "type": "convenience_store", "lat": 14.6402, "lng": 121.0720, "city": "Quezon City"},
        {"name": "7-Eleven Makati Ave", "type": "convenience_store", "lat": 14.5578, "lng": 121.0176, "city": "Makati"},
        {"name": "Ministop UN Ave", "type": "convenience_store", "lat": 14.5832, "lng": 120.9837, "city": "Manila"},
        {"name": "Family Mart Ortigas", "type": "convenience_store", "lat": 14.5866, "lng": 121.0620, "city": "Pasig"},
        # Security/University Posts
        {"name": "UP Diliman Gate 1 Security", "type": "security_post", "lat": 14.6540, "lng": 121.0680, "city": "Quezon City"},
        {"name": "Ateneo Security Gate", "type": "security_post", "lat": 14.6402, "lng": 121.0781, "city": "Quezon City"},
        {"name": "SM Manila Security Post", "type": "security_post", "lat": 14.5982, "lng": 120.9867, "city": "Manila"},
        # Hospitals (safe refuge)
        {"name": "Philippine General Hospital", "type": "hospital", "lat": 14.5784, "lng": 120.9822, "city": "Manila"},
        {"name": "Makati Medical Center", "type": "hospital", "lat": 14.5596, "lng": 121.0160, "city": "Makati"},
        {"name": "The Medical City Ortigas", "type": "hospital", "lat": 14.5842, "lng": 121.0686, "city": "Pasig"},
        # Fire Stations
        {"name": "Manila Fire Station Central", "type": "fire_station", "lat": 14.6010, "lng": 120.9836, "city": "Manila"},
        {"name": "Quezon City Fire Station", "type": "fire_station", "lat": 14.6508, "lng": 121.0355, "city": "Quezon City"},
    ]
    
    lat_min, lat_max = 14.4, 14.8
    lng_min, lng_max = 120.9, 121.2
    spot_types = ['convenience_store', 'police_station', 'security_post', 'hospital']
    cities = ['Quezon City', 'Manila', 'Makati', 'Pasig', 'Mandaluyong']
    
    # Fill up with synthetic spots
    synthetic = []
    for i in range(n - len(real_spots)):
        synthetic.append({
            'name': f"Safe Spot {i+1}",
            'type': random.choice(spot_types),
            'lat': round(random.uniform(lat_min, lat_max), 6),
            'lng': round(random.uniform(lng_min, lng_max), 6),
            'city': random.choice(cities)
        })
    
    all_spots = real_spots + synthetic
    
    data = []
    for i, spot in enumerate(all_spots):
        data.append({
            'spot_id': i + 1,
            'name': spot['name'],
            'type': spot['type'],
            'latitude': spot.get('lat', spot.get('latitude')),
            'longitude': spot.get('lng', spot.get('longitude')),
            'hours': '24/7',
            'address': f"{spot['city']}, Metro Manila",
            'city': spot['city']
        })
    
    df = pd.DataFrame(data)
    out = Path(__file__).resolve().parent / "safe_spots.csv"
    df.to_csv(out, index=False)
    print(f"[OK] Generated {len(df)} safe spots (incl. {len(real_spots)} anchor locations) -> {out}")
    return df

if __name__ == "__main__":
    Path(__file__).resolve().parent.mkdir(parents=True, exist_ok=True)
    generate_synthetic_safe_spots(55)
