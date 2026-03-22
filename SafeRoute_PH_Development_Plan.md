# SafeRoute - Phase-by-Phase Development Plan

**Project Type:** MVP (Competition Submission)  
**Timeline:** 4 Days (March 21-24, 2026)  
**Competition:** AIRA Youth Challenge 2026  
**Budget:** ₱0 (Free/Open-source Stack)  
**Team:** PUP Students (Assume 3 developers)

---

## CRITICAL PATH OVERVIEW

```
Day 1 (March 21) → Infrastructure + Data Pipeline
Day 2 (March 22) → Core Routing Engine + Frontend Shell
Day 3 (March 23) → Feature Integration + Testing
Day 4 (March 24) → Polish + Deployment + Submission
```

**Key Success Criteria:**
- ✅ Working demo deployed by March 24, 11:59pm GMT+8
- ✅ All 4 core features functional (Routes, Heatmap, Safe Spots, Buddy Alert)
- ✅ Mobile-responsive web app
- ✅ Submission materials ready (PDF, video, GitHub)

---

## RESOURCE ALLOCATION

### Developer Roles (3-person team)

**Developer A (Full-stack Lead):**
- Backend architecture (FastAPI)
- ML safety scoring model
- Database schema design
- API integration (OpenRouteService, Twilio)

**Developer B (Frontend Lead):**
- React + Vite setup
- Leaflet.js map implementation
- UI/UX components (Tailwind + DaisyUI)
- Responsive design

**Developer C (Data + DevOps):**
- Crime data collection & cleaning
- Safe spots database population
- Deployment (Vercel + Railway)
- Video production & documentation

### Tech Stack Decisions

| Component | Technology | Justification |
|-----------|-----------|---------------|
| **Frontend** | React + Vite | Fast HMR, modern bundling |
| **Styling** | Tailwind CSS + DaisyUI | Rapid prototyping, pre-built components |
| **Mapping** | Leaflet.js + React-Leaflet | Free, OSM-based, heatmap plugins |
| **Backend** | FastAPI | High performance, async support, auto docs |
| **Database** | PostgreSQL (Railway free tier) | PostGIS for geospatial queries |
| **Routing API** | OpenRouteService | Free tier: 2000 req/day, walking routes |
| **SMS** | Twilio API | $15 free credit (~100 SMS for demo) |
| **ML Model** | Scikit-learn (Random Forest) | Simple, interpretable, fast inference |
| **Hosting** | Vercel (frontend) + Railway (backend) | Free tiers, auto deploy from Git |

---

# PHASE 1: FOUNDATION (Day 1 - March 21)

**Goal:** Set up infrastructure, data pipeline, and development environment  
**Duration:** 8 hours  
**Blocker Risk:** Medium (data quality, API keys)

---

## Phase 1.1: Environment Setup (2 hours)

### Tasks for Developer A (Backend)

**1.1.1 Initialize Backend Repository**
```bash
# Create project structure
mkdir saferoute-backend && cd saferoute-backend
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install fastapi uvicorn[standard]
pip install sqlalchemy psycopg2-binary alembic
pip install python-dotenv requests
pip install twilio
pip install scikit-learn pandas numpy joblib
pip install geopy
pip freeze > requirements.txt

# Create project structure
mkdir -p app/{api,models,services,ml}
touch app/{__init__,main,database,config}.py
touch app/api/{__init__,routes,safety,spots}.py
touch app/models/{__init__,crime,location}.py
touch app/services/{__init__,routing,sms}.py
touch app/ml/{__init__,safety_scorer}.py
```

**1.1.2 FastAPI Skeleton (app/main.py)**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import routes, safety, spots
from app.database import engine, Base

app = FastAPI(title="SafeRoute API", version="1.0.0")

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://saferoute.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables
Base.metadata.create_all(bind=engine)

# Include routers
app.include_router(routes.router, prefix="/api", tags=["routing"])
app.include_router(safety.router, prefix="/api", tags=["safety"])
app.include_router(spots.router, prefix="/api", tags=["safe-spots"])

@app.get("/")
def health_check():
    return {"status": "ok", "version": "1.0.0"}
```

**1.1.3 Database Configuration (app/database.py)**
```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost/saferoute")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

**Deliverable:** Backend runs on `localhost:8000`, Swagger docs accessible at `/docs`

---

### Tasks for Developer B (Frontend)

**1.1.4 Initialize Frontend Repository**
```bash
# Create React app
npm create vite@latest saferoute-frontend -- --template react
cd saferoute-frontend

# Install dependencies
npm install leaflet react-leaflet
npm install axios
npm install react-router-dom
npm install @heroicons/react
npm install -D tailwindcss postcss autoprefixer daisyui
npx tailwindcss init -p

# Configure Tailwind (tailwind.config.js)
cat > tailwind.config.js << 'EOF'
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: { extend: {} },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["light"],
  },
}
EOF

# Start dev server
npm run dev
```

**1.1.5 Project Structure**
```bash
src/
├── components/
│   ├── Map/
│   │   ├── MapView.jsx          # Main map component
│   │   ├── RouteLayer.jsx       # Route polylines
│   │   ├── HeatmapLayer.jsx     # Danger heatmap
│   │   └── SafeSpotMarkers.jsx  # Safe location markers
│   ├── RouteSearch.jsx          # Origin/destination input
│   ├── RouteCard.jsx            # Route option display
│   ├── BuddyAlert.jsx           # Emergency button
│   └── Onboarding.jsx           # Tutorial slides
├── pages/
│   ├── Home.jsx                 # Main app page
│   └── NotFound.jsx
├── services/
│   └── api.js                   # Axios instance
├── utils/
│   └── helpers.js               # Utility functions
├── App.jsx
└── main.jsx
```

**1.1.6 Leaflet Map Boilerplate (src/components/Map/MapView.jsx)**
```jsx
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useState } from 'react';

export default function MapView() {
  const [center] = useState([14.5995, 120.9842]); // Manila center
  
  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: '100vh', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
    </MapContainer>
  );
}
```

**Deliverable:** React app runs on `localhost:5173`, displays OSM map centered on Manila

---

### Tasks for Developer C (Data)

**1.1.7 Crime Data Collection**

**Data Sources:**
1. **PNP Crime Statistics** (public reports)
2. **Barangay Incident Reports** (scraped from QC/Manila/Makati websites)
3. **News Articles** (manual tagging of locations from Rappler, Inquirer)
4. **Synthetic Data** (for demo purposes if real data insufficient)

**CSV Schema (crime_incidents.csv):**
```csv
incident_id,latitude,longitude,incident_type,date,time_of_day,description,barangay,city
1,14.6507,121.1029,robbery,2025-11-15,22:30,bag snatching near 7-Eleven,Diliman,Quezon City
2,14.5547,121.0244,harassment,2025-10-22,19:45,catcalling on street,Ermita,Manila
```

**Script: data/scrape_crime_data.py**
```python
import pandas as pd
import random
from datetime import datetime, timedelta

def generate_synthetic_crime_data(n=500):
    """Generate synthetic crime data for demo (replace with real data)"""
    
    # Metro Manila bounding box
    lat_min, lat_max = 14.4, 14.8
    lng_min, lng_max = 120.9, 121.2
    
    incident_types = ['robbery', 'harassment', 'assault', 'theft']
    cities = ['Quezon City', 'Manila', 'Makati']
    
    data = []
    for i in range(n):
        data.append({
            'incident_id': i + 1,
            'latitude': random.uniform(lat_min, lat_max),
            'longitude': random.uniform(lng_min, lng_max),
            'incident_type': random.choice(incident_types),
            'date': (datetime.now() - timedelta(days=random.randint(0, 365))).strftime('%Y-%m-%d'),
            'time_of_day': f"{random.randint(0, 23):02d}:{random.randint(0, 59):02d}",
            'city': random.choice(cities),
        })
    
    df = pd.DataFrame(data)
    df.to_csv('crime_incidents.csv', index=False)
    print(f"Generated {n} synthetic crime incidents")

if __name__ == "__main__":
    generate_synthetic_crime_data(500)
```

**1.1.8 Safe Spots Collection**

**Data Sources:**
1. Google Maps API (search for "7-Eleven", "McDonald's", "police station")
2. PNP website (police station list)
3. Manual entry (security posts at universities)

