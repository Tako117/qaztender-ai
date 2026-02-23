from .nlp_spec import analyze_spec_rules
from .market_simulator import lognormal_samples, ci95, price_deviation_score
from .quantity import expected_quantity, quantity_score
from .risk_engine import compute_risk, category
from .explainability import build_explanations
from .history import history_score
from ..core.config import settings
from collections import Counter

def participant_risk(count: int) -> float:
    if count <= 1:
        return 100.0
    if count == 2:
        return 70.0
    if count == 3:
        return 45.0
    return 10.0

def summarize_history(category_key: str, region: str, history_rows: list[dict]) -> dict:
    scoped = [r for r in history_rows if r.get("category") == category_key and r.get("region") == region]
    if not scoped:
        return {
            "sample": 0,
            "top_suppliers": [],
            "note": "No history rows for this category/region."
        }

    wins = [r for r in scoped if r.get("won")]
    c = Counter([r.get("supplier_name") or r.get("supplier_id") for r in wins])
    top = [{"supplier": k, "wins": v} for k, v in c.most_common(8)]

    return {
        "sample": len(scoped),
        "top_suppliers": top
    }

def analyze_tender(tender: dict, market_ref: dict, history_rows: list[dict]) -> dict:
    spec = analyze_spec_rules(tender["spec_text"], tender["category"])

    # Choose "winning" bid for MVP: min unit price
    winning_bid = sorted(tender["bids"], key=lambda b: b["unit_price"])[0]
    item0 = tender["items"][0]

    # Market mean from reference table (fallback)
    market_mean = market_ref.get(tender["category"], {}).get(item0["name"], 100000.0)
    samples = lognormal_samples(mean=market_mean, cv=0.18, n=5000)
    lo, hi = ci95(samples)

    deviation_pct = (winning_bid["unit_price"] - market_mean) / market_mean * 100.0
    overpriced = deviation_pct > 30.0
    price_score = price_deviation_score(deviation_pct)

    exp_qty = expected_quantity(tender["category"], item0["name"])
    qty_score, ratio = quantity_score(item0["quantity"], exp_qty)

    p_risk = participant_risk(tender["participants_count"])

    # History scoring using seed rows scoped to tender category/region and winning supplier
    h_score, h_details = history_score(winning_bid["supplier_id"], [r for r in history_rows if r.get("category") == tender["category"] and r.get("region") == tender["region"]]) \
        if history_rows else (15.0, {"win_rate_cat_region": 0.0, "wins": 0, "sample": 0})

    factors = {
        "technical_narrowness": float(spec["technical_narrowness_score"]),
        "price_deviation": float(price_score),
        "quantity_anomaly": float(qty_score),
        "participant_count_risk": float(p_risk),
        "winner_history_pattern": float(h_score)
    }

    risk, contrib = compute_risk(factors)

    flags = {
        "overpriced": overpriced,
        "deviation_pct": deviation_pct,
        "participants_count": tender["participants_count"]
    }

    explanations = build_explanations(factors, contrib, flags)

    suspicious_fragments = [
        {"start": s, "end": e, "text": t, "reason": r, "severity": sev}
        for (s, e, t, r, sev) in spec["suspicious_fragments"]
    ]

    # Honest metadata for UI
    if settings.DEMO_MODE:
        price_source = "Seed market baseline"
        price_conf = 0.35
        history_source = "Seed history baseline"
        history_conf = 0.30
    else:
        price_source = "Real sources (connected)"
        price_conf = 0.75
        history_source = "Real portal history (connected)"
        history_conf = 0.70

    history_summary = summarize_history(tender["category"], tender["region"], history_rows)

    return {
        "tender_id": tender["tender_id"],
        "risk_score": risk,
        "risk_category": category(risk),
        "factor_scores": factors,
        "weighted_contributions": contrib,
        "suspicious_fragments": suspicious_fragments,
        "price_intelligence": {
            "market_mean": market_mean,
            "ci95": [lo, hi],
            "deviation_pct": deviation_pct,
            "overpriced_flag": overpriced,
            "monte_carlo_samples": samples[:600],
            "data_source": price_source,
            "confidence": price_conf
        },
        "quantity_intelligence": {
            "expected_median": exp_qty,
            "ratio": ratio,
            "data_source": "Heuristic baseline",
            "confidence": 0.40 if settings.DEMO_MODE else 0.65
        },
        "history_intelligence": {
            "data_source": history_source,
            "confidence": history_conf,
            "win_rate_cat_region": h_details.get("win_rate_cat_region", 0.0),
            "wins": h_details.get("wins", 0),
            "sample": h_details.get("sample", 0),
            "top_suppliers": history_summary.get("top_suppliers", []),
            "note": "History is limited unless real portal data is connected."
        },
        "explanations": explanations
    }