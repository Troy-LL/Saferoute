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
3. Seed the database (CSV files are in `saferoute-backend/data/`, or regenerate with `python data/scrape_crime_data.py` and `python data/fetch_safe_spots.py`):  
   `python scripts/seed_database.py`
4. Start the API: `uvicorn app.main:app --reload` (from `saferoute-backend/`).

**Frontend** — from `saferoute-frontend/`:

1. `npm install`
2. Copy `.env.example` to `.env` and set `VITE_API_URL` to your API (Railway URL in production).
3. `npm run dev` (default Vite dev server, often `http://localhost:5173`).

## Deployment (target)

- **API:** Railway — set **Root Directory** to `saferoute-backend`, add the **PostgreSQL** plugin (injects `DATABASE_URL`), set env vars from `.env.example`, **Start Command** is defined in `saferoute-backend/railway.toml` (`uvicorn app.main:app --host 0.0.0.0 --port $PORT`). After first deploy, run **once**: `python scripts/seed_database.py` (Railway CLI shell or one-off job) so Postgres has schema + seed data.
- **Web:** Vercel — set **Root Directory** to `saferoute-frontend`, add `VITE_API_URL` = your Railway API URL — production: [saferoute-asean.vercel.app](https://saferoute-asean.vercel.app).

Tune `CORS_ORIGINS` in the backend env to include `https://saferoute-asean.vercel.app` (and localhost for dev).

## Phase 1 deliverables (checklist)

| Item | How to verify |
|------|----------------|
| FastAPI on Railway | Open `/health` on your Railway URL. |
| React on Vercel | Load [saferoute-asean.vercel.app](https://saferoute-asean.vercel.app); map loads. |
| PostgreSQL + schema | Railway Postgres attached; tables created on app boot (`Base.metadata.create_all`). |
| 500+ crime incidents | `data/crime_incidents.csv` has 520 rows; `seed_database.py` loads them. |
| 50+ safe spots | `data/safe_spots.csv` has 55 rows; seeded with script. |
| OpenRouteService | `OPENROUTESERVICE_API_KEY` set in Railway (and local `.env`). |
| Twilio SMS | `python scripts/verify_twilio.py` (optional: `TWILIO_SEND_TEST=1` + `TWILIO_TEST_TO`). |
| ML safety scorer | `GET /api/safety-score?lat=14.65&lng=121.07&hour=22` returns score + label; night vs day differs. |
| GitHub clean commits | Feature commits on `main`; push to origin. |

## License / data

Crime and POI data are for **demonstration**; production use requires appropriate sources, licenses, and privacy review.
