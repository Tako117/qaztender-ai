from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ModelOutputs:
    # probability-like outputs in [0,1]
    spec_manipulation: float
    price_inflation: float
    quantity_anomaly: float
    overall_risk: float  # 0..1


@dataclass(frozen=True)
class ModelMeta:
    model_name: str
    model_version: str
    trained_on_examples: int
    calibrated: bool