**CSV Schema (safe_spots.csv):**
```csv
spot_id,name,type,latitude,longitude,hours,address,city
1,7-Eleven Katipunan,convenience_store,14.6402,121.0720,24/7,Katipunan Ave,Quezon City
2,QCPD Station 9,police_station,14.6512,121.0681,24/7,Magsaysay Ave,Quezon City
```

**Script: data/fetch_safe_spots.py**
```python
import requests
import pandas as pd

def fetch_safe_spots_google_maps(api_key):
    """Fetch convenience stores and police stations via Google Places API"""
    
    places = []
    keywords = ["7-Eleven", "McDonald's", "police station", "security guard"]
    locations = [
        (14.6507, 121.1029),  # QC
        (14.5547, 121.0244),  # Manila
        (14.5547, 121.0244),  # Makati
    ]
    
    for keyword in keywords:
        for lat, lng in locations:
            url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
            params = {
                'location': f"{lat},{lng}",
                'radius': 2000,  # 2km radius
                'keyword': keyword,
                'key': api_key
            }
            response = requests.get(url, params=params)
            data = response.json()
            
            for place in data.get('results', []):
                places.append({
                    'name': place['name'],
                    'type': 'convenience_store' if 'store' in keyword.lower() else 'police_station',
                    'latitude': place['geometry']['location']['lat'],
                    'longitude': place['geometry']['location']['lng'],
                    'address': place.get('vicinity', ''),
                })
    
    df = pd.DataFrame(places).drop_duplicates(subset=['latitude', 'longitude'])
    df['hours'] = '24/7'  # Assume 24/7 for MVP
    df['spot_id'] = range(1, len(df) + 1)
    df.to_csv('safe_spots.csv', index=False)
    print(f"Fetched {len(df)} safe spots")

# For MVP: Use synthetic data if no API key
def generate_synthetic_safe_spots(n=50):
    lat_min, lat_max = 14.4, 14.8
    lng_min, lng_max = 120.9, 121.2
    
    data = []
    for i in range(n):
        data.append({
            'spot_id': i + 1,
            'name': f"Safe Spot {i+1}",
            'type': random.choice(['convenience_store', 'police_station', 'security_post']),
            'latitude': random.uniform(lat_min, lat_max),
            'longitude': random.uniform(lng_min, lng_max),
            'hours': '24/7',
            'address': 'Metro Manila',
            'city': random.choice(['Quezon City', 'Manila', 'Makati']),
        })
    
    df = pd.DataFrame(data)
    df.to_csv('safe_spots.csv', index=False)

if __name__ == "__main__":
    # Use synthetic for quick start
    generate_synthetic_safe_spots(50)
```

**Deliverable:** 
- `crime_incidents.csv` (500+ rows)
- `safe_spots.csv` (50+ rows)

---

## Phase 1.2: Database Schema & Seeding (2 hours)

### Tasks for Developer A

**1.2.1 Define SQLAlchemy Models (app/models/__init__.py)**

```python
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import enum

Base = declarative_base()

class IncidentType(enum.Enum):
    ROBBERY = "robbery"
    HARASSMENT = "harassment"
    ASSAULT = "assault"
    THEFT = "theft"

class CrimeIncident(Base):
    __tablename__ = "crime_incidents"
    
    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String, unique=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    incident_type = Column(Enum(IncidentType), nullable=False)
    date = Column(DateTime, nullable=False)
    time_of_day = Column(String)  # HH:MM format
    description = Column(String)
    barangay = Column(String)
    city = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class SafeSpot(Base):
    __tablename__ = "safe_spots"
    
    id = Column(Integer, primary_key=True, index=True)
    spot_id = Column(String, unique=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # convenience_store, police_station, security_post
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    hours = Column(String)  # "24/7" or "Mon-Fri 8am-5pm"
    address = Column(String)
    city = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
```

**1.2.2 Alembic Migration Setup**
```bash
# Initialize Alembic
alembic init migrations

# Edit alembic.ini
# sqlalchemy.url = postgresql://user:pass@localhost/saferoute

# Create initial migration
alembic revision --autogenerate -m "Initial schema"
alembic upgrade head
```

**1.2.3 Data Seeding Script (scripts/seed_database.py)**
```python
import pandas as pd
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import Base, CrimeIncident, SafeSpot
from datetime import datetime

def seed_crime_data():
    db = SessionLocal()
    
    # Read CSV
    df = pd.read_csv('data/crime_incidents.csv')
    
    for _, row in df.iterrows():
        incident = CrimeIncident(
            incident_id=str(row['incident_id']),
            latitude=row['latitude'],
            longitude=row['longitude'],
            incident_type=row['incident_type'],
            date=datetime.strptime(row['date'], '%Y-%m-%d'),
            time_of_day=row['time_of_day'],
            city=row.get('city', 'Metro Manila')
        )
        db.add(incident)
    
    db.commit()
    db.close()
    print(f"Seeded {len(df)} crime incidents")

def seed_safe_spots():
    db = SessionLocal()
    
    df = pd.read_csv('data/safe_spots.csv')
    
    for _, row in df.iterrows():
        spot = SafeSpot(
            spot_id=str(row['spot_id']),
            name=row['name'],
            type=row['type'],
            latitude=row['latitude'],
            longitude=row['longitude'],
            hours=row.get('hours', '24/7'),
            address=row.get('address', ''),
            city=row.get('city', 'Metro Manila')
        )
        db.add(spot)
    
    db.commit()
    db.close()
    print(f"Seeded {len(df)} safe spots")

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    seed_crime_data()
    seed_safe_spots()
```

**Run seeding:**
```bash
python scripts/seed_database.py
```

**Deliverable:** PostgreSQL database populated with crime incidents and safe spots

---

## Phase 1.3: External API Setup (2 hours)

### Tasks for Developer A

**1.3.1 OpenRouteService Integration (app/services/routing.py)**

```python
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
        raise Exception(f"ORS API error: {response.text}")
    
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
    
    routes = get_walking_routes(start, end, alternatives=2)
    print(f"Found {len(routes)} routes")
    for i, route in enumerate(routes):
        print(f"Route {i+1}: {route['distance']}m, {route['duration']}s")
```

**1.3.2 Get OpenRouteService API Key**
```bash
# Sign up at https://openrouteservice.org/dev/#/signup
# Free tier: 2000 requests/day, 40 requests/minute
# Add to .env file
echo "OPENROUTESERVICE_API_KEY=your_api_key_here" >> .env
```

**1.3.3 Twilio SMS Setup (app/services/sms.py)**

```python
from twilio.rest import Client
import os
from dotenv import load_dotenv

load_dotenv()

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")

client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

def send_buddy_alert(user_name, current_location, destination, buddy_phone, tracking_url):
    """
    Send emergency SMS to buddy
    
    Args:
        user_name: Name of user
        current_location: Dict with 'lat', 'lng', 'address'
        destination: Destination address
        buddy_phone: Phone number to send to (format: +639XXXXXXXXX)
        tracking_url: URL for live tracking
    
    Returns:
        Twilio message SID
    """
    
    message_body = f"""SafeRoute Alert: {user_name} is walking from {current_location['address']} to {destination}.

Current location: ({current_location['lat']}, {current_location['lng']})
Track: {tracking_url}

This is an automated message from SafeRoute."""
    
    message = client.messages.create(
        body=message_body,
        from_=TWILIO_PHONE_NUMBER,
        to=buddy_phone
    )
    
    return message.sid

# Test function
if __name__ == "__main__":
    send_buddy_alert(
        user_name="Test User",
        current_location={
            'lat': 14.6507,
            'lng': 121.1029,
            'address': "UP Diliman, Quezon City"
        },
        destination="Quezon Memorial Circle",
        buddy_phone="+639XXXXXXXXX",  # Test phone number
        tracking_url="https://saferoute.vercel.app/track/test123"
    )
```

**1.3.4 Get Twilio Credentials**
```bash
# Sign up at https://www.twilio.com/try-twilio
# Get $15 free credit (~100 SMS)
# Get: Account SID, Auth Token, Phone Number
# Add to .env
echo "TWILIO_ACCOUNT_SID=your_sid" >> .env
echo "TWILIO_AUTH_TOKEN=your_token" >> .env
echo "TWILIO_PHONE_NUMBER=+1234567890" >> .env
```

