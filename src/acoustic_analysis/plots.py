"""Plotly figures for the acoustic analysis dashboard."""

from __future__ import annotations

import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots

from acoustic_analysis.analyzer import AnalysisResult


def waveform_figure(result: AnalysisResult) -> go.Figure:
    t = np.linspace(0, result.duration_s, num=len(result.y), endpoint=False)
    fig = go.Figure()
    fig.add_trace(
        go.Scatter(
            x=t,
            y=result.y,
            mode="lines",
            name="Waveform",
            line=dict(color="#4C78A8", width=1),
        )
    )
    _add_outlier_shading(fig, result.outlier_regions, row=None)
    fig.update_layout(
        title="Waveform with detected outliers",
        xaxis_title="Time (s)",
        yaxis_title="Amplitude",
        height=280,
        margin=dict(l=50, r=20, t=50, b=40),
        showlegend=False,
    )
    return fig


def spectrogram_figure(result: AnalysisResult) -> go.Figure:
    fig = go.Figure(
        data=go.Heatmap(
            x=result.spec_times,
            y=result.spec_freqs,
            z=result.spectrogram_db,
            colorscale="Viridis",
            colorbar=dict(title="dB"),
        )
    )
    _add_outlier_shading(fig, result.outlier_regions, row=None, yref="paper")
    fig.update_layout(
        title="Spectrogram",
        xaxis_title="Time (s)",
        yaxis_title="Frequency (Hz)",
        height=320,
        margin=dict(l=50, r=20, t=50, b=40),
    )
    return fig


def anomaly_timeline_figure(result: AnalysisResult) -> go.Figure:
    fig = go.Figure()
    fig.add_trace(
        go.Scatter(
            x=result.times,
            y=result.outlier_result.scores,
            mode="lines",
            name="Anomaly score",
            line=dict(color="#E45756", width=1.5),
            fill="tozeroy",
            fillcolor="rgba(228, 87, 86, 0.15)",
        )
    )
    outlier_times = result.times[result.outlier_result.mask]
    outlier_scores = result.outlier_result.scores[result.outlier_result.mask]
    if len(outlier_times):
        fig.add_trace(
            go.Scatter(
                x=outlier_times,
                y=outlier_scores,
                mode="markers",
                name="Outlier frames",
                marker=dict(color="#F58518", size=6, symbol="x"),
            )
        )
    fig.update_layout(
        title="Frame-level anomaly score",
        xaxis_title="Time (s)",
        yaxis_title="Score (0–1)",
        height=260,
        margin=dict(l=50, r=20, t=50, b=40),
    )
    return fig


def feature_grid_figure(result: AnalysisResult, max_features: int = 6) -> go.Figure:
    names = result.feature_names[:max_features]
    fig = make_subplots(
        rows=len(names),
        cols=1,
        shared_xaxes=True,
        vertical_spacing=0.04,
        subplot_titles=names,
    )
    for i, name in enumerate(names, start=1):
        col_idx = result.feature_names.index(name)
        y_vals = result.features[:, col_idx]
        fig.add_trace(
            go.Scatter(
                x=result.times,
                y=y_vals,
                mode="lines",
                line=dict(width=1),
                showlegend=False,
            ),
            row=i,
            col=1,
        )
        out_mask = result.outlier_result.mask
        if out_mask.any():
            fig.add_trace(
                go.Scatter(
                    x=result.times[out_mask],
                    y=y_vals[out_mask],
                    mode="markers",
                    marker=dict(color="#E45756", size=4),
                    showlegend=False,
                ),
                row=i,
                col=1,
            )
    fig.update_layout(
        height=180 * len(names),
        title="Acoustic features (outliers marked)",
        margin=dict(l=50, r=20, t=60, b=40),
    )
    fig.update_xaxes(title_text="Time (s)", row=len(names))
    return fig


def feature_distribution_figure(result: AnalysisResult) -> go.Figure:
    fig = go.Figure()
    for name in result.feature_names:
        normal = result.feature_df.loc[~result.feature_df["is_outlier"], name]
        outlier = result.feature_df.loc[result.feature_df["is_outlier"], name]
        fig.add_trace(
            go.Box(y=normal, name=name, legendgroup=name, showlegend=False, marker_color="#4C78A8")
        )
        if len(outlier):
            fig.add_trace(
                go.Box(
                    y=outlier,
                    name=f"{name} (outlier)",
                    legendgroup=name,
                    marker_color="#E45756",
                    boxpoints="all",
                )
            )
    fig.update_layout(
        title="Feature distributions: normal vs outlier frames",
        yaxis_title="Value",
        height=400,
        boxmode="group",
        margin=dict(l=50, r=20, t=50, b=40),
    )
    return fig


def _add_outlier_shading(
    fig: go.Figure,
    regions: list[dict],
    *,
    row: int | None,
    yref: str = "y",
) -> None:
    for r in regions:
        fig.add_vrect(
            x0=r["start_s"],
            x1=r["end_s"],
            fillcolor="rgba(228, 87, 86, 0.25)",
            line_width=0,
            layer="below",
        )
