"""Azimuth convention: MAT files use 180° for front; display uses 0° for front."""

from __future__ import annotations

import numpy as np


def remap_azimuth(azimuth: int | float) -> int:
    """Shift so experimental front (180°) becomes 0°."""
    a = int(azimuth) - 180
    while a > 180:
        a -= 360
    while a <= -180:
        a += 360
    return a


def remap_azimuth_list(azimuths: np.ndarray | list) -> list[int]:
    return [remap_azimuth(a) for a in np.asarray(azimuths).ravel()]
