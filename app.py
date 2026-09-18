"""
SunChill — Solar-Powered Smart Mini Cold Storage for the North Eastern Region (NER)

Flask backend:
  * Serves the SunChill dashboard (index.html).
  * Server-side proxies for weather, reverse-geocoding and location search
    (respectful User-Agent + response caching, so the free APIs are used properly).
  * Optional IoT sensor feed — POST real sensor readings, GET the latest.

Run:
  pip install -r requirements.txt
  python app.py
Then open http://127.0.0.1:5000
"""

import json
import threading
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone

from flask import Flask, jsonify, request, render_template

app = Flask(__name__, template_folder=".", static_folder="static")

# --------------------------------------------------------------------------
# External data sources
# --------------------------------------------------------------------------
OPENMETEO = "https://api.open-meteo.com/v1/forecast"
NOMINATIM = "https://nominatim.openstreetmap.org"
USER_AGENT = "SunChill-Hackathon/1.0 (agriculture-foodtech-demo)"

ASIA_COUNTRY_CODES = {
    "af", "am", "az", "bh", "bd", "bt", "bn", "kh", "cn", "cy", "ge", "hk",
    "in", "id", "ir", "iq", "il", "jp", "jo", "kz", "kw", "kg", "la", "lb",
    "ly", "my", "mv", "mn", "mm", "np", "kp", "om", "pk", "ps", "ph", "qa",
    "mo", "sa", "sg", "kr", "lk", "sy", "tw", "tj", "th", "tl", "tr", "tm",
    "ae", "uz", "vn", "ye", "ru",
}

# --------------------------------------------------------------------------
# Simple thread-safe cache for external API calls
# --------------------------------------------------------------------------
_cache = {}
_cache_lock = threading.Lock()
CACHE_TTL = 300  # seconds


def _cached(key, ttl=CACHE_TTL):
    with _cache_lock:
        row = _cache.get(key)
        if row and time.time() - row["ts"] < ttl:
            return row["data"]
    return None


def _store(key, data):
    with _cache_lock:
        _cache[key] = {"ts": time.time(), "data": data}
        if len(_cache) > 256:
            oldest = min(_cache, key=lambda k: _cache[k]["ts"])
            _cache.pop(oldest, None)


def _http_get_json(url, timeout=12):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _err(message, code=502):
    return jsonify({"ok": False, "error": message}), code


# --------------------------------------------------------------------------
# System metadata for the dashboard
# --------------------------------------------------------------------------
UNIT = {
    "id": "SC-NER-001",
    "name": "SunChill Unit · Room 1",
    "capacity_tonnes": "2–5",
    "temp_range_c": "2–10",
    "safe_temp_max_c": 9,
    "battery_critical_pct": 20,
    "energy": "100% solar",
    "demo_recommended": True,
}


# --------------------------------------------------------------------------
# IoT sensor feed (in-memory; swap in a real DB/queue for production)
# --------------------------------------------------------------------------
SENSOR_STORE = {"latest": None, "history": []}
SENSOR_LOCK = threading.Lock()
MAX_HISTORY = 500


@app.route("/api/status")
def api_status():
    return jsonify({"ok": True, "unit": UNIT})


@app.route("/api/sensor", methods=["GET", "POST"])
def api_sensor():
    if request.method == "POST":
        payload = request.get_json(silent=True) or {}
        if not any(k in payload for k in ("temperature", "humidity", "battery", "doorOpen", "solar", "cooling")):
            return _err("no sensor fields provided", 400)
        reading = {
            "temperature": payload.get("temperature"),
            "humidity": payload.get("humidity"),
            "battery": payload.get("battery"),
            "door_open": bool(payload.get("doorOpen")),
            "solar_kw": payload.get("solar"),
            "cooling": payload.get("cooling"),
            "received_at": datetime.now(timezone.utc).isoformat(),
        }
        with SENSOR_LOCK:
            SENSOR_STORE["latest"] = reading
            SENSOR_STORE["history"].append(reading)
            SENSOR_STORE["history"] = SENSOR_STORE["history"][-MAX_HISTORY:]
        return jsonify({"ok": True, "reading": reading}), 201

    with SENSOR_LOCK:
        latest = SENSOR_STORE["latest"]
        history = SENSOR_STORE["history"][-50:]
    return jsonify({
        "ok": True,
        "connected": latest is not None,
        "latest": latest,
        "history": history,
        "count": len(SENSOR_STORE["history"]),
    })


