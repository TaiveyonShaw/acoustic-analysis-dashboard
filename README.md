# Acoustic Analysis Dashboard

Interactive **React** dashboard for hearing-aid acoustic analysis: **WAV** frame-level outlier detection and **OSF thestruct MAT** files (ILD/ITD spatial maps). A FastAPI backend runs librosa/scikit-learn analysis; the frontend renders charts with **Canvas** (no Plotly/Recharts) for a small bundle and fast paint.

## Architecture

```
frontend/          React + Vite + plain CSS (Canvas charts)
api/main.py        FastAPI — POST /api/analyze
src/acoustic_analysis/   Feature extraction & outlier detection
```

**Speed choices**

- API returns downsampled waveform (~4k points) and decimated spectrogram
- Canvas 2D rendering instead of heavy chart libraries
- Debounced re-analysis when settings change
- `AbortController` cancels in-flight requests on new uploads

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
| **Cold starts** | Service sleeps after ~15 min idle; first request may take 30–60s while Python/librosa load. |
| **RAM** | Use **≥512 MB**; **1 GB** is safer for longer WAV files. |
| **Timeouts** | HTTP requests must finish within Render’s limit (upgrade if analysis times out). |
| **CORS** | Same-origin on Render (UI + API one URL). For Netlify UI + Render API, set `CORS_ORIGINS` to your Netlify URL and build with `VITE_API_URL=https://<your-service>.onrender.com/api`. |

### Environment variables (Render dashboard)

| Variable | Purpose |
|----------|---------|
| `CORS_ORIGINS` | Comma-separated allowed origins (add Netlify URL if UI is hosted elsewhere) |
| `VITE_API_URL` | Build-time only — set in frontend build if UI and API are on different hosts |

## Optional Streamlit UI

```bash
pip install -e ".[streamlit]"
streamlit run app.py
```

## API

`POST /api/analyze` — multipart form:

| Field | Purpose |
|-------|---------|
| `file` | `.wav` recording or OSF `.mat` thestruct file |
| `record_index` | For MAT files: which of the 63 aid/room/run records to visualize (0–62) |
| `frame_length`, `hop_length` | WAV analysis only |
| `method`, `contamination`, `z_threshold`, `iqr_multiplier` | Outlier detector settings |

### MAT (thestruct) format

Each OSF `thestruct_*.mat` file contains one variable (e.g. `thestruct_MoreA1`) with **63 records**. Every record is a MATLAB struct with:

| Field | Description |
|-------|-------------|
| `subject`, `aid`, `room`, `cond`, `run` | Metadata (e.g. Occ/Open/Unaid, Ane/SRS/Room, runs mean–6) |
| `azimuths` | 11 azimuth angles (degrees) |
| `freqs` | 28 frequency bins (Hz) |
| `rawILD`, `normILD`, `rawITD`, `normITD` | 11×28 matrices |

Sample data lives in `osf-storage/More_thestructs/` and `osf-storage/Opn_thestructs/`.

## Library usage

```python
from acoustic_analysis import AcousticAnalyzer

result = AcousticAnalyzer().analyze_file("recording.wav")
print(result.outlier_regions)
```

## Requirements

- Python 3.10+
- Node 18+ (for frontend)
