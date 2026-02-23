def clamp(x: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, x))

WEIGHTS = {
    "technical_narrowness": 0.25,
    "price_deviation": 0.30,
    "quantity_anomaly": 0.20,
    "participant_count_risk": 0.15,
    "winner_history_pattern": 0.10,
}

def compute_risk(factors: dict) -> tuple[float, dict]:
    # factors expected in 0..100
    contrib = {k: factors[k] * WEIGHTS[k] for k in WEIGHTS}
    score = sum(contrib.values())
    score = clamp(score)
    return score, contrib

def category(score: float) -> str:
    if score >= 67:
        return "High"
    if score >= 34:
        return "Medium"
    return "Low"