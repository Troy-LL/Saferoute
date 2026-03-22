# SafeRoute

Walking navigation for **Metro Manila** that prefers **safer streets**, not just the fastest path. The app combines **crime incident data**, **lighting and time-of-day context**, **safe spots** (e.g. lit areas, police, commercial corridors), and an **ML-based safety scorer** so users can plan routes with clearer situational awareness—especially women walking alone.

Built for the **AIRA Youth Challenge 2026** (MVP).

## What we’re building

- **Map + route planner** — Origin/destination, map visualization (Leaflet), and routes biased by safety scores along the graph.
- **Backend API** — FastAPI service for routing (OpenRouteService), per-segment safety scoring, crime/safe-spot data, and optional **SMS** (Twilio) for sharing location or alerts.
- **Data layer** — PostgreSQL in production (SQLite supported for local dev); seeded crime incidents and safe spots for realistic demos.

## Repository layout

| Path | Role |
|------|------|
| `saferoute-backend/` | FastAPI app (`/api` routing, safety, spots), SQLAlchemy models, ML scorer, Twilio helper, seed scripts |
| `saferoute-frontend/` | React 19 + Vite + React Router + Leaflet UI |

## Tech stack

| Layer | Choices |
|-------|---------|
| API | Python 3, FastAPI, Uvicorn |
| Data | SQLAlchemy, PostgreSQL (prod) / SQLite (dev) |
| Routing | OpenRouteService |
| ML | scikit-learn–based safety scoring |
| Notifications | Twilio SMS (optional) |
| Web | React, Vite, Leaflet / react-leaflet, Axios |

## Local development

**Backend** — from `saferoute-backend/`:

1. Create a virtual environment and install dependencies: `pip install -r requirements.txt`
2. Copy `saferoute-backend/.env.example` to `saferoute-backend/.env` and set `DATABASE_URL`, `OPENROUTESERVICE_API_KEY`, and Twilio vars if you use SMS.
3. Run seed scripts if you need demo data (see `scripts/` in the backend).
4. Start the API (e.g. `uvicorn app.main:app --reload`).

**Frontend** — from `saferoute-frontend/`:

1. `npm install`
2. Configure `.env` (API base URL for your backend).
3. `npm run dev` (default Vite dev server, often `http://localhost:5173`).

## Deployment (target)

- **API:** Railway (FastAPI + managed PostgreSQL).
- **Web:** Vercel (static build from the Vite app).

Tune `CORS_ORIGINS` in the backend env to match your Vercel URL.

## License / data

Crime and POI data are for **demonstration**; production use requires appropriate sources, licenses, and privacy review.
