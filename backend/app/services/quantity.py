def expected_quantity(category: str, item_name: str) -> float:
    # MVP heuristics; extend with learned baselines later
    key = item_name.lower()
    if "laptop" in key or "notebook" in key:
        return 30.0
    if "printer" in key:
        return 10.0
    if "fuel" in key or "diesel" in key:
        return 5000.0
    return 100.0

def quantity_score(stated: float, expected: float) -> tuple[float, float]:
    ratio = stated / max(1e-6, expected)
    if ratio <= 1.2:
        return 0.0, ratio
    # ramp up
    score = min(100.0, (ratio - 1.0) * 40.0)  # 2x -> 40, 3x -> 80
    return score, ratio