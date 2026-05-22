"""FastAPI backend for acoustic analysis."""

from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from acoustic_analysis.analyzer import AcousticAnalyzer
from acoustic_analysis.outliers import OutlierConfig, OutlierMethod
from acoustic_analysis.serialize import result_to_payload
from acoustic_analysis.thestruct import analyze_thestruct, load_thestruct_bytes
from acoustic_analysis.thestruct_serialize import thestruct_to_payload

app = FastAPI(title="Acoustic Analysis API", version="0.1.0")

_default_origins = "http://localhost:5173,http://127.0.0.1:5173"
_cors_origins = [
    o.strip() for o in os.getenv("CORS_ORIGINS", _default_origins).split(",") if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


def _outlier_config(
    method: str,
    contamination: float,
    z_threshold: float,
    iqr_multiplier: float,
) -> OutlierConfig:
    return OutlierConfig(
        method=OutlierMethod(method),
        contamination=contamination,
        z_threshold=z_threshold,
        iqr_multiplier=iqr_multiplier,
    )


@app.post("/api/analyze")
async def analyze(
    file: UploadFile = File(...),
    method: str = Form("isolation_forest"),
    contamination: float = Form(0.05),
    z_threshold: float = Form(3.0),
    iqr_multiplier: float = Form(1.5),
    record_index: int = Form(0),
) -> dict:
    data = await file.read()
    filename = (file.filename or "upload").lower()
    config = _outlier_config(method, contamination, z_threshold, iqr_multiplier)

    if filename.endswith(".mat"):
        thestruct = load_thestruct_bytes(data, file_name=file.filename or "upload.mat")
        analysis = analyze_thestruct(thestruct, outlier_config=config, record_index=record_index)
        return thestruct_to_payload(analysis, record_index=record_index)

    analyzer = AcousticAnalyzer(outlier_config=config)
    result = analyzer.analyze_bytes(data, file_name=file.filename or "upload.wav")
    payload = result_to_payload(result)
    payload["dataType"] = "wav"
    return payload


_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if _dist.is_dir():
    app.mount("/", StaticFiles(directory=str(_dist), html=True), name="static")
