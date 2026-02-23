from collections import Counter

def history_score(supplier_id: str, history_rows: list[dict]) -> tuple[float, dict]:
    # history_rows: [{supplier_id, category, region, won:bool}, ...]
    wins = [r for r in history_rows if r.get("won") and r.get("supplier_id") == supplier_id]
    total_cat_reg = [r for r in history_rows if r.get("category")==history_rows[0]["category"]
                     and r.get("region")==history_rows[0]["region"]]
    win_rate = (len(wins) / max(1, len(total_cat_reg))) if total_cat_reg else 0.0

    # map win_rate to 0..100
    score = min(100.0, win_rate * 200.0)  # 0.5 -> 100
    return score, {"win_rate_cat_region": win_rate, "wins": len(wins), "sample": len(total_cat_reg)}