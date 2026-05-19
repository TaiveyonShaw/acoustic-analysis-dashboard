"""Compact JSON payloads for fast API / frontend transfer."""

from __future__ import annotations

import numpy as np

from acoustic_analysis.analyzer import AnalysisResult

MAX_WAVEFORM_POINTS = 4000
MAX_SPEC_TIME = 512
MAX_SPEC_FREQ = 256
DISPLAY_FEATURES = 6


def result_to_payload(result: AnalysisResult) -> dict:
    """Build a downsampled dict safe for JSON and fast canvas rendering."""
    duration = result.duration_s
    n = len(result.y)
    wf_n = min(n, MAX_WAVEFORM_POINTS)
    wf_idx = np.linspace(0, n - 1, wf_n, dtype=np.int64)
    wf_t = (wf_idx / result.sr).tolist()
    wf_y = result.y[wf_idx].tolist()

    spec = _decimate_spec(result.spectrogram_db, MAX_SPEC_TIME, MAX_SPEC_FREQ)
    spec_times = _decimate_axis(result.spec_times, spec.shape[1])
    spec_freqs = _decimate_axis(result.spec_freqs, spec.shape[0])

    times_list = _round_list(result.times.tolist())

    def _feature_series(i: int) -> dict:
        return {
            "name": result.feature_names[i],
            "times": times_list,
            "values": _round_list(result.features[:, i].tolist()),
        }

    all_features = [_feature_series(i) for i in range(len(result.feature_names))]
    features = all_features[:DISPLAY_FEATURES]

    return {
        "fileName": result.file_name,
        "summary": {
            "durationS": round(duration, 4),
            "sampleRate": result.sr,
            "nFrames": len(result.times),
            "nOutliers": int(result.outlier_result.mask.sum()),
            "outlierPct": round(100 * float(result.outlier_result.mask.mean()), 2),
            "nRegions": len(result.outlier_regions),
            "method": result.outlier_result.method,
        },
        "waveform": {"t": _round_list(wf_t), "y": _round_list(wf_y)},
        "spectrogram": {
            "times": _round_list(spec_times.tolist()),
            "freqs": _round_list(spec_freqs.tolist()),
            "db": _round_list(spec.tolist()),
        },
        "anomaly": {
            "times": _round_list(result.times.tolist()),
            "scores": _round_list(result.outlier_result.scores.tolist()),
            "mask": result.outlier_result.mask.tolist(),
        },
        "features": features,
        "regions": result.outlier_regions,
        "featureNames": result.feature_names,
        "allFeatures": all_features,
    }


def _decimate_spec(spec: np.ndarray, max_t: int, max_f: int) -> np.ndarray:
    t_step = max(1, spec.shape[1] // max_t)
    f_step = max(1, spec.shape[0] // max_f)
    return spec[::f_step, ::t_step]


def _decimate_axis(axis: np.ndarray, target_len: int) -> np.ndarray:
    if len(axis) <= target_len:
        return axis
    idx = np.linspace(0, len(axis) - 1, target_len, dtype=np.int64)
    return axis[idx]


def _round_list(values: list, decimals: int = 5) -> list:
    return [round(float(v), decimals) for v in values]
