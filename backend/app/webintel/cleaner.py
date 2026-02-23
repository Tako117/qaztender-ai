from __future__ import annotations

from dataclasses import dataclass
from typing import List, Tuple
import numpy as np


@dataclass(frozen=True)
class CleanedMarket:
    values: list[float]
    low: float
    avg: float
    high: float
    confidence: float


def iqr_filter(values: list[float]) -> list[float]:
    if len(values) < 4:
        return values
    v = np.array(values, dtype=float)
    q1 = np.percentile(v, 25)
    q3 = np.percentile(v, 75)
    iqr = q3 - q1
    lo = q1 - 1.5 * iqr
    hi = q3 + 1.5 * iqr
    filtered = [float(x) for x in v if lo <= x <= hi]
    return filtered if filtered else values


def aggregate(values: list[float], n_sources: int) -> CleanedMarket:
    if not values:
        return CleanedMarket(values=[], low=0.0, avg=0.0, high=0.0, confidence=0.0)
    vals = iqr_filter(values)
    v = np.array(vals, dtype=float)
    low = float(np.percentile(v, 20))
    avg = float(np.mean(v))
    high = float(np.percentile(v, 80))
    # simple confidence: more sources + lower dispersion => higher
    disp = float(np.std(v) / (avg + 1e-9))
    conf = max(0.0, min(1.0, (min(1.0, n_sources / 3.0)) * (1.0 - min(1.0, disp))))
    return CleanedMarket(values=vals, low=low, avg=avg, high=high, confidence=conf)
