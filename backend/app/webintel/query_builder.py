from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass(frozen=True)
class QueryPlan:
    normalized_name: str
    queries: list[str]


def normalize_item_name(name: str) -> str:
    # SKU-like normalization: remove punctuation, collapse spaces, keep alnum and basic symbols.
    s = name.lower()
    s = re.sub(r"[\(\)\[\]\{\},;:/\\|]+", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def build_queries(item_name: str, locale_hint: str = "kz") -> QueryPlan:
    n = normalize_item_name(item_name)
    # 3-5 queries
    queries = [
        f"{n} цена KZT",
        f"{n} купить Казахстан",
        f"{n} price",
        f"{n} характеристики цена",
    ]
    # de-dup while preserving order
    seen=set()
    out=[]
    for q in queries:
        if q not in seen:
            out.append(q)
            seen.add(q)
    return QueryPlan(normalized_name=n, queries=out[:5])
