"""
Clean data/safety_data.csv (OSM-style export) for downstream use.

- Normalizes column names and string fields
- Parses latitude / longitude, drops invalid or out-of-bounds rows
- Applies convenience-store heuristics (7-Eleven, Alfamart, Dali, Uncle John's, unnamed shops)
- Optional deduplication by rounded coordinates
- Writes UTF-8 CSV with stable column names

Run from saferoute-backend/:
  python data/csv_safety_cleanr.py
  python data/csv_safety_cleanr.py -o data/safety_data_cleaned.csv
"""
from __future__ import annotations

import argparse
import re
import sys
import unicodedata
from pathlib import Path

import pandas as pd

DATA_DIR = Path(__file__).resolve().parent
DEFAULT_IN = DATA_DIR / "safety_data.csv"
DEFAULT_OUT = DATA_DIR / "safety_data_cleaned.csv"

# Metro Manila / NCR — loose bounds to drop obvious bad points
LAT_MIN, LAT_MAX = 14.35, 14.85
LON_MIN, LON_MAX = 120.85, 121.30

# Dedup: treat points within this many meters as duplicates (haversine ~6 decimals ~0.1m)
ROUND_LAT_LON = 6

# --- Brand / unnamed-shop defaults (see _apply_business_rules) ---
H_ALFAMART_DEFAULT = "07:00-22:00"
H_DALI_DEFAULT = "07:00-22:00"
H_UNCLE_SUBURBAN = "06:00-00:00"  # 6 AM – midnight
H_UNNAMED_SHOP = "08:00-20:00"
NAME_UNNAMED_SHOP = "Unnamed Convenience Store"

# Approximate dense "major city" areas in Metro Manila (lat_min, lat_max, lon_min, lon_max).
# Uncle John's: 24/7 inside any box; otherwise suburban hours above.
MAJOR_CITY_BOXES: list[tuple[float, float, float, float]] = [
    (14.57, 14.61, 120.96, 121.02),  # Manila core (Ermita, Malate, Binondo)
    (14.55, 14.57, 121.01, 121.04),  # Makati CBD
    (14.54, 14.56, 121.04, 121.08),  # BGC / Taguig
    (14.58, 14.61, 121.05, 121.08),  # Ortigas / Pasig
    (14.57, 14.59, 121.03, 121.06),  # Mandaluyong
    (14.61, 14.66, 121.05, 121.10),  # QC Cubao / Katipunan / Libis
    (14.68, 14.72, 121.05, 121.08),  # QC Fairview / Commonwealth dense strip
    (14.63, 14.66, 120.98, 121.02),  # Caloocan / Manila north
    (14.52, 14.55, 120.98, 121.03),  # Pasay / bay area
    (14.59, 14.62, 121.00, 121.04),  # San Juan / Greenhills
]


def _in_major_city(lat: float, lon: float) -> bool:
    for la0, la1, lo0, lo1 in MAJOR_CITY_BOXES:
        if la0 <= lat <= la1 and lo0 <= lon <= lo1:
            return True
    return False


def _hours_indicates_24_7(s: str) -> bool:
    t = re.sub(r"\s+", "", (s or "").lower())
    if not t:
        return False
    return "24/7" in t or "24-7" in t or t == "24h" or "24hours" in t or "open24" in t


def _is_7_eleven(name: str) -> bool:
    n = (name or "").lower()
    return "7-eleven" in n or "7 eleven" in n or bool(re.search(r"7\s*[-‐]?\s*eleven", n))


def _is_alfamart(name: str) -> bool:
    return "alfamart" in (name or "").lower()


def _is_dali(name: str) -> bool:
    n = (name or "").strip().lower()
    if "dali everyday grocery" in n:
        return True
    if n == "dali" or n.startswith("dali,"):
        return True
    return bool(re.match(r"^dali\s+", n))


def _is_uncle_johns(name: str) -> bool:
    return "uncle john" in (name or "").lower()


def _apply_business_rules(df: pd.DataFrame) -> pd.DataFrame:
    """Fill brand-specific hours and unnamed convenience rows (mutates a copy)."""
    if df.empty:
        return df
    df = df.copy()

    names = df["name"].fillna("").astype(str)
    hours = df["opening_hours"].fillna("").astype(str).copy()
    surv = df["surveillance_type"].fillna("").astype(str).str.lower()

    # 7-Eleven: always 24/7
    m_711 = names.map(_is_7_eleven)
    hours.loc[m_711] = "24/7"

    # Alfamart: 07:00-22:00 unless already tagged 24/7
    m_alfa = names.map(_is_alfamart) & ~m_711
    hours.loc[m_alfa] = hours.loc[m_alfa].map(
        lambda x: "24/7" if _hours_indicates_24_7(x) else H_ALFAMART_DEFAULT
    )

    # Dali Everyday Grocery / Dali: typical 07:00-22:00
    m_dali = names.map(_is_dali) & ~m_711
    hours.loc[m_dali] = H_DALI_DEFAULT

    # Uncle John's: 24/7 in major-city boxes, else 06:00–midnight
    m_uj = names.map(_is_uncle_johns) & ~m_711
    if m_uj.any():
        uj_h = df.loc[m_uj].apply(
            lambda r: (
                "24/7"
                if _in_major_city(float(r["latitude"]), float(r["longitude"]))
                else H_UNCLE_SUBURBAN
            ),
            axis=1,
        )
        hours.loc[m_uj] = uj_h.values

    # Unlabeled shops (empty name, not a camera POV): conservative label + hours
    m_unnamed = (names.str.len() == 0) & (surv != "camera") & ~m_711
    df.loc[m_unnamed, "name"] = NAME_UNNAMED_SHOP
    hours.loc[m_unnamed] = H_UNNAMED_SHOP

    df["opening_hours"] = hours.map(_strip_opening_hours)
    return df


