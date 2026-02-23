from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.multiclass import OneVsRestClassifier
from sklearn.pipeline import Pipeline

from .schema import ModelMeta, ModelOutputs
from .feature_builder import build_rule_signals

_SEED = 1337


@dataclass
class TrainedModelBundle:
    pipeline: Any
    meta: ModelMeta


def build_pipeline() -> Pipeline:
    tfidf = TfidfVectorizer(
        lowercase=True,
        strip_accents="unicode",
        ngram_range=(1, 2),
        max_features=30000,
        min_df=1,
    )
    base = LogisticRegression(
        solver="liblinear",
        random_state=_SEED,
        max_iter=2000,
    )
    clf = OneVsRestClassifier(base)
    return Pipeline([("tfidf", tfidf), ("clf", clf)])


def train_baseline(
    examples: list[dict],
    model_name: str = "qaztender-baseline-tfidf-lr",
    model_version: str = "0.1.0",
) -> TrainedModelBundle:
    X = [ex["canonical_text"] for ex in examples]
    y = np.array(
        [
            [
                int(ex["labels"].get("spec_manipulation", 0) > 0),
                int(ex["labels"].get("price_inflation", 0) > 0),
                int(ex["labels"].get("quantity_anomaly", 0) > 0),
            ]
            for ex in examples
        ],
        dtype=int,
    )

    pipe = build_pipeline()
    pipe.fit(X, y)

    meta = ModelMeta(
        model_name=model_name,
        model_version=model_version,
        trained_on_examples=len(examples),
        calibrated=False,
    )
    return TrainedModelBundle(pipeline=pipe, meta=meta)


def predict(bundle: TrainedModelBundle, canonical_text: str) -> ModelOutputs:
    proba = bundle.pipeline.predict_proba([canonical_text])
    proba = np.asarray(proba)[0].astype(float)

    rules = build_rule_signals(canonical_text)
    boost = 0.0
    boost += 0.08 * rules.has_brand_lock
    boost += 0.06 * rules.has_single_supplier_hint
    boost += 0.05 * rules.has_excessive_requirements

    overall = float(np.clip(0.45 * proba[0] + 0.35 * proba[1] + 0.20 * proba[2] + boost, 0.0, 1.0))

    return ModelOutputs(
        spec_manipulation=float(np.clip(proba[0], 0.0, 1.0)),
        price_inflation=float(np.clip(proba[1], 0.0, 1.0)),
        quantity_anomaly=float(np.clip(proba[2], 0.0, 1.0)),
        overall_risk=overall,
    )


def save_bundle(bundle: TrainedModelBundle, path: str) -> None:
    Path(os.path.dirname(path)).mkdir(parents=True, exist_ok=True)
    joblib.dump({"pipeline": bundle.pipeline, "meta": bundle.meta.__dict__}, path)


def load_bundle(path: str) -> TrainedModelBundle:
    obj = joblib.load(path)
    meta = ModelMeta(**obj["meta"])
    return TrainedModelBundle(pipeline=obj["pipeline"], meta=meta)
