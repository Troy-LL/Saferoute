# SafeRoute - Product Requirements Document (MVP)

**Document Version:** 1.0  
**Last Updated:** March 21, 2026  
**Project Timeline:** March 21-24, 2026 (4 days)  
**Competition:** AIRA Youth Challenge 2026  
**Team:** Polytechnic University of the Philippines

---

## 1. EXECUTIVE SUMMARY

### Product Overview
**Product Name:** SafeRoute  
**Version:** MVP v1.0 (Competition Demo)  
**Budget:** ₱0 (100% free/open-source)  
**Target:** AIRA Youth Challenge submission + functional demo

### One-Sentence Pitch
AI-powered walking navigation that routes women through safer streets in Metro Manila based on crime data, lighting conditions, and time of day.

### Key Objectives
- Build working MVP in 4 days (March 21-24, 2026)
- Submit to AIRA Youth Challenge before deadline (March 24, 11:59pm GMT+8)
- Demonstrate feasibility of AI-powered safety routing
- Validate user need through demo and feedback

---

## 2. PROBLEM STATEMENT

### Background
Women in the Philippines, especially in Metro Manila, face constant safety concerns when commuting on foot. This fear significantly impacts their mobility, limiting access to education, work opportunities, and social activities.

### User Pain Points

1. **No Safety-Focused Navigation**
   - Google Maps and Waze optimize for speed, not safety
   - No way to know which streets are dangerous before walking them
   - Users must rely on word-of-mouth or personal experience

2. **Fear of Harassment and Assault**
   - 1 in 3 women in Metro Manila report experiencing harassment while commuting
   - Fear intensifies at night or in unfamiliar areas
   - No preventive tools, only reactive (panic buttons)

3. **Lack of Situational Awareness**
   - Users don't know where safe spots (stores, police stations) are located
   - Can't predict danger levels at different times of day
   - No way to share location/route with trusted contacts easily

4. **Limited Mobility and Opportunity**
   - Fear prevents women from taking certain jobs (night shifts)
   - Limits educational opportunities (evening classes)
   - Reduces social engagement and independence

### Target Users (MVP)

**Primary Persona: "Maria the College Student"**
- Age: 18-25
- Location: Metro Manila (QC, Manila, Makati)
- Occupation: University student
- Commute: Walks to/from campus, evening classes
- Pain: Feels unsafe walking alone at night
- Tech: Smartphone user, comfortable with apps

**Secondary Persona: "Ana the Night Shift Worker"**
- Age: 25-35
- Location: Metro Manila
- Occupation: BPO employee, call center agent
- Commute: Walks from office to transport hub (11pm-2am)
- Pain: Navigating dark streets after midnight
- Tech: Smartphone user, needs reliable tools

**Tertiary Persona: "Joy the Young Professional"**
- Age: 22-30
- Location: Metro Manila
- Occupation: Office worker, freelancer
- Commute: Walks for errands, meetings, gym
- Pain: Unfamiliar areas during business trips
- Tech: Power user, early adopter

### Market Validation
- **Target Market Size:** 6.2M women aged 18-35 in Metro Manila
- **Addressable Market:** 2.1M smartphone users who walk regularly
- **Initial Target:** 1,000 university students (3 campuses)

### Success Metrics (MVP)
- 100+ women test the demo during competition week
- 80%+ say "I would use this" in post-demo survey
- 10+ testimonials collected for outreach video
- Successfully submitted to AIRA Youth Challenge on time

---

## 3. MVP SCOPE

### Must-Have Features (Core MVP)

#### Feature 1: Safety-Scored Routes
**Description:** User enters start and destination points, app displays 2-3 route options with AI-calculated safety scores (0-100).

**User Story:**
> "As a female student walking home from evening class, I want to see which route is safest, so that I can avoid dangerous streets and feel secure."

**Acceptance Criteria:**
- ✅ Routes display on map with color coding (green = safe 80+, yellow = moderate 50-79, red = risky <50)
- ✅ Each route shows: distance (km), duration (minutes), safety score (0-100)
- ✅ User can tap route to see detailed path
- ✅ User can select preferred route to begin navigation
- ✅ Routes calculate in <3 seconds

**Technical Implementation:**
- Frontend: React component with Leaflet.js map
- Backend: FastAPI endpoint `/api/calculate-route`
- API: OpenRouteService for routing, custom ML model for safety scoring
- Data: Crime incidents, lighting scores, time of day

---

#### Feature 2: Danger Heatmap
**Description:** Interactive map overlay showing dangerous areas (red zones) based on aggregated crime data and environmental factors.

**User Story:**
> "As a night shift worker, I want to know why certain areas are flagged as dangerous, so that I can make informed decisions about my route."

**Acceptance Criteria:**
- ✅ Heat map overlay on main map view
- ✅ Updates based on time of day (different danger zones at 2pm vs 10pm)
- ✅ Users can tap zones to see "Why is this dangerous?" popup with details
- ✅ Popup shows: number of incidents, types (robbery, harassment), timeframe
- ✅ Visual intensity correlates with danger level (darker red = more dangerous)

**Technical Implementation:**
- Frontend: Leaflet.js heatmap layer
- Backend: FastAPI endpoint `/api/danger-heatmap`
- Data: Aggregated crime incidents from database
- Algorithm: Kernel density estimation for heatmap generation

---

#### Feature 3: Safe Spots Markers
**Description:** Map pins showing verified safe locations (24/7 stores, police stations, security posts) within walking distance.

**User Story:**
> "As a woman walking alone at night, I want to know where I can go if I feel unsafe, so that I have escape options mid-route."

**Acceptance Criteria:**
- ✅ At least 50 safe spots pre-loaded in common areas (QC, Manila, Makati)
- ✅ Markers display with distinct icons (🏪 store, 🚔 police, 💂 security)
- ✅ Users can click marker to see: name, type, hours, distance from current location
- ✅ Safe spots update based on map viewport (only show nearby locations)
- ✅ "Find Nearest Safe Spot" button shows closest option with directions

