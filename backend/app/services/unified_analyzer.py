from __future__ import annotations

import math
import random
from typing import Any, Optional

from ..ingestion.pipeline import to_canonical, to_segmented
from ..ingestion.types import AcquiredDocument, CanonicalDocument
from ..ml.inference import infer, ModelNotReady
from ..ml.feature_builder import build_rule_signals
from ..webintel.market_prices import fetch_market_intel, MarketIntel
from ..extraction.item_extractor import extract_items_from_text


def _risk_category(score_0_100: float) -> str:
    if score_0_100 < 30:
        return "LOW"
    if score_0_100 < 60:
        return "MEDIUM"
    return "HIGH"


def _mc_simulate(
    tender_unit_price: float,
    market_avg: float,
    market_std: float,
    n: int = 800,
    seed: int = 1337,
) -> list[float]:
    """Deterministic Monte Carlo (normal approximation).

    We keep it deterministic (fixed seed) so the same canonical input yields
    the same simulation output.
    """
    rng = random.Random(seed)
    if market_avg <= 0:
        market_avg = max(1.0, tender_unit_price)
    if market_std <= 0:
        market_std = max(1.0, 0.15 * market_avg)

    samples: list[float] = []
    for _ in range(n):
        # Box–Muller transform
        u1 = max(1e-9, rng.random())
        u2 = max(1e-9, rng.random())
        z = math.sqrt(-2.0 * math.log(u1)) * math.cos(2.0 * math.pi * u2)
        x = market_avg + market_std * z
        samples.append(max(0.0, float(x)))
    return samples


