"""Outlier detection on frame-level acoustic features."""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler


class OutlierMethod(str, Enum):
    ISOLATION_FOREST = "isolation_forest"
    Z_SCORE = "z_score"
    IQR = "iqr"


@dataclass
class OutlierConfig:
    method: OutlierMethod = OutlierMethod.ISOLATION_FOREST
    contamination: float = 0.05
    z_threshold: float = 3.0
    iqr_multiplier: float = 1.5
    random_state: int = 42


@dataclass
class OutlierResult:
    mask: np.ndarray  # True where frame is an outlier
    scores: np.ndarray  # higher = more anomalous (method-dependent, normalized 0-1)
    method: str


def detect_outliers(features: np.ndarray, config: OutlierConfig) -> OutlierResult:
    """Flag anomalous frames from feature matrix (n_frames, n_features)."""
    if features.ndim != 2 or features.shape[0] < 3:
        n = features.shape[0] if features.ndim == 2 else 0
        return OutlierResult(
            mask=np.zeros(n, dtype=bool),
            scores=np.zeros(n),
            method=config.method.value,
        )

    scaler = StandardScaler()
    X = scaler.fit_transform(np.nan_to_num(features, nan=0.0, posinf=0.0, neginf=0.0))

    if config.method == OutlierMethod.ISOLATION_FOREST:
        return _isolation_forest(X, config)
    if config.method == OutlierMethod.Z_SCORE:
        return _z_score(X, config)
    return _iqr(X, config)


def _isolation_forest(X: np.ndarray, config: OutlierConfig) -> OutlierResult:
    clf = IsolationForest(
        contamination=config.contamination,
        random_state=config.random_state,
        n_estimators=200,
    )
    preds = clf.fit_predict(X)
    raw_scores = -clf.score_samples(X)
    scores = _normalize_scores(raw_scores)
    return OutlierResult(
        mask=preds == -1,
        scores=scores,
        method=OutlierMethod.ISOLATION_FOREST.value,
    )


def _z_score(X: np.ndarray, config: OutlierConfig) -> OutlierResult:
    z = np.abs((X - X.mean(axis=0)) / (X.std(axis=0) + 1e-10))
    frame_max_z = z.max(axis=1)
    mask = frame_max_z > config.z_threshold
    scores = _normalize_scores(frame_max_z)
    return OutlierResult(mask=mask, scores=scores, method=OutlierMethod.Z_SCORE.value)


def _iqr(X: np.ndarray, config: OutlierConfig) -> OutlierResult:
    q1 = np.percentile(X, 25, axis=0)
    q3 = np.percentile(X, 75, axis=0)
    iqr = q3 - q1
    lower = q1 - config.iqr_multiplier * iqr
    upper = q3 + config.iqr_multiplier * iqr
    outside = (X < lower) | (X > upper)
    frame_violations = outside.sum(axis=1).astype(float)
    mask = frame_violations > 0
    scores = _normalize_scores(frame_violations)
    return OutlierResult(mask=mask, scores=scores, method=OutlierMethod.IQR.value)


def _normalize_scores(raw: np.ndarray) -> np.ndarray:
    lo, hi = raw.min(), raw.max()
    if hi - lo < 1e-10:
        return np.zeros_like(raw)
    return (raw - lo) / (hi - lo)


def merge_outlier_regions(
    mask: np.ndarray,
    times: np.ndarray,
    *,
    min_gap_s: float = 0.05,
) -> list[dict]:
    """Group consecutive outlier frames into time regions."""
    if not mask.any():
        return []

    regions: list[dict] = []
    start_idx: int | None = None

    for i, is_out in enumerate(mask):
        if is_out and start_idx is None:
            start_idx = i
        elif not is_out and start_idx is not None:
            regions.append(_region_dict(start_idx, i - 1, times, mask))
            start_idx = None

    if start_idx is not None:
        regions.append(_region_dict(start_idx, len(mask) - 1, times, mask))

    if len(regions) <= 1:
        return regions

    merged: list[dict] = [regions[0]]
    for r in regions[1:]:
        prev = merged[-1]
        if r["start_s"] - prev["end_s"] <= min_gap_s:
            prev["end_s"] = r["end_s"]
            prev["end_idx"] = r["end_idx"]
            prev["n_frames"] += r["n_frames"]
        else:
            merged.append(r)
    return merged


def _region_dict(start: int, end: int, times: np.ndarray, mask: np.ndarray) -> dict:
    return {
        "start_s": float(times[start]),
        "end_s": float(times[end]),
        "start_idx": start,
        "end_idx": end,
        "n_frames": int(mask[start : end + 1].sum()),
    }
