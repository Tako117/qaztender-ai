from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
from sklearn.metrics import classification_report

# Run with: PYTHONPATH=backend python scripts/evaluate.py ...
from app.ml.model import load_bundle


def load_jsonl(path: Path) -> list[dict]:
    examples = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        examples.append(json.loads(line))
    return examples


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", required=True, help="Prepared JSONL.")
    ap.add_argument("--model", default="backend/app/ml/artifacts/qaztender_baseline.joblib", help="Model artifact path.")
    args = ap.parse_args()

    bundle = load_bundle(args.model)
    examples = load_jsonl(Path(args.data))

    X = [ex["canonical_text"] for ex in examples]
    y_true = np.array(
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

    y_pred = (bundle.pipeline.predict_proba(X) >= 0.5).astype(int)

    print("=== Multi-label report (3 heads) ===")
    for i, name in enumerate(["spec_manipulation", "price_inflation", "quantity_anomaly"]):
        print(f"\n--- {name} ---")
        print(classification_report(y_true[:, i], y_pred[:, i], digits=3))


if __name__ == "__main__":
    main()