def analyze_document(
    acquired: AcquiredDocument,
    *,
    tender_title: str | None = None,
    category: str | None = None,
    region: str | None = None,
    currency: str = "KZT",
    items: Optional[list[dict]] = None,
    bids: Optional[list[dict]] = None,
    participants_count: Optional[int] = None,
    debug: bool = False,
    enable_webintel: bool = True,
) -> dict[str, Any]:
    """Unified analysis for ALL input modes."""
    canonical: CanonicalDocument = to_canonical(acquired)
    segmented = to_segmented(canonical)

    # ==== If items/bids were not provided (file/url modes), best-effort extract them from canonical text ====
    if not items:
        extracted_items = extract_items_from_text(canonical.canonical_text, default_currency=currency)
        if extracted_items:
            items = [
                {
                    "item_id": f"I{i+1}",
                    "name": it.name,
                    "quantity": float(it.quantity) if it.quantity is not None else 1.0,
                    "unit": it.unit or "pcs",
                    "unit_price": float(it.unit_price) if it.unit_price is not None else None,
                    "currency": it.currency or currency,
                }
                for i, it in enumerate(extracted_items)
            ]

    if not bids and items:
        # If we have unit_price on the first item, synthesize a bid marker.
        try:
            up = items[0].get("unit_price")
            if up is not None:
                bids = [{"supplier_id": "S1", "supplier_name": "Bidder", "unit_price": float(up)}]
        except Exception:
            pass

    # ==== ML inference (real supervised model) ====
    model_ready = True
    model_error = None
    try:
        ml_out, ml_meta = infer(canonical.canonical_text)
    except ModelNotReady as e:
        model_ready = False
        model_error = str(e)
        ml_out, ml_meta = None, None

    rules = build_rule_signals(canonical.canonical_text)

    # ==== Determine tender unit price marker (from bids or extracted item price) ====
    tender_unit_price = None
    if bids:
        try:
            tender_unit_price = float(min(b.get("unit_price", float("inf")) for b in bids))
        except Exception:
            tender_unit_price = None
    if tender_unit_price is None and items:
        try:
            up = items[0].get("unit_price")
            if up is not None:
                tender_unit_price = float(up)
        except Exception:
            tender_unit_price = None

    # ==== Pick an item for web market research (MVP uses first item) ====
    item_name_for_web = None
    item_qty = None
    if items and len(items) > 0:
        item0 = items[0]
        item_name_for_web = str(item0.get("name") or item0.get("item_name") or item0.get("title") or "").strip() or None
        try:
            item_qty = float(item0.get("quantity") or item0.get("qty") or 0.0)
        except Exception:
            item_qty = None

    # ==== Web intelligence ====
    market: Optional[MarketIntel] = None
    market_samples: list[float] = []
    evidence = []
    if enable_webintel and item_name_for_web:
        market = fetch_market_intel(item_name_for_web, target_currency=currency)
        market_samples = list(market.samples)
        evidence = [e.__dict__ for e in market.evidence]

    # If web intel fails, fall back to deterministic demo samples around tender price.
    if (not market_samples) and tender_unit_price is not None:
        # Deterministic synthetic market distribution: +/- 20% around tender price
        seed = int(canonical.canonical_text_hash[:8], 16)
        rng = random.Random(seed)
        market_samples = [max(0.0, tender_unit_price * (0.8 + 0.4 * rng.random())) for _ in range(90)]
        # Use robust summary
        try:
            import numpy as np

            arr = np.array(market_samples, dtype=float)
            low = float(np.percentile(arr, 2.5))
            avg = float(np.mean(arr))
            high = float(np.percentile(arr, 97.5))
        except Exception:
            low = tender_unit_price * 0.85
            avg = tender_unit_price * 1.0
            high = tender_unit_price * 1.15

        market = MarketIntel(
            item_name=item_name_for_web or "",
            normalized_name=(item_name_for_web or "").strip().lower(),
            market_low=low,
            market_avg=avg,
            market_high=high,
            confidence=0.15,
            samples=market_samples,
            evidence=[],
            mode="demo",
        )

    # ==== Factor signals ====
    spec_score = float(ml_out.spec_manipulation) if ml_out else float(
        min(1.0, 0.55 * rules.has_brand_lock + 0.35 * rules.has_excessive_requirements + 0.20 * rules.has_single_supplier_hint)
    )

    deviation_pct = None
    price_deviation_score = float(ml_out.price_inflation) if ml_out else 0.0
    if tender_unit_price is not None and market and market.market_avg > 0:
        deviation_pct = (tender_unit_price - market.market_avg) / market.market_avg * 100.0
        # Map to 0..1 (0% -> 0, 30% -> ~0.43, 70% -> 1)
        price_deviation_score = float(max(0.0, min(1.0, (deviation_pct) / 70.0)))

    expected_qty = None
    quantity_ratio = None
    quantity_score = float(ml_out.quantity_anomaly) if ml_out else 0.2
    if item_qty is not None:
        expected_qty = max(1.0, item_qty * 0.7)
        quantity_ratio = item_qty / expected_qty if expected_qty else None
        if item_qty >= 100000:
            quantity_score = 0.9
        elif item_qty >= 10000:
            quantity_score = 0.65
        elif item_qty >= 1000:
            quantity_score = 0.35
        else:
            quantity_score = 0.1

    participant_score = 0.0
    if participants_count is not None:
        try:
            pc = int(participants_count)
            if pc <= 1:
                participant_score = 0.9
            elif pc == 2:
                participant_score = 0.55
            elif pc == 3:
                participant_score = 0.35
            else:
                participant_score = 0.15
        except Exception:
            participant_score = 0.2

    base_overall = float(ml_out.overall_risk) if ml_out else float(0.45 * spec_score + 0.35 * price_deviation_score + 0.20 * quantity_score)
    overall = float(max(0.0, min(1.0, base_overall + 0.10 * participant_score)))
    risk_score_0_100 = round(100.0 * overall, 2)

    # ==== Graphs ====
    mc_samples = []
    if tender_unit_price is not None and market and market.market_avg > 0:
        std = 0.0
        if market.samples and len(market.samples) >= 3:
            try:
                import numpy as np
                std = float(np.std(market.samples))
            except Exception:
                std = 0.0
        mc_samples = _mc_simulate(tender_unit_price, market.market_avg, std, n=600)

    quantity_chart = []
    if item_qty is not None and expected_qty is not None:
        quantity_chart = [
            {"label": "requested", "value": float(item_qty)},
            {"label": "estimated_need", "value": float(expected_qty)},
        ]

    # ==== Explainability triggers ====
    triggers = []
    if rules.has_brand_lock:
        triggers.append({"tag": "brand_lock", "severity": "high", "reason": "Brand-locking language detected (e.g., 'only brand', 'no equivalent')."})
    if rules.has_single_supplier_hint:
        triggers.append({"tag": "single_supplier_hint", "severity": "high", "reason": "Single-supplier / direct-contract hint detected."})
    if rules.has_excessive_requirements:
        triggers.append({"tag": "excessive_requirements", "severity": "medium", "reason": "Potentially excessive requirements detected (ISO, years of experience, etc.)."})
    if deviation_pct is not None and deviation_pct > 30.0:
        triggers.append({"tag": "price_above_market", "severity": "high", "reason": "Tender unit price appears above market average based on web evidence."})

    # ==== Output ====
    # History intelligence (hybrid demo tied to canonical hash). This makes the history page
    # non-empty and consistent per tender, even without real portal integration.
    seed = int(canonical.canonical_text_hash[:8], 16)
    rng_h = random.Random(seed)
    dominant = None
    try:
        if bids and bids[0].get("supplier_name"):
            dominant = str(bids[0].get("supplier_name"))
    except Exception:
        dominant = None

    supplier_pool = [dominant or "TechSupply LLP", "DigitalPartner", "CityIT", "QazSolutions", "AltynTech"]
    rng_h.shuffle(supplier_pool)
    total_wins = 6
    w1 = max(2, int(round(total_wins * (0.45 + 0.25 * rng_h.random()))))
    w2 = max(1, int(round((total_wins - w1) * (0.55 + 0.25 * rng_h.random()))))
    w3 = max(0, total_wins - w1 - w2)
    history_intel = {
        "top_suppliers": [
            {"supplier": supplier_pool[0], "wins": w1},
            {"supplier": supplier_pool[1], "wins": w2},
            {"supplier": supplier_pool[2], "wins": w3},
        ],
        "data_source": "demo_tied_to_hash" if not enable_webintel else "hybrid_demo",
        "confidence": 0.25,
    }

    result: dict[str, Any] = {
        # New unified output (API contract)
        "risk_score": risk_score_0_100,
        "risk_category": _risk_category(risk_score_0_100),
        "factors": {
            "spec_manipulation": round(spec_score, 4),
            "price_inflation": round(price_deviation_score, 4),
            "quantity_anomaly": round(quantity_score, 4),
            "participant_count_risk": round(participant_score, 4),
        },
        "web_intel": {
            "enabled": bool(enable_webintel),
            "market_low": market.market_low if market else None,
            "market_avg": market.market_avg if market else None,
            "market_high": market.market_high if market else None,
            "confidence": float(market.confidence) if market else 0.0,
            "mode": market.mode if market else "disabled",
            "evidence": evidence,
            "samples": market_samples,
        },
        "graphs": {
            "market_price_samples": market_samples,
            "tender_unit_price": tender_unit_price,
            "monte_carlo_samples": mc_samples,
            "quantity_chart": quantity_chart,
        },
        "canonical_text": canonical.canonical_text,
        "explainability": {"triggers": triggers},

        # Legacy UI contract (frontend currently calls /analyze)
        "input": {"title": tender_title, "category": category, "region": region, "currency": currency},
        "spec_intelligence": {
            "signals": {
                "brand_lock": bool(rules.has_brand_lock),
                "single_supplier_hint": bool(rules.has_single_supplier_hint),
                "excessive_requirements": bool(rules.has_excessive_requirements),
            },
            "spec_score": round(spec_score * 100.0, 2),
        },
        "price_intelligence": {
            "market_mean": float(market.market_avg) if market else 0.0,
            "ci95": [float(market.market_low), float(market.market_high)] if market else [0.0, 0.0],
            "deviation_pct": float(deviation_pct) if deviation_pct is not None else 0.0,
            "overpriced_flag": bool(deviation_pct is not None and deviation_pct > 30.0),
            "price_score": round(price_deviation_score * 100.0, 2),
            "samples": market_samples,
            "monte_carlo_samples": mc_samples,
            "data_source": (market.mode if market else "none"),
            "confidence": float(market.confidence) if market else 0.0,
            "evidence": evidence,
        },
        "quantity_intelligence": {
            "expected_median": float(expected_qty) if expected_qty is not None else 0.0,
            "expected_quantity": float(expected_qty) if expected_qty is not None else 0.0,
            "requested_quantity": float(item_qty) if item_qty is not None else 0.0,
            "ratio": float(quantity_ratio) if quantity_ratio is not None else 0.0,
            "quantity_score": round(quantity_score * 100.0, 2),
            "data_source": "Heuristic baseline",
        },

        "history_intelligence": history_intel,
    }

    if debug:
        result["debug"] = {
            "canonical_text_hash": canonical.canonical_text_hash,
            "content_type": canonical.content_type,
            "url_final": canonical.url_final,
            "chunks_count": len(segmented.chunks),
            "model": (ml_meta.__dict__ if ml_meta is not None else None),
            "model_ready": model_ready,
            "model_error": model_error,
        }

    return result
