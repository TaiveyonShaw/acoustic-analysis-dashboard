"""JSON payloads for thestruct MAT uploads."""

from __future__ import annotations

import numpy as np

from acoustic_analysis.thestruct import ThestructAnalysis, ThestructRecord

MATRIX_FIELDS = ("rawILD", "normILD", "rawITD", "normITD")


def thestruct_to_payload(analysis: ThestructAnalysis, *, record_index: int) -> dict:
    thestruct = analysis.thestruct
    record_index = int(np.clip(record_index, 0, len(thestruct.records) - 1))
    selected = thestruct.records[record_index]

    n_records = len(thestruct.records)
    n_outliers = int(analysis.record_outliers.mask.sum())

    records_meta = []
    for i, rec in enumerate(thestruct.records):
        records_meta.append(
            {
                "index": i,
                "subject": rec.subject,
                "aid": rec.aid,
                "room": rec.room,
                "cond": rec.cond,
                "run": rec.run,
                "label": rec.label,
                "isOutlier": bool(analysis.record_outliers.mask[i]),
                "anomalyScore": round(float(analysis.record_outliers.scores[i]), 5),
            }
        )

    cell_masks = {
        name: analysis.cell_outliers[name].mask.reshape(selected.normILD.shape).tolist()
        for name in ("normILD", "normITD")
        if name in analysis.cell_outliers
    }
    cell_scores = {
        name: _round_matrix(analysis.cell_outliers[name].scores.reshape(selected.normILD.shape).tolist())
        for name in ("normILD", "normITD")
        if name in analysis.cell_outliers
    }

    return {
        "dataType": "thestruct",
        "fileName": thestruct.file_name,
        "variableName": thestruct.variable_name,
        "subject": thestruct.subject,
        "summary": {
            "nRecords": n_records,
            "nOutliers": n_outliers,
            "outlierPct": round(100 * n_outliers / max(n_records, 1), 2),
            "method": analysis.record_outliers.method,
            "nAzimuths": len(selected.azimuths),
            "nFreqs": len(selected.freqs),
            "selectedIndex": record_index,
        },
        "records": records_meta,
        "selected": _record_payload(selected, cell_masks, cell_scores),
        "matrices": {
            name: _round_matrix(getattr(selected, name).tolist()) for name in MATRIX_FIELDS
        },
    }


def _record_payload(
    record: ThestructRecord,
    cell_masks: dict[str, list],
    cell_scores: dict[str, list],
) -> dict:
    return {
        "index": record.index,
        "subject": record.subject,
        "aid": record.aid,
        "room": record.room,
        "cond": record.cond,
        "run": record.run,
        "label": record.label,
        "azimuths": record.azimuths.astype(int).tolist(),
        "freqs": _round_list(record.freqs.tolist()),
        "cellOutliers": {
            "masks": cell_masks,
            "scores": cell_scores,
        },
    }


def _round_list(values: list, decimals: int = 5) -> list:
    return [round(float(v), decimals) for v in values]


def _round_matrix(rows: list, decimals: int = 5) -> list:
    return [[round(float(v), decimals) for v in row] for row in rows]
