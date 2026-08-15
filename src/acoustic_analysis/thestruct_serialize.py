"""JSON payloads for thestruct MAT uploads."""

from __future__ import annotations

import numpy as np

from acoustic_analysis.azimuth import remap_azimuth_list
from acoustic_analysis.direction_accuracy import direction_accuracy_payload
from acoustic_analysis.thestruct import ThestructFile, ThestructRecord

MATRIX_FIELDS = ("rawILD", "normILD", "rawITD", "normITD")


def thestruct_to_payload(thestruct: ThestructFile, *, record_index: int) -> dict:
    record_index = int(np.clip(record_index, 0, len(thestruct.records) - 1))
    selected = thestruct.records[record_index]

    n_records = len(thestruct.records)

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
            }
        )

    direction_accuracy = direction_accuracy_payload(thestruct, selected)

    return {
        "dataType": "thestruct",
        "fileName": thestruct.file_name,
        "variableName": thestruct.variable_name,
        "subject": thestruct.subject,
        "summary": {
            "nRecords": n_records,
            "nAzimuths": len(selected.azimuths),
            "nFreqs": len(selected.freqs),
            "selectedIndex": record_index,
        },
        "records": records_meta,
        "selected": _record_payload(selected),
        "matrices": {
            name: _round_matrix(getattr(selected, name).tolist()) for name in MATRIX_FIELDS
        },
        "directionAccuracy": direction_accuracy,
    }


def _record_payload(record: ThestructRecord) -> dict:
    return {
        "index": record.index,
        "subject": record.subject,
        "aid": record.aid,
        "room": record.room,
        "cond": record.cond,
        "run": record.run,
        "label": record.label,
        "azimuths": remap_azimuth_list(record.azimuths),
        "freqs": _round_list(record.freqs.tolist()),
    }


def _round_list(values: list, decimals: int = 5) -> list:
    return [round(float(v), decimals) for v in values]


def _round_matrix(rows: list, decimals: int = 5) -> list:
    return [[round(float(v), decimals) for v in row] for row in rows]
