from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass(frozen=True)
class RuleSignals:
    has_brand_lock: int
    has_single_supplier_hint: int
    has_excessive_requirements: int
    mentions_warranty: int


_BRAND_LOCK_PATTERNS = [
    r"\b(только|only)\b.*\b(бренд|brand|марка)\b",
    r"\b(без\s+аналога|no\s+equivalent)\b",
    r"\b(оригинал|original)\b\s+(только|only)",
]

_SINGLE_SUPPLIER_PATTERNS = [
    r"\b(единственный\s+поставщик|single\s+supplier)\b",
    r"\b(без\s+конкуренции|without\s+competition)\b",
    r"\b(по\s+прямому\s+договору|direct\s+contract)\b",
]

_EXCESSIVE_REQ_PATTERNS = [
    r"\b(не\s+менее\s+\d+\s+лет|at\s+least\s+\d+\s+years)\b",
    r"\b(сертификат\s+ISO|ISO\s*\d+)\b",
    r"\b(опыт\s+работы|years\s+of\s+experience)\b",
]


def build_rule_signals(canonical_text: str) -> RuleSignals:
    txt = canonical_text.lower()

    def any_match(patterns: list[str]) -> int:
        for p in patterns:
            if re.search(p, txt, flags=re.IGNORECASE | re.MULTILINE):
                return 1
        return 0

    has_brand_lock = any_match(_BRAND_LOCK_PATTERNS)
    has_single_supplier_hint = any_match(_SINGLE_SUPPLIER_PATTERNS)
    has_excessive_requirements = any_match(_EXCESSIVE_REQ_PATTERNS)
    mentions_warranty = 1 if re.search(r"\b(гарантия|warranty)\b", txt, flags=re.IGNORECASE) else 0

    return RuleSignals(
        has_brand_lock=has_brand_lock,
        has_single_supplier_hint=has_single_supplier_hint,
        has_excessive_requirements=has_excessive_requirements,
        mentions_warranty=mentions_warranty,
    )
