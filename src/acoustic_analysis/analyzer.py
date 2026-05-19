"""High-level acoustic analysis pipeline."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import librosa
import numpy as np
import pandas as pd

from acoustic_analysis.features import FEATURE_NAMES, compute_spectrogram, extract_frame_features
from acoustic_analysis.outliers import OutlierConfig, OutlierResult, detect_outliers, merge_outlier_regions


@dataclass
class AnalysisResult:
    y: np.ndarray
    sr: int
    duration_s: float
    features: np.ndarray
    feature_names: list[str]
    times: np.ndarray
    feature_df: pd.DataFrame
    outlier_result: OutlierResult
    outlier_regions: list[dict]
    spectrogram_db: np.ndarray
    spec_freqs: np.ndarray
    spec_times: np.ndarray
    file_name: str


class AcousticAnalyzer:
    """Load WAV audio, extract features, and detect outliers."""

    def __init__(
        self,
        *,
        frame_length: int = 2048,
        hop_length: int = 512,
        outlier_config: OutlierConfig | None = None,
    ):
        self.frame_length = frame_length
        self.hop_length = hop_length
        self.outlier_config = outlier_config or OutlierConfig()

    def analyze_file(self, path: str | Path) -> AnalysisResult:
        path = Path(path)
        y, sr = librosa.load(path, sr=None, mono=True)
        return self.analyze_array(y, sr, file_name=path.name)

    def analyze_bytes(self, data: bytes, file_name: str = "upload.wav") -> AnalysisResult:
        import io
        import soundfile as sf

        y, sr = sf.read(io.BytesIO(data), always_2d=False)
        if y.ndim > 1:
            y = y.mean(axis=1)
        y = y.astype(np.float32)
        if sr != 16000:
            y = librosa.resample(y, orig_sr=sr, target_sr=16000)
            sr = 16000
        return self.analyze_array(y, sr, file_name=file_name)

    def analyze_array(
        self,
        y: np.ndarray,
        sr: int,
        *,
        file_name: str = "audio.wav",
    ) -> AnalysisResult:
        features, times = extract_frame_features(
            y, sr, frame_length=self.frame_length, hop_length=self.hop_length
        )
        outlier_result = detect_outliers(features, self.outlier_config)
        outlier_regions = merge_outlier_regions(outlier_result.mask, times)

        df = pd.DataFrame(features, columns=FEATURE_NAMES)
        df.insert(0, "time_s", times)
        df["is_outlier"] = outlier_result.mask
        df["anomaly_score"] = outlier_result.scores

        spec_db, spec_freqs, spec_times = compute_spectrogram(
            y, sr, n_fft=self.frame_length, hop_length=self.hop_length
        )

        return AnalysisResult(
            y=y,
            sr=sr,
            duration_s=float(len(y) / sr),
            features=features,
            feature_names=FEATURE_NAMES,
            times=times,
            feature_df=df,
            outlier_result=outlier_result,
            outlier_regions=outlier_regions,
            spectrogram_db=spec_db,
            spec_freqs=spec_freqs,
            spec_times=spec_times,
            file_name=file_name,
        )
