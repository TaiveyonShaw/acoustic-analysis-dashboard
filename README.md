# Acoustic Analysis Dashboard

Interactive **React** dashboard for **outlier detection** in hearing-aid WAV recordings. A FastAPI backend runs librosa/scikit-learn analysis; the frontend renders charts with **Canvas** (no Plotly/Recharts) for a small bundle and fast paint.

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

## Production build

```bash
cd frontend && npm run build
uvicorn api.main:app --host 0.0.0.0 --port 8000
```

The API serves `frontend/dist` when present.

## Optional Streamlit UI

```bash
pip install -e ".[streamlit]"
streamlit run app.py
```

## API

`POST /api/analyze` — multipart form: `file` (WAV), `frame_length`, `hop_length`, `method`, `contamination`, `z_threshold`, `iqr_multiplier`.

## Library usage

```python
from acoustic_analysis import AcousticAnalyzer

result = AcousticAnalyzer().analyze_file("recording.wav")
print(result.outlier_regions)
```

## Requirements

- Python 3.10+
- Node 18+ (for frontend)