**Technical Implementation:**
- Frontend: Leaflet.js marker layer
- Backend: FastAPI endpoint `/api/safe-spots?lat=X&lng=Y&radius_km=2`
- Data: Curated database of verified safe locations
- Sources: Google Maps (7-Eleven, McDonald's), PNP website (police stations)

---

#### Feature 4: Buddy Alert System
**Description:** One-tap emergency button that sends SMS alert to pre-configured trusted contacts with current location and planned route.

**User Story:**
> "As a woman walking alone at night, I want to quickly alert someone if I feel unsafe, so that someone knows my location and can check on me."

**Acceptance Criteria:**
- ✅ User can pre-set 1-3 emergency contacts in settings
- ✅ Big, prominent "Alert Buddy" button visible during navigation
- ✅ SMS includes: user name, current location (address + coordinates), destination, ETA, tracking link
- ✅ Alert sends in <5 seconds
- ✅ Confirmation message appears after successful send
- ✅ Works even with low data connection (SMS fallback)

**SMS Template:**
```
SafeRoute Alert: [Name] is walking from [Start Address] to [End Address]. 
Current location: [Address] (14.6507, 121.1029)
ETA: 25 minutes
Track: https://saferoute-asean.vercel.app/track/abc123
```

**Technical Implementation:**
- Frontend: React component with button + contact management
- Backend: FastAPI endpoint `/api/send-alert`
- SMS Provider: Twilio API (free trial: $15 credit ~100 SMS)
- Database: Store user contacts in PostgreSQL

---

### Nice-to-Have Features (Post-MVP)

These features are valuable but not required for competition submission:

- ❌ **Real-Time Tracking:** Buddy can follow user's location live on map
- ❌ **Voice Navigation:** Audio directions ("Turn left in 50m, well-lit street")
- ❌ **Community Reporting:** Users can mark areas as unsafe in real-time
- ❌ **Historical Trends:** Graph showing crime trends over time
- ❌ **Offline Mode:** Download maps and data for offline use
- ❌ **Ride-Hailing Integration:** Compare walking vs Grab safety/cost
- ❌ **User Accounts:** Save favorite routes, manage contacts persistently
- ❌ **Multiple Languages:** Tagalog, Bisaya interface (English only for MVP)

---

## 4. USER STORIES & FLOWS

### Epic 1: First-Time User Experience

**User Story 1.1: Onboarding**
> "As a first-time user, I want to understand what SafeRoute does and how it helps me, so that I can decide if it's useful."

**User Flow:**
1. User opens app (web URL)
2. Sees splash screen with tagline: "Walk safer. Walk smarter."
3. Clicks "Get Started" → Brief 3-slide tutorial:
   - Slide 1: "See which routes are safest"
   - Slide 2: "Know where safe spots are"
   - Slide 3: "Alert trusted contacts instantly"
4. Clicks "Start Using SafeRoute" → Main map view

**Design Notes:**
- Tutorial is skippable (small "Skip" link)
- Tutorial only shows once (use localStorage to track)
- Minimal text, focus on visuals

---

**User Story 1.2: Granting Permissions**
> "As a user, I want to allow location access so the app can show my current position and calculate routes."

**User Flow:**
1. App requests location permission via browser prompt
2. If allowed → Map centers on user's location, shows "You are here" marker
3. If denied → Show message: "For best experience, enable location. You can still search addresses manually."
4. User can retry permission from settings

**Edge Cases:**
- No location permission: Allow manual address entry
- Location unavailable: Default to Manila City Hall coordinates

---

### Epic 2: Planning a Safe Route

**User Story 2.1: Searching for Destination**
> "As a user, I want to enter my destination quickly, so that I can see route options."

**User Flow:**
1. User taps search bar at top: "Where to?"
2. Begins typing destination (e.g., "UP Diliman")
3. Autocomplete suggestions appear (powered by OpenStreetMap Nominatim)
4. User selects destination from suggestions OR
5. User taps map to drop a pin as destination
6. App automatically calculates routes using current location as start

**Design Notes:**
- Search supports:
  - Street addresses: "123 Katipunan Ave, QC"
  - Landmarks: "UP Diliman", "SM North EDSA"
  - Coordinates: "14.6507, 121.1029"
- Recent searches saved (up to 5)
- Favorites: "Home", "School", "Work" (set in settings)

---

**User Story 2.2: Comparing Route Options**
> "As a user, I want to see multiple routes with safety scores, so that I can choose based on my priorities (speed vs safety)."

**User Flow:**
1. After entering destination, user sees "Calculating routes..." loader
2. Map shows 2-3 routes as colored lines:
   - Route 1 (Green): "Safest Route" - 92/100 safety, 3.2km, 38min
   - Route 2 (Yellow): "Balanced Route" - 78/100 safety, 2.8km, 32min
   - Route 3 (Red): "Fastest Route" - 65/100 safety, 2.1km, 24min
3. Bottom sheet slides up showing route cards with details
4. User can:
   - Tap route card to highlight on map
   - Swipe between routes to compare
   - Tap "View Details" to see why score is X/100

**Route Card Contents:**
```
┌─────────────────────────────┐
│ ✅ Safest Route             │
│ Safety: 92/100 🟢           │
│ 3.2 km • 38 min             │
│ ━━━━━━━━━━━━━━━━━━━         │
│ ✓ Well-lit main roads       │
│ ✓ 3 safe spots along route  │
│ ⚠ Avoid 1 poorly lit section│
│ [View on Map] [Select]      │
└─────────────────────────────┘
```

---

**User Story 2.3: Understanding Danger Zones**
> "As a user, I want to know WHY certain areas are marked as dangerous, so that I can make informed decisions."

**User Flow:**
1. User views map with heatmap overlay showing red zones
2. User taps on red zone
3. Popup appears:
   ```
   ⚠️ High Risk Area
   
   3 robbery incidents reported here
   • Jan 15, 2025: Snatching at 8:30pm
   • Feb 3, 2025: Robbery at 10:15pm
   • Mar 2, 2025: Harassment at 9:00pm
   
   Contributing factors:
   • Poor street lighting
   • Low foot traffic after 8pm
   • Narrow side street
   
   [Avoid this area] [I understand]
   ```
4. User can choose to avoid or proceed with caution

**Design Notes:**
- Incidents shown are anonymized (no victim details)
- Source attribution: "Data from Rappler, Inquirer"
- Option to report inaccuracy: "This area is safe now"

---

### Epic 3: Active Navigation

**User Story 3.1: Starting Navigation**
> "As a user, I want to begin walking my chosen route with guidance, so that I stay on the safe path."

**User Flow:**
1. User selects route → Taps "Start Navigation"
2. App asks: "Add emergency contacts for this trip?"
   - If yes → Goes to contact selection screen
   - If no → Proceeds to navigation
3. Navigation screen appears:
   - Map centered on user location
   - Route highlighted in bold
   - Next turn instruction at bottom
   - "Alert Buddy" button prominent at top

**Navigation Screen Elements:**
```
┌─────────────────────────────────────┐
│ 🚨 ALERT BUDDY         [X] Stop     │
├─────────────────────────────────────┤
│                                     │
│    ╔═══════════════════════╗       │
│    ║ 📍 YOU ARE HERE       ║       │
│    ║ ━━━━━━━━━━━━━━━━━━    ║       │
│    ║                       ║       │
│    ║ 🏪 Safe Spot 0.5km    ║       │
│    ╚═══════════════════════╝       │
│                                     │
│ ⏱️ ETA: 15 minutes                  │
│ 🛡️ Safety: 92/100                   │
│ 📏 Distance left: 1.8 km            │
│                                     │
│ 📍 NEXT: Turn right on Katipunan   │
│    in 150 meters                    │
└─────────────────────────────────────┘
```

---

**User Story 3.2: Sending Buddy Alert**
> "As a user walking alone, I want to instantly alert my trusted contacts if I feel unsafe, so that someone knows where I am."

**User Flow:**
1. While navigating, user feels uncomfortable
2. User taps big red "🚨 ALERT BUDDY" button
3. Confirmation dialog appears:
   ```
   Send alert to:
   ✓ Mom (+639171234567)
   ✓ Best Friend (+639189876543)
   
   Message will include:
   • Your current location
   • Your planned destination
   • Live tracking link
   
   [Cancel] [SEND ALERT]
   ```
4. User taps "SEND ALERT"
5. SMS sent to all selected contacts
6. Success message: "Alert sent to 2 contacts. They can track you."
7. User continues walking with confidence

**SMS Received by Contacts:**
```
SafeRoute Alert: Maria is walking from 
Katipunan Ave to Loyola Heights. 

Current location: Corner Katipunan & Aurora
(14.6507, 121.1029)

ETA: 15 minutes

Track her route: 
https://saferoute-asean.vercel.app/track/abc123

- SafeRoute
```

---

**User Story 3.3: Finding Safe Spot Mid-Route**
> "As a user who feels unsafe mid-route, I want to quickly find the nearest safe spot, so that I can seek refuge."

**User Flow:**
1. While navigating, user feels threatened
2. User taps "Find Nearest Safe Spot" button (or shakes phone twice)
3. App immediately shows:
   ```
   🏪 Nearest Safe Spot
   
   7-Eleven Katipunan Branch
   150 meters away (2 min walk)
   
   Open: 24/7
   
   [Get Directions] [Call 911]
   ```
4. User taps "Get Directions"
5. Route updates to lead to safe spot
6. User walks to safety

**Design Notes:**
- "Call 911" button for emergencies
- Safe spot markers pulse on map to attract attention
- Option to alert buddy: "I'm going to [Safe Spot]"

---

### Epic 4: Post-Walk Experience

**User Story 4.1: Completing Journey**
> "As a user who safely reached destination, I want confirmation that my journey is complete, so that I can dismiss navigation."

**User Flow:**
1. User arrives within 50m of destination
2. App shows celebration screen:
   ```
   🎉 You've Arrived Safely!
   
   Journey Summary:
   • Distance: 3.2 km
   • Time: 37 minutes
   • Safety Score: 92/100
   
   [Rate This Route] [Done]
   ```
3. User taps "Done" → Returns to main map view
4. Optional: User rates route (1-5 stars)

---

**User Story 4.2: Providing Feedback**
> "As a user, I want to rate my experience and report issues, so that the app improves."

**User Flow:**
1. After completing journey, user taps "Rate This Route"
2. Simple feedback form appears:
   ```
   How safe did you feel?
   ⭐⭐⭐⭐⭐ (5 stars)
   
   Any issues to report?
   [ ] Route had poorly lit sections
   [ ] Felt unsafe despite high score
   [ ] Found a new safe spot
   [ ] Other: [text input]
   
   [Skip] [Submit Feedback]
   ```
3. User submits → "Thanks! Your feedback helps us improve."

**Design Notes:**
- Feedback optional, not forced
- Data used to improve ML model
- User can attach photo (e.g., of unlit street)

---

## 5. TECHNICAL ARCHITECTURE

### System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        USER (Mobile/Web)                     │
│                  iOS Safari, Android Chrome                  │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND (React + Vercel)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Leaflet.js  │  │ Route Select │  │ Buddy Alert  │      │
│  │  Map Display │  │  Component   │  │   Button     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Heatmap    │  │  Safe Spots  │  │  Navigation  │      │
│  │   Overlay    │  │   Markers    │  │     View     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────────┬─────────────────────────────────┘
                            │ REST API (JSON)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND (FastAPI + Railway)                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │             API ENDPOINTS                            │   │
│  │  POST /api/calculate-route                          │   │
│  │  GET  /api/safe-spots?lat=X&lng=Y&radius_km=Z       │   │
│  │  POST /api/send-alert                               │   │
│  │  GET  /api/danger-heatmap?bounds=...&time=...       │   │
│  └──────────────────────────────────────────────────────┘   │
│         │                    │                    │          │
│         ▼                    ▼                    ▼          │
│  ┌──────────┐   ┌─────────────────┐   ┌───────────────┐    │
│  │ ML Model │   │ OpenRouteService│   │  Twilio SMS   │    │
│  │(Pickle)  │   │   Routing API   │   │  Integration  │    │
│  │Safety    │   │  (2000 req/day) │   │ ($15 credit)  │    │
│  │Scoring   │   └─────────────────┘   └───────────────┘    │
│  └──────────┘                                                │
└───────────────────────────┬─────────────────────────────────┘
                            │ SQL (PostgreSQL)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              DATABASE (Supabase PostgreSQL)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │crime_incidents│  │  safe_spots  │  │    routes    │      │
│  │              │  │              │  │              │      │
│  │ • id         │  │ • id         │  │ • id         │      │
│  │ • type       │  │ • name       │  │ • geometry   │      │
│  │ • lat/lng    │  │ • type       │  │ • safety_    │      │
│  │ • date       │  │ • lat/lng    │  │   score      │      │
│  │ • source     │  │ • hours      │  │ • distance   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐                                           │
│  │    users     │  (Optional for MVP)                       │
│  │              │                                           │
│  │ • id         │                                           │
│  │ • name       │                                           │
│  │ • phone      │                                           │
│  │ • emergency_ │                                           │
│  │   contacts   │                                           │
│  └──────────────┘                                           │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Frontend (React + Vite)

**Core Technologies:**
- **React 18.2** - UI framework
- **Vite 5.0** - Build tool (faster than Create React App)
- **React Router 6** - Client-side routing

**Mapping & Visualization:**
- **Leaflet.js 1.9** - Interactive maps
- **React-Leaflet 4.2** - React wrapper for Leaflet
- **OpenStreetMap** - Map tiles (free, no API key needed)
- **Leaflet.heat** - Heatmap plugin for danger zones

**UI & Styling:**
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **DaisyUI 4.6** - Pre-built components (buttons, cards, modals)
- **Heroicons** - Icon library
- **Lucide React** - Additional icons

**Data Fetching:**
- **Axios 1.6** - HTTP client for API requests
- **React Query** - Server state management (optional, for caching)

**State Management:**
- **React Context API** - Global state (user location, selected route)
- **localStorage** - Persist settings, recent searches

**Deployment:**
- **Vercel** - Free hosting with automatic deployments from GitHub
  - Unlimited bandwidth
  - Global CDN
  - Automatic HTTPS

---

#### Backend (Python FastAPI)

**Core Technologies:**
- **Python 3.11** - Programming language
- **FastAPI 0.109** - Modern web framework
- **Uvicorn 0.27** - ASGI server
- **Pydantic 2.5** - Data validation

**Database:**
- **Supabase PostgreSQL** - Database hosting (500MB free tier)
- **SQLAlchemy 2.0** - ORM (Object-Relational Mapping)
- **Alembic** - Database migrations

**External APIs:**
- **OpenRouteService** - Route calculation (2,000 requests/day free)
  - Alternatives: OSRM (self-hosted, unlimited)
- **Twilio** - SMS alerts ($15 free credit = ~100 SMS)
  - Alternative: Semaphore (100 SMS/month free for PH)
- **Nominatim** - Address geocoding (OpenStreetMap)

**Machine Learning:**
- **scikit-learn 1.4** - ML library
- **pandas 2.2** - Data manipulation
- **numpy 1.26** - Numerical computing
- **joblib** - Model serialization (pickle alternative)

**Utilities:**
- **python-dotenv** - Environment variables
- **requests** - HTTP library for API calls
- **geopy** - Geographic calculations (distance, etc.)

**Deployment:**
- **Railway** - Free hosting (500 execution hours/month)
  - Automatic deployments from GitHub
  - Built-in PostgreSQL (alternative to Supabase)
  - Free SSL certificates

---

#### Data Sources

**Crime Data:**
- **Primary:** Web scraping from news sites
  - Rappler crime beat section
  - Philippine Daily Inquirer crime reports
  - Manila Bulletin police blotter
- **Method:** BeautifulSoup + Selenium
- **Target:** 100+ incidents from 2023-2025
- **Storage:** PostgreSQL table with lat/lng, type, date

**Street Lighting:**
- **Primary:** OpenStreetMap `lit` tag
  - Query Overpass API for streets with `highway=*` and `lit=yes/no`
- **Secondary:** Manual verification via Google Street View
- **Scoring:** Binary (1.0 = lit, 0.0 = unlit) or gradient based on lamp density

**Safe Spots:**
- **Primary:** Manual curation
  - 7-Eleven stores (Google Maps API)
  - McDonald's, Jollibee 24hr locations
  - Police stations (PNP website)
  - Barangay halls with security
- **Target:** 50+ spots in QC, Manila, Makati
- **Verification:** Phone calls to confirm 24/7 operation

**Foot Traffic (Proxy):**
- **Method:** POI (Point of Interest) density from OpenStreetMap
  - Count amenities (shops, restaurants) within 100m radius
  - Higher POI count = higher foot traffic assumption
- **Formula:** `foot_traffic_score = min(1.0, poi_count / 10)`

---

### Database Schema (PostgreSQL)

#### Table: `crime_incidents`
Stores reported crime incidents with location and details.

```sql
CREATE TABLE crime_incidents (
  id SERIAL PRIMARY KEY,
  incident_type VARCHAR(100) NOT NULL, -- 'Robbery', 'Harassment', 'Assault', 'Snatching'
  lat FLOAT NOT NULL,
  lng FLOAT NOT NULL,
  date DATE NOT NULL,
  time TIME, -- Time of incident (if available)
  source VARCHAR(255), -- 'Rappler', 'Inquirer', 'User Report'
  description TEXT,
  verified BOOLEAN DEFAULT FALSE, -- TRUE if from official source
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_crime_location ON crime_incidents USING GIST (
  ll_to_earth(lat, lng)
);
CREATE INDEX idx_crime_date ON crime_incidents(date DESC);
```

**Sample Data:**
```sql
INSERT INTO crime_incidents (incident_type, lat, lng, date, time, source, description) VALUES
('Robbery', 14.6507, 121.1029, '2025-02-15', '20:30:00', 'Rappler', 'Snatching incident on Katipunan Ave'),
('Harassment', 14.6385, 121.0774, '2025-03-02', '21:15:00', 'Inquirer', 'Woman harassed near UP campus'),
('Assault', 14.6412, 121.0801, '2025-01-20', '22:00:00', 'Manila Bulletin', 'Assault reported on side street');
```

---

#### Table: `safe_spots`
Stores verified safe locations where users can seek refuge.

```sql
CREATE TABLE safe_spots (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- '7-Eleven', 'Police Station', 'Security Guard', 'Barangay Hall'
  lat FLOAT NOT NULL,
  lng FLOAT NOT NULL,
  address VARCHAR(500),
  hours VARCHAR(50), -- '24/7', '6:00-22:00', etc.
  phone VARCHAR(20),
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for geographic queries
CREATE INDEX idx_safe_spots_location ON safe_spots USING GIST (
  ll_to_earth(lat, lng)
);
```

**Sample Data:**
```sql
INSERT INTO safe_spots (name, type, lat, lng, address, hours, phone, verified) VALUES
('7-Eleven Katipunan', '7-Eleven', 14.6387, 121.0774, 'Katipunan Ave, QC', '24/7', NULL, TRUE),
('QCPD Station 9', 'Police Station', 14.6412, 121.0801, 'Aurora Blvd, QC', '24/7', '8806-4815', TRUE),
('McDonald''s UP Town Center', 'Restaurant', 14.6505, 121.1020, 'UP Town Center, QC', '24/7', NULL, TRUE);
```

---

#### Table: `routes`
Stores calculated routes for analytics and caching.

```sql
CREATE TABLE routes (
  id SERIAL PRIMARY KEY,
  start_lat FLOAT NOT NULL,
  start_lng FLOAT NOT NULL,
  end_lat FLOAT NOT NULL,
  end_lng FLOAT NOT NULL,
  route_geometry JSONB, -- GeoJSON LineString
  safety_score INT CHECK (safety_score >= 0 AND safety_score <= 100),
  distance_km FLOAT,
  duration_min FLOAT,
  calculated_at TIMESTAMP DEFAULT NOW(),
  time_of_day VARCHAR(10), -- 'morning', 'afternoon', 'evening', 'night'
  day_of_week VARCHAR(10) -- 'Monday', 'Tuesday', etc.
);

-- Index for finding similar routes
CREATE INDEX idx_routes_endpoints ON routes(start_lat, start_lng, end_lat, end_lng);
```

---

#### Table: `users` (Optional for MVP)
Stores user data if we implement accounts.

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  emergency_contacts JSONB, -- [{"name": "Mom", "phone": "+639171234567"}]
  created_at TIMESTAMP DEFAULT NOW(),
  last_active TIMESTAMP
);
```

**Note:** For MVP, we can skip user accounts and use browser localStorage to store emergency contacts. This reduces complexity and avoids GDPR/privacy concerns.

---

### API Endpoints Specification

#### POST `/api/calculate-route`
Calculates 2-3 route options with safety scores.

**Request Body:**
```json
{
  "start": {
    "lat": 14.6507,
    "lng": 121.1029
  },
  "end": {
    "lat": 14.6349,
    "lng": 121.0754
  },
  "time": "22:00", // Optional, defaults to current time (24hr format)
  "day": "Friday" // Optional, defaults to current day
}
```

**Response (200 OK):**
```json
{
  "routes": [
    {
      "id": "route_1",
      "name": "Safest Route",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [121.1029, 14.6507],
          [121.1020, 14.6495],
          ...
        ]
      },
      "safety_score": 92,
      "distance_km": 3.2,
      "duration_min": 38,
      "danger_zones": [
        {
          "lat": 14.645,
          "lng": 121.090,
          "reason": "2 robbery incidents in past 2 months, poorly lit",
          "severity": "medium"
        }
      ],
      "safe_spots_count": 5
    },
    {
      "id": "route_2",
      "name": "Fastest Route",
      "geometry": {...},
      "safety_score": 65,
      "distance_km": 2.1,
      "duration_min": 24,
      "danger_zones": [...],
      "safe_spots_count": 2
    }
  ],
  "calculated_at": "2026-03-21T14:30:00Z"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Invalid coordinates",
  "message": "Latitude must be between -90 and 90"
}
```

**Implementation Notes:**
- Use OpenRouteService to get 2-3 alternative routes
- For each route, calculate safety score using ML model
- Query crime_incidents table for danger zones along route
- Cache results for 15 minutes (same start/end = same routes)

---

#### GET `/api/safe-spots`
Returns safe spots within radius of given location.

**Query Parameters:**
- `lat` (float, required): Latitude
- `lng` (float, required): Longitude
- `radius_km` (float, optional): Search radius in km (default: 2)

**Example Request:**
```
GET /api/safe-spots?lat=14.6507&lng=121.1029&radius_km=1.5
```

**Response (200 OK):**
```json
{
  "safe_spots": [
    {
      "id": 1,
      "name": "7-Eleven Katipunan",
      "type": "7-Eleven",
      "lat": 14.6387,
      "lng": 121.0774,
      "address": "Katipunan Ave, QC",
      "hours": "24/7",
      "phone": null,
      "distance_km": 0.8,
      "bearing": "SW" // Compass direction from user
    },
    {
      "id": 2,
      "name": "QCPD Station 9",
      "type": "Police Station",
      "lat": 14.6412,
      "lng": 121.0801,
      "hours": "24/7",
      "phone": "8806-4815",
      "distance_km": 1.2,
      "bearing": "S"
    }
  ],
  "total": 2
}
```

**Implementation Notes:**
- Use PostGIS distance query for efficient geographic search
- Sort by distance ascending
- Limit to 20 results max

---

#### POST `/api/send-alert`
Sends SMS alert to emergency contacts.

**Request Body:**
```json
{
  "user_name": "Maria",
  "current_location": {
    "lat": 14.6507,
    "lng": 121.1029,
    "address": "Katipunan Ave, Quezon City" // Optional
  },
  "destination": {
    "lat": 14.6349,
    "lng": 121.0754,
    "address": "Loyola Heights, Quezon City" // Optional
  },
  "contacts": [
    "+639171234567",
    "+639189876543"
  ],
  "message": "Feeling unsafe" // Optional custom message
}
```

**Response (200 OK):**
```json
{
  "status": "sent",
  "message": "SMS sent to 2 contacts",
  "sent_to": [
    "+639171234567",
    "+639189876543"
  ],
  "tracking_link": "https://saferoute-asean.vercel.app/track/abc123",
  "timestamp": "2026-03-21T14:30:00Z"
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "error": "SMS send failed",
  "message": "Twilio authentication failed. Check API credentials."
}
```

**SMS Template:**
```
SafeRoute Alert: {user_name} is walking from {start_address} to {end_address}.

