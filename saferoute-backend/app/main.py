from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine
from app.models import Base
from app.config import CORS_ORIGINS

app = FastAPI(
    title="SafeRoute PH API",
    version="1.0.0",
    description="Safe walking route planner for Metro Manila - AIRA Youth Challenge 2026"
)

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables on startup
Base.metadata.create_all(bind=engine)

# Include routers (imported here to avoid circular imports)
from app.api import routes, safety, spots
app.include_router(routes.router, prefix="/api", tags=["routing"])
app.include_router(safety.router, prefix="/api", tags=["safety"])
app.include_router(spots.router, prefix="/api", tags=["safe-spots"])

@app.get("/")
def health_check():
    return {"status": "ok", "version": "1.0.0", "project": "SafeRoute PH"}

@app.get("/health")
def health():
    return {"status": "healthy"}
