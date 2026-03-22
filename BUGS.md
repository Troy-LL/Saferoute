# Known issues (Phase 3.4)

## Medium

1. **Buddy alert requires Twilio** — `/api/buddy-alert` returns 500 if `TWILIO_*` env vars are missing. Expected for local dev without SMS.

## Low

1. **Safe spot popups** — On small screens, popups can overlap the route panel; adjust z-index or offset if needed.

2. **Python 3.14 + `psycopg2-binary`** — Some environments may fail to install pinned `psycopg2-binary`; use Python 3.11–3.12 or PostgreSQL client tooling as documented for your OS.
