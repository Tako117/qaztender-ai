from __future__ import annotations

import argparse
import json
from pathlib import Path

# Run with: PYTHONPATH=backend python scripts/prepare_dataset.py ...
from app.ingestion.canonicalize import canonicalize_and_hash


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True, help="Raw labeled dataset JSONL (may contain raw_text field).")
    ap.add_argument("--output", required=True, help="Output JSONL with canonical_text + canonical_text_hash.")
    args = ap.parse_args()

    inp = Path(args.input)
    outp = Path(args.output)
    outp.parent.mkdir(parents=True, exist_ok=True)

    n = 0
    with inp.open("r", encoding="utf-8") as f_in, outp.open("w", encoding="utf-8") as f_out:
        for line in f_in:
            line = line.strip()
            if not line:
                continue
            ex = json.loads(line)
            raw = ex.get("raw_text") or ex.get("canonical_text") or ""
            canonical_text, h = canonicalize_and_hash(raw)
            ex["canonical_text"] = canonical_text
            ex["canonical_text_hash"] = h
            f_out.write(json.dumps(ex, ensure_ascii=False) + "\n")
            n += 1

    print(f"Prepared {n} examples -> {outp}")


if __name__ == "__main__":
    main()
