"""
Database seeding script: loads CSV data into the database.
Run AFTER generating CSVs with scrape_crime_data.py and fetch_safe_spots.py.

Usage:
    python scripts/seed_database.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
from app.database import SessionLocal, engine
from app.models import Base, CrimeIncident, SafeSpot
from datetime import datetime


def seed_crime_data():
    db = SessionLocal()
    try:
        # Clear existing data
        db.query(CrimeIncident).delete()
        db.commit()

        df = pd.read_csv('data/crime_incidents.csv')

        for _, row in df.iterrows():
            try:
                date_val = datetime.strptime(str(row['date']), '%Y-%m-%d')
            except Exception:
                date_val = datetime.now()

            incident = CrimeIncident(
                incident_id=str(row['incident_id']),
                latitude=float(row['latitude']),
                longitude=float(row['longitude']),
                incident_type=str(row['incident_type']),
                date=date_val,
                time_of_day=str(row.get('time_of_day', '12:00')),
                description=str(row.get('description', '')),
                barangay=str(row.get('barangay', '')),
                city=str(row.get('city', 'Metro Manila'))
            )
            db.add(incident)

        db.commit()
        print(f"✅ Seeded {len(df)} crime incidents")
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding crime data: {e}")
        raise
    finally:
        db.close()


def seed_safe_spots():
    db = SessionLocal()
    try:
        # Clear existing data
        db.query(SafeSpot).delete()
        db.commit()

        df = pd.read_csv('data/safe_spots.csv')

        for _, row in df.iterrows():
            spot = SafeSpot(
                spot_id=str(row['spot_id']),
                name=str(row['name']),
                type=str(row['type']),
                latitude=float(row['latitude']),
                longitude=float(row['longitude']),
                hours=str(row.get('hours', '24/7')),
                address=str(row.get('address', '')),
                city=str(row.get('city', 'Metro Manila'))
            )
            db.add(spot)

        db.commit()
        print(f"✅ Seeded {len(df)} safe spots")
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding safe spots: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("🌱 Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("🌱 Seeding crime incidents...")
    seed_crime_data()
    print("🌱 Seeding safe spots...")
    seed_safe_spots()
    print("✅ Database seeding complete!")
