"""Load and analyze OSF thestruct MATLAB files (ILD/ITD spatial hearing data)."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import numpy as np
import scipy.io

from acoustic_analysis.outliers import OutlierConfig, OutlierResult, detect_outliers

FIELD_NAMES = (
    "subject",
    "aid",
    "room",
    "cond",
    "run",
    "azimuths",
    "freqs",
    "rawILD",
    "normILD",
    "rawITD",
    "normITD",
)

MATRIX_FIELDS = ("rawILD", "normILD", "rawITD", "normITD")


@dataclass
class ThestructRecord:
    index: int
    subject: str
    aid: str
    room: str
    cond: str
    run: str
    azimuths: np.ndarray
    freqs: np.ndarray
    rawILD: np.ndarray
    normILD: np.ndarray
    rawITD: np.ndarray
    normITD: np.ndarray

    @property
    def label(self) -> str:
        return f"{self.aid} · {self.room} · run {self.run}"


@dataclass
class ThestructFile:
    variable_name: str
    file_name: str
    subject: str
    records: list[ThestructRecord]


@dataclass
class ThestructAnalysis:
    thestruct: ThestructFile
    record_outliers: OutlierResult
    cell_outliers: dict[str, OutlierResult]


def load_thestruct_bytes(data: bytes, file_name: str = "upload.mat") -> ThestructFile:
    import io

    buf = io.BytesIO(data)
    return load_thestruct_file(buf, file_name=file_name)


def load_thestruct_path(path: str | Path) -> ThestructFile:
    return load_thestruct_file(Path(path))


def load_thestruct_file(source: str | Path | object, *, file_name: str | None = None) -> ThestructFile:
    path = Path(source) if isinstance(source, (str, Path)) else None
    name = file_name or (path.name if path is not None else "upload.mat")

    if path is not None:
        mat = scipy.io.loadmat(path, squeeze_me=True, struct_as_record=False)
    else:
        mat = scipy.io.loadmat(source, squeeze_me=True, struct_as_record=False)

    keys = [k for k in mat if not k.startswith("_")]
    if not keys:
        raise ValueError("MAT file contains no data variables")

    variable_name = keys[0]
    raw = mat[variable_name]
    items = np.atleast_1d(raw).ravel().tolist()
    if not items:
        raise ValueError(f"Variable {variable_name!r} is empty")

    records: list[ThestructRecord] = []
    for index, item in enumerate(items):
        records.append(_parse_record(index, item))

    subject = records[0].subject
    return ThestructFile(
        variable_name=variable_name,
        file_name=name,
        subject=subject,
        records=records,
    )


def analyze_thestruct(
    thestruct: ThestructFile,
    *,
    outlier_config: OutlierConfig,
    record_index: int = 0,
) -> ThestructAnalysis:
    record_features = np.array([_record_feature_vector(r) for r in thestruct.records], dtype=np.float64)
    record_outliers = detect_outliers(record_features, outlier_config)

    record_index = int(np.clip(record_index, 0, len(thestruct.records) - 1))
    selected = thestruct.records[record_index]
    cell_outliers: dict[str, OutlierResult] = {}
    for field in ("normILD", "normITD"):
        matrix = getattr(selected, field)
        features = np.column_stack([matrix.ravel(), getattr(selected, "rawILD" if field == "normILD" else "rawITD").ravel()])
        cell_outliers[field] = detect_outliers(features, outlier_config)

    return ThestructAnalysis(
        thestruct=thestruct,
        record_outliers=record_outliers,
        cell_outliers=cell_outliers,
    )


def _parse_record(index: int, item: object) -> ThestructRecord:
    if not hasattr(item, "_fieldnames"):
        raise ValueError(f"Record {index} is not a MATLAB struct")

    missing = [f for f in FIELD_NAMES if f not in item._fieldnames]
    if missing:
        raise ValueError(f"Record {index} missing fields: {missing}")

    def _str(field: str) -> str:
        value = getattr(item, field)
        if isinstance(value, np.ndarray):
            flat = value.ravel()
            if flat.size == 0:
                return ""
            if flat.dtype.kind in "SU":
                return "".join(str(x) for x in flat)
            return str(flat.item())
        return str(value)

    def _array(field: str) -> np.ndarray:
        value = np.asarray(getattr(item, field), dtype=np.float64)
        return np.squeeze(value)

    azimuths = np.asarray(getattr(item, "azimuths"), dtype=np.int16).ravel()
    freqs = _array("freqs").ravel()

    matrices = {name: _array(name) for name in MATRIX_FIELDS}
    for name, matrix in matrices.items():
        if matrix.shape != (len(azimuths), len(freqs)):
            raise ValueError(
                f"Record {index} {name} shape {matrix.shape} "
                f"does not match azimuths×freqs ({len(azimuths)}, {len(freqs)})"
            )

    return ThestructRecord(
        index=index,
        subject=_str("subject"),
        aid=_str("aid"),
        room=_str("room"),
        cond=_str("cond"),
        run=_str("run"),
        azimuths=azimuths,
        freqs=freqs,
        **matrices,
    )


def _record_feature_vector(record: ThestructRecord) -> np.ndarray:
    feats: list[float] = []
    for name in MATRIX_FIELDS:
        matrix = getattr(record, name)
        feats.extend(
            [
                float(np.mean(matrix)),
                float(np.std(matrix)),
                float(np.min(matrix)),
                float(np.max(matrix)),
            ]
        )
    return np.array(feats, dtype=np.float64)
