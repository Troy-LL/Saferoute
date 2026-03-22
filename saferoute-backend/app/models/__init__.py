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
    incident_type = Column(String, nullable=False)  # Store as string for flexibility
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
