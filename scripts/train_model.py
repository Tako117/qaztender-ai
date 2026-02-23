from __future__ import annotations

import argparse
import json
from pathlib import Path

# Run with: PYTHONPATH=backend python scripts/train_model.py ...
from app.ml.model import train_baseline, save_bundle


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
    ap.add_argument("--data", required=True, help="Prepared JSONL containing canonical_text + labels.")
    ap.add_argument("--out", default="backend/app/ml/artifacts/qaztender_baseline.joblib", help="Output model path.")
    ap.add_argument("--model-version", default="0.1.0", help="Model version tag.")
    args = ap.parse_args()

    data_path = Path(args.data)
    examples = load_jsonl(data_path)

    if len(examples) < 8:
        raise SystemExit("Need at least 8 labeled examples to train a baseline model.")

    bundle = train_baseline(examples, model_version=args.model_version)
    save_bundle(bundle, args.out)
    print(f"Saved model -> {args.out} (trained_on={bundle.meta.trained_on_examples})")


if __name__ == "__main__":
    main()
