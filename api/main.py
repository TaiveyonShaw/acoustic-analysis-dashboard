"""FastAPI backend for thestruct MAT analysis."""

from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from acoustic_analysis.osf import OsfError, download_file, list_folders, list_mat_files
from acoustic_analysis.thestruct import load_thestruct_bytes
from acoustic_analysis.thestruct_serialize import thestruct_to_payload

OSF_NODE_ID = os.getenv("OSF_NODE_ID", "xnr9f")
OSF_PROJECT_URL = f"https://osf.io/{OSF_NODE_ID}/"

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


@app.get("/api")
def api_root() -> dict:
    return {
        "name": "Acoustic Analysis API",
        "health": "/api/health",
        "osfFolders": "/api/osf/folders",
        "analyze": "POST /api/analyze",
        "analyzeOsf": "POST /api/analyze/osf",
    }


def _analyze_mat_bytes(data: bytes, filename: str, *, record_index: int) -> dict:
    if not filename.lower().endswith(".mat"):
        raise HTTPException(status_code=400, detail="Only .mat thestruct files are supported")
    thestruct = load_thestruct_bytes(data, file_name=filename)
    return thestruct_to_payload(thestruct, record_index=record_index)


@app.get("/api/osf/folders")
def osf_folders() -> dict:
    try:
        folders = list_folders(OSF_NODE_ID)
    except OsfError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return {
        "nodeId": OSF_NODE_ID,
        "projectUrl": OSF_PROJECT_URL,
        "folders": [
            {"id": folder.id, "name": folder.name, "label": folder.label} for folder in folders
        ],
    }


@app.get("/api/osf/folders/{folder_id}/files")
def osf_folder_files(folder_id: str) -> dict:
    try:
        files = list_mat_files(folder_id, node_id=OSF_NODE_ID)
    except OsfError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return {
        "folderId": folder_id,
        "files": [
            {
                "id": file.id,
                "name": file.name,
                "size": file.size,
                "downloadUrl": file.download_url,
            }
            for file in files
        ],
    }


@app.post("/api/analyze")
async def analyze(
    file: UploadFile = File(...),
    record_index: int = Form(0),
) -> dict:
    data = await file.read()
    return _analyze_mat_bytes(
        data,
        file.filename or "upload.mat",
        record_index=record_index,
    )


@app.post("/api/analyze/osf")
async def analyze_osf(
    download_url: str = Form(...),
    file_name: str = Form(...),
    record_index: int = Form(0),
) -> dict:
    try:
        data = download_file(download_url)
    except OsfError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return _analyze_mat_bytes(data, file_name, record_index=record_index)


_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if _dist.is_dir():
    app.mount("/", StaticFiles(directory=str(_dist), html=True), name="static")
else:

    @app.get("/")
    def dev_root() -> dict:
        return {
            "message": "API is running. Use the Vite dev server for the UI.",
            "ui": "http://localhost:5173",
            "api": "/api",
            "health": "/api/health",
        }
