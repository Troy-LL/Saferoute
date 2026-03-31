from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.routing import get_walking_routes
from app.ml.safety_scorer import SafetyScorer
from app.limiter import limiter
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
import polyline as polyline_lib
import requests
import os

router = APIRouter()


class RailwaySchedule(BaseModel):
    line: str
    origin: str
    destination: str
    schedule_type: str
    first_train: str
    last_train: str
    notes: str


@router.get("/railway-schedules", response_model=List[RailwaySchedule])
def get_railway_schedules():
    import csv
    path = os.path.join("data", "railway_schedules.csv")
    if not os.path.exists(path):
        return []
    
    schedules = []
    with open(path, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            schedules.append(RailwaySchedule(
                line=row['Line'],
                origin=row['Origin_Station'],
                destination=row['Destination_Station'],
                schedule_type=row['Schedule_Type'],
                first_train=row['First_Train'],
                last_train=row['Last_Train'],
                notes=row['Notes']
            ))
    return schedules


def _is_placeholder_ors_key(key: str) -> bool:
    k = (key or "").strip().lower()
    if not k:
        return True
    if "your_openrouteservice" in k:
        return True
    if k in ("xxx", "changeme", "placeholder"):
        return True
    return False


def _ors_error_message(response) -> str:
    try:
        j = response.json()
        return (j.get("error") or j.get("message") or str(j))[:300]
    except Exception:
        return (response.text or "")[:300]


# Pelias / ORS geocode layer — higher = prefer for autocomplete
_LAYER_RANK = {
    "venue": 100,
    "address": 90,
    "street": 82,
    "neighbourhood": 75,
    "borough": 55,
    "localadmin": 50,
    "locality": 45,
    "county": 20,
    "macroregion": 5,
    "region": 3,
    "country": 0,
    "ocean": 0,
    "marinearea": 0,
}


def _layer_rank(layer: Optional[str]) -> int:
    if not layer:
        return 30
    return _LAYER_RANK.get(layer.lower(), 30)


STATION_HINTS = [
    {
        'label': 'Fernando Poe Jr. Station (LRT-1), Quezon City',
        'lat': 14.6575,
        'lng': 121.0211,
        'aliases': ['fernando poe jr.', 'fernando poe jr. station', 'lrt-1 fernando poe jr.']
    },
    {
        'label': 'Balintawak Station (LRT-1), Quezon City',
        'lat': 14.6577,
        'lng': 121.0039,
        'aliases': ['balintawak', 'balintawak station', 'lrt-1 balintawak']
    },
    {
        'label': 'Monumento Station (LRT-1), Caloocan',
        'lat': 14.6542,
        'lng': 120.9838,
        'aliases': ['monumento', 'monumento station', 'lrt-1 monumento']
    },
    {
        'label': '5th Avenue Station (LRT-1), Caloocan',
        'lat': 14.6444,
        'lng': 120.9835,
        'aliases': ['5th avenue', '5th avenue station', 'lrt-1 5th avenue']
    },
    {
        'label': 'R. Papa Station (LRT-1), Manila',
        'lat': 14.636,
        'lng': 120.9827,
        'aliases': ['r. papa', 'r. papa station', 'lrt-1 r. papa']
    },
    {
        'label': 'Abad Santos Station (LRT-1), Manila',
        'lat': 14.6304,
        'lng': 120.9813,
        'aliases': ['abad santos', 'abad santos station', 'lrt-1 abad santos']
    },
    {
        'label': 'Blumentritt Station (LRT-1), Manila',
        'lat': 14.6227,
        'lng': 120.9828,
        'aliases': ['blumentritt', 'blumentritt station', 'lrt-1 blumentritt']
    },
    {
        'label': 'Tayuman Station (LRT-1), Manila',
        'lat': 14.6167,
        'lng': 120.9832,
        'aliases': ['tayuman', 'tayuman station', 'lrt-1 tayuman']
    },
    {
        'label': 'Bambang Station (LRT-1), Manila',
        'lat': 14.6111,
        'lng': 120.9832,
        'aliases': ['bambang', 'bambang station', 'lrt-1 bambang']
    },
    {
        'label': 'Doroteo Jose Station (LRT-1), Manila',
        'lat': 14.6054,
        'lng': 120.9818,
        'aliases': ['doroteo jose', 'doroteo jose station', 'lrt-1 doroteo jose']
    },
    {
        'label': 'Carriedo Station (LRT-1), Manila',
        'lat': 14.5996,
        'lng': 120.9814,
        'aliases': ['carriedo', 'carriedo station', 'lrt-1 carriedo']
    },
    {
        'label': 'Central Terminal Station (LRT-1), Manila',
        'lat': 14.5925,
        'lng': 120.9817,
        'aliases': ['central terminal', 'central terminal station', 'lrt-1 central terminal']
    },
    {
        'label': 'United Nations Station (LRT-1), Manila',
        'lat': 14.5826,
        'lng': 120.9846,
        'aliases': ['united nations', 'united nations station', 'lrt-1 united nations']
    },
    {
        'label': 'Pedro Gil Station (LRT-1), Manila',
        'lat': 14.5768,
        'lng': 120.9883,
        'aliases': ['pedro gil', 'pedro gil station', 'lrt-1 pedro gil']
    },
    {
        'label': 'Quirino Station (LRT-1), Manila',
        'lat': 14.5703,
        'lng': 120.9913,
        'aliases': ['quirino', 'quirino station', 'lrt-1 quirino']
    },
    {
        'label': 'Vito Cruz Station (LRT-1), Manila',
        'lat': 14.5633,
        'lng': 120.9947,
        'aliases': ['vito cruz', 'vito cruz station', 'lrt-1 vito cruz']
    },
    {
        'label': 'Gil Puyat Station (LRT-1), Pasay',
        'lat': 14.554,
        'lng': 120.9972,
        'aliases': ['gil puyat', 'gil puyat station', 'lrt-1 gil puyat']
    },
    {
        'label': 'Libertad Station (LRT-1), Pasay',
        'lat': 14.5476,
        'lng': 120.9985,
        'aliases': ['libertad', 'libertad station', 'lrt-1 libertad']
    },
    {
        'label': 'EDSA Station (LRT-1), Pasay',
        'lat': 14.5377,
        'lng': 121.0003,
        'aliases': ['edsa', 'edsa station', 'lrt-1 edsa']
    },
    {
        'label': 'Baclaran Station (LRT-1), Pasay',
        'lat': 14.5343,
        'lng': 120.9983,
        'aliases': ['baclaran', 'baclaran station', 'lrt-1 baclaran']
    },
    {
        'label': 'Redemptorist-Aseana Station (LRT-1), Parañaque',
        'lat': 14.5298,
        'lng': 120.994,
        'aliases': ['redemptorist-aseana', 'redemptorist-aseana station', 'lrt-1 redemptorist-aseana']
    },
    {
        'label': 'MIA Road Station (LRT-1), Parañaque',
        'lat': 14.519,
        'lng': 120.9945,
        'aliases': ['mia road', 'mia road station', 'lrt-1 mia road']
    },
    {
        'label': 'Asiaworld (PITX) Station (LRT-1), Parañaque',
        'lat': 14.5118,
        'lng': 120.9958,
        'aliases': ['asiaworld (pitx)', 'asiaworld (pitx) station', 'lrt-1 asiaworld (pitx)']
    },
    {
        'label': 'Ninoy Aquino Station (LRT-1), Parañaque',
        'lat': 14.502,
        'lng': 120.9978,
        'aliases': ['ninoy aquino', 'ninoy aquino station', 'lrt-1 ninoy aquino']
    },
    {
        'label': 'Dr. Santos Station (LRT-1), Parañaque',
        'lat': 14.4925,
        'lng': 121.0011,
        'aliases': ['dr. santos', 'dr. santos station', 'lrt-1 dr. santos']
    },
    {
        'label': 'Recto Station (LRT-2), Manila',
        'lat': 14.6038,
        'lng': 120.9839,
        'aliases': ['recto', 'recto station', 'lrt-2 recto']
    },
    {
        'label': 'Legarda Station (LRT-2), Manila',
        'lat': 14.601,
        'lng': 120.9918,
        'aliases': ['legarda', 'legarda station', 'lrt-2 legarda']
    },
    {
        'label': 'Pureza Station (LRT-2), Manila',
        'lat': 14.6018,
        'lng': 121.005,
        'aliases': ['pureza', 'pureza station', 'lrt-2 pureza']
    },
    {
        'label': 'V. Mapa Station (LRT-2), Manila',
        'lat': 14.6042,
        'lng': 121.018,
        'aliases': ['v. mapa', 'v. mapa station', 'lrt-2 v. mapa']
    },
    {
        'label': 'J. Ruiz Station (LRT-2), San Juan',
        'lat': 14.6105,
        'lng': 121.0255,
        'aliases': ['j. ruiz', 'j. ruiz station', 'lrt-2 j. ruiz']
    },
    {
        'label': 'Gilmore Station (LRT-2), Quezon City',
        'lat': 14.6135,
        'lng': 121.0345,
        'aliases': ['gilmore', 'gilmore station', 'lrt-2 gilmore']
    },
    {
        'label': 'Betty Go-Belmonte Station (LRT-2), Quezon City',
        'lat': 14.6186,
        'lng': 121.0435,
        'aliases': ['betty go-belmonte', 'betty go-belmonte station', 'lrt-2 betty go-belmonte']
    },
    {
        'label': 'Araneta Center-Cubao (LRT2) Station (LRT-2), Quezon City',
        'lat': 14.6224,
        'lng': 121.0526,
        'aliases': ['araneta center-cubao (lrt2)', 'araneta center-cubao (lrt2) station', 'lrt-2 araneta center-cubao (lrt2)']
    },
    {
        'label': 'Anonas Station (LRT-2), Quezon City',
        'lat': 14.6281,
        'lng': 121.0645,
        'aliases': ['anonas', 'anonas station', 'lrt-2 anonas']
    },
    {
        'label': 'Katipunan Station (LRT-2), Quezon City',
        'lat': 14.6318,
        'lng': 121.0734,
        'aliases': ['katipunan', 'katipunan station', 'lrt-2 katipunan']
    },
    {
        'label': 'Santolan Station (LRT-2), Pasig',
        'lat': 14.6219,
        'lng': 121.0858,
        'aliases': ['santolan', 'santolan station', 'lrt-2 santolan']
    },
    {
        'label': 'Marikina-Pasig Station (LRT-2), Marikina',
        'lat': 14.619,
        'lng': 121.1011,
        'aliases': ['marikina-pasig', 'marikina-pasig station', 'lrt-2 marikina-pasig']
    },
    {
        'label': 'Antipolo Station (LRT-2), Antipolo',
        'lat': 14.6248,
        'lng': 121.1215,
        'aliases': ['antipolo', 'antipolo station', 'lrt-2 antipolo']
    },
    {
        'label': 'North Avenue Station (MRT-3), Quezon City',
        'lat': 14.6521,
        'lng': 121.0323,
        'aliases': ['north avenue', 'north avenue station', 'mrt-3 north avenue']
    },
    {
        'label': 'Quezon Avenue Station (MRT-3), Quezon City',
        'lat': 14.6425,
        'lng': 121.0378,
        'aliases': ['quezon avenue', 'quezon avenue station', 'mrt-3 quezon avenue']
    },
    {
        'label': 'GMA-Kamuning Station (MRT-3), Quezon City',
        'lat': 14.6353,
        'lng': 121.0433,
        'aliases': ['gma-kamuning', 'gma-kamuning station', 'mrt-3 gma-kamuning']
    },
    {
        'label': 'Araneta Center-Cubao (MRT3) Station (MRT-3), Quezon City',
        'lat': 14.6195,
        'lng': 121.0511,
        'aliases': ['araneta center-cubao (mrt3)', 'araneta center-cubao (mrt3) station', 'mrt-3 araneta center-cubao (mrt3)']
    },
    {
        'label': 'Santolan-Annapolis Station (MRT-3), Quezon City',
        'lat': 14.6078,
        'lng': 121.0564,
        'aliases': ['santolan-annapolis', 'santolan-annapolis station', 'mrt-3 santolan-annapolis']
    },
    {
        'label': 'Ortigas Station (MRT-3), Mandaluyong',
        'lat': 14.5878,
        'lng': 121.0567,
        'aliases': ['ortigas', 'ortigas station', 'mrt-3 ortigas']
    },
    {
        'label': 'Shaw Boulevard Station (MRT-3), Mandaluyong',
        'lat': 14.5813,
        'lng': 121.0536,
        'aliases': ['shaw boulevard', 'shaw boulevard station', 'mrt-3 shaw boulevard']
    },
    {
        'label': 'Boni Station (MRT-3), Mandaluyong',
        'lat': 14.5739,
        'lng': 121.0481,
        'aliases': ['boni', 'boni station', 'mrt-3 boni']
    },
    {
        'label': 'Guadalupe Station (MRT-3), Makati',
        'lat': 14.5673,
        'lng': 121.0455,
        'aliases': ['guadalupe', 'guadalupe station', 'mrt-3 guadalupe']
    },
    {
        'label': 'Buendia Station (MRT-3), Makati',
        'lat': 14.5542,
        'lng': 121.0321,
        'aliases': ['buendia', 'buendia station', 'mrt-3 buendia']
    },
    {
        'label': 'Ayala Station (MRT-3), Makati',
        'lat': 14.5491,
        'lng': 121.0278,
        'aliases': ['ayala', 'ayala station', 'mrt-3 ayala']
    },
    {
        'label': 'Magallanes Station (MRT-3), Makati',
        'lat': 14.542,
        'lng': 121.0195,
        'aliases': ['magallanes', 'magallanes station', 'mrt-3 magallanes']
    },
    {
        'label': 'Taft Avenue Station (MRT-3), Pasay',
        'lat': 14.5376,
        'lng': 121.0013,
        'aliases': ['taft avenue', 'taft avenue station', 'mrt-3 taft avenue']
    },
    {
        'label': 'University of the Philippines Diliman, Quezon City',
        'lat': 14.6549,
        'lng': 121.0645,
        'aliases': ['university of the philippines diliman']
    },
    {
        'label': 'UP Diliman - University Avenue Gate, Quezon City',
        'lat': 14.6508,
        'lng': 121.0594,
        'aliases': ['up diliman - university avenue gate', 'up diliman', 'university avenue gate']
    },
    {
        'label': 'UP Diliman - Katipunan Gate (UP Town Side), Quezon City',
        'lat': 14.6505,
        'lng': 121.0741,
        'aliases': ['up diliman - katipunan gate (up town side)', 'up diliman', 'katipunan gate (up town side)', 'up diliman - katipunan gate']
    },
    {
        'label': 'UP Diliman - CP Garcia Gate, Quezon City',
        'lat': 14.6582,
        'lng': 121.0664,
        'aliases': ['up diliman - cp garcia gate', 'up diliman', 'cp garcia gate']
    },
    {
        'label': 'UP Diliman - Velasquez Gate, Quezon City',
        'lat': 14.6535,
        'lng': 121.0615,
        'aliases': ['up diliman - velasquez gate', 'up diliman', 'velasquez gate']
    },
    {
        'label': 'Ateneo de Manila University, Quezon City',
        'lat': 14.6397,
        'lng': 121.0775,
        'aliases': ['ateneo de manila university']
    },
    {
        'label': 'Ateneo Gate 1, Quezon City',
        'lat': 14.6345,
        'lng': 121.0774,
        'aliases': ['ateneo gate 1']
    },
    {
        'label': 'Ateneo Gate 2, Quezon City',
        'lat': 14.6375,
        'lng': 121.0778,
        'aliases': ['ateneo gate 2']
    },
    {
        'label': 'Ateneo Gate 3, Quezon City',
        'lat': 14.6405,
        'lng': 121.0782,
        'aliases': ['ateneo gate 3']
    },
    {
        'label': 'Miriam College, Quezon City',
        'lat': 14.6465,
        'lng': 121.0763,
        'aliases': ['miriam college']
    },
    {
        'label': 'University of Santo Tomas, Manila',
        'lat': 14.6091,
        'lng': 120.9896,
        'aliases': ['university of santo tomas']
    },
    {
        'label': 'UST - España Gate (Main), Manila',
        'lat': 14.6083,
        'lng': 120.9898,
        'aliases': ['ust - españa gate (main)', 'ust', 'españa gate (main)', 'ust - españa gate']
    },
    {
        'label': 'UST - P. Noval Gate, Manila',
        'lat': 14.6095,
        'lng': 120.9868,
        'aliases': ['ust - p. noval gate', 'ust', 'p. noval gate']
    },
    {
        'label': 'UST - Dapitan Gate, Manila',
        'lat': 14.6116,
        'lng': 120.9893,
        'aliases': ['ust - dapitan gate', 'ust', 'dapitan gate']
    },
    {
        'label': 'UST - Lacson Gate, Manila',
        'lat': 14.6105,
        'lng': 120.9925,
        'aliases': ['ust - lacson gate', 'ust', 'lacson gate']
    },
    {
        'label': 'De La Salle University Manila, Manila',
        'lat': 14.5648,
        'lng': 120.9932,
        'aliases': ['de la salle university manila']
    },
    {
        'label': 'DLSU - North Gate (Taft), Manila',
        'lat': 14.5661,
        'lng': 120.9926,
        'aliases': ['dlsu - north gate (taft)', 'dlsu', 'north gate (taft)', 'dlsu - north gate']
    },
    {
        'label': 'DLSU - South Gate (Taft), Manila',
        'lat': 14.5641,
        'lng': 120.9935,
        'aliases': ['dlsu - south gate (taft)', 'dlsu', 'south gate (taft)', 'dlsu - south gate']
    },
    {
        'label': 'DLSU - Agno Gate, Manila',
        'lat': 14.5645,
        'lng': 120.9918,
        'aliases': ['dlsu - agno gate', 'dlsu', 'agno gate']
    },
    {
        'label': 'Polytechnic University of the Philippines, Manila',
        'lat': 14.5982,
        'lng': 121.0108,
        'aliases': ['polytechnic university of the philippines']
    },
    {
        'label': 'PUP - Main Gate, Manila',
        'lat': 14.5975,
        'lng': 121.0101,
        'aliases': ['pup - main gate', 'pup', 'main gate']
    },
    {
        'label': 'Far Eastern University Manila, Manila',
        'lat': 14.6041,
        'lng': 120.9863,
        'aliases': ['far eastern university manila']
    },
    {
        'label': 'Centro Escolar University, Manila',
        'lat': 14.5991,
        'lng': 120.9902,
        'aliases': ['centro escolar university']
    },
    {
        'label': 'Adamson University, Manila',
        'lat': 14.5878,
        'lng': 120.9861,
        'aliases': ['adamson university']
    },
    {
        'label': 'Mapúa University, Manila',
        'lat': 14.5906,
        'lng': 120.9774,
        'aliases': ['mapúa university']
    },
    {
        'label': 'University of the East Manila, Manila',
        'lat': 14.6019,
        'lng': 120.9888,
        'aliases': ['university of the east manila']
    },
    {
        'label': 'National University Manila, Manila',
        'lat': 14.6046,
        'lng': 120.9944,
        'aliases': ['national university manila']
    },
    {
        'label': 'Pamantasan ng Lungsod ng Maynila, Manila',
        'lat': 14.5866,
        'lng': 120.9763,
        'aliases': ['pamantasan ng lungsod ng maynila']
    },
    {
        'label': 'Technological University of the Philippines, Manila',
        'lat': 14.5873,
        'lng': 120.9845,
        'aliases': ['technological university of the philippines']
    },
    {
        'label': 'Philippine Normal University, Manila',
        'lat': 14.5886,
        'lng': 120.9835,
        'aliases': ['philippine normal university']
    },
    {
        'label': 'San Beda University, Manila',
        'lat': 14.5997,
        'lng': 120.9919,
        'aliases': ['san beda university']
    },
    {
        'label': 'Colegio de San Juan de Letran, Manila',
        'lat': 14.5937,
        'lng': 120.9765,
        'aliases': ['colegio de san juan de letran']
    },
    {
        'label': 'Technological Institute of the Philippines Manila, Manila',
        'lat': 14.5947,
        'lng': 120.9892,
        'aliases': ['technological institute of the philippines manila']
    },
    {
        'label': 'Technological Institute of the Philippines QC, Quezon City',
        'lat': 14.6231,
        'lng': 121.0575,
        'aliases': ['technological institute of the philippines qc']
    },
    {
        'label': 'Quezon City University - Main, Quezon City',
        'lat': 14.7008,
        'lng': 121.0335,
        'aliases': ['quezon city university - main', 'quezon city university', 'main']
    },
    {
        'label': 'Quezon City University - Batasan, Quezon City',
        'lat': 14.6936,
        'lng': 121.0945,
        'aliases': ['quezon city university - batasan', 'quezon city university', 'batasan']
    },
    {
        'label': 'Quezon City University - San Francisco, Quezon City',
        'lat': 14.6585,
        'lng': 121.0205,
        'aliases': ['quezon city university - san francisco', 'quezon city university', 'san francisco']
    },
    {
        'label': 'New Era University, Quezon City',
        'lat': 14.6644,
        'lng': 121.0566,
        'aliases': ['new era university']
    },
    {
        'label': 'World Citi Colleges QC, Quezon City',
        'lat': 14.6247,
        'lng': 121.0622,
        'aliases': ['world citi colleges qc']
    },
    {
        'label': 'Trinity University of Asia, Quezon City',
        'lat': 14.6199,
        'lng': 121.0189,
        'aliases': ['trinity university of asia']
    },
    {
        'label': 'St. Paul University Quezon City, Quezon City',
        'lat': 14.6148,
        'lng': 121.0345,
        'aliases': ['st. paul university quezon city']
    },
    {
        'label': 'St. Paul University Manila, Manila',
        'lat': 14.5745,
        'lng': 120.9902,
        'aliases': ['st. paul university manila']
    },
    {
        'label': 'Arellano University Main, Manila',
        'lat': 14.6015,
        'lng': 120.9934,
        'aliases': ['arellano university main']
    },
    {
        'label': 'Manila Central University, Manila',
        'lat': 14.6582,
        'lng': 120.9847,
        'aliases': ['manila central university']
    },
    {
        'label': 'Our Lady of Fatima University QC, Quezon City',
        'lat': 14.7005,
        'lng': 121.0543,
        'aliases': ['our lady of fatima university qc']
    },
    {
        'label': 'FEU-NRMF, Quezon City',
        'lat': 14.6836,
        'lng': 121.0614,
        'aliases': ['feu-nrmf']
    },
    {
        'label': 'AMA Computer University, Quezon City',
        'lat': 14.6685,
        'lng': 121.0195,
        'aliases': ['ama computer university']
    },
    {
        'label': 'STI College Quezon Avenue, Quezon City',
        'lat': 14.6394,
        'lng': 121.0315,
        'aliases': ['sti college quezon avenue']
    },
    {
        'label': 'De Ocampo Memorial College, Manila',
        'lat': 14.5995,
        'lng': 121.0025,
        'aliases': ['de ocampo memorial college']
    },
    {
        'label': 'La Consolacion College Manila, Manila',
        'lat': 14.5985,
        'lng': 120.9915,
        'aliases': ['la consolacion college manila']
    },
    {
        'label': 'St. Jude College Manila, Manila',
        'lat': 14.6105,
        'lng': 120.9882,
        'aliases': ['st. jude college manila']
    },
    {
        'label': 'NCBA - Fairview, Quezon City',
        'lat': 14.7052,
        'lng': 121.0604,
        'aliases': ['ncba - fairview', 'ncba', 'fairview']
    },
    {
        'label': 'NCBA - Cubao, Quezon City',
        'lat': 14.6225,
        'lng': 121.0555,
        'aliases': ['ncba - cubao', 'ncba', 'cubao']
    },
    {
        'label': 'Central Colleges of the Philippines, Quezon City',
        'lat': 14.6074,
        'lng': 121.0142,
        'aliases': ['central colleges of the philippines']
    },
    {
        'label': 'Eulogio Amang Rodriguez Institute (EARIST), Manila',
        'lat': 14.5991,
        'lng': 121.0044,
        'aliases': ['eulogio amang rodriguez institute (earist)', 'eulogio amang rodriguez institute']
    },
    {
        'label': 'Philippine Womens University, Manila',
        'lat': 14.5748,
        'lng': 120.9893,
        'aliases': ["philippine women's university"]
    },
    {
        'label': 'Lyceum of the Philippines University, Manila',
        'lat': 14.5925,
        'lng': 120.9764,
        'aliases': ['lyceum of the philippines university']
    },
    {
        'label': 'Asian College Quezon City, Quezon City',
        'lat': 14.6235,
        'lng': 121.0595,
        'aliases': ['asian college quezon city']
    },
    {
        'label': 'CIIT College of Arts and Technology, Quezon City',
        'lat': 14.6335,
        'lng': 121.0345,
        'aliases': ['ciit college of arts and technology']
    },
    {
        'label': 'National Teachers College, Manila',
        'lat': 14.5975,
        'lng': 120.9895,
        'aliases': ['national teachers college']
    },
    {
        'label': 'St. Marys College of QC, Quezon City',
        'lat': 14.6275,
        'lng': 121.0255,
        'aliases': ["st. mary's college of qc"]
    },
    {
        'label': 'Siena College of Quezon City, Quezon City',
        'lat': 14.6385,
        'lng': 121.0125,
        'aliases': ['siena college of quezon city']
    },
    {
        'label': 'UP Manila - College of Medicine, Manila',
        'lat': 14.5775,
        'lng': 120.9865,
        'aliases': ['up manila - college of medicine', 'up manila', 'college of medicine']
    },
    {
        'label': 'UP Manila - PGH, Manila',
        'lat': 14.5795,
        'lng': 120.9875,
        'aliases': ['up manila - pgh', 'up manila', 'pgh']
    },
    {
        'label': 'UE Ramon Magsaysay (UERM), Quezon City',
        'lat': 14.6085,
        'lng': 121.0165,
        'aliases': ['ue ramon magsaysay (uerm)', 'ue ramon magsaysay']
    },
    {
        'label': 'San Sebastian College - Recoletos, Manila',
        'lat': 14.6002,
        'lng': 120.9885,
        'aliases': ['san sebastian college - recoletos', 'san sebastian college', 'recoletos']
    },
    {
        'label': 'Chiang Kai Shek College, Manila',
        'lat': 14.6115,
        'lng': 120.9785,
        'aliases': ['chiang kai shek college']
    },
    {
        'label': 'EAC - Emilio Aguinaldo College, Manila',
        'lat': 14.5845,
        'lng': 120.9885,
        'aliases': ['eac - emilio aguinaldo college', 'eac', 'emilio aguinaldo college']
    },
    {
        'label': 'St. Scholasticas College, Manila',
        'lat': 14.5635,
        'lng': 120.9945,
        'aliases': ["st. scholastica's college"]
    },
    {
        'label': 'PCU - Philippine Christian University, Manila',
        'lat': 14.5755,
        'lng': 120.9895,
        'aliases': ['pcu - philippine christian university', 'pcu', 'philippine christian university']
    },
    {
        'label': 'Dasmariñas Village Gate (for Mapua/DLSU reference), Manila',
        'lat': 14.5915,
        'lng': 120.9765,
        'aliases': ['dasmariñas village gate (for mapua/dlsu reference)', 'dasmariñas village gate']
    },
    {
        'label': 'FEU Diliman, Quezon City',
        'lat': 14.6855,
        'lng': 121.0825,
        'aliases': ['feu diliman']
    },
    {
        'label': 'Access Computer College, Manila',
        'lat': 14.6035,
        'lng': 120.9835,
        'aliases': ['access computer college']
    },
]

def _metro_manila_poi_hints(raw: str) -> List[Dict[str, Any]]:
    """Curated suggestions matching prefixes and aliases for fast autocomplete."""
    # Strip the suffix added by the frontend's RoutePlanner
    q = raw.lower().replace("metro manila philippines", "").strip()
    if len(q) < 2:
        return []
    
    hints: List[Dict[str, Any]] = []
    q_words = q.replace('-', ' ').split()
    
    for h in STATION_HINTS:
        searchable_text = f"{h['label'].lower()} {' '.join(h['aliases'])}".replace('-', ' ')
        if all(w in searchable_text for w in q_words):
            hints.append({
                "label": h["label"],
                "lat": h["lat"],
                "lng": h["lng"]
            })
            if len(hints) >= 8:
                break
    return hints

def _feature_to_result(f: Dict[str, Any]) -> Dict[str, Any]:
    coords = f["geometry"]["coordinates"]
    props = f.get("properties") or {}
    return {
        "label": props.get("label", ""),
        "lat": coords[1],
        "lng": coords[0],
        "_layer": props.get("layer"),
        "_rank": _layer_rank(props.get("layer")),
    }


def _merge_geocode_results(
    hints: List[Dict[str, Any]],
    ors_sorted: List[Dict[str, Any]],
    max_size: int = 8,
) -> List[Dict[str, Any]]:
    seen: set[str] = set()
    out: List[Dict[str, Any]] = []

    def push(r: Dict[str, Any]) -> None:
        label = (r.get("label") or "").strip().lower()
        if not label or label in seen:
            return
        seen.add(label)
        clean = {"label": r["label"], "lat": r["lat"], "lng": r["lng"]}
        out.append(clean)

    for h in hints:
        if len(out) >= max_size:
            break
        push(h)

    for r in ors_sorted:
        if len(out) >= max_size:
            break
        push(r)

    return out


class RouteRequest(BaseModel):
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float
    time_of_day: Optional[int] = None  # Hour (0-23)


class RouteOption(BaseModel):
    route_id: int
    geometry: List[List[float]]  # [[lng, lat], ...]
    distance_km: float
    duration_minutes: int
    safety_score: float
    color: str  # 'green', 'yellow', 'red'
    safety_label: str
    passed_safe_spots: List[str] = []

@router.post("/calculate-route", response_model=List[RouteOption])
@limiter.limit("5/minute")
def calculate_route(request: Request, body: RouteRequest, db: Session = Depends(get_db)):
    """
    Calculate 2-3 walking routes with safety scores.
    Returns routes sorted by safety score (safest first).
    """
    try:
        # Get routes from OpenRouteService
        start_coords = [body.start_lng, body.start_lat]
        end_coords = [body.end_lng, body.end_lat]

        ors_routes = get_walking_routes(start_coords, end_coords, alternatives=2)

        # Initialize safety scorer
        scorer = SafetyScorer(db)

        # Calculate safety for each route
        route_options = []
        for i, route in enumerate(ors_routes):
            # Decode polyline geometry
            decoded = polyline_lib.decode(route['geometry'])  # Returns [(lat, lng), ...]
            coords_lnglat = [[lng, lat] for lat, lng in decoded]  # Convert to [lng, lat]

            # Calculate safety score
            safety_score = scorer.calculate_route_safety(
                coords_lnglat,
                time_of_day=request.time_of_day
            )
            passed = scorer.get_passed_safe_spots(coords_lnglat, radius_meters=150)

            route_options.append(RouteOption(
                route_id=i + 1,
                geometry=coords_lnglat,
                distance_km=round(route['distance'] / 1000, 2),
                duration_minutes=round(route['duration'] / 60),
                safety_score=safety_score,
                color=SafetyScorer.score_to_color(safety_score),
                safety_label=SafetyScorer.score_to_label(safety_score),
                passed_safe_spots=passed
            ))

        # Sort by safety score (safest first)
        route_options.sort(key=lambda r: r.safety_score, reverse=True)

        return route_options

    except HTTPException as e:
        # Re-raise explicit HTTP exceptions from services (like 403 for ORS)
        raise e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Log unexpected errors to server logs for debugging
        print(f"CRITICAL: Failed to calculate route: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@router.get("/geocode")
def geocode_address(address: str):
    """
    Geocode / autocomplete endpoint.
    Priority:
      1) Local POI overrides for key demo spots
      2) Metro Manila POI hints (hard-coded)
      3) OpenRouteService Pelias geocoder (Philippines-bounded)
    """
    addr_key = address.strip().lower()
    poi_overrides = {
        "katipunan station, quezon city": (14.6392, 121.0741),
        "katipunan station, quezon city, metro manila, philippines": (14.6392, 121.0741),
        "ateneo gate 2, quezon city": (14.6409, 121.0734),
        "ateneo gate 2, quezon city, metro manila, philippines": (14.6409, 121.0734),
    }
    if addr_key in poi_overrides:
        lat, lng = poi_overrides[addr_key]
        return {
            "results": [{
                "label": address,
                "lat": lat,
                "lng": lng,
            }]
        }

    hints = _metro_manila_poi_hints(address)

    api_key = os.getenv("OPENROUTESERVICE_API_KEY")
    if not api_key or _is_placeholder_ors_key(api_key):
        if hints:
            return {"results": hints[:4]}
        raise HTTPException(
            status_code=503,
            detail=(
                "No geocoding service configured. Set OPENROUTESERVICE_API_KEY "
                "in saferoute-backend/.env"
            ),
        )

    # Fast Path: If we have strong local hints (like stations or campus POIs),
    # return immediately. This makes autocomplete 100x faster (0ms vs 2000ms ORS delay)
    if len(hints) >= 1:
        return {"results": hints}

    url = "https://api.openrouteservice.org/geocode/search"
    base_params: Dict[str, Any] = {
        "api_key": api_key,
        "text": address,
        "boundary.country": "PH",
        "boundary.rect": "120.90,14.10,121.20,14.90",
        # Bias toward Katipunan / central QC (reduces generic “NCR” hits)
        "focus.point.lat": "14.639",
        "focus.point.lon": "121.074",
        "size": 12,
    }

    ors_results: List[Dict[str, Any]] = []
    for use_layers in (True, False):
        params = dict(base_params)
        if use_layers:
            params["layers"] = (
                "venue,address,street,neighbourhood,borough,localadmin,locality"
            )
        try:
            response = requests.get(url, params=params, timeout=2.0)
        except Exception as ex:
            raise HTTPException(status_code=502, detail="Geocoding service error") from ex
        if response.status_code != 200:
            if use_layers:
                continue
            msg = _ors_error_message(response)
            raise HTTPException(
                status_code=502,
                detail=(
                    f"Geocoding failed (OpenRouteService HTTP {response.status_code}): {msg}"
                ),
            )
        data = response.json()
        features = data.get("features", [])
        ors_results = [_feature_to_result(f) for f in features]
        ors_results.sort(key=lambda r: r.get("_rank", 0), reverse=True)
        if ors_results:
            best = ors_results[0].get("_rank", 0)
            if best >= 45:
                ors_results = [r for r in ors_results if r.get("_rank", 0) >= 20]
            break
        if not use_layers:
            break

    merged = _merge_geocode_results(hints, ors_results, max_size=8)
    return {"results": merged}
