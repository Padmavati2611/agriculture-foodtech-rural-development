# SunChill — Solar-Powered Smart Mini Cold Storage for the North Eastern Region (NER)

AgriTech hackathon project under the theme **Agriculture, FoodTech & Rural Development**.
An off-grid, solar-powered, IoT-enabled mini cold storage unit that keeps fresh vegetables crisp
from farm gate to market — cutting NER post-harvest losses and raising farmer income.

## What's inside

| File | Purpose |
| --- | --- |
| `app.py` | Flask backend — serves the dashboard + `/api/*` routes (weather, geocoding, search, IoT sensor feed, status) |
| `index.html` | The SunChill dashboard (single-page site, all sections) |
| `static/styles.css` | Full design system (eco-green brand, gradients, responsive) |
| `static/script.js` | Front-end logic — location access, live weather, IoT/AI dashboard, alerts, sound, demo simulation |
| `requirements.txt` | Python dependencies |

## Run it (recommended — full API mode)

```bash
pip install -r requirements.txt
python app.py
```

Open **http://127.0.0.1:5000** — Weather, geocoding and search go through `app.py`,
which uses a proper User-Agent and caching for the free Open-Meteo / OpenStreetMap APIs.

## Or run it without Python

Just double-click `index.html` — the page auto-falls back to the browser calling
Open-Meteo / OpenStreetMap directly. (Browser geolocation needs `https://` or `localhost`,
so on a `file://` page the dashboard shows the honest "location unavailable" state.)

## API endpoints

- `GET /api/status` — unit metadata
- `GET /api/weather?lat=&lon=` — live outdoor weather (Open-Meteo, cached 5 min)
- `GET /api/reverse?lat=&lon=` — coordinates → city / region / country
- `GET /api/search?q=` — place search across Asia (cities, towns, small villages)
- `GET /api/sensor` — latest IoT sensor readings
- `POST /api/sensor` — push a real sensor reading `{temperature, humidity, battery, doorOpen, solar, cooling}`

## Live dashboard behaviour

- **Location & Weather** — browser GPS (or type any Asian city/village) → live outdoor
  temperature, humidity, condition, map. Calibrate to your own thermometer if the
  model value is a few degrees off.
- **Cold Storage Temperature** — shown only from a physical IoT sensor. The dashboard
  honestly reports *Not connected* until one is plugged in; a clearly-labelled
  **Demo Simulation** toggle shows what the dashboard looks like with simulated data.
- **Alerts & sound** — critical alerts (temp out of range, battery low, door open,
  sensor disconnected) with an audible siren; toggleable.
- **AI spoilage risk** — low / medium / high, labelled *Demo Prediction* until real
  sensor history is available.

## Roadmap summary

1. Field prototypes on NER farms (monsoon + winter data)
2. FPO/SHG cooperative rollout + multilingual farmer app
3. 500-unit network with mandi/retail integration

*Concept prototype prepared for hackathon evaluation.*