Current location: {current_address} ({lat}, {lng})
ETA: {eta_minutes} minutes

{custom_message}

Track route: {tracking_link}

- SafeRoute
```

**Implementation Notes:**
- Validate phone numbers (Philippine format: +639XXXXXXXXX)
- Rate limit: Max 5 alerts per user per hour (prevent spam)
- Log all alerts for analytics
- Consider WhatsApp API as future alternative (free messaging)

---

#### GET `/api/danger-heatmap`
Returns heatmap data for danger zones in given map bounds.

**Query Parameters:**
- `bounds` (string, required): "lat1,lng1,lat2,lng2" (southwest, northeast corners)
- `time` (string, optional): "HH:MM" in 24hr format (default: current time)
- `day` (string, optional): Day of week (default: current day)

**Example Request:**
```
GET /api/danger-heatmap?bounds=14.60,121.05,14.70,121.15&time=22:00&day=Saturday
```

**Response (200 OK):**
```json
{
  "heat_points": [
    {
      "lat": 14.645,
      "lng": 121.090,
      "intensity": 0.9, // 0.0-1.0 scale
      "incident_count": 5,
      "recent_incidents": [
        {
          "type": "Robbery",
          "date": "2025-02-15",
          "time": "20:30"
        }
      ]
    },
    {
      "lat": 14.638,
      "lng": 121.078,
      "intensity": 0.6,
      "incident_count": 2,
      "recent_incidents": [...]
    }
  ],
  "generated_at": "2026-03-21T14:30:00Z",
  "time_context": "Saturday night (22:00)"
}
```

**Implementation Notes:**
- Use kernel density estimation to smooth point data
- Adjust intensity based on time of day (night = higher weight)
- Cache heatmap for 1 hour per time/day combination

---

### Machine Learning Model

#### Purpose
Predict safety score (0-100) for street segments based on environmental and historical factors.

#### Model Type
**Random Forest Regressor** (scikit-learn)

**Why Random Forest?**
- Handles non-linear relationships well
- Works with mixed feature types (numeric, categorical)
- Provides feature importance (explain which factors matter most)
- Fast inference (<50ms)
- No need for feature scaling

**Alternative Considered:** Logistic Regression (simpler, faster, but less accurate)

---

#### Features (Input Variables)

| Feature Name | Type | Range | Description | Source |
|--------------|------|-------|-------------|--------|
| `crime_count` | Integer | 0-20+ | Number of incidents within 500m radius in past 2 years | Database query |
| `lighting_score` | Float | 0.0-1.0 | Street lighting quality (1.0 = well-lit, 0.0 = dark) | OpenStreetMap `lit` tag + manual |
| `time_of_day` | Float | 0.0-1.0 | Encoded time (morning=0.2, afternoon=0.3, evening=0.7, night=1.0) | User input / current time |
| `day_of_week` | Float | 0.0-1.0 | Encoded day (weekday=0.4, weekend=0.6) | User input / current day |
| `foot_traffic` | Float | 0.0-1.0 | Estimated foot traffic (0.0 = empty, 1.0 = crowded) | POI density from OSM |
| `road_type` | Float | 0.0-1.0 | Road classification (main=0.3, side street=0.7, alley=1.0) | OpenStreetMap `highway` tag |

**Feature Engineering:**
```python
def encode_time_of_day(hour):
    """Convert hour (0-23) to danger coefficient"""
    if 6 <= hour < 12:  # Morning
        return 0.2
    elif 12 <= hour < 18:  # Afternoon
        return 0.3
    elif 18 <= hour < 22:  # Evening
        return 0.7
    else:  # Night (22-6)
        return 1.0

