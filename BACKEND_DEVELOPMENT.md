# SafeRoute — Backend development guide

This document covers how the FastAPI service is installed, how the database is managed today, how external services integrate, and what is **not** finished yet (so we can evolve it deliberately).

---

## 1. Stack

| Piece | Role |
|-------|------|
| Python 3.11+ recommended | Runtime (3.13 works if dependencies install cleanly) |
| FastAPI + Uvicorn | HTTP API |
| SQLAlchemy 2.x | ORM |
| SQLite | Default **local** database file |
| PostgreSQL | **Production** — Railway plugin, **Supabase** (planned), or any standard Postgres |
| OpenRouteService | Walking directions + geocoding |
| Twilio | SMS (buddy alerts) |
| scikit-learn / NumPy / GeoPy | Safety scoring helpers |

---

## 2. Installation (local)

From **`saferoute-backend/`**:

```bash
python -m venv venv
```

**Windows (PowerShell):**

```powershell
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**macOS / Linux:**

```bash
source venv/bin/activate
pip install -r requirements.txt
```

Copy **`.env.example`** → **`.env`** and fill in real values (never commit `.env`).

Run the app:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- API root: `http://127.0.0.1:8000`
- Interactive docs: `http://127.0.0.1:8000/docs`

---

## 3. Environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | SQLAlchemy URL. Local default in code: `sqlite:///./saferoute.db`. Railway often provides `postgres://…`; the app normalizes that to `postgresql://…`. For Supabase, use the **URI** from the dashboard (often includes `?sslmode=require`). |
| `OPENROUTESERVICE_API_KEY` | Required for `/api/calculate-route` and `/api/geocode`. |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` | Required for `/api/buddy-alert` and `scripts/verify_twilio.py`. |
| `APP_ENV` | Optional (`development` / `production`). |
| `CORS_ORIGINS` | Comma-separated origins allowed by the browser (include your Vercel URL and `http://localhost:5173`). |

See **`saferoute-backend/.env.example`** for placeholders.

---

## 4. Database management (current state)

### 4.1 How schema is created today

On application startup, `app/main.py` runs:

```text
Base.metadata.create_all(bind=engine)
```

That creates **missing** tables from SQLAlchemy models in `app/models/`. It does **not**:

- Drop or rename columns automatically
- Apply versioned migrations
- Safely coordinate multiple deploys without drift

So: fine for early MVP; **not** a full lifecycle strategy.

### 4.2 Local (SQLite)

- Default file: **`saferoute.db`** in the current working directory when you start Uvicorn (usually `saferoute-backend/`).
- Engine uses `check_same_thread=False` for SQLite only.

### 4.3 Production (PostgreSQL)

- Set `DATABASE_URL` to the Postgres URL from your host (Railway injects this when you add a Postgres service).
- Same `create_all` runs on boot — tables appear if they did not exist.

### 4.4 Seeding data

Synthetic CSVs live under **`saferoute-backend/data/`** (`crime_incidents.csv`, `safe_spots.csv`). Regenerate if needed:

```bash
python data/scrape_crime_data.py
python data/fetch_safe_spots.py
```

Load into the DB (from **`saferoute-backend/`**):

```bash
python scripts/seed_database.py
```

Run **after** migrations/schema exist and **after** Postgres is reachable (e.g. one-off job or Railway shell on first deploy). The script clears and repopulates crime and safe-spot tables — **do not** run blindly on production without a backup strategy.

### 4.5 What is **not** done yet (database)

| Gap | Notes |
|-----|--------|
| **Alembic migrations** | `alembic` is listed in `requirements.txt`, but the repo does **not** yet ship `alembic.ini` / `versions/`. Schema changes today rely on manual DB fixes or wipe-and-recreate — **next step** is to initialize Alembic and check in migrations. |
| **Revision history** | No upgrade/downgrade path between model versions. |
| **Pooling / timeouts** | `create_engine` uses defaults; tune for production under load later. |
| **Backups** | No automated backup documentation; use host tools (Railway snapshots, `pg_dump`, **Supabase scheduled backups**, etc.). |
| **Multi-environment parity** | Dev SQLite vs prod Postgres can hide type/constraint differences — test against Postgres before release. |

### 4.6 Planned: Supabase as hosted Postgres

