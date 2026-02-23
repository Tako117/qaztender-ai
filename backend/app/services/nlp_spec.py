import re
from typing import List, Dict

BRANDS = ["HP", "Dell", "Lenovo", "Cisco", "Apple", "Samsung"]
MODEL_RE = re.compile(r"\b[A-Z]{2,}\-?\d{2,}[A-Z0-9\-]*\b")
NUM_CONSTRAINT_RE = re.compile(r"(\b\d+(\.\d+)?\b)\s?(mm|cm|inch|kg|w|wh|gb|mhz|ghz|%)", re.I)

def analyze_spec_rules(text: str, category: str) -> Dict:
    suspicious = []

    # Brand mentions
    for b in BRANDS:
        for m in re.finditer(rf"\b{re.escape(b)}\b", text):
            suspicious.append((m.start(), m.end(), text[m.start():m.end()],
                               "Brand-oriented language", "high"))

    # Model-like tokens
    for m in MODEL_RE.finditer(text):
        suspicious.append((m.start(), m.end(), m.group(0),
                           "Possible model/part number reference", "high"))

    # Missing "or equivalent"
    has_equiv = bool(re.search(r"\bor\s+equivalent\b", text, re.I))
    if (len(suspicious) > 0) and (not has_equiv):
        suspicious.append((0, min(len(text), 120),
                           text[:120],
                           "Brand/model mentioned without 'or equivalent'", "high"))

    # Constraint density
    constraints = list(NUM_CONSTRAINT_RE.finditer(text))
    density = (len(constraints) / max(1, len(text))) * 1000  # per 1000 chars

    # Narrowness score: combine density + brand presence
    score = min(100.0, density * 12.0 + (20.0 if len(suspicious) else 0.0))

    return {
        "technical_narrowness_score": score,
        "suspicious_fragments": suspicious,
        "constraint_density": density
    }