def encode_day_of_week(day):
    """Weekends slightly riskier (less people commuting)"""
    weekend_days = ['Saturday', 'Sunday']
    return 0.6 if day in weekend_days else 0.4

def calculate_foot_traffic(lat, lng):
    """Estimate foot traffic from POI density"""
    # Query OSM for amenities within 100m
    poi_count = count_nearby_pois(lat, lng, radius_m=100)
    return min(1.0, poi_count / 10)  # Cap at 1.0
```

---

#### Training Data

**For MVP (Demo):** We'll use **synthetic training data** since we can't collect real user feedback in 4 days.

**Synthetic Data Generation:**
```python
import pandas as pd
import numpy as np

# Generate 500 training samples
np.random.seed(42)
n_samples = 500

data = {
    'crime_count': np.random.poisson(lam=2, size=n_samples),  # Poisson distribution
    'lighting_score': np.random.beta(a=5, b=2, size=n_samples),  # Skewed toward well-lit
    'time_of_day': np.random.choice([0.2, 0.3, 0.7, 1.0], size=n_samples),
    'day_of_week': np.random.choice([0.4, 0.6], size=n_samples),
    'foot_traffic': np.random.beta(a=2, b=2, size=n_samples),
    'road_type': np.random.choice([0.3, 0.5, 0.7, 1.0], size=n_samples)
}

