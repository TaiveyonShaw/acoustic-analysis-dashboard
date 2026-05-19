"""Frame-level acoustic feature extraction for hearing-aid audio."""

from __future__ import annotations

import numpy as np
import librosa


FEATURE_NAMES = [
    "rms",
    "zcr",
    "spectral_centroid",
    "spectral_bandwidth",
    "spectral_rolloff",
    "spectral_flatness",
    "mfcc_1",
    "mfcc_2",
    "mfcc_3",
    "hnr_proxy",
]


def extract_frame_features(
    y: np.ndarray,
    sr: int,
    *,
    frame_length: int = 2048,
    hop_length: int = 512,
    n_mfcc: int = 13,
) -> tuple[np.ndarray, np.ndarray]:
    """
    Extract per-frame features suited to hearing-aid / speech analysis.

    Returns
    -------
    features : (n_frames, n_features)
    times : (n_frames,) center time of each frame in seconds
    """
    rms = librosa.feature.rms(y=y, frame_length=frame_length, hop_length=hop_length)[0]
    zcr = librosa.feature.zero_crossing_rate(y, frame_length=frame_length, hop_length=hop_length)[0]
    centroid = librosa.feature.spectral_centroid(
        y=y, sr=sr, n_fft=frame_length, hop_length=hop_length
    )[0]
    bandwidth = librosa.feature.spectral_bandwidth(
        y=y, sr=sr, n_fft=frame_length, hop_length=hop_length
    )[0]
    rolloff = librosa.feature.spectral_rolloff(
        y=y, sr=sr, n_fft=frame_length, hop_length=hop_length
    )[0]
    flatness = librosa.feature.spectral_flatness(
        y=y, n_fft=frame_length, hop_length=hop_length
    )[0]
    mfcc = librosa.feature.mfcc(
        y=y, sr=sr, n_mfcc=n_mfcc, n_fft=frame_length, hop_length=hop_length
    )

    hnr_proxy = _harmonic_noise_ratio_proxy(y, sr, frame_length, hop_length)

    features = np.column_stack(
        [
            rms,
            zcr,
            centroid,
            bandwidth,
            rolloff,
            flatness,
            mfcc[0],
            mfcc[1],
            mfcc[2],
            hnr_proxy,
        ]
    )

    n_frames = features.shape[0]
    times = librosa.frames_to_time(np.arange(n_frames), sr=sr, hop_length=hop_length)
    return features.astype(np.float64), times


def _harmonic_noise_ratio_proxy(
    y: np.ndarray,
    sr: int,
    frame_length: int,
    hop_length: int,
) -> np.ndarray:
    """Lightweight HNR proxy: harmonic energy vs residual per frame."""
    harmonic, percussive = librosa.effects.hpss(y)
    harm_rms = librosa.feature.rms(y=harmonic, frame_length=frame_length, hop_length=hop_length)[0]
    perc_rms = librosa.feature.rms(y=percussive, frame_length=frame_length, hop_length=hop_length)[0]
    eps = 1e-10
    ratio_db = 20 * np.log10((harm_rms + eps) / (perc_rms + eps))
    return np.clip(ratio_db, -40, 40)


def compute_spectrogram(
    y: np.ndarray,
    sr: int,
    *,
    n_fft: int = 2048,
    hop_length: int = 512,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Return power spectrogram (dB), frequencies, and times."""
    S = np.abs(librosa.stft(y, n_fft=n_fft, hop_length=hop_length)) ** 2
    S_db = librosa.power_to_db(S, ref=np.max)
    freqs = librosa.fft_frequencies(sr=sr, n_fft=n_fft)
    times = librosa.frames_to_time(np.arange(S_db.shape[1]), sr=sr, hop_length=hop_length)
    return S_db, freqs, times
