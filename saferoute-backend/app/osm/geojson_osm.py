"""
Load OSM-derived GeoJSON (e.g. Overpass export) for route safety: street lamps,
surveillance (CCTV / guards), and police polygons (centroids).

Coordinates are WGS84; geometries use GeoJSON order [lng, lat].
"""
from __future__ import annotations

import json
import logging
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any, List, Optional, Tuple

import numpy as np
from sklearn.neighbors import BallTree

logger = logging.getLogger(__name__)


@dataclass
class OsmGeoData:
    """Spatial indices built from OSM GeoJSON features."""

    lamp_coords: List[Tuple[float, float]]  # (lat, lng)
    lamp_tree: Optional[BallTree]
    surveillance_rows: List[dict]  # lat, lng, weight
    surveillance_tree: Optional[BallTree]
    police_centroids: List[Tuple[float, float]]
    police_tree: Optional[BallTree]


def _ring_centroid(ring: List[List[float]]) -> Tuple[float, float]:
    """Simple mean of vertices (GeoJSON ring: [lng, lat])."""
    if not ring:
        return 0.0, 0.0
    lngs = [p[0] for p in ring]
    lats = [p[1] for p in ring]
    n = len(lats)
    return sum(lats) / n, sum(lngs) / n


def _coords_from_geometry(geom: dict[str, Any]) -> Optional[Tuple[float, float]]:
    t = geom.get("type")
    coords = geom.get("coordinates")
    if not coords:
        return None
    if t == "Point":
        lng, lat = coords[0], coords[1]
        return (lat, lng)
    if t == "Polygon":
        return _ring_centroid(coords[0])
    if t == "MultiPolygon":
        # First outer ring of first polygon
        return _ring_centroid(coords[0][0])
    return None


def _surveillance_weight(props: dict[str, Any]) -> float:
    """Higher = more perceived deterrence for routing bonus."""
    st = (props.get("surveillance:type") or "").lower()
    if st == "camera":
        return 1.0
    if st == "guard":
        return 1.15
    return 0.9


def load_osm_from_geojson(path: Optional[str | Path] = None) -> OsmGeoData:
    """
    Parse export.geojson and build coordinate lists + BallTrees.
    If path is None, uses env OSM_GEOJSON_PATH or data/export.geojson next to backend root.
    """
    base = Path(__file__).resolve().parents[2]  # saferoute-backend/
    default_path = base / "data" / "export.geojson"
    resolved = Path(path or os.getenv("OSM_GEOJSON_PATH") or default_path)

    lamps: List[Tuple[float, float]] = []
    surveillance: List[dict] = []
    police: List[Tuple[float, float]] = []

    if not resolved.is_file():
        logger.info("OSM GeoJSON not found at %s — OSM bonuses disabled", resolved)
        return OsmGeoData(lamps, None, [], None, [], None)

    try:
        with open(resolved, encoding="utf-8") as f:
            data = json.load(f)
    except (OSError, json.JSONDecodeError) as e:
        logger.warning("Could not load OSM GeoJSON %s: %s", resolved, e)
        return OsmGeoData(lamps, None, [], None, [], None)

    for feat in data.get("features") or []:
        props = feat.get("properties") or {}
        geom = feat.get("geometry") or {}
        ll = _coords_from_geometry(geom)
        if ll is None:
            continue
        lat, lng = ll

        if props.get("highway") == "street_lamp":
            lamps.append((lat, lng))
            continue

        if props.get("amenity") == "police":
            police.append((lat, lng))
            continue

        if props.get("man_made") == "surveillance" or props.get("surveillance"):
            surveillance.append(
                {"lat": lat, "lng": lng, "weight": _surveillance_weight(props)}
            )

    lamp_tree = (
        BallTree(np.radians(lamps), metric="haversine") if lamps else None
    )
    surv_tree = (
        BallTree(
            np.radians([[r["lat"], r["lng"]] for r in surveillance]),
            metric="haversine",
        )
        if surveillance
        else None
    )
    pol_tree = (
        BallTree(np.radians(police), metric="haversine") if police else None
    )

    logger.info(
        "OSM GeoJSON: %d lamps, %d surveillance, %d police centroids from %s",
        len(lamps),
        len(surveillance),
        len(police),
        resolved.name,
    )

    return OsmGeoData(
        lamp_coords=lamps,
        lamp_tree=lamp_tree,
        surveillance_rows=surveillance,
        surveillance_tree=surv_tree,
        police_centroids=police,
        police_tree=pol_tree,
    )


_cached_osm: Optional[OsmGeoData] = None


def get_osm_geo_data() -> OsmGeoData:
    """Single load per process — safe for FastAPI workers."""
    global _cached_osm
    if _cached_osm is None:
        _cached_osm = load_osm_from_geojson()
    return _cached_osm