# Calculate target (safety_score) using domain logic
safety_scores = []
for i in range(n_samples):
    # Base score: 100
    score = 100
    
    # Penalize crime (each incident -10 points, max -50)
    score -= min(50, data['crime_count'][i] * 10)
    
    # Penalize poor lighting (-30 points if completely unlit)
    score -= (1 - data['lighting_score'][i]) * 30
    
    # Penalize night time (-20 points at night)
    score -= data['time_of_day'][i] * 20
    
    # Penalize low foot traffic (-15 points if empty)
    score -= (1 - data['foot_traffic'][i]) * 15
    
    # Penalize alleyways (-10 points)
    score -= data['road_type'][i] * 10
    
    # Add noise (±5 points randomness)
    score += np.random.uniform(-5, 5)
    
    # Clamp to 0-100
    score = max(0, min(100, score))
    safety_scores.append(score)

data['safety_score'] = safety_scores
df = pd.DataFrame(data)

# Save for training
df.to_csv('training_data.csv', index=False)
```

**Post-MVP (Real Data):** After launch, collect user feedback:
- "How safe did you feel on this route?" (1-5 stars → convert to 0-100 score)
- Incident reports from users
- Aggregate and retrain model monthly

---

#### Model Training

**Training Script:** `backend/ml/train_model.py`

```python
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
import joblib

# Load training data
df = pd.read_csv('training_data.csv')

# Split features and target
X = df[['crime_count', 'lighting_score', 'time_of_day', 
        'day_of_week', 'foot_traffic', 'road_type']]
y = df['safety_score']

# Split into train and test sets (80/20)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train Random Forest model
model = RandomForestRegressor(
    n_estimators=100,  # 100 decision trees
    max_depth=10,
    min_samples_split=5,
    random_state=42,
    n_jobs=-1  # Use all CPU cores
)

model.fit(X_train, y_train)

# Evaluate on test set
y_pred = model.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print(f"Mean Absolute Error: {mae:.2f}")
print(f"R² Score: {r2:.2f}")

# Feature importance
feature_importance = pd.DataFrame({
    'feature': X.columns,
    'importance': model.feature_importances_
}).sort_values('importance', ascending=False)

print("\nFeature Importance:")
print(feature_importance)

# Save model
joblib.dump(model, 'danger_model.pkl')
print("\nModel saved to danger_model.pkl")
```

**Expected Performance (Synthetic Data):**
- **MAE:** ~8.2 (predictions within ±8 points on average)
- **R² Score:** ~0.87 (explains 87% of variance)

**Feature Importance (Expected):**
1. `crime_count` (~35%) - Most important
2. `lighting_score` (~25%)
3. `time_of_day` (~20%)
4. `foot_traffic` (~10%)
5. `road_type` (~7%)
6. `day_of_week` (~3%)

---

#### Model Inference

**In Production:** Load pickled model in FastAPI backend

```python
import joblib
import numpy as np

# Load model at startup
model = joblib.load('danger_model.pkl')

def predict_safety_score(crime_count, lighting_score, time_of_day, 
                         day_of_week, foot_traffic, road_type):
    """Predict safety score for a street segment"""
    features = np.array([[
        crime_count,
        lighting_score,
        time_of_day,
        day_of_week,
        foot_traffic,
        road_type
    ]])
    
    score = model.predict(features)[0]
    
    # Clamp to 0-100
    score = max(0, min(100, score))
    
    return round(score)

