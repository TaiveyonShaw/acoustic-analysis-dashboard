# Acoustic Analysis Dashboard

Interactive **React** dashboard for **OSF thestruct MAT** files — ILD/ITD spatial maps from hearing-aid research data. A FastAPI backend loads MATLAB structs; the frontend renders charts with **Canvas** (no Plotly/Recharts) for a small bundle and fast paint.

## Architecture

```
frontend/          React + Vite + plain CSS (Canvas charts)
api/main.py        FastAPI — OSF catalog + POST /api/analyze
src/acoustic_analysis/   thestruct MAT loading & direction accuracy
```

**Speed choices**

- OSF file listing proxied through the API (avoids browser CORS)
- Canvas 2D rendering instead of heavy chart libraries
- Debounced re-analysis when the selected record changes
- `AbortController` cancels in-flight requests on new selections

## Quick start (development)

```bash
# Terminal 1 — API
python -m venv .venv && source .venv/bin/activate
pip install -e .
uvicorn api.main:app --reload --port 8000

# Terminal 2 — frontend
cd frontend && npm install && npm run dev
```

Open [http://localhost:5173](http://localhost:5173) (Vite proxies `/api` to port 8000).

Or use the helper script:

```bash
chmod +x scripts/dev.sh && ./scripts/dev.sh
```

## Production build (local)

```bash
cd frontend && npm run build
uvicorn api.main:app --host 0.0.0.0 --port 8000
```

The API serves `frontend/dist` when present.

## Deploy on Render

One **Web Service** runs the API and the built React UI (Docker).

### Option A — Blueprint (recommended)

1. Push this repo to GitHub.
2. In [Render](https://render.com) → **New** → **Blueprint** → connect the repo.
3. Render reads `render.yaml` and creates the web service.
4. After deploy, open `https://<your-service>.onrender.com`.

### Option B — Manual Web Service

1. **New** → **Web Service** → connect the repo.
2. **Runtime:** Docker  
3. **Dockerfile path:** `./Dockerfile`  
4. **Health check path:** `/api/health`  
5. Deploy.

### Notes for Render free tier

| Topic | Detail |
|-------|--------|
| **Cold starts** | Service sleeps after ~15 min idle; first request may take a few seconds while Python loads. |
| **RAM** | **512 MB** is sufficient for MAT analysis. |
| **CORS** | Same-origin on Render (UI + API one URL). For Netlify UI + Render API, set `CORS_ORIGINS` to your Netlify URL and build with `VITE_API_URL=https://<your-service>.onrender.com/api`. |

### Environment variables (Render dashboard)

| Variable | Purpose |
|----------|---------|
| `CORS_ORIGINS` | Comma-separated allowed origins (add Netlify URL if UI is hosted elsewhere) |
| `VITE_API_URL` | Build-time only — set in frontend build if UI and API are on different hosts |
| `OSF_NODE_ID` | OSF project ID (default: `xnr9f`) |

## API

| Endpoint | Purpose |
|----------|---------|
| `GET /api/osf/folders` | List product folders (More, Opn) |
| `GET /api/osf/folders/{id}/files` | List `.mat` files in a folder |
| `POST /api/analyze/osf` | Download and analyze an OSF file |
| `POST /api/analyze` | Upload a local `.mat` file |

Multipart form fields for analyze endpoints:

| Field | Purpose |
|-------|---------|
| `file` / `download_url` + `file_name` | MAT file source |
| `record_index` | Which of the 63 aid/room/run records to visualize (0–62) |

### MAT (thestruct) format

Each OSF `thestruct_*.mat` file contains one variable (e.g. `thestruct_MoreA1`) with **63 records**. Every record is a MATLAB struct with:

| Field | Description |
|-------|-------------|
| `subject`, `aid`, `room`, `cond`, `run` | Metadata (e.g. Occ/Open/Unaid, Ane/SRS/Room, runs mean–6) |
| `azimuths` | 11 azimuth angles (degrees) |
| `freqs` | 28 frequency bins (Hz) |
| `rawILD`, `normILD`, `rawITD`, `normITD` | 11×28 matrices |

Sample data: [OSF Data Science 2022–2023](https://osf.io/xnr9f/overview) (`More_thestructs/`, `Opn_thestructs/`).

## Library usage

```python
from acoustic_analysis import load_thestruct_path

thestruct = load_thestruct_path("thestruct_MoreA1.mat")
print(thestruct.subject, len(thestruct.records))
```

## Requirements

- Python 3.10+
- Node 18+ (for frontend)