**Deliverable:** Both external APIs tested and working

---

## Phase 1.4: ML Safety Scoring Model (2 hours)

### Tasks for Developer A

**1.4.1 Safety Score Algorithm Design**

**Scoring Factors:**
1. **Crime Density** (40% weight): Number of incidents within 200m radius
2. **Time of Day** (30% weight): Higher risk at night (10pm-5am)
3. **Street Lighting** (20% weight): Assumed based on road type (major roads = well-lit)
4. **Foot Traffic** (10% weight): Assumed based on POI density

**Score Formula:**
```
Safety Score = 100 - (
    0.4 * crime_density_penalty +
    0.3 * time_penalty +
    0.2 * lighting_penalty +
    0.1 * traffic_penalty
)
```

**1.4.2 Implement Scorer (app/ml/safety_scorer.py)**

```python
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
                'type': inc.incident_type.value,
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
        
        # Average safety across route
        return round(np.mean(scores), 1)
    
    def _sample_route(self, coords, interval_meters=50):
        """Sample points along route at regular intervals"""
        sampled = [coords[0]]  # Start point
        
        total_distance = 0
        for i in range(1, len(coords)):
            p1 = (coords[i-1][1], coords[i-1][0])  # (lat, lng)
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
        # Assume major roads are well-lit (penalty = 0), minor roads less so
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
    print(f"Safety score at 10pm: {score}/100")
    
    score = scorer.calculate_route_safety(test_coords, time_of_day=14)
    print(f"Safety score at 2pm: {score}/100")
```

**Deliverable:** ML safety scorer functional, returns 0-100 scores

---

## Phase 1.5: Deployment Setup (1 hour)

### Tasks for Developer C

**1.5.1 Railway Database Setup**

```bash
# Sign up at railway.app
# Create new project → Add PostgreSQL
# Copy DATABASE_URL from Railway dashboard
# Add to .env locally

# Update production .env on Railway:
# DATABASE_URL=postgresql://user:pass@host:port/db
# OPENROUTESERVICE_API_KEY=xxx
# TWILIO_ACCOUNT_SID=xxx
# TWILIO_AUTH_TOKEN=xxx
# TWILIO_PHONE_NUMBER=+1234567890
```

**1.5.2 Vercel Frontend Setup**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
cd saferoute-frontend
vercel link

# Set environment variables
vercel env add VITE_API_URL production
# Enter: https://saferoute-backend.railway.app
```

**1.5.3 GitHub Repository Setup**

```bash
# Create repo on GitHub
# Add both frontend and backend

git init
git remote add origin https://github.com/[username]/saferoute.git

# Create .gitignore
cat > .gitignore << EOF
node_modules/
venv/
.env
*.pyc
__pycache__/
dist/
build/
.DS_Store
EOF

# Initial commit
git add .
git commit -m "Initial commit: SafeRoute MVP"
git push -u origin main
```

**Deliverable:** 
- Railway backend deployed
- Vercel frontend linked
- GitHub repo live

---

## PHASE 1 DELIVERABLES CHECKLIST

- [ ] Backend FastAPI running on Railway
- [ ] Frontend React app running on Vercel
- [ ] PostgreSQL database with schema created
- [ ] 500+ crime incidents seeded
- [ ] 50+ safe spots seeded
- [ ] OpenRouteService API key configured
- [ ] Twilio SMS API tested
- [ ] ML safety scorer returns realistic scores
- [ ] GitHub repo initialized with clean commits

**End of Day 1 Status:** Infrastructure complete, ready for feature development

---

# PHASE 2: CORE FEATURES (Day 2 - March 22)

**Goal:** Implement routing engine, map visualization, and core UI  
**Duration:** 8 hours  
**Blocker Risk:** High (API rate limits, map rendering bugs)

---

## Phase 2.1: Route Calculation API (2 hours)

### Tasks for Developer A

**2.1.1 Route Calculation Endpoint (app/api/routes.py)**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.routing import get_walking_routes
from app.ml.safety_scorer import SafetyScorer
from pydantic import BaseModel
from typing import List
import polyline

router = APIRouter()

class RouteRequest(BaseModel):
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float
    time_of_day: int = None  # Hour (0-23)

class RouteOption(BaseModel):
    route_id: int
    geometry: List[List[float]]  # [[lng, lat], ...]
    distance_km: float
    duration_minutes: int
    safety_score: float
    color: str  # 'green', 'yellow', 'red'

@router.post("/calculate-route", response_model=List[RouteOption])
def calculate_route(request: RouteRequest, db: Session = Depends(get_db)):
    """
    Calculate 2-3 walking routes with safety scores
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
            coords = polyline.decode(route['geometry'])  # Returns [(lat, lng), ...]
            coords_lnglat = [[lng, lat] for lat, lng in coords]  # Convert to [lng, lat]
            
            # Calculate safety score
            safety_score = scorer.calculate_route_safety(
                coords_lnglat,
                time_of_day=request.time_of_day
            )
            
            # Determine color
            if safety_score >= 80:
                color = 'green'
            elif safety_score >= 50:
                color = 'yellow'
            else:
                color = 'red'
            
            route_options.append(RouteOption(
                route_id=i + 1,
                geometry=coords_lnglat,
                distance_km=round(route['distance'] / 1000, 2),
                duration_minutes=round(route['duration'] / 60),
                safety_score=safety_score,
                color=color
            ))
        
        # Sort by safety score (safest first)
        route_options.sort(key=lambda r: r.safety_score, reverse=True)
        
        return route_options
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

**2.1.2 Install Missing Dependency**
```bash
pip install polyline
pip freeze > requirements.txt
```

**2.1.3 Test Endpoint**
```bash
# Start backend
uvicorn app.main:app --reload

# Test with curl
curl -X POST http://localhost:8000/api/calculate-route \
  -H "Content-Type: application/json" \
  -d '{
    "start_lat": 14.6402,
    "start_lng": 121.0720,
    "end_lat": 14.6504,
    "end_lng": 121.0506,
    "time_of_day": 14
  }'
```

**Expected Response:**
```json
[
  {
    "route_id": 1,
    "geometry": [[121.072, 14.6402], [121.071, 14.641], ...],
    "distance_km": 2.3,
    "duration_minutes": 28,
    "safety_score": 85.2,
    "color": "green"
  },
  {
    "route_id": 2,
    "geometry": [[121.072, 14.6402], [121.073, 14.642], ...],
    "distance_km": 2.5,
    "duration_minutes": 30,
    "safety_score": 72.1,
    "color": "yellow"
  }
]
```

**Deliverable:** Route calculation API endpoint functional

---

## Phase 2.2: Heatmap & Safe Spots APIs (2 hours)

### Tasks for Developer A

**2.2.1 Danger Heatmap Endpoint (app/api/safety.py)**

```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import CrimeIncident
from pydantic import BaseModel
from typing import List
from datetime import datetime

router = APIRouter()

class HeatmapPoint(BaseModel):
    lat: float
    lng: float
    intensity: float  # 0-1

@router.get("/danger-heatmap", response_model=List[HeatmapPoint])
def get_danger_heatmap(
    time_of_day: int = None,
    db: Session = Depends(get_db)
):
    """
    Get danger heatmap data for current time
    """
    
    # Get all crime incidents
    incidents = db.query(CrimeIncident).all()
    
    heatmap_data = []
    for incident in incidents:
        # Filter by time if specified
        if time_of_day is not None:
            incident_hour = int(incident.time_of_day.split(':')[0]) if incident.time_of_day else 12
            # Only include incidents within ±3 hours
            if abs(incident_hour - time_of_day) > 3:
                continue
        
        # Determine intensity based on incident type
        intensity_map = {
            'robbery': 1.0,
            'assault': 0.9,
            'harassment': 0.6,
            'theft': 0.5
        }
        
        intensity = intensity_map.get(incident.incident_type.value, 0.5)
        
        heatmap_data.append(HeatmapPoint(
            lat=incident.latitude,
            lng=incident.longitude,
            intensity=intensity
        ))
    
    return heatmap_data
```

**2.2.2 Safe Spots Endpoint (app/api/spots.py)**

```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import SafeSpot
from pydantic import BaseModel
from typing import List
from geopy.distance import geodesic

