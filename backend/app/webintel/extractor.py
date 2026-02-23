from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Optional, Tuple

_CCY_PATTERNS = [
    (re.compile(r"(?P<amt>\d+(?:\.\d+)?)\s*(?P<ccy>KZT|тг|тенге|₸)\b", re.IGNORECASE), "KZT"),
    (re.compile(r"(?P<amt>\d+(?:\.\d+)?)\s*(?P<ccy>USD|\$)\b", re.IGNORECASE), "USD"),
    (re.compile(r"(?P<amt>\d+(?:\.\d+)?)\s*(?P<ccy>EUR|€)\b", re.IGNORECASE), "EUR"),
    (re.compile(r"(?P<amt>\d+(?:\.\d+)?)\s*(?P<ccy>RUB|руб|₽)\b", re.IGNORECASE), "RUB"),
]


@dataclass(frozen=True)
class ExtractedPrice:
    amount: float
    currency: str
    raw: str


def extract_first_price(text: str) -> Optional[ExtractedPrice]:
    # Normalize numbers 10 000 -> 10000, 10,5 -> 10.5
    t = re.sub(r"(\d),(\d)", r"\1.\2", text)
    t = re.sub(r"(?<=\d)[ \u00a0\u202f](?=\d{3}(\D|$))", "", t)

    for rx, ccy in _CCY_PATTERNS:
        m = rx.search(t)
        if m:
            raw = m.group(0)
            try:
                amt = float(m.group("amt"))
            except Exception:
                continue
            return ExtractedPrice(amount=amt, currency=ccy, raw=raw)
    return None