# Example usage
score = predict_safety_score(
    crime_count=2,
    lighting_score=0.8,
    time_of_day=0.7,  # Evening
    day_of_week=0.4,  # Weekday
    foot_traffic=0.6,
    road_type=0.5  # Side street
)
print(f"Safety Score: {score}/100")  # e.g., 78/100
```

**Performance:** <50ms inference time on Railway free tier

---

#### Model Improvements (Future)

Post-MVP enhancements:
1. **Real user feedback:** Replace synthetic data with actual ratings
2. **Weather integration:** Rain/fog reduces visibility → lower scores
3. **Real-time incidents:** API integration with PNP for live crime data
4. **Computer vision:** Analyze Street View images for lighting quality
5. **Ensemble model:** Combine Random Forest + XGBoost for better accuracy
6. **Deep learning:** Use LSTM to capture temporal patterns (crime trends over time)

---

## 6. DEVELOPMENT TIMELINE (4 DAYS)

### Day 1: Friday, March 21 - Foundation

#### Morning Session (9am - 1pm): Setup & Core Infrastructure

**Tasks:**
1. ✅ **Project Setup** (1 hour)
   - Create GitHub repository
   - Initialize React frontend with Vite
   - Initialize FastAPI backend
   - Set up folder structure
   - Create `.env` files

2. ✅ **Deployment Pipeline** (1 hour)
   - Deploy "Hello World" frontend to Vercel
   - Deploy "Hello World" backend to Railway
   - Verify both are accessible online
   - Set up automatic deployments from GitHub

3. ✅ **Map Integration** (2 hours)
   - Install Leaflet.js in React
   - Display basic map with OpenStreetMap tiles
   - Implement user location detection (browser geolocation API)
   - Add "You are here" marker
   - Test on mobile device

**Deliverable:** Map loads on phone, shows current location

---

#### Afternoon Session (2pm - 6pm): Data Collection

**Tasks:**
1. ✅ **Database Setup** (1 hour)
   - Create Supabase account
   - Create PostgreSQL database
   - Run schema SQL to create tables
   - Configure backend connection to Supabase

2. ✅ **Crime Data Scraping** (2 hours)
   - Write Python script to scrape Rappler/Inquirer
   - Extract: incident type, date, location, description
   - Geocode addresses to lat/lng using Nominatim
   - Target: 100+ incidents

3. ✅ **Safe Spots Curation** (1 hour)
   - Manually list 50 safe spots (Google Maps search):
     - 7-Eleven stores in QC, Manila, Makati
     - McDonald's/Jollibee 24hr locations
     - Police stations from PNP website
   - Create CSV with: name, type, lat, lng, hours

**Deliverable:** Database populated with crime data + safe spots

---

#### Evening Session (7pm - 9pm): API Foundation

**Tasks:**
1. ✅ **Safe Spots API** (1 hour)
   - Build `/api/safe-spots` endpoint
   - Implement geographic radius query
   - Test with Postman/curl

2. ✅ **Map Markers** (1 hour)
   - Fetch safe spots from API
   - Display as markers on map
   - Add click popup with details
   - Test on mobile

**Deliverable:** Safe spots show on map, clickable

---

### Day 2: Saturday, March 22 - Core Features

#### Morning Session (9am - 1pm): Routing System

**Tasks:**
1. ✅ **OpenRouteService Integration** (2 hours)
   - Sign up for free API key
   - Test API in Postman (get sample route)
   - Build `/api/calculate-route` endpoint
   - Request 2-3 alternative routes
   - Parse GeoJSON response

2. ✅ **Display Routes on Map** (2 hours)
   - Create route display component
   - Show multiple routes as colored polylines
   - Add route selection UI (bottom sheet with cards)
   - Display distance, duration for each route

**Deliverable:** Routes display on map, user can select

---

#### Afternoon Session (2pm - 6pm): AI Safety Scoring

**Tasks:**
1. ✅ **ML Model Training** (2 hours)
   - Open Google Colab notebook
   - Generate synthetic training data (500 samples)
   - Train Random Forest model
   - Download `danger_model.pkl`

2. ✅ **Safety Score Integration** (2 hours)
   - Load model in FastAPI backend
   - For each route, split into 100m segments
   - Calculate features for each segment
   - Predict safety score, aggregate to route score
   - Return scores in API response

**Deliverable:** Routes show safety scores (0-100)

---

#### Evening Session (7pm - 10pm): Danger Heatmap

**Tasks:**
1. ✅ **Heatmap Data API** (1.5 hours)
   - Build `/api/danger-heatmap` endpoint
   - Query crime incidents in map bounds
   - Use Leaflet.heat plugin for visualization

2. ✅ **Interactive Heatmap** (1.5 hours)
   - Add heatmap overlay to map
   - Make zones clickable (show incident details)
   - Add toggle button to show/hide heatmap

**Deliverable:** Heatmap shows danger zones, tappable

---

### Day 3: Sunday, March 23 - Polish & Demo

#### Morning Session (9am - 12pm): Buddy Alert System

**Tasks:**
1. ✅ **Twilio Setup** (30 min)
   - Create Twilio account (free trial)
   - Get phone number + API credentials
   - Test SMS sending with Python script

2. ✅ **Alert API** (1.5 hours)
   - Build `/api/send-alert` endpoint
   - Implement SMS sending with Twilio
   - Create tracking link (optional: simple map view)

3. ✅ **Frontend Integration** (1 hour)
   - Add "Alert Buddy" button to navigation screen
   - Create contact management UI
   - Test SMS delivery to real phones

**Deliverable:** Buddy alert works, SMS received

---

#### Afternoon Session (1pm - 5pm): UI/UX Polish

**Tasks:**
1. ✅ **Styling & Responsiveness** (2 hours)
   - Apply Tailwind + DaisyUI styling
   - Make all screens mobile-responsive
   - Add loading states, error messages
   - Improve button sizes for touch
   - Add icons (Heroicons)

2. ✅ **User Flow Testing** (2 hours)
   - Test complete flow: search → select route → navigate → alert
   - Fix bugs on actual phone
   - Get 3-5 friends to test, collect feedback
   - Make quick UX improvements

**Deliverable:** App looks polished, works smoothly on phone

---

#### Evening Session (6pm - 10pm): Video Demo

**Tasks:**
1. ✅ **Video Recording** (2 hours)
   - Write video script (see template below)
   - Record screen demos on phone
   - Film talking head segments
   - Capture B-roll (Manila streets, women walking)

2. ✅ **Video Editing** (2 hours)
   - Edit in CapCut/iMovie (free tools)
   - Add background music (copyright-free)
   - Add subtitles (English + Tagalog)
   - Export as MP4, max 3 minutes

**Deliverable:** 3-minute pitch video ready

---

### Day 4: Monday, March 24 - Submission

#### Morning Session (9am - 12pm): Proposal Writing

**Tasks:**
1. ✅ **Proposal Draft** (3 hours)
   - Page 1: Problem statement + statistics
   - Page 2: Solution overview + screenshots
   - Page 3: Technical implementation + architecture
   - Page 4: Impact & scalability
   - Page 5: Outreach plan
   - Format: Arial 12pt, 1.5 spacing, max 5 pages

**Deliverable:** 5-page PDF proposal

---

#### Afternoon Session (1pm - 5pm): Final Testing & Polish

**Tasks:**
1. ✅ **Bug Fixes** (2 hours)
   - Fix any critical bugs found in testing
   - Verify all features work end-to-end
   - Test on different devices/browsers

2. ✅ **Documentation** (1 hour)
   - Update GitHub README
   - Add screenshots to repo
   - Create demo GIF

3. ✅ **Submission Package** (1 hour)
   - Organize files:
     - SafeRoute_PH_Proposal.pdf
     - SafeRoute_PH_Video.mp4
     - Links.txt (live demo URL, GitHub repo)
   - Double-check requirements checklist

**Deliverable:** All files ready for submission

---

#### Evening Session (6pm - 9pm): SUBMIT!

**Tasks:**
1. ✅ **Final Review** (1 hour)
   - Re-read proposal (check for typos)
   - Watch video one last time
   - Test live demo URL in incognito mode
   - Verify GitHub repo is public

2. ✅ **Submission** (30 min)
   - Upload to AIRA portal
   - Fill out submission form
   - Screenshot confirmation page
   - **SUBMIT BEFORE 11:59PM GMT+8**

3. ✅ **Backup** (30 min)
   - Email submission files to team
   - Save local copies
   - Post on social media

**Deliverable:** Submitted on time! 🎉

---

### Daily Standup Template (15 min each morning)

**What did I accomplish yesterday?**
- [List completions]

**What will I work on today?**
- [List tasks]

**Any blockers?**
- [List issues needing help]

**Team commitment:** Everyone codes with at least 1 other person reviewing before merging to main.

---

## 7. SUCCESS METRICS

### Competition Metrics (Primary)

**Submission Quality:**
- ✅ Submitted before deadline (March 24, 11:59pm GMT+8)
- ✅ All required materials included (5-page PDF, 3-min video, live demo link)
- ✅ Zero critical bugs in live demo
- ✅ Video is engaging and clear (no audio issues, good visuals)

**Technical Metrics:**
- ✅ Routes calculate successfully in <3 seconds
- ✅ Map loads on mobile in <2 seconds
- ✅ SMS alerts send in <5 seconds
- ✅ App is mobile responsive (works on iOS Safari, Android Chrome)
- ✅ 95%+ uptime during judging period (March 25 - April 6)

---

### User Validation Metrics (Demo Week)

**Engagement:**
- Target: 100+ women test the app during demo week
- Target: 50+ completed routes
- Target: 10+ buddy alerts sent (test mode)

**Feedback:**
- Target: 80%+ say "I would use this regularly"
- Target: 70%+ feel safer using SafeRoute vs Google Maps
- Target: 10+ written testimonials collected

**Net Promoter Score:**
- Question: "How likely are you to recommend SafeRoute to a friend?" (0-10 scale)
- Target: NPS > 40 (good for MVP)

---

### Impact Metrics (6 Months Post-Launch - For Proposal)

**Adoption:**
- Month 1: 1,000 active users (3 universities)
- Month 3: 5,000 active users
- Month 6: 10,000 active users

**Usage:**
- 10,000+ routes calculated per month
- 500+ buddy alerts sent per month
- 50+ safe spots added by community

**Safety Outcomes:**
- 0 incidents reported by SafeRoute users (validation of routing)
- 90%+ of users report feeling safer
- 5+ testimonials of "avoided dangerous area thanks to SafeRoute"

---

### Business/Sustainability Metrics (Future)

**Partnerships:**
- 3 university partnerships (UP, Ateneo, UST)
- 2 LGU partnerships (Quezon City, Manila)
- 1 corporate sponsor (Globe, Smart, or women-focused brand)

**Media Coverage:**
- 3 news articles (Rappler, Inquirer, TechCrunch Asia)
- 10,000+ social media impressions
- Feature in 1 women's safety campaign

**Scalability:**
- Expand to 2 additional cities (Cebu, Davao)
- Launch iOS app (in addition to web)
- Achieve <₱10,000/month operational cost (sustainable)

---

## 8. RISK MANAGEMENT

### Technical Risks

**Risk 1: OpenRouteService API Quota Exceeded**
- **Impact:** High (can't calculate routes)
- **Probability:** Low (2,000 requests/day should cover demo)
- **Mitigation:** 
  - Cache routes for same start/end points
  - Set up OSRM self-hosted as backup
  - Monitor API usage daily

**Risk 2: ML Model Accuracy Too Low**
- **Impact:** Medium (safety scores seem random)
- **Probability:** Medium (synthetic data may not generalize)
- **Mitigation:**
  - Use rule-based scoring as fallback (main roads = safer)
  - Be transparent in proposal: "Currently using synthetic data, will improve with real feedback"
  - Focus demo on other features (heatmap, safe spots)

**Risk 3: Twilio Credits Run Out**
- **Impact:** Medium (buddy alerts stop working)
- **Probability:** Low ($15 = ~100 SMS should cover demo)
- **Mitigation:**
  - Use Semaphore free tier as backup
  - Limit alerts to 50 during demo week
  - Add warning: "Alerts limited during demo period"

**Risk 4: Frontend Doesn't Work on Mobile**
- **Impact:** High (most users on mobile)
- **Probability:** Low (using responsive framework)
- **Mitigation:**
  - Test on real phones daily from Day 1
  - Use mobile-first design approach
  - Have team test on different devices (iOS, Android)

---

### Data Risks

**Risk 5: Crime Data Hard to Scrape**
- **Impact:** High (no data = no heatmap)
- **Probability:** Medium (websites may block scraping)
- **Mitigation:**
  - Use sample/synthetic data for demo
  - Manual data entry as last resort (50 incidents minimum)
  - Note limitation in proposal: "Data collection in progress"

**Risk 6: Crime Data Inaccurate/Outdated**
- **Impact:** Low (demo only, not production)
- **Probability:** Medium (news reports may not have exact locations)
- **Mitigation:**
  - Verify sample of incidents manually
  - Add disclaimer: "Demo data, not for real-world use yet"
  - In proposal, outline data verification process for production

---

### Competition Risks

**Risk 7: Submission Portal Crashes on Deadline**
- **Impact:** Critical (can't submit)
- **Probability:** Low (but happens sometimes)
- **Mitigation:**
  - **Submit 2 hours early (9:59pm, not 11:59pm)**
  - Screenshot every step of submission
  - Have backup: email to organizers as fallback
  - Save all files locally + Google Drive

**Risk 8: Video Quality Poor**
- **Impact:** Medium (less engaging pitch)
- **Probability:** Low (using smartphone cameras)
- **Mitigation:**
  - Use good lighting (daytime by window)
  - Use phone stabilizer or tripod
  - Record 2-3 takes, pick best
  - Test audio before final recording

**Risk 9: Demo Breaks During Judging**
- **Impact:** High (bad impression on judges)
- **Probability:** Low (if tested thoroughly)
- **Mitigation:**
  - Test end-to-end day before submission
  - Have video backup showing features working
  - Monitor uptime during judging period
  - Set up error logging to catch issues early

---

### Team Risks

**Risk 10: Team Member Unavailable**
- **Impact:** Medium (workload increases for others)
- **Probability:** Medium (emergencies happen)
- **Mitigation:**
  - Document everything in GitHub README
  - Pair program (2 people know each component)
  - Have daily check-ins
  - Adjust scope if needed (cut nice-to-have features)

**Risk 11: Scope Creep**
- **Impact:** Medium (don't finish on time)
- **Probability:** High (tempting to add features)
- **Mitigation:**
  - Stick to MVP scope strictly
  - "Nice-to-have" features go in roadmap, not MVP
  - Troy as technical lead has veto power on scope changes
  - Focus: working demo > perfect demo

---

## 9. OUT OF SCOPE (NOT IN MVP)

These features are valuable but excluded from MVP to meet 4-day deadline:

### User Account Features
- ❌ User registration/login system
- ❌ Persistent profile storage
- ❌ Saved favorite routes
- ❌ Route history
- ❌ Usage analytics dashboard

**Why excluded:** Adds complexity (authentication, session management). Use localStorage for MVP.

---

### Advanced Navigation
- ❌ Voice-guided navigation ("Turn left in 50m")
- ❌ Real-time location tracking for buddies
- ❌ Augmented reality arrows
- ❌ Offline mode (downloadable maps)

**Why excluded:** Requires significant additional development. Core routing is sufficient for demo.

---

### Community Features
- ❌ User-reported incidents
- ❌ Community verification of safe spots
- ❌ Rating/reviewing routes
- ❌ Social sharing of routes
- ❌ Leaderboards or gamification

**Why excluded:** Requires moderation system, user accounts. Can be post-MVP feature.

---

### Advanced AI Features
- ❌ Real-time incident prediction
- ❌ Weather-aware routing (rain = less safe)
- ❌ Computer vision for street lighting analysis
- ❌ Natural language chat ("Find me a safe route to UP")

**Why excluded:** Too complex for 4-day build. Basic ML model is sufficient for demo.

---

### Integration Features
- ❌ Grab/Angkas integration (compare walk vs ride)
- ❌ Calendar integration (auto-suggest routes for events)
- ❌ Wearable device support (Apple Watch, Fitbit)
- ❌ Smart home integration ("Alexa, send my route to Mom")

**Why excluded:** Requires partner APIs, additional platforms. Web app is sufficient for MVP.

---

### Multi-Platform
- ❌ iOS native app
- ❌ Android native app
- ❌ Desktop application
- ❌ Browser extension

**Why excluded:** Web app (PWA) works on all platforms. Native apps are post-MVP.

---

### Localization
- ❌ Tagalog interface
- ❌ Bisaya, Ilocano translations
- ❌ Multi-language support

**Why excluded:** English is sufficient for demo (university students). Add translations post-MVP.

---

### Advanced Safety Features
- ❌ Panic button with police notification
- ❌ Fake call feature (pretend call to escape situation)
- ❌ Scream detection via microphone
- ❌ Video recording during walk

**Why excluded:** Legal/privacy concerns. Buddy alert is sufficient for MVP.

---

## 10. POST-COMPETITION ROADMAP

### Phase 1: University Pilot (April - June 2026)

**Goal:** Validate product-market fit with 1,000 users

**Features to Add:**
- User accounts (save routes, contacts)
- Real-time location tracking for buddies
- Community incident reporting
- Voice navigation

**Partnerships:**
- UP Diliman Student Council
- Ateneo Women's Studies Department
- UST Student Government

**Metrics:**
- 1,000+ registered users
- 80%+ retention (use app 2x per week)
- 50+ verified community reports

---

### Phase 2: Public Launch (July - December 2026)

**Goal:** Scale to 10,000 users across Metro Manila

**Features to Add:**
- Offline mode (downloadable maps)
- iOS native app
- Historical crime trends
- Integration with Grab (compare safety/cost)

**Partnerships:**
- Quezon City LGU (street lighting improvements)
- Manila LGU (barangay safety programs)
- Globe/Smart (CSR partnership for free SMS)

**Metrics:**
- 10,000+ active users
- 3 cities covered (QC, Manila, Makati)
- Media coverage (Rappler, Inquirer, TechCrunch Asia)

---

### Phase 3: Sustainability (2027+)

**Goal:** Achieve financial sustainability and regional expansion

**Revenue Model:**
- Freemium: Free for individuals, paid for businesses
- Corporate subscriptions: ₱500/employee/year for companies (employee safety tracking)
- API licensing: Sell safety data to ride-hailing companies
- Grants: Apply for Google.org grants, UN Women funding

**Expansion:**
- Cebu, Davao (Philippines)
- Jakarta, Bangkok, Ho Chi Minh (ASEAN)
- Partner with women's safety orgs regionally

**Metrics:**
- 100,000+ active users (Philippines)
- ₱500,000+/year revenue
- Break-even operational costs
- 5+ corporate clients

---

## 11. APPENDICES

### Appendix A: Environment Setup Commands

**Frontend Setup:**
```bash
# Create React app with Vite
npm create vite@latest saferoute-frontend -- --template react
cd saferoute-frontend

