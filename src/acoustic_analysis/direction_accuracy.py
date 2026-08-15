"""Unaided reference alignment for thestruct comparison charts."""

from __future__ import annotations

import numpy as np

from acoustic_analysis.azimuth import remap_azimuth_list
from acoustic_analysis.thestruct import MATRIX_FIELDS, ThestructFile, ThestructRecord

REFERENCE_AID = "Unaid"


def find_reference_record(
    thestruct: ThestructFile,
    selected: ThestructRecord,
) -> ThestructRecord | None:
    """Match unaided baseline for the same room and run."""
    if selected.aid == REFERENCE_AID:
        return None
    for record in thestruct.records:
        if (
            record.aid == REFERENCE_AID
            and record.room == selected.room
            and record.run == selected.run
        ):
            return record
    return None


def _freq_key(hz: float) -> float:
    return round(float(hz), 5)


def align_reference_to_selected(
    selected: ThestructRecord,
    reference: ThestructRecord,
) -> dict[str, np.ndarray]:
    """Reorder reference rows/columns to match selected azimuth and frequency grids."""
    sel_az = remap_azimuth_list(selected.azimuths)
    ref_az = remap_azimuth_list(reference.azimuths)
    ref_row = {az: i for i, az in enumerate(ref_az)}

    missing_az = [az for az in sel_az if az not in ref_row]
    if missing_az:
        raise ValueError(
            f"Reference record missing azimuths {missing_az[:5]} "
            f"(need {len(sel_az)} directions, reference has {len(ref_az)})"
        )

    row_idx = np.array([ref_row[az] for az in sel_az], dtype=int)

    sel_freqs = np.asarray(selected.freqs, dtype=np.float64).ravel()
    ref_freqs = np.asarray(reference.freqs, dtype=np.float64).ravel()
    ref_col = {_freq_key(f): i for i, f in enumerate(ref_freqs)}

    col_idx: list[int] = []
    for i, f in enumerate(sel_freqs):
        key = _freq_key(f)
        if key not in ref_col:
            if len(ref_freqs) == len(sel_freqs):
                col_idx.append(i)
                continue
            raise ValueError(
                f"Reference record missing frequency {f} Hz "
                f"(selected grid has {len(sel_freqs)} bins)"
            )
        col_idx.append(ref_col[key])
    col_idx_arr = np.array(col_idx, dtype=int)

    return {
        field: getattr(reference, field)[row_idx, :][:, col_idx_arr]
        for field in MATRIX_FIELDS
    }


def compute_direction_accuracy(
    selected: ThestructRecord,
    reference: ThestructRecord,
) -> dict:
    """Align unaided reference matrices to the selected record grid."""
    ref = align_reference_to_selected(selected, reference)
    return {
        "hasReference": True,
        "referenceAid": reference.aid,
        "referenceLabel": reference.label,
        "referenceMatrices": {
            field: _round_matrix(ref[field].tolist()) for field in MATRIX_FIELDS
        },
    }


def direction_accuracy_payload(
    thestruct: ThestructFile,
    selected: ThestructRecord,
) -> dict:
    reference = find_reference_record(thestruct, selected)
    if reference is None:
        reason = (
            "Select an Occ or Open record to compare against the unaided baseline."
            if selected.aid == REFERENCE_AID
            else "No matching unaided reference for this room/run."
        )
        return {
            "hasReference": False,
            "referenceAid": REFERENCE_AID,
            "referenceLabel": None,
            "reason": reason,
            "referenceMatrices": None,
        }
    return compute_direction_accuracy(selected, reference)


def _round_matrix(rows: list, decimals: int = 4) -> list:
    return [[round(float(v), decimals) for v in row] for row in rows]
