from __future__ import annotations

"""Calibration script placeholder (hackathon-safe).

For a fuller MVP:
- split train/valid
- fit Platt scaling (sigmoid) or isotonic on validation probs per head
- persist calibrator and apply during inference.

This repo keeps baseline deterministic and simple.
"""

import argparse


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--help-note", action="store_true")
    _ = ap.parse_args()
    print(
        "Calibration is not implemented in this minimal baseline. "
        "Use a validation split + sklearn CalibratedClassifierCV if needed."
    )


if __name__ == "__main__":
    main()
