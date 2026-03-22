"""
Database seeding script: loads CSV data into the database.
Run AFTER generating CSVs with scrape_crime_data.py and fetch_safe_spots.py.

Usage (from saferoute-backend/):
    python scripts/seed_database.py
"""
import sys
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import pandas as pd
from app.database import SessionLocal, engine
from app.models import Base, CrimeIncident, SafeSpot
from datetime import datetime

DATA_DIR = ROOT / "data"
CRIME_CSV = DATA_DIR / "crime_incidents.csv"
SPOTS_CSV = DATA_DIR / "safe_spots.csv"


def seed_crime_data():
    db = SessionLocal()
    try:
        db.query(CrimeIncident).delete()
        db.commit()

        df = pd.read_csv(CRIME_CSV)

        for _, row in df.iterrows():
            try:
                date_val = datetime.strptime(str(row["date"]), "%Y-%m-%d")
            except Exception:
                date_val = datetime.now()

            incident = CrimeIncident(
                incident_id=str(row["incident_id"]),
                latitude=float(row["latitude"]),
                longitude=float(row["longitude"]),
                incident_type=str(row["incident_type"]),
                date=date_val,
                time_of_day=str(row.get("time_of_day", "12:00")),
                description=str(row.get("description", "")),
                barangay=str(row.get("barangay", "")),
                city=str(row.get("city", "Metro Manila")),
            )
            db.add(incident)

        db.commit()
        print(f"[OK] Seeded {len(df)} crime incidents")
    except Exception as e:
        db.rollback()
        print(f"[ERR] Error seeding crime data: {e}")
        raise
    finally:
        db.close()


def seed_safe_spots():
    db = SessionLocal()
    try:
        db.query(SafeSpot).delete()
        db.commit()

        df = pd.read_csv(SPOTS_CSV)

        for _, row in df.iterrows():
            spot = SafeSpot(
                spot_id=str(row["spot_id"]),
                name=str(row["name"]),
                type=str(row["type"]),
                latitude=float(row["latitude"]),
                longitude=float(row["longitude"]),
                hours=str(row.get("hours", "24/7")),
                address=str(row.get("address", "")),
                city=str(row.get("city", "Metro Manila")),
            )
            db.add(spot)

        db.commit()
        print(f"[OK] Seeded {len(df)} safe spots")
    except Exception as e:
        db.rollback()
        print(f"[ERR] Error seeding safe spots: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    if not CRIME_CSV.is_file() or not SPOTS_CSV.is_file():
        print(
            "Missing CSVs. From saferoute-backend/ run:\n"
            "  python data/scrape_crime_data.py\n"
            "  python data/fetch_safe_spots.py"
        )
        sys.exit(1)

    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("Seeding crime incidents...")
    seed_crime_data()
    print("Seeding safe spots...")
    seed_safe_spots()
    print("Database seeding complete.")
