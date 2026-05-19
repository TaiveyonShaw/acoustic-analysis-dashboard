"""Streamlit dashboard for hearing-aid acoustic outlier detection."""

from __future__ import annotations

import io

import pandas as pd
import streamlit as st

from acoustic_analysis.analyzer import AcousticAnalyzer
from acoustic_analysis.outliers import OutlierConfig, OutlierMethod
from acoustic_analysis.plots import (
    anomaly_timeline_figure,
    feature_grid_figure,
    spectrogram_figure,
    waveform_figure,
)

st.set_page_config(
    page_title="Hearing Aid Acoustic Analysis",
    page_icon="🎧",
    layout="wide",
)

st.title("Hearing Aid Acoustic Analysis")
st.caption(
    "Upload a WAV file to extract frame-level acoustic features and detect "
    "anomalous segments that may indicate artifacts, dropouts, or processing issues."
)


@st.cache_data(show_spinner=False)
def run_analysis(
    file_bytes: bytes,
    file_name: str,
    frame_length: int,
    hop_length: int,
    method: str,
    contamination: float,
    z_threshold: float,
    iqr_multiplier: float,
) -> dict:
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
    result = analyzer.analyze_bytes(file_bytes, file_name=file_name)
    return {
        "result": result,
        "summary": {
            "duration_s": result.duration_s,
            "sr": result.sr,
            "n_frames": len(result.times),
            "n_outliers": int(result.outlier_result.mask.sum()),
            "outlier_pct": 100 * result.outlier_result.mask.mean(),
            "n_regions": len(result.outlier_regions),
            "method": result.outlier_result.method,
        },
    }


with st.sidebar:
    st.header("Settings")
    uploaded = st.file_uploader("WAV file", type=["wav"], help="Mono or stereo hearing-aid recording")
    st.subheader("Analysis")
    frame_length = st.select_slider("Frame length (samples)", options=[1024, 2048, 4096], value=2048)
    hop_length = st.select_slider("Hop length (samples)", options=[256, 512, 1024], value=512)
    st.subheader("Outlier detection")
    method = st.selectbox(
        "Method",
        options=[m.value for m in OutlierMethod],
        format_func=lambda v: {
            "isolation_forest": "Isolation Forest (multivariate)",
            "z_score": "Z-score (per feature)",
            "iqr": "IQR (per feature)",
        }[v],
    )
    contamination = st.slider(
        "Expected outlier fraction",
        0.01,
        0.25,
        0.05,
        0.01,
        disabled=method != "isolation_forest",
        help="Used only for Isolation Forest",
    )
    z_threshold = st.slider("Z-score threshold", 2.0, 5.0, 3.0, 0.1, disabled=method != "z_score")
    iqr_multiplier = st.slider("IQR multiplier", 1.0, 3.0, 1.5, 0.1, disabled=method != "iqr")

if uploaded is None:
    st.info("Upload a `.wav` file to begin analysis.")
    st.markdown(
        """
        ### What this dashboard does

        1. **Loads** your hearing-aid audio (resampled to 16 kHz for consistent analysis).
        2. **Extracts** frame-level features: energy, spectral shape, MFCCs, and a harmonic–noise proxy.
        3. **Flags outliers** — frames that deviate from the rest of the recording — using your chosen detector.
        4. **Visualizes** waveforms, spectrograms, anomaly scores, and outlier time regions.

        Outliers often correspond to clicks, dropouts, sudden gain changes, or non-speech events.
        """
    )
    st.stop()

file_bytes = uploaded.read()
analysis = run_analysis(
    file_bytes,
    uploaded.name,
    frame_length,
    hop_length,
    method,
    contamination,
    z_threshold,
    iqr_multiplier,
)
result = analysis["result"]
summary = analysis["summary"]

col1, col2, col3, col4, col5 = st.columns(5)
col1.metric("Duration", f"{summary['duration_s']:.2f} s")
col2.metric("Sample rate", f"{summary['sr']:,} Hz")
col3.metric("Outlier frames", f"{summary['n_outliers']} / {summary['n_frames']}")
col4.metric("Outlier %", f"{summary['outlier_pct']:.1f}%")
col5.metric("Outlier regions", summary["n_regions"])

tab_overview, tab_features, tab_export = st.tabs(["Overview", "Features", "Export"])

with tab_overview:
    st.plotly_chart(waveform_figure(result), use_container_width=True)
    left, right = st.columns(2)
    with left:
        st.plotly_chart(spectrogram_figure(result), use_container_width=True)
    with right:
        st.plotly_chart(anomaly_timeline_figure(result), use_container_width=True)

    if result.outlier_regions:
        st.subheader("Outlier time regions")
        regions_df = pd.DataFrame(result.outlier_regions)
        regions_df["duration_s"] = regions_df["end_s"] - regions_df["start_s"]
        regions_df = regions_df.rename(
            columns={
                "start_s": "Start (s)",
                "end_s": "End (s)",
                "duration_s": "Duration (s)",
                "n_frames": "Outlier frames",
            }
        )
        st.dataframe(regions_df[["Start (s)", "End (s)", "Duration (s)", "Outlier frames"]], hide_index=True)
    else:
        st.success("No outlier regions detected with current settings.")

with tab_features:
    st.plotly_chart(feature_grid_figure(result), use_container_width=True)
    with st.expander("Feature reference"):
        st.markdown(
            """
            | Feature | Meaning for hearing-aid audio |
            |---------|-------------------------------|
            | **rms** | Short-term loudness — spikes may indicate clicks or gain jumps |
            | **zcr** | Zero-crossing rate — useful for noise vs voiced speech |
            | **spectral_centroid** | Brightness / timbre shifts |
            | **spectral_bandwidth** | Spread of energy across frequencies |
            | **spectral_rolloff** | Frequency below which most energy lies |
            | **spectral_flatness** | Tonality vs noise-like content |
            | **mfcc_1–3** | Coarse spectral envelope (speech-like vs atypical) |
            | **hnr_proxy** | Harmonic vs noise energy (distortion, wind, processing artifacts) |
            """
        )

with tab_export:
    st.subheader("Download results")
    csv_buf = io.StringIO()
    result.feature_df.to_csv(csv_buf, index=False)
    st.download_button(
        "Download frame features (CSV)",
        csv_buf.getvalue(),
        file_name=f"{result.file_name}_features.csv",
        mime="text/csv",
    )
    if result.outlier_regions:
        regions_csv = io.StringIO()
        pd.DataFrame(result.outlier_regions).to_csv(regions_csv, index=False)
        st.download_button(
            "Download outlier regions (CSV)",
            regions_csv.getvalue(),
            file_name=f"{result.file_name}_outlier_regions.csv",
            mime="text/csv",
        )
