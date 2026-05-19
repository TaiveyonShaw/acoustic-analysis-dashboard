"""FastAPI backend for acoustic analysis."""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from acoustic_analysis.analyzer import AcousticAnalyzer
from acoustic_analysis.outliers import OutlierConfig, OutlierMethod
from acoustic_analysis.serialize import result_to_payload

app = FastAPI(title="Acoustic Analysis API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/api/analyze")
async def analyze(
    file: UploadFile = File(...),
    frame_length: int = Form(2048),
    hop_length: int = Form(512),
    method: str = Form("isolation_forest"),
    contamination: float = Form(0.05),
    z_threshold: float = Form(3.0),
    iqr_multiplier: float = Form(1.5),
) -> dict:
    data = await file.read()
    config = OutlierConfig(
        method=OutlierMethod(method),
        contamination=contamination,
        z_threshold=z_threshold,
        iqr_multiplier=iqr_multiplier,
    )
    analyzer = AcousticAnalyzer(
        frame_length=frame_length,
        hop_length=hop_length,
        outlier_config=config,
    )
    result = analyzer.analyze_bytes(data, file_name=file.filename or "upload.wav")
    return result_to_payload(result)


_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if _dist.is_dir():
    app.mount("/", StaticFiles(directory=str(_dist), html=True), name="static")