# Install dependencies
npm install leaflet react-leaflet axios
npm install tailwindcss daisyui
npm install react-router-dom
npm install @heroicons/react

# Initialize Tailwind
npx tailwindcss init -p

# Run development server
npm run dev
```

**Backend Setup:**
```bash
# Create backend directory
mkdir saferoute-backend && cd saferoute-backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn[standard]
pip install sqlalchemy psycopg2-binary
pip install python-dotenv requests
pip install twilio
pip install scikit-learn pandas numpy joblib
pip install geopy

# Create requirements.txt
pip freeze > requirements.txt

# Run development server
uvicorn main:app --reload --port 8000
```

---

### Appendix B: 3-Minute Video Script Template

**0:00-0:30 - Problem Statement**
[B-roll: News headlines about harassment, women walking alone at night]

"Every day, millions of women in Metro Manila walk in fear. One in three have experienced harassment while commuting. But existing navigation apps like Google Maps only care about speed, not safety. There's no tool that tells you: which streets to avoid, where danger zones are, or where to go if you feel unsafe. Until now."

**0:30-1:00 - Solution Introduction**
[Screen recording: Opening SafeRoute app]

"Meet SafeRoute. The first AI-powered navigation app that routes you through safer streets. Using crime data, street lighting analysis, and real-time danger prediction, SafeRoute calculates safety scores for every route. So you can walk with confidence, not fear."

**1:00-2:00 - Feature Demo**
[Screen recording: Live demo]

"Here's how it works. Enter your destination. SafeRoute shows you 2-3 routes—not just the fastest, but the safest. Each route has a safety score from 0 to 100, so you know exactly what you're walking into.

See those red zones? That's our danger heatmap showing high-crime areas. Tap to see why—recent incidents, poor lighting, low foot traffic.

Green markers? Those are safe spots—24/7 stores, police stations—where you can go if you feel unsafe.

And with one tap, you can alert your trusted contacts. They get your location, your route, and a tracking link. Someone always knows where you are."

**2:00-2:30 - Impact & Outreach**
[B-roll: Students walking on campus, night shift workers]

"We're launching at UP, Ateneo, and UST—reaching 10,000 students in our first month. Through social media campaigns and partnerships with women's organizations, we'll raise AI awareness among thousands of Filipinos. Because safety isn't a luxury. It's a right."

**2:30-3:00 - Call to Action**
[Talking head: Team member]

"SafeRoute is 100% free and open-source. Built by students, for the community. If we can prevent even one assault, this was worth building. Join us in making our streets safer—one route at a time."

[End screen: SafeRoute logo, QR code to demo, website URL]

---

### Appendix C: Submission Checklist

**Required Materials:**
- [ ] 5-page PDF proposal
  - [ ] Arial font, size 12
  - [ ] 1.5 line spacing
  - [ ] Max 5 pages (strictly enforced)
  - [ ] Includes diagrams/wireframes
  - [ ] PDF is <10MB file size

- [ ] 3-minute pitch video
  - [ ] MP4 format
  - [ ] Exactly 3 minutes or less
  - [ ] English language (with Tagalog subtitles)
  - [ ] Good audio quality (no background noise)
  - [ ] Shows working demo
  - [ ] File size <500MB

- [ ] Live demo link
  - [ ] Working URL (https://saferoute-asean.vercel.app)
  - [ ] Tested in incognito mode
  - [ ] Mobile responsive
  - [ ] No authentication required

- [ ] GitHub repository
  - [ ] Public visibility
  - [ ] README with setup instructions
  - [ ] MIT License included
  - [ ] Code is clean and commented

**Submission Portal:**
- [ ] Account created on AIRA portal
- [ ] Team information filled out
- [ ] All team members from same country
- [ ] At least 1 team member is citizen
- [ ] Submitted before March 24, 11:59pm GMT+8
- [ ] Confirmation email received
- [ ] Screenshot of confirmation page saved

---

### Appendix D: Contact Information

**Team Lead:**
- Name: Troy
- Email: [email]
- Phone: [phone]
- University: Polytechnic University of the Philippines

**Team Members:**
- [Name 1] - Frontend Developer
- [Name 2] - Backend Developer
- [Name 3] - Content & Research

**Project Links:**
- Live Demo: https://saferoute-asean.vercel.app
- GitHub: https://github.com/[username]/saferoute
- Video: [YouTube/Google Drive link]

**Support:**
- Email: saferoute.ph@gmail.com
- Discord: [Invite link]

---

**END OF PRD**

**Document Version:** 1.0  
**Total Pages:** [Auto-generated]  
**Last Updated:** March 21, 2026

---

*This Product Requirements Document is a living document and will be updated as the project evolves. For questions or clarifications, contact the team lead.*
