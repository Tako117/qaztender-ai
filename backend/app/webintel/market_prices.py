from __future__ import annotations

import hashlib
from dataclasses import dataclass
from typing import Any, Optional

from .query_builder import build_queries
from .fetcher import search_duckduckgo, fetch_page_text, SearchHit
from .extractor import extract_first_price
from .cleaner import aggregate
from .storage import WebCache


@dataclass(frozen=True)
class PriceEvidence:
    url: str
    domain: str
    title: str
    snippet: str
    extracted_price: float
    currency: str
    raw_text: str


@dataclass(frozen=True)
class MarketIntel:
    item_name: str
    normalized_name: str
    market_low: float
    market_avg: float
    market_high: float
    confidence: float
    samples: list[float]
    evidence: list[PriceEvidence]
    mode: str  # "live" | "cache" | "failed"


def _key_for_item(name: str) -> str:
    h = hashlib.sha256(name.strip().lower().encode("utf-8")).hexdigest()
    return f"market:{h}"


def fetch_market_intel(
    item_name: str,
    target_currency: str = "KZT",
    max_sources: int = 6,
    cache_ttl_s: int = 6 * 3600,
    cache: Optional[WebCache] = None,
) -> MarketIntel:
    cache = cache or WebCache()
    plan = build_queries(item_name)
    cache_key = _key_for_item(plan.normalized_name)

    cached = cache.get(cache_key, ttl_s=cache_ttl_s)
    if cached:
        payload = cached.payload
        return MarketIntel(
            item_name=item_name,
            normalized_name=payload["normalized_name"],
            market_low=payload["market_low"],
            market_avg=payload["market_avg"],
            market_high=payload["market_high"],
            confidence=payload["confidence"],
            samples=payload["samples"],
            evidence=[PriceEvidence(**e) for e in payload.get("evidence", [])],
            mode="cache",
        )

    hits: list[SearchHit] = []
    for q in plan.queries:
        try:
            hits.extend(search_duckduckgo(q, max_hits=max_sources))
        except Exception:
            continue

    # de-dup by url
    seen = set()
    uniq: list[SearchHit] = []
    for h in hits:
        if h.url in seen:
            continue
        seen.add(h.url)
        uniq.append(h)
        if len(uniq) >= max_sources:
            break

    evidence: list[PriceEvidence] = []
    samples: list[float] = []

    # Lightweight FX conversion (approximate) to reduce "no data" failures.
    # MVP only. Replace with a live FX source later.
    fx_to_kzt = {
        "KZT": 1.0,
        "USD": 480.0,
        "EUR": 520.0,
        "RUB": 5.2,
    }

    def convert(amount: float, cur: str, to_cur: str) -> tuple[float, float]:
        """Return (converted_amount, confidence_penalty)."""
        cur = (cur or "").upper()
        to_cur = (to_cur or "").upper()
        if cur == to_cur:
            return float(amount), 0.0
        if cur not in fx_to_kzt or to_cur not in fx_to_kzt:
            return float(amount), 0.35
        amount_kzt = float(amount) * fx_to_kzt[cur]
        out = amount_kzt / fx_to_kzt[to_cur]
        return float(out), 0.20

    conf_penalty = 0.0

    for h in uniq:
        try:
            page_text = fetch_page_text(h.url)
            pr = extract_first_price(page_text)
            if not pr:
                continue

            converted, penalty = convert(float(pr.amount), pr.currency, target_currency)
            conf_penalty = max(conf_penalty, penalty)

            evidence.append(
                PriceEvidence(
                    url=h.url,
                    domain=h.domain,
                    title=h.title,
                    snippet=h.snippet,
                    extracted_price=float(converted),
                    currency=target_currency,
                    raw_text=pr.raw,
                )
            )
            samples.append(float(converted))
        except Exception:
            continue

    cleaned = aggregate(samples, n_sources=len(evidence))

    result = MarketIntel(
        item_name=item_name,
        normalized_name=plan.normalized_name,
        market_low=cleaned.low,
        market_avg=cleaned.avg,
        market_high=cleaned.high,
        confidence=max(0.0, float(cleaned.confidence) - conf_penalty),
        samples=cleaned.values,
        evidence=evidence,
        mode="live" if evidence else "failed",
    )

    # cache even partial results to reduce repeated scraping
    cache.set(
        cache_key,
        {
            "normalized_name": result.normalized_name,
            "market_low": result.market_low,
            "market_avg": result.market_avg,
            "market_high": result.market_high,
            "confidence": result.confidence,
            "samples": result.samples,
            "evidence": [e.__dict__ for e in result.evidence],
        },
    )

    return result
