# QazTender AI

Real AI + real web intelligence MVP for procurement/tender risk detection.

## What this repo contains

- `backend/` — FastAPI backend
  - Unified ingestion pipeline: text / file / URL → canonical text → stable chunks
  - Deterministic `canonical_text_hash` (debug mode)
  - Supervised ML baseline (TF-IDF + LogisticRegression) with explainable signals
  - Web intelligence: live market price discovery (no API keys required; best-effort) + caching
  - Consistency regression tests (same input ⇒ same hash & same score)

- `frontend/` — Next.js UI (premium dark UI). Branding is **QazTender AI**.

- `scripts/` — training utilities (prepare/train/evaluate)

## Quickstart

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Endpoints

- `POST /analyze/text`
- `POST /analyze/url`
- `POST /analyze/file`
- `POST /analyze` (legacy structured payload)

### Training (baseline)

From repo root:

```bash
PYTHONPATH=backend python scripts/train_model.py --data backend/app/ml/demo_data.jsonl
PYTHONPATH=backend python scripts/evaluate.py --data backend/app/ml/demo_data.jsonl
```

### Tests

```bash
cd backend
pytest -q
```

## Privacy

- No personal data collection is implemented.
- Minimal logs by default.
- Web market results are cached in SQLite for the demo.
