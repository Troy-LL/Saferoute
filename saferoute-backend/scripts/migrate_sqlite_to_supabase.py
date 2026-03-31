"""
One-time migration: SQLite → Supabase (PostgreSQL)

Usage (from saferoute-backend/):
    pip install supabase
    SUPABASE_SERVICE_ROLE_KEY=<your_key> python scripts/migrate_sqlite_to_supabase.py

The SERVICE_ROLE key bypasses RLS — keep it secret, only use server-side.
"""

import os
import sqlite3
import sys

try:
    from supabase import create_client
except ImportError:
    print("ERROR: supabase package not installed. Run: pip install supabase>=2.10.0")
    sys.exit(1)

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://djginnuhavnpwvcdbpfp.supabase.co")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
SQLITE_PATH = os.getenv("SQLITE_PATH", "saferoute.db")

if not SUPABASE_SERVICE_ROLE_KEY:
    print("ERROR: SUPABASE_SERVICE_ROLE_KEY env var is required.")
    print("  Get it from: Supabase Dashboard → Settings → API → service_role secret key")
    sys.exit(1)

if not os.path.exists(SQLITE_PATH):
    print(f"ERROR: SQLite database not found at: {SQLITE_PATH}")
    sys.exit(1)

print(f"Connecting to Supabase: {SUPABASE_URL}")
sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

conn = sqlite3.connect(SQLITE_PATH)
conn.row_factory = sqlite3.Row

# ─── Migrate crime_incidents ───────────────────────────────────────────────────
print("\nMigrating crime_incidents...")
rows = conn.execute("SELECT * FROM crime_incidents").fetchall()
if rows:
    batch = []
    for r in rows:
        batch.append({
            "incident_id": r["incident_id"],
            "latitude": r["latitude"],
            "longitude": r["longitude"],
            "incident_type": r["incident_type"],
            "date": r["date"],
            "time_of_day": r["time_of_day"],
            "description": r["description"],
            "barangay": r["barangay"],
            "city": r["city"],
        })
    # Upsert in chunks of 500
    CHUNK = 500
    for i in range(0, len(batch), CHUNK):
        chunk = batch[i : i + CHUNK]
        sb.table("crime_incidents").upsert(chunk, on_conflict="incident_id").execute()
        print(f"  Upserted rows {i+1}–{min(i+CHUNK, len(batch))}")
    print(f"✓ Migrated {len(batch)} crime incidents")
else:
    print("  No crime_incidents rows to migrate.")

# ─── Migrate safe_spots ────────────────────────────────────────────────────────
print("\nMigrating safe_spots...")
rows = conn.execute("SELECT * FROM safe_spots").fetchall()
if rows:
    batch = []
    for r in rows:
        batch.append({
            "spot_id": r["spot_id"],
            "name": r["name"],
            "type": r["type"],
            "latitude": r["latitude"],
            "longitude": r["longitude"],
            "hours": r["hours"],
            "address": r["address"],
            "city": r["city"],
        })
    CHUNK = 500
    for i in range(0, len(batch), CHUNK):
        chunk = batch[i : i + CHUNK]
        sb.table("safe_spots").upsert(chunk, on_conflict="spot_id").execute()
        print(f"  Upserted rows {i+1}–{min(i+CHUNK, len(batch))}")
    print(f"✓ Migrated {len(batch)} safe spots")
else:
    print("  No safe_spots rows to migrate.")

conn.close()
print("\nMigration complete! 🎉")
print("Verify at: https://supabase.com/dashboard/project/djginnuhavnpwvcdbpfp/editor")
