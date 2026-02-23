from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Optional, Tuple

from .model import load_bundle, save_bundle, train_baseline, predict, TrainedModelBundle
from .schema import ModelOutputs, ModelMeta

ARTIFACT_PATH = os.getenv("QAZTENDER_MODEL_PATH", "backend/app/ml/artifacts/qaztender_baseline.joblib")
DEMO_DATA_PATH = os.getenv("QAZTENDER_DEMO_DATA", "backend/app/ml/demo_data.jsonl")


class ModelNotReady(RuntimeError):
    pass


_bundle: Optional[TrainedModelBundle] = None


def load_jsonl(path: str) -> list[dict]:
    p = Path(path)
    if not p.exists():
        return []
    out: list[dict] = []
    for line in p.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        out.append(json.loads(line))
    return out


def ensure_model_ready() -> TrainedModelBundle:
    global _bundle
    if _bundle is not None:
        return _bundle

    artifact = Path(ARTIFACT_PATH)
    if artifact.exists():
        _bundle = load_bundle(str(artifact))
        return _bundle

    # MVP fail-safe: train on included demo data (tiny dataset, but real supervised training).
    examples = load_jsonl(DEMO_DATA_PATH)
    if len(examples) < 8:
        raise ModelNotReady(
            "Model artifact not found and demo dataset is missing/too small. "
            "Provide labeled data and run scripts/train_model.py."
        )

    bundle = train_baseline(examples)
    save_bundle(bundle, str(artifact))
    _bundle = bundle
    return _bundle


def infer(canonical_text: str) -> Tuple[ModelOutputs, ModelMeta]:
    bundle = ensure_model_ready()
    outputs = predict(bundle, canonical_text)
    return outputs, bundle.meta