def _normalize_columns(raw: list[str]) -> dict[str, str]:
    """Map original header names to internal keys."""
    mapping: dict[str, str] = {}
    for c in raw:
        key = c.strip()
        if key.startswith("@"):
            key = key[1:]
        if key == "type":
            mapping[c] = "osm_type"
        elif key in ("lat", "latitude"):
            mapping[c] = "latitude"
        elif key in ("lon", "longitude", "lng"):
            mapping[c] = "longitude"
        elif key == "name":
            mapping[c] = "name"
        elif "surveillance" in key.lower():
            mapping[c] = "surveillance_type"
        elif "opening" in key.lower() or key == "opening_hours":
            mapping[c] = "opening_hours"
        else:
            mapping[c] = key.replace(":", "_")
    return mapping


def _clean_text(s: str) -> str:
    if not isinstance(s, str):
        return ""
    s = unicodedata.normalize("NFC", s.strip())
    # Common OSM / Cyrillic-style number sign → ASCII
    s = s.replace("№", "No.")
    return s


def _strip_opening_hours(s: str) -> str:
    s = _clean_text(s)
    if not s:
        return ""
    # Collapse repeated spaces
    s = re.sub(r"\s+", " ", s)
    return s


def clean_dataframe(df: pd.DataFrame, *, dedup: bool = True) -> tuple[pd.DataFrame, dict[str, int]]:
    rename = _normalize_columns(list(df.columns))
    df = df.rename(columns=rename)

    required = {"latitude", "longitude"}
    if not required.issubset(df.columns):
        missing = required - set(df.columns)
        raise ValueError(f"Missing required columns after rename: {missing}")

    for col in ("osm_type", "name", "surveillance_type", "opening_hours"):
        if col not in df.columns:
            df[col] = ""

    # Strings
    for col in ("osm_type", "name", "surveillance_type"):
        df[col] = df[col].fillna("").map(_clean_text)
    df["opening_hours"] = df["opening_hours"].fillna("").map(_strip_opening_hours)

    # Coordinates
    df["latitude"] = pd.to_numeric(df["latitude"], errors="coerce")
    df["longitude"] = pd.to_numeric(df["longitude"], errors="coerce")
    before = len(df)
    df = df.dropna(subset=["latitude", "longitude"])
    df = df[
        (df["latitude"] >= LAT_MIN)
        & (df["latitude"] <= LAT_MAX)
        & (df["longitude"] >= LON_MIN)
        & (df["longitude"] <= LON_MAX)
    ]
    dropped_invalid_or_oob = before - len(df)

    df = _apply_business_rules(df)

    dropped_dup = 0
    if dedup and len(df) > 0:
        df["_lat_r"] = df["latitude"].round(ROUND_LAT_LON)
        df["_lon_r"] = df["longitude"].round(ROUND_LAT_LON)
        before_dedup = len(df)
        df = df.drop_duplicates(subset=["_lat_r", "_lon_r"], keep="first")
        df = df.drop(columns=["_lat_r", "_lon_r"])
        dropped_dup = before_dedup - len(df)

    out_cols = [
        "osm_type",
        "name",
        "surveillance_type",
        "opening_hours",
        "latitude",
        "longitude",
    ]
    df = df[out_cols].reset_index(drop=True)

    meta = {"dropped_invalid_or_oob": dropped_invalid_or_oob, "dropped_duplicates": dropped_dup}
    return df, meta


def main() -> None:
    parser = argparse.ArgumentParser(description="Clean safety_data.csv")
    parser.add_argument(
        "-i",
        "--input",
        type=Path,
        default=DEFAULT_IN,
        help=f"Input CSV (default: {DEFAULT_IN})",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=DEFAULT_OUT,
        help=f"Output CSV (default: {DEFAULT_OUT})",
    )
    parser.add_argument(
        "--no-dedup",
        action="store_true",
        help="Do not remove duplicate coordinates (rounded to 6 decimals)",
    )
    args = parser.parse_args()

    if not args.input.is_file():
        print(f"[ERR] Input not found: {args.input}", file=sys.stderr)
        sys.exit(1)

    df = pd.read_csv(args.input, encoding="utf-8-sig", dtype=str, keep_default_na=False)
    df, meta = clean_dataframe(df, dedup=not args.no_dedup)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(args.output, index=False, encoding="utf-8")

    print(f"[OK] Wrote {len(df)} rows -> {args.output}")
    print(
        f"     Dropped (invalid coords / out of bounds): {meta.get('dropped_invalid_or_oob', 0)}; "
        f"duplicate coords removed: {meta.get('dropped_duplicates', 0)}"
    )


if __name__ == "__main__":
    main()