# --------------------------------------------------------------------------
# Weather (Open-Meteo, live surface conditions)
# --------------------------------------------------------------------------
@app.route("/api/weather")
def api_weather():
    try:
        lat = float(request.args.get("lat"))
        lon = float(request.args.get("lon"))
    except (TypeError, ValueError):
        return _err("lat and lon are required", 400)

    key = ("weather", round(lat, 3), round(lon, 3))
    cached = _cached(key)
    if cached:
        return jsonify({"ok": True, "cache": "hit", **cached})

    q = urllib.parse.urlencode({
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,weather_code",
        "temperature_unit": "celsius",
    })
    try:
        data = _http_get_json(f"{OPENMETEO}?{q}")
    except Exception as exc:  # noqa: BLE001
        return _err(f"weather API unreachable: {exc}")

    current = data.get("current", {})
    result = {
        "temperature_2m": current.get("temperature_2m"),
        "relative_humidity_2m": current.get("relative_humidity_2m"),
        "weather_code": current.get("weather_code"),
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }
    _store(key, result)
    return jsonify({"ok": True, "cache": "miss", **result})


# --------------------------------------------------------------------------
# Reverse geocoding (coordinates -> city / region / country)
# --------------------------------------------------------------------------
@app.route("/api/reverse")
def api_reverse():
    try:
        lat = float(request.args.get("lat"))
        lon = float(request.args.get("lon"))
    except (TypeError, ValueError):
        return _err("lat and lon are required", 400)

    key = ("reverse", round(lat, 4), round(lon, 4))
    cached = _cached(key, ttl=86400)
    if cached:
        return jsonify({"ok": True, "cache": "hit", **cached})
    try:
        data = _http_get_json(
            f"{NOMINATIM}/reverse?format=jsonv2&accept-language=en&lat={lat}&lon={lon}"
        )
    except Exception as exc:  # noqa: BLE001
        return _err(f"reverse geocoding unavailable: {exc}")

    addr = data.get("address", {})
    result = {
        "city": addr.get("city") or addr.get("town") or addr.get("village")
        or addr.get("municipality") or addr.get("county") or addr.get("state_district") or "Unknown",
        "region": addr.get("state") or addr.get("state_district") or addr.get("region") or "",
        "country": addr.get("country") or "",
    }
    _store(key, result)
    return jsonify({"ok": True, "cache": "miss", **result})


# --------------------------------------------------------------------------
# Location search (cities, towns and small villages — Asia-first)
# --------------------------------------------------------------------------
@app.route("/api/search")
def api_search():
    q = (request.args.get("q") or "").strip()
    if not q:
        return _err("q is required", 400)

    key = ("search", q.lower())
    cached = _cached(key, ttl=86400)
    if cached:
        return jsonify({"ok": True, "cache": "hit", "results": cached})

    try:
        data = _http_get_json(
            f"{NOMINATIM}/search?format=jsonv2&limit=10&addressdetails=1"
            f"&accept-language=en&q={urllib.parse.quote(q)}"
        )
    except Exception as exc:  # noqa: BLE001
        return _err(f"search service unavailable: {exc}")

    hits = []
    for h in data:
        addr = h.get("address", {})
        cc = (addr.get("country_code") or "").lower()
        if cc in ASIA_COUNTRY_CODES:
            hits.append(h)
    if not hits:
        for h in data:
            if h.get("address", {}).get("country_code"):
                hits.append(h)

    results = [
        {
            "latitude": parse_float(h.get("lat")),
            "longitude": parse_float(h.get("lon")),
            "accuracy": parse_float(h.get("accuracy")),
            "display_name": h.get("display_name", ""),
        }
        for h in hits[:10]
    ]
    _store(key, results)
    return jsonify({"ok": True, "cache": "miss", "results": results})


def parse_float(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


# --------------------------------------------------------------------------
# Pages
# --------------------------------------------------------------------------
@app.route("/")
def index():
    return render_template("index.html")


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)