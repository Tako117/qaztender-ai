# QazTender AI — Training Plan (Hackathon-feasible)

## Dataset schema (JSONL)

Each line is one tender document:

```json
{
  "raw_text": "... optional ...",
  "canonical_text": "... required after prepare_dataset.py ...",
  "canonical_text_hash": "sha256...",
  "items": [
    {"name": "A4 paper", "qty": 100, "unit": "pcs", "unit_price": 1200, "currency": "KZT"}
  ],
  "labels": {
    "spec_manipulation": 0,
    "price_inflation": 1,
    "quantity_anomaly": 0,
    "overall_risk": 0
  },
  "explanation_tags": ["brand_lock", "price_above_market"]
}
```

Label scales:
- `spec_manipulation`: 0/1
- `price_inflation`: 0/1
- `quantity_anomaly`: 0/1
- `overall_risk`: 0..100 (optional; can be derived)

## Labeling guidelines (quick)

- Spec manipulation = 1 when:
  - brand lock (“only brand”, “no equivalent”, “original only”)
  - unnecessary certificates (ISO etc.) without justification
  - overly specific dimensions/colors that reduce competition

- Price inflation = 1 when:
  - tender price > market avg by ~30%+ with 3+ independent sources

- Quantity anomaly = 1 when:
  - requested quantity clearly exceeds realistic need (based on org size / historical usage / typical consumption)

## Baseline model (implemented)

- Vectorizer: TF-IDF (1–2 grams)
- Classifier: LogisticRegression (OneVsRest; 3 heads)
- Deterministic seed for reproducibility
- Inference output:
  - `spec_manipulation` probability
  - `price_inflation` probability
  - `quantity_anomaly` probability
  - `overall_risk` computed deterministic blend + rule boosts

## Metrics

- Per-head:
  - Precision / Recall / F1
- Overall risk:
  - MAE vs human 0..100 (if labeled)
  - Calibration plot (optional)

## Calibration & thresholding

For hackathon:
- Use a validation split and `CalibratedClassifierCV` (sigmoid/Platt) per head.
- Choose thresholds per head to balance recall (catch risk) vs precision (avoid false accusations).
- Surface “LOW CONFIDENCE” when:
  - fewer than 3 web sources
  - high dispersion in market samples
  - model is trained on too few examples