router = APIRouter()

class SafeSpotResponse(BaseModel):
    spot_id: str
    name: str
    type: str
    lat: float
    lng: float
    hours: str
    address: str
    distance_km: float = None

@router.get("/safe-spots", response_model=List[SafeSpotResponse])
def get_safe_spots(
    lat: float = None,
    lng: float = None,
    radius_km: float = 2.0,
    db: Session = Depends(get_db)
):
    """
    Get safe spots within radius of given location
    """
    
    spots = db.query(SafeSpot).all()
    
    results = []
    for spot in spots:
        # Calculate distance if user location provided
        if lat and lng:
            user_point = (lat, lng)
            spot_point = (spot.latitude, spot.longitude)
            distance = geodesic(user_point, spot_point).kilometers
            
            # Filter by radius
            if distance > radius_km:
                continue
        else:
            distance = None
        
        results.append(SafeSpotResponse(
            spot_id=spot.spot_id,
            name=spot.name,
            type=spot.type,
            lat=spot.latitude,
            lng=spot.longitude,
            hours=spot.hours,
            address=spot.address,
            distance_km=round(distance, 2) if distance else None
        ))
    
    # Sort by distance if available
    if lat and lng:
        results.sort(key=lambda s: s.distance_km)
    
    return results

@router.get("/safe-spots/nearest")
def get_nearest_safe_spot(
    lat: float,
    lng: float,
    db: Session = Depends(get_db)
):
    """
    Find nearest safe spot to given location
    """
    
    spots = get_safe_spots(lat=lat, lng=lng, radius_km=10, db=db)
    
    if not spots:
        return {"error": "No safe spots found within 10km"}
    
    return spots[0]  # Already sorted by distance
```

**Deliverable:** Both API endpoints tested and returning data

---

## Phase 2.3: Frontend Map Integration (2 hours)

### Tasks for Developer B

**2.3.1 Route Search Component (src/components/RouteSearch.jsx)**

```jsx
import { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function RouteSearch({ onSearch }) {
  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!startAddress || !endAddress) {
      alert('Please enter both start and destination');
      return;
    }

    setLoading(true);
    
    // For MVP: Use Nominatim for geocoding (free, no API key)
    try {
      const startCoords = await geocodeAddress(startAddress);
      const endCoords = await geocodeAddress(endAddress);
      
      onSearch(startCoords, endCoords);
    } catch (error) {
      alert('Could not find location. Try being more specific.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setStartAddress(`${position.coords.latitude}, ${position.coords.longitude}`);
        },
        (error) => {
          alert('Could not get current location');
        }
      );
    }
  };

  return (
    <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-4 w-80">
      <h2 className="text-lg font-bold mb-3">Plan Your Safe Route</h2>
      
      <div className="space-y-3">
        <div>
          <label className="text-sm text-gray-600">Starting Point</label>
          <div className="flex gap-2">
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Enter address or landmark"
              value={startAddress}
              onChange={(e) => setStartAddress(e.target.value)}
            />
            <button
              className="btn btn-square btn-outline"
              onClick={getCurrentLocation}
              title="Use current location"
            >
              📍
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-600">Destination</label>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="Enter address or landmark"
            value={endAddress}
            onChange={(e) => setEndAddress(e.target.value)}
          />
        </div>

        <button
          className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? 'Finding routes...' : (
            <>
              <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
              Find Safe Routes
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Helper: Geocode address to coordinates
async function geocodeAddress(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}, Metro Manila, Philippines`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.length === 0) {
    throw new Error('Location not found');
  }
  
  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon)
  };
}
```

**2.3.2 Route Display Component (src/components/RouteCard.jsx)**

```jsx
export default function RouteCard({ route, onSelect, isSelected }) {
  const colorClasses = {
    green: 'border-green-500 bg-green-50',
    yellow: 'border-yellow-500 bg-yellow-50',
    red: 'border-red-500 bg-red-50'
  };

  const scoreColor = {
    green: 'text-green-700',
    yellow: 'text-yellow-700',
    red: 'text-red-700'
  };

  return (
    <div
      className={`border-2 rounded-lg p-3 cursor-pointer transition ${
        colorClasses[route.color]
      } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      onClick={() => onSelect(route)}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold">Route {route.route_id}</h3>
          <p className="text-sm text-gray-600">
            {route.distance_km} km • {route.duration_minutes} min walk
          </p>
        </div>
        <div className={`text-right ${scoreColor[route.color]}`}>
          <div className="text-2xl font-bold">{route.safety_score}</div>
          <div className="text-xs">Safety Score</div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className={`badge ${route.color === 'green' ? 'badge-success' : route.color === 'yellow' ? 'badge-warning' : 'badge-error'}`}>
          {route.color === 'green' ? '✓ Safe' : route.color === 'yellow' ? '⚠ Moderate' : '⚠ Risky'}
        </div>
      </div>
    </div>
  );
}
```

**2.3.3 Map with Route Layers (src/components/Map/MapView.jsx)**

```jsx
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