[Supabase](https://supabase.com) is compatible with this backend because it exposes **standard PostgreSQL**. No rewrite of the ORM layer is required—only the connection string and operational practices change.

| Step | Task |
|------|------|
| 1 | Create a Supabase project; open **Settings → Database**. |
| 2 | Copy the **connection string** (URI). Prefer the **direct** connection (port **5432**) for a long-lived FastAPI/Uvicorn process unless you intentionally use the **pooler** (port **6543**) per Supabase docs. |
| 3 | Ensure **SSL**: URIs usually include `?sslmode=require` (or equivalent). |
| 4 | Set `DATABASE_URL` in `.env` / Railway / CI to that URI (URL-encode special characters in the password). |
| 5 | Run the app or `alembic upgrade head` (once migrations exist) against Supabase; then run **`scripts/seed_database.py`** once for demo data if needed. |
| 6 | **Pick one primary prod DB** — Supabase *or* Railway Postgres — to avoid split-brain data. |

**Optional later (not required for routing/crime APIs):**

- **Supabase Auth** — if you want hosted auth instead of custom JWT.
- **Supabase Storage** — user uploads, exports.
- **Realtime** — live buddy or map updates; would need client/subscription design.

**Why Supabase helps:** managed Postgres, dashboard, branching (paid), backups UI, and room to grow without changing the SQLAlchemy models.

---

## 5. Integration points

### 5.1 OpenRouteService (ORS)

- **Walking routes:** `app/services/routing.py` → `POST` to ORS `foot-walking` with alternatives.
- **Geocoding:** `app/api/routes.py` → ORS Geocode with `boundary.country=PH`.

Failures surface as HTTP 500 from `/api/calculate-route` or `/api/geocode` with the upstream message in `detail`. Monitor quota (free tier limits).

### 5.2 Twilio

- **Buddy alert:** `app/services/sms.py`, exposed as `POST /api/buddy-alert`.
- **Credential check:** `python scripts/verify_twilio.py` (optional test send via env vars documented in that file).

### 5.3 Frontend (CORS)

The React app calls this API from the browser. `CORS_ORIGINS` must list the exact Vite dev origin and production URL (scheme + host, no trailing path).

---

## 6. Deployment — Railway / Supabase

**Railway (API container)**

- Set **Root Directory** to **`saferoute-backend`**.
- Attach **PostgreSQL** *or* point `DATABASE_URL` at **Supabase** (no Railway DB plugin needed if using Supabase only).
- **Start command** is defined in **`railway.toml`** (`uvicorn` on `$PORT`).
- After first successful deploy: run **`python scripts/seed_database.py`** once if you need demo data (Railway shell or one-off job), **after** the DB is reachable.

**Supabase (database only)**

- No change to Docker image: same FastAPI deploy; only **`DATABASE_URL`** targets Supabase.
- Use Supabase **SQL editor** for ad-hoc checks; enable **Point-in-time recovery** / backups per project plan.

---

## 7. Useful scripts

| Script | Purpose |
|--------|---------|
| `scripts/seed_database.py` | Create tables (if missing) and load CSV seed data. |
| `scripts/verify_twilio.py` | Validate Twilio credentials; optional SMS test. |
| `data/scrape_crime_data.py` | Regenerate synthetic crime CSV. |
| `data/fetch_safe_spots.py` | Regenerate synthetic safe-spots CSV. |

---

## 8. Roadmap: data, Supabase, and migrations

1. **Choose prod Postgres** — Railway Postgres vs **Supabase**; document the final `DATABASE_URL` source in deployment notes.
2. **Initialize Alembic** in `saferoute-backend/`, point it at `DATABASE_URL`, generate an initial migration from current models, and use `alembic upgrade head` in deploy instead of relying solely on `create_all`.
3. **Replace or gate `create_all`** in production once migrations exist (avoid accidental divergence).
4. **Add automated tests** (pytest) for critical routes and DB sessions (in-memory SQLite or test Postgres/Supabase branch).
5. **Document backup/restore** — `pg_dump` / Supabase backup UI / Railway snapshots before real users.

---

## 9. Roadmap: backend optimization

These items improve latency, cost, and operability as traffic and data grow.

| Area | Task |
|------|------|
| **DB connection pool** | Configure SQLAlchemy `pool_size`, `max_overflow`, `pool_pre_ping`, and `pool_recycle` for Postgres/Supabase; avoid exhausting connections under concurrent requests. |
| **Indexes** | Add indexes on frequently filtered columns (e.g. `crime_incidents.latitude/longitude`, `time_of_day`, `safe_spots` location) after profiling slow queries. |
| **Query scope** | Replace full-table scans where possible (e.g. incidents near a bbox or radius using PostGIS or bounded lat/lng filters consistently). |
| **Caching** | Short-TTL cache for ORS route responses for identical start/end/time (careful with cache keys); optional Redis later. |
| **HTTP client** | Reuse a `requests.Session` or move hot paths to **httpx** with connection pooling for ORS calls. |
| **Async vs sync** | Evaluate **async SQLAlchemy** + async routes for I/O-bound workloads; not mandatory for MVP. |
| **Rate limiting** | Add middleware or reverse-proxy limits on `/api/geocode` and `/api/calculate-route` to protect ORS quota and abuse. |
| **Payload size** | Cap or simplify large route geometries in responses if mobile clients struggle; optional GeoJSON simplification. |
| **Compression** | Enable **GZip** middleware in FastAPI/Starlette for JSON-heavy responses. |
| **Observability** | Structured logging, request IDs, and metrics (latency, ORS errors, DB pool stats); optional OpenTelemetry + hosted collector. |
| **Security** | Tighten CORS in production, secrets only via env, dependency scanning (`pip-audit`), and HTTPS termination at the edge. |
| **Background work** | Move heavy batch jobs (re-seeding, large imports) to a worker or scheduled job, not the request path. |

---

## 10. Project layout (backend)

```text
saferoute-backend/
  app/
    main.py           # FastAPI app, CORS, create_all, routers
    database.py       # Engine, SessionLocal, get_db
    config.py         # Shared env reads (CORS, etc.)
    models/           # SQLAlchemy models / Base
    api/              # routes, safety, spots
    services/         # ORS routing, Twilio SMS
    ml/               # SafetyScorer
  data/               # Seed CSVs + generators
  scripts/            # seed_database, verify_twilio
  requirements.txt
  railway.toml
  .env.example
```

For repo-wide context, see the root **`README.md`**.