function MapController({ routes, selectedRoute }) {
  const map = useMap();

  useEffect(() => {
    if (selectedRoute && selectedRoute.geometry.length > 0) {
      // Fit map to route bounds
      const bounds = L.latLngBounds(
        selectedRoute.geometry.map(([lng, lat]) => [lat, lng])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [selectedRoute, map]);

  return null;
}

export default function MapView({ routes, selectedRoute, onRouteClick, startMarker, endMarker }) {
  const center = [14.5995, 120.9842]; // Manila

  const routeColors = {
    green: '#22c55e',
    yellow: '#eab308',
    red: '#ef4444'
  };

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: '100vh', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />

      {/* Start marker */}
      {startMarker && (
        <Marker position={[startMarker.lat, startMarker.lng]}>
          <Popup>Start</Popup>
        </Marker>
      )}

      {/* End marker */}
      {endMarker && (
        <Marker position={[endMarker.lat, endMarker.lng]}>
          <Popup>Destination</Popup>
        </Marker>
      )}

      {/* Route polylines */}
      {routes.map((route) => (
        <Polyline
          key={route.route_id}
          positions={route.geometry.map(([lng, lat]) => [lat, lng])}
          color={routeColors[route.color]}
          weight={selectedRoute?.route_id === route.route_id ? 6 : 3}
          opacity={selectedRoute?.route_id === route.route_id ? 1 : 0.5}
          eventHandlers={{
            click: () => onRouteClick(route)
          }}
        />
      ))}

      <MapController routes={routes} selectedRoute={selectedRoute} />
    </MapContainer>
  );
}
```

**Deliverable:** Map displays routes with color coding

---

## Phase 2.4: Integration & State Management (2 hours)

### Tasks for Developer B

**2.4.1 API Service Layer (src/services/api.js)**

```javascript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const calculateRoute = async (startLat, startLng, endLat, endLng, timeOfDay = null) => {
  const response = await api.post('/api/calculate-route', {
    start_lat: startLat,
    start_lng: startLng,
    end_lat: endLat,
    end_lng: endLng,
    time_of_day: timeOfDay || new Date().getHours(),
  });
  return response.data;
};

export const getDangerHeatmap = async (timeOfDay = null) => {
  const response = await api.get('/api/danger-heatmap', {
    params: { time_of_day: timeOfDay }
  });
  return response.data;
};

export const getSafeSpots = async (lat, lng, radiusKm = 2) => {
  const response = await api.get('/api/safe-spots', {
    params: { lat, lng, radius_km: radiusKm }
  });
  return response.data;
};

export const sendBuddyAlert = async (alertData) => {
  const response = await api.post('/api/send-alert', alertData);
  return response.data;
};

export default api;
```

**2.4.2 Main App Integration (src/pages/Home.jsx)**

```jsx
import { useState } from 'react';
import MapView from '../components/Map/MapView';
import RouteSearch from '../components/RouteSearch';
import RouteCard from '../components/RouteCard';
import { calculateRoute } from '../services/api';

export default function Home() {
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [startMarker, setStartMarker] = useState(null);
  const [endMarker, setEndMarker] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (startCoords, endCoords) => {
    setLoading(true);
    setStartMarker(startCoords);
    setEndMarker(endCoords);

    try {
      const routeData = await calculateRoute(
        startCoords.lat,
        startCoords.lng,
        endCoords.lat,
        endCoords.lng
      );

      setRoutes(routeData);
      setSelectedRoute(routeData[0]); // Auto-select safest route
    } catch (error) {
      console.error('Route calculation failed:', error);
      alert('Failed to calculate routes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-screen">
      <MapView
        routes={routes}
        selectedRoute={selectedRoute}
        onRouteClick={setSelectedRoute}
        startMarker={startMarker}
        endMarker={endMarker}
      />

      <RouteSearch onSearch={handleSearch} />

      {/* Route options panel */}
      {routes.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-4 max-h-64 overflow-y-auto">
          <h3 className="font-bold mb-3">Route Options</h3>
          <div className="space-y-2">
            {routes.map((route) => (
              <RouteCard
                key={route.route_id}
                route={route}
                onSelect={setSelectedRoute}
                isSelected={selectedRoute?.route_id === route.route_id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Deliverable:** Full routing workflow functional (search → routes → selection)

---

## PHASE 2 DELIVERABLES CHECKLIST

- [ ] Route calculation API returns 2-3 routes with safety scores
- [ ] Heatmap API returns crime data points
- [ ] Safe spots API returns locations within radius
- [ ] Map displays routes with color coding (green/yellow/red)
- [ ] User can search for routes by address
- [ ] User can select route to highlight on map
- [ ] Route cards show distance, duration, safety score

**End of Day 2 Status:** Core routing feature complete

---

# PHASE 3: ADDITIONAL FEATURES & TESTING (Day 3 - March 23)

**Goal:** Add heatmap, safe spots, buddy alert; comprehensive testing  
**Duration:** 8 hours  
**Blocker Risk:** Medium (SMS testing, UI bugs)

---

## Phase 3.1: Heatmap Overlay (1.5 hours)

### Tasks for Developer B

**3.1.1 Install Heatmap Plugin**
```bash
npm install leaflet.heat
```

**3.1.2 Heatmap Component (src/components/Map/HeatmapLayer.jsx)**

```jsx
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

export default function HeatmapLayer({ data, visible }) {
  const map = useMap();

  useEffect(() => {
    if (!visible || !data || data.length === 0) return;

    // Convert data to heatmap format: [lat, lng, intensity]
    const heatData = data.map(point => [point.lat, point.lng, point.intensity]);

    // Create heatmap layer
    const heatLayer = L.heatLayer(heatData, {
      radius: 25,
      blur: 35,
      maxZoom: 17,
      max: 1.0,
      gradient: {
        0.0: '#ffffb2',
        0.5: '#fd8d3c',
        1.0: '#bd0026'
      }
    }).addTo(map);

    // Cleanup on unmount
    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, data, visible]);

  return null;
}
```

**3.1.3 Integrate into MapView**

```jsx
// In src/components/Map/MapView.jsx
import HeatmapLayer from './HeatmapLayer';

// Add prop
export default function MapView({ ..., heatmapData, showHeatmap }) {
  // ...
  
  return (
    <MapContainer ...>
      {/* ... existing layers ... */}
      
      <HeatmapLayer data={heatmapData} visible={showHeatmap} />
    </MapContainer>
  );
}
```

**3.1.4 Heatmap Toggle in Home.jsx**

```jsx
// In src/pages/Home.jsx
const [showHeatmap, setShowHeatmap] = useState(true);
const [heatmapData, setHeatmapData] = useState([]);

useEffect(() => {
  // Load heatmap on mount
  async function loadHeatmap() {
    const data = await getDangerHeatmap();
    setHeatmapData(data);
  }
  loadHeatmap();
}, []);

// Add toggle button
<div className="absolute top-4 right-4 z-[1000]">
  <button
    className={`btn ${showHeatmap ? 'btn-error' : 'btn-outline'}`}
    onClick={() => setShowHeatmap(!showHeatmap)}
  >
    {showHeatmap ? '🔥 Hide Danger Zones' : 'Show Danger Zones'}
  </button>
</div>
```

**Deliverable:** Danger heatmap overlay toggleable

---

## Phase 3.2: Safe Spots Markers (1.5 hours)

### Tasks for Developer B

**3.2.1 Safe Spot Markers Component (src/components/Map/SafeSpotMarkers.jsx)**

```jsx
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Custom icons for different spot types
const spotIcons = {
  convenience_store: L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1076/1076984.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  }),
  police_station: L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1611/1611729.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  }),
  security_post: L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3004/3004458.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  })
};

export default function SafeSpotMarkers({ spots, visible }) {
  if (!visible) return null;

  return (
    <>
      {spots.map((spot) => (
        <Marker
          key={spot.spot_id}
          position={[spot.lat, spot.lng]}
          icon={spotIcons[spot.type] || spotIcons.convenience_store}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-bold">{spot.name}</h3>
              <p className="text-sm text-gray-600">{spot.type.replace('_', ' ')}</p>
              <p className="text-sm">📍 {spot.address}</p>
              <p className="text-sm">🕐 {spot.hours}</p>
              {spot.distance_km && (
                <p className="text-sm font-bold mt-1">
                  {spot.distance_km} km away
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
```

**3.2.2 Integrate into Home.jsx**

```jsx
const [safeSpots, setSafeSpots] = useState([]);
const [showSafeSpots, setShowSafeSpots] = useState(true);

useEffect(() => {
  // Load safe spots when user location is available
  if (startMarker) {
    async function loadSafeSpots() {
      const spots = await getSafeSpots(startMarker.lat, startMarker.lng, 2);
      setSafeSpots(spots);
    }
    loadSafeSpots();
  }
}, [startMarker]);

// In MapView
<SafeSpotMarkers spots={safeSpots} visible={showSafeSpots} />

// Toggle button
<button
  className={`btn ${showSafeSpots ? 'btn-success' : 'btn-outline'}`}
  onClick={() => setShowSafeSpots(!showSafeSpots)}
>
  {showSafeSpots ? '🏪 Hide Safe Spots' : 'Show Safe Spots'}
</button>
```

**Deliverable:** Safe spot markers visible on map with info popups

---

## Phase 3.3: Buddy Alert System (2 hours)

### Tasks for Developer A (Backend)

**3.3.1 SMS Alert Endpoint (app/api/alerts.py)**

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.sms import send_buddy_alert
import uuid

router = APIRouter()

class AlertRequest(BaseModel):
    user_name: str
    current_lat: float
    current_lng: float
    current_address: str
    destination: str
    buddy_phone: str  # Format: +639XXXXXXXXX

@router.post("/send-alert")
def send_alert(request: AlertRequest):
    """
    Send emergency SMS to buddy
    """
    
    try:
        # Generate tracking URL
        tracking_id = str(uuid.uuid4())[:8]
        tracking_url = f"https://saferoute.vercel.app/track/{tracking_id}"
        
        # Send SMS
        message_sid = send_buddy_alert(
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
        
        return {
            "success": True,
            "message_sid": message_sid,
            "tracking_url": tracking_url
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

**3.3.2 Register Router in main.py**

```python
from app.api import alerts

app.include_router(alerts.router, prefix="/api", tags=["alerts"])
```

---

### Tasks for Developer B (Frontend)

**3.3.3 Buddy Alert Component (src/components/BuddyAlert.jsx)**

```jsx
import { useState } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { sendBuddyAlert } from '../services/api';

export default function BuddyAlert({ currentLocation, destination }) {
  const [buddyPhone, setBuddyPhone] = useState('');
  const [userName, setUserName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSendAlert = async () => {
    if (!buddyPhone || !userName) {
      alert('Please enter your name and buddy phone number');
      return;
    }

    // Validate phone format
    if (!buddyPhone.match(/^\+639\d{9}$/)) {
      alert('Phone must be in format: +639XXXXXXXXX');
      return;
    }

    setSending(true);

    try {
      const response = await sendBuddyAlert({
        user_name: userName,
        current_lat: currentLocation.lat,
        current_lng: currentLocation.lng,
        current_address: currentLocation.address || 'Unknown location',
        destination: destination || 'Unknown destination',
        buddy_phone: buddyPhone
      });

      alert('✓ Alert sent successfully!');
      setShowModal(false);
    } catch (error) {
      alert('Failed to send alert. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        className="btn btn-error btn-lg gap-2"
        onClick={() => setShowModal(true)}
        disabled={!currentLocation}
      >
        <ExclamationTriangleIcon className="w-6 h-6" />
        Alert Buddy
      </button>

      {/* Modal */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Send Emergency Alert</h3>
            
            <div className="form-control mb-3">
              <label className="label">
                <span className="label-text">Your Name</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Maria Santos"
                className="input input-bordered"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>

            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Buddy's Phone Number</span>
              </label>
              <input
                type="tel"
                placeholder="+639XXXXXXXXX"
                className="input input-bordered"
                value={buddyPhone}
                onChange={(e) => setBuddyPhone(e.target.value)}
              />
              <label className="label">
                <span className="label-text-alt">Format: +639XXXXXXXXX</span>
              </label>
            </div>

            <div className="alert alert-warning mb-4">
              <span className="text-sm">
                Your buddy will receive an SMS with your location and route.
              </span>
            </div>

            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className={`btn btn-error ${sending ? 'loading' : ''}`}
                onClick={handleSendAlert}
                disabled={sending}
              >
                {sending ? 'Sending...' : 'Send Alert'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

**3.3.4 Integrate into Home.jsx**

```jsx
import BuddyAlert from '../components/BuddyAlert';

// Add to UI
<div className="absolute bottom-4 right-4 z-[1000]">
  <BuddyAlert
    currentLocation={startMarker}
    destination={endMarker?.address}
  />
</div>
```

**Deliverable:** Buddy alert SMS functional

---

## Phase 3.4: Comprehensive Testing (2 hours)

### Tasks for Developer C

**3.4.1 Backend Testing (tests/test_api.py)**

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_calculate_route():
    payload = {
        "start_lat": 14.6402,
        "start_lng": 121.0720,
        "end_lat": 14.6504,
        "end_lng": 121.0506,
        "time_of_day": 14
    }
    response = client.post("/api/calculate-route", json=payload)
    assert response.status_code == 200
    
    routes = response.json()
    assert len(routes) >= 1
    assert routes[0]["safety_score"] >= 0
    assert routes[0]["safety_score"] <= 100

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
    response = client.get("/api/safe-spots?lat=14.6507&lng=121.1029&radius_km=2")
    assert response.status_code == 200
    
    spots = response.json()
    assert isinstance(spots, list)
    if len(spots) > 0:
        assert "name" in spots[0]
        assert "type" in spots[0]
        assert "distance_km" in spots[0]
```

**Run tests:**
```bash
pip install pytest
pytest tests/
```

**3.4.2 Frontend E2E Testing Checklist**

**Manual Test Scenarios:**

1. **Route Search Flow**
   - [ ] Enter start/end addresses
   - [ ] Routes display on map
   - [ ] Routes have correct colors (green/yellow/red)
   - [ ] Click route card to highlight on map
   - [ ] Safety scores are reasonable (0-100)

2. **Map Interactions**
   - [ ] Map loads centered on Manila
   - [ ] Can zoom in/out
   - [ ] Can pan around
   - [ ] Start/end markers display
   - [ ] Routes are clickable

3. **Heatmap**
   - [ ] Toggle button shows/hides heatmap
   - [ ] Heatmap displays red zones
   - [ ] Intensity varies by crime density

4. **Safe Spots**
   - [ ] Markers display on map
   - [ ] Click marker shows popup with details
   - [ ] Popup shows name, type, hours
   - [ ] Different icons for different types

5. **Buddy Alert**
   - [ ] Button disabled when no location
   - [ ] Modal opens on click
   - [ ] Form validates phone number format
   - [ ] SMS sends successfully
   - [ ] Confirmation message displays

6. **Mobile Responsiveness**
   - [ ] Test on phone screen (375px width)
   - [ ] All buttons are tappable
   - [ ] Text is readable
   - [ ] Map controls accessible
   - [ ] No horizontal scrolling

**3.4.3 Browser Compatibility Testing**

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (iOS)
- [ ] Chrome Mobile (Android)

**3.4.4 Performance Testing**

```bash
# Frontend build size
npm run build
ls -lh dist/

# Target: < 2MB total bundle size
```

**3.4.5 Bug Fixes**

Document any bugs found in `BUGS.md`:
```markdown
## Known Issues

1. [HIGH] Route calculation fails for very long distances
   - **Fix:** Add distance validation (<10km)
   
2. [MEDIUM] Heatmap doesn't update when time changes
   - **Fix:** Re-fetch data on time selector change

3. [LOW] Safe spot popup overlaps route cards
   - **Fix:** Adjust z-index
```

**Deliverable:** All major features tested and bugs documented

---

## Phase 3.5: UI Polish (1 hour)

### Tasks for Developer B

**3.5.1 Loading States**

```jsx
// Add to Home.jsx
{loading && (
  <div className="absolute inset-0 bg-black bg-opacity-50 z-[2000] flex items-center justify-center">
    <div className="bg-white p-6 rounded-lg">
      <div className="loading loading-spinner loading-lg"></div>
      <p className="mt-4">Calculating safest routes...</p>
    </div>
  </div>
)}
```

**3.5.2 Empty States**

```jsx
// When no routes found
{routes.length === 0 && !loading && (
  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
    <h2 className="text-2xl font-bold mb-2">Find Your Safe Route</h2>
    <p className="text-gray-600">Enter your destination to get started</p>
  </div>
)}
```

**3.5.3 Error Handling**

```jsx
const [error, setError] = useState(null);

// In handleSearch
catch (error) {
  setError('Failed to calculate routes. Please try again.');
  setTimeout(() => setError(null), 5000);
}

// Display error
{error && (
  <div className="alert alert-error fixed top-4 right-4 z-[2000] w-96">
    <span>{error}</span>
  </div>
)}
```

**3.5.4 Accessibility Improvements**

```jsx
// Add ARIA labels
<button aria-label="Find safe routes" ...>
<input aria-label="Starting point" ...>
<div role="navigation" ...>
```

**Deliverable:** Polished UI with loading, empty, and error states

---

## PHASE 3 DELIVERABLES CHECKLIST

- [ ] Danger heatmap displays and toggles
- [ ] Safe spot markers with custom icons
- [ ] Buddy alert SMS sends successfully
- [ ] All APIs tested with unit tests
- [ ] Frontend E2E scenarios passing
- [ ] Mobile responsive on 375px screen
- [ ] Loading/error states implemented
- [ ] Bugs documented and prioritized

**End of Day 3 Status:** All 4 core features complete, app is testable

---

# PHASE 4: POLISH & SUBMISSION (Day 4 - March 24)

**Goal:** Final polish, create submission materials, deploy, submit  
**Duration:** 8 hours  
**Blocker Risk:** Critical (submission deadline is HARD)

---

## Phase 4.1: Onboarding & Tutorial (1 hour)

### Tasks for Developer B

**4.1.1 Onboarding Component (src/components/Onboarding.jsx)**

```jsx
import { useState, useEffect } from 'react';

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Show onboarding only on first visit
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const slides = [
    {
      title: 'See Which Routes Are Safest',
      description: 'Get AI-calculated safety scores for every walking route',
      icon: '🛣️'
    },
    {
      title: 'Know Where Danger Zones Are',
      description: 'View real-time crime heatmaps based on recent incidents',
      icon: '🔥'
    },
    {
      title: 'Find Safe Spots Nearby',
      description: '24/7 stores, police stations, and security posts on your route',
      icon: '🏪'
    },
    {
      title: 'Alert Trusted Contacts',
      description: 'One-tap emergency SMS with your location and route',
      icon: '🚨'
    }
  ];

  const handleComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
  };

  if (!showOnboarding) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
        <div className="text-center">
          <div className="text-6xl mb-4">{slides[currentSlide].icon}</div>
          <h2 className="text-2xl font-bold mb-2">{slides[currentSlide].title}</h2>
          <p className="text-gray-600 mb-6">{slides[currentSlide].description}</p>
        </div>

        <div className="flex justify-center gap-2 mb-4">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${
                index === currentSlide ? 'bg-primary' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        <div className="flex justify-between">
          <button
            className="btn btn-ghost"
            onClick={handleComplete}
          >
            Skip
          </button>
          
          {currentSlide < slides.length - 1 ? (
            <button
              className="btn btn-primary"
              onClick={() => setCurrentSlide(currentSlide + 1)}
            >
              Next
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleComplete}
            >
              Get Started
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

**4.1.2 Integrate into Home.jsx**

```jsx
import Onboarding from '../components/Onboarding';

// At top of component
return (
  <>
    <Onboarding />
    <div className="relative h-screen">
      {/* ... rest of app ... */}
    </div>
  </>
);
```

**Deliverable:** First-time user tutorial

---

## Phase 4.2: Documentation (1.5 hours)

### Tasks for Developer C

**4.2.1 README.md**

```markdown
# SafeRoute

AI-powered walking navigation that routes women through safer streets in Metro Manila.

## 🎯 Features

- **Safety-Scored Routes**: AI-calculated safety scores (0-100) for walking routes
- **Danger Heatmap**: Real-time crime visualization based on incident data
- **Safe Spots**: 50+ verified 24/7 stores, police stations, security posts
- **Buddy Alert**: One-tap emergency SMS to trusted contacts

## 🚀 Quick Start

### Frontend

```bash
cd saferoute-frontend
npm install
npm run dev
```

Visit `http://localhost:5173`

### Backend

```bash
cd saferoute-backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Visit `http://localhost:8000/docs` for API documentation

## 🔧 Environment Variables

### Frontend (.env)
```
VITE_API_URL=https://saferoute-backend.railway.app
```

### Backend (.env)
```
DATABASE_URL=postgresql://user:pass@host:port/db
OPENROUTESERVICE_API_KEY=your_key
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
```

## 📦 Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Leaflet.js
- **Backend**: FastAPI, PostgreSQL, SQLAlchemy
- **ML**: Scikit-learn (Random Forest)
- **APIs**: OpenRouteService (routing), Twilio (SMS)
- **Hosting**: Vercel (frontend), Railway (backend)

## 🧪 Testing

```bash
# Backend tests
cd saferoute-backend
pytest tests/

# Frontend (manual)
npm run build
npm run preview
```

## 📊 Data Sources

- Crime incidents: Synthetic data (500+ incidents for demo)
- Safe spots: Scraped from Google Maps + PNP website
- Routing: OpenRouteService API

## 🏆 AIRA Youth Challenge 2026

This project was built for the AIRA Youth Challenge 2026, demonstrating how AI can improve women's safety in urban environments.

## 👥 Team

- Troy - Full-stack Lead
- [Name] - Frontend Developer
- [Name] - Data & DevOps

## 📄 License

MIT License - See LICENSE file

## 🔗 Links

- Live Demo: https://saferoute.vercel.app
- Video: [YouTube link]
- Slides: [Google Drive link]
```

**4.2.2 API Documentation (docs/API.md)**

```markdown
# SafeRoute API Documentation

Base URL: `https://saferoute-backend.railway.app`

## Endpoints

### POST /api/calculate-route

Calculate walking routes with safety scores.

**Request:**
```json
{
  "start_lat": 14.6402,
  "start_lng": 121.0720,
  "end_lat": 14.6504,
  "end_lng": 121.0506,
  "time_of_day": 14
}
```

**Response:**
```json
[
  {
    "route_id": 1,
    "geometry": [[121.072, 14.6402], ...],
    "distance_km": 2.3,
    "duration_minutes": 28,
    "safety_score": 85.2,
    "color": "green"
  }
]
```

### GET /api/danger-heatmap

Get crime heatmap data.

**Query Params:**
- `time_of_day` (optional): Hour (0-23)

**Response:**
```json
[
  {
    "lat": 14.6507,
    "lng": 121.1029,
    "intensity": 0.8
  }
]
```

### GET /api/safe-spots

Get safe locations within radius.

**Query Params:**
- `lat`: User latitude
- `lng`: User longitude
- `radius_km` (optional): Search radius (default 2km)

**Response:**
```json
[
  {
    "spot_id": "1",
    "name": "7-Eleven Katipunan",
    "type": "convenience_store",
    "lat": 14.6402,
    "lng": 121.0720,
    "hours": "24/7",
    "address": "Katipunan Ave",
    "distance_km": 0.5
  }
]
```

### POST /api/send-alert

Send emergency SMS to buddy.

**Request:**
```json
{
  "user_name": "Maria Santos",
  "current_lat": 14.6507,
  "current_lng": 121.1029,
  "current_address": "UP Diliman",
  "destination": "QMC",
  "buddy_phone": "+639123456789"
}
```

**Response:**
```json
{
  "success": true,
  "message_sid": "SM...",
  "tracking_url": "https://saferoute.vercel.app/track/abc123"
}
```
```

**4.2.3 License File**

```markdown
MIT License

Copyright (c) 2026 SafeRoute Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

**Deliverable:** Complete documentation package

---

## Phase 4.3: 3-Minute Pitch Video (2 hours)

### Tasks for Developer C

**4.3.1 Video Production Checklist**

**Pre-production (30 min):**
- [ ] Write script (use template from Appendix B in PRD)
- [ ] Prepare screen recordings
- [ ] Gather B-roll footage/images
- [ ] Set up recording environment (quiet room, good lighting)

**Production (60 min):**
- [ ] Record talking head segments
- [ ] Record screen demo:
  - Search for route
  - Show heatmap toggle
  - Click safe spot
  - Send buddy alert
- [ ] Capture additional B-roll if needed

**Post-production (30 min):**
- [ ] Edit in CapCut/DaVinci Resolve (free)
- [ ] Add background music (royalty-free from YouTube Audio Library)
- [ ] Add captions (Tagalog subtitles)
- [ ] Export as MP4, 1080p, <500MB

**4.3.2 Recommended Tools**

- **Screen Recording**: OBS Studio (free)
- **Video Editing**: CapCut (free, easy) or DaVinci Resolve (free, pro)
- **Music**: YouTube Audio Library, Epidemic Sound (free tier)
- **Captions**: CapCut auto-captions or Subtitle Edit

**4.3.3 Script Example (30-second segment)**

> "Here's how it works. I enter my starting point and destination. SafeRoute shows me three routes—not just the fastest, but the safest. This green route has a safety score of 85—well-lit streets, low crime. The yellow route is 72—moderate risk. And this red one? Only 45—high-crime area at night. The choice is clear."

**Deliverable:** 3-minute video exported and uploaded

---

## Phase 4.4: 5-Page PDF Proposal (1.5 hours)

### Tasks for Developer C

**4.4.1 PDF Structure**

**Page 1: Cover + Problem**
- Title: SafeRoute
- Tagline: "AI-Powered Safety Navigation for Women in Metro Manila"
- Team logo
- Problem statement with statistics
- Target user personas

**Page 2: Solution + Features**
- Screenshots of app
- 4 core features with icons
- How it works (3-step diagram)

**Page 3: Technical Architecture**
- System diagram (frontend, backend, APIs, database)
- Tech stack
- ML model explanation

**Page 4: Impact + Outreach**
- Addressable market (2.1M smartphone users)
- AI awareness strategy
- Partnership plan (universities, LGUs)
- Testimonials (mock for now)

**Page 5: Roadmap + Budget**
- 3-phase roadmap (MVP → Pilot → Public Launch)
- Budget breakdown (emphasize ₱0 cost)
- Call to action
- Team contact info

**4.4.2 Design Tool**

Use **Canva** (free tier):
- Template: "Tech Startup Pitch Deck"
- Export as PDF
- Ensure <10MB file size

**4.4.3 Design Checklist**

- [ ] Arial font, size 12
- [ ] 1.5 line spacing
- [ ] High-quality screenshots (1920x1080 → resized)
- [ ] Consistent color scheme (match app)
- [ ] No spelling/grammar errors

**Deliverable:** 5-page PDF proposal <10MB

---

## Phase 4.5: Final Deployment & Testing (1 hour)

### Tasks for Developer A & B

**4.5.1 Production Deployment Checklist**

**Backend (Railway):**
- [ ] All environment variables set
- [ ] Database seeded with data
- [ ] Health check endpoint returns 200
- [ ] Swagger docs accessible
- [ ] CORS configured for Vercel domain

```bash
# Test production backend
curl https://saferoute-backend.railway.app/
curl https://saferoute-backend.railway.app/docs
```

**Frontend (Vercel):**
- [ ] Environment variable `VITE_API_URL` set
- [ ] Build successful (no errors)
- [ ] Custom domain linked (optional)
- [ ] HTTPS enabled
- [ ] Mobile responsive

```bash
# Test production frontend
npm run build
# Check dist/ folder size < 2MB

vercel --prod
```

**4.5.2 End-to-End Production Test**

Test on **actual mobile device**:
1. Open https://saferoute.vercel.app
2. Complete onboarding
3. Search for route (use real Manila addresses)
4. Select route, verify map display
5. Toggle heatmap on/off
6. Click safe spot marker
7. Send test buddy alert (use own phone number)
8. Verify SMS received

**4.5.3 Performance Check**

```bash
# Lighthouse audit (aim for 70+ on all metrics)
npm install -g lighthouse
lighthouse https://saferoute.vercel.app --view
```

**Metrics to check:**
- Performance: >70
- Accessibility: >90
- Best Practices: >80
- SEO: >80

**Deliverable:** Production app fully functional

---

## Phase 4.6: Submission (1 hour)

### Tasks for Team Lead (Troy)

**4.6.1 Gather All Materials**

Checklist:
- [ ] 5-page PDF proposal (<10MB)
- [ ] 3-minute video MP4 (<500MB)
- [ ] Live demo URL (https://saferoute.vercel.app)
- [ ] GitHub repo URL (public, with README)
- [ ] Team information form filled

**4.6.2 AIRA Portal Submission**

1. Go to AIRA Youth Challenge submission portal
2. Create account / login
3. Fill team information:
   - Team name: SafeRoute Team
   - University: Polytechnic University of the Philippines
   - Country: Philippines
   - Team members: (all from same country, at least 1 citizen)
4. Upload PDF proposal
5. Upload video (or provide YouTube link)
6. Enter live demo URL
7. Enter GitHub repo URL
8. Review all information
9. **Submit before March 24, 11:59pm GMT+8**
10. Screenshot confirmation page
11. Save confirmation email

**4.6.3 Backup Plan**

If submission portal has issues:
- Have PDF/video on Google Drive (shareable link)
- Prepare email with all materials
- Contact AIRA support immediately

**4.6.4 Post-Submission**

- [ ] Tweet about submission (tag @AIRAChallenge)
- [ ] Post on LinkedIn
- [ ] Share in PUP community groups
- [ ] Thank team members

**Deliverable:** Submission confirmed before deadline

---

## PHASE 4 DELIVERABLES CHECKLIST

- [ ] Onboarding tutorial implemented
- [ ] README.md complete with setup instructions
- [ ] API documentation written
- [ ] 3-minute pitch video recorded and edited
- [ ] 5-page PDF proposal designed
- [ ] Production deployment successful
- [ ] End-to-end test passed on mobile
- [ ] Lighthouse score >70
- [ ] All materials submitted to AIRA portal
- [ ] Confirmation screenshot saved

**End of Day 4 Status:** Submission complete, competition entry live

---

# RISK MITIGATION STRATEGIES

## High-Risk Items

### Risk 1: OpenRouteService API Rate Limit (2000/day)
**Mitigation:**
- Cache route calculations in localStorage
- Implement request throttling
- Fall back to direct polyline if quota exceeded

### Risk 2: Twilio Credits Run Out
**Mitigation:**
- Use test phone numbers
- Limit demo to 50 SMS sends
- Display "Demo Mode: SMS not sent" after quota

### Risk 3: Database Crashes on Railway
**Mitigation:**
- Export database backup daily
- Have CSV fallback for critical data
- Document restore process

### Risk 4: Vercel Deployment Fails
**Mitigation:**
- Test build locally first
- Have GitHub Pages as backup hosting
- Keep dist/ folder in repo

### Risk 5: Video Rendering Takes Too Long
**Mitigation:**
- Start video production on Day 3
- Use template to speed up editing
- Have team member B-roll ready

---

# DAILY STANDUPS

## Day 1 Standup (End of Day)

**Completed:**
- Infrastructure setup
- Database seeded
- API scaffolding

**Blockers:**
- None

**Tomorrow:**
- Core routing feature
- Map visualization

---

## Day 2 Standup (End of Day)

**Completed:**
- Route calculation working
- Map displays routes
- Route selection functional

**Blockers:**
- OpenRouteService occasionally slow (>5s)

**Tomorrow:**
- Heatmap + safe spots
- Buddy alert

---

## Day 3 Standup (End of Day)

**Completed:**
- All 4 features done
- Testing complete
- Bugs documented

**Blockers:**
- Need more test devices for mobile testing

**Tomorrow:**
- Polish + documentation
- Video + PDF
- Submission

---

## Day 4 Standup (Midday Check)

**Completed:**
- Onboarding done
- Documentation 80% done

**In Progress:**
- Video editing
- PDF design

**On Track:**
- Submission by deadline ✓

---

# SUCCESS METRICS (POST-SUBMISSION)

## Competition Goals
- [ ] Submitted before deadline (March 24, 11:59pm)
- [ ] All 4 required materials included
- [ ] Demo is functional and accessible
- [ ] Video is under 3 minutes
- [ ] PDF is exactly 5 pages

## Product Goals
- [ ] 100+ women test the demo during competition week
- [ ] 80%+ say "I would use this" in survey
- [ ] 10+ testimonials collected
- [ ] Media coverage (at least 1 university publication)

## Team Goals
- [ ] All team members contributed
- [ ] Learning documented (what worked, what didn't)
- [ ] Post-competition roadmap planned
- [ ] Codebase is maintainable for future work

---

# APPENDIX: TROUBLESHOOTING GUIDE

## Backend Issues

**Problem: Database connection fails**
```bash
# Check DATABASE_URL format
echo $DATABASE_URL
# Should be: postgresql://user:pass@host:port/db

# Test connection
psql $DATABASE_URL
```

**Problem: OpenRouteService returns 401**
```bash
# Verify API key
echo $OPENROUTESERVICE_API_KEY

# Test with curl
curl -X POST https://api.openrouteservice.org/v2/directions/foot-walking \
  -H "Authorization: $OPENROUTESERVICE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"coordinates":[[121.072,14.6402],[121.0506,14.6504]]}'
```

**Problem: Twilio SMS not sending**
```bash
# Check credentials
twilio phone-numbers:list

# Test SMS
twilio api:core:messages:create \
  --from $TWILIO_PHONE_NUMBER \
  --to +639XXXXXXXXX \
  --body "Test from SafeRoute"
```

---

## Frontend Issues

**Problem: Map not loading**
```javascript
// Check Leaflet CSS imported
import 'leaflet/dist/leaflet.css';

// Check React-Leaflet version compatibility
npm list react-leaflet leaflet
```

**Problem: Routes not displaying**
```javascript
// Debug: Log route data
console.log('Routes:', routes);

// Check geometry format: [[lng, lat], ...]
console.log('First coordinate:', routes[0].geometry[0]);
```

**Problem: API calls failing (CORS)**
```javascript
// Check API_URL in .env
console.log(import.meta.env.VITE_API_URL);

// Verify CORS headers in backend
// Should include: https://saferoute.vercel.app
```

---

## Deployment Issues

**Problem: Vercel build fails**
```bash
# Check build locally first
npm run build

# Check for errors in build log
# Common issue: missing environment variables
```

**Problem: Railway backend not responding**
```bash
# Check logs
railway logs

# Restart service
railway up
```

**Problem: Database not seeded**
```bash
# Run seed script manually on Railway
railway run python scripts/seed_database.py
```

---

# FINAL NOTES

## What We Built

A functional MVP demonstrating:
- AI-powered safety routing
- Real-time danger visualization
- Emergency communication system
- User-friendly interface

## What We Learned

- Rapid prototyping techniques
- API integration strategies
- Frontend/backend coordination
- Competition submission processes

## What's Next

- University pilot program (April-June 2026)
- User feedback collection
- Feature expansion based on real user needs
- Partnership outreach

---

**Good luck, Team SafeRoute! 🚀**

**Remember:** The goal is not perfection, it's demonstrating feasibility and impact. Ship it! 

---

**END OF DEVELOPMENT PLAN**
