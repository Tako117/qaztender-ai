from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Iterable, Optional

# NOTE:
# This module is intentionally lightweight and deterministic.
# It provides "best effort" extraction of line items (name/qty/unit/unit_price/currency)
# from canonical text so file/url/text modes yield consistent downstream graphs.


_CURRENCY_ALIASES = {
    "KZT": ["kzt", "тг", "тенге", "теңге", "₸"],
    "RUB": ["rub", "руб", "₽"],
    "USD": ["usd", "$", "дол", "доллар", "us$"],
    "EUR": ["eur", "€"],
}

_UNIT_ALIASES = {
    "pcs": ["pcs", "pc", "piece", "pieces", "шт", "штук", "дана", "ед", "unit"],
    "kg": ["kg", "кг", "килограмм", "kilogram"],
    "g": ["g", "гр", "г", "gram"],
    "l": ["l", "л", "литр", "liter"],
    "m": ["m", "м", "метр", "meter"],
    "set": ["set", "компл", "комплект", "набор"],
    "box": ["box", "кор", "короб", "упак", "упаковка", "pack"],
}


def _norm_ws(s: str) -> str:
    return re.sub(r"\s+", " ", s or "").strip()


def _parse_number(s: str) -> Optional[float]:
    """Parse numbers like '2,4' '1 200,50' '1200.50' -> float."""
    if s is None:
        return None
    t = str(s)
    t = t.replace("\u00a0", " ")
    t = re.sub(r"[^\d,.\- ]", "", t)
    t = _norm_ws(t)
    if not t:
        return None

    # Remove spaces used as thousand separators
    t = t.replace(" ", "")

    # If both comma and dot exist: assume comma is thousands separator, dot is decimal
    if "," in t and "." in t:
        # decide by last separator position: the last one is decimal
        if t.rfind(",") > t.rfind("."):
            # comma decimal, dot thousands
            t = t.replace(".", "")
            t = t.replace(",", ".")
        else:
            # dot decimal, comma thousands
            t = t.replace(",", "")
    else:
        # only comma -> decimal comma
        if "," in t and "." not in t:
            t = t.replace(",", ".")
    try:
        return float(t)
    except Exception:
        return None


def _detect_currency(text: str, default: str = "KZT") -> str:
    low = text.lower()
    for cur, aliases in _CURRENCY_ALIASES.items():
        for a in aliases:
            if a in low:
                return cur
    return default


def _detect_unit(text: str) -> Optional[str]:
    low = text.lower()
    for unit, aliases in _UNIT_ALIASES.items():
        for a in aliases:
            # match as token-ish
            if re.search(rf"(?<!\w){re.escape(a)}(?!\w)", low):
                return unit
    return None


@dataclass(frozen=True)
class ExtractedItem:
    name: str
    quantity: Optional[float] = None
    unit: Optional[str] = None
    unit_price: Optional[float] = None
    currency: Optional[str] = None


# Common patterns:
# - "Наименование ... Кол-во ... Цена ...", "Qty", "Unit price"
# - list lines: "1. Item name - 10 шт - 2500 тг"
# - tables copied to text: "Item | qty | price"
_RE_ROW_SPLIT = re.compile(r"(?:\r?\n)+")
_RE_BULLET_PREFIX = re.compile(r"^\s*(?:\d+[\).\]]|[-–•*])\s+")

# price tokens
_RE_PRICE = re.compile(
    r"(?:(?:цена|стоимость|price|unit\s*price|ц/ед|цена\s*за\s*ед)[^\d]{0,12})?"
    r"(?P<price>[-+]?\d[\d\s\u00a0]*[.,]?\d{0,3})"
    r"\s*(?P<cur>₸|kzt|тг|тенге|теңге|руб|₽|rub|usd|\$|eur|€)?",
    re.IGNORECASE,
)

_RE_QTY = re.compile(
    r"(?:(?:кол-?во|количество|qty|quantity|amount)[^\d]{0,12})?"
    r"(?P<qty>[-+]?\d[\d\s\u00a0]*[.,]?\d{0,3})"
    r"\s*(?P<unit>pcs|pc|шт|штук|дана|ед|kg|кг|g|гр|г|l|л|m|м|set|компл|комплект|упак|pack|box|короб|кор)?",
    re.IGNORECASE,
)


def _candidate_lines(text: str) -> Iterable[str]:
    for raw in _RE_ROW_SPLIT.split(text or ""):
        line = _norm_ws(raw)
        if not line:
            continue
        # avoid extremely long "paragraph" lines for item extraction
        if len(line) > 400:
            continue
        yield line


def extract_items_from_text(text: str, default_currency: str = "KZT") -> list[ExtractedItem]:
    """Extract item-like rows from canonical text.

    Deterministic strategy:
    - scan lines
    - pick lines that look like they contain both a name and either qty or price
    - normalize name by stripping numbering/bullets and common column headings
    """
    items: list[ExtractedItem] = []
    if not text:
        return items

    for line in _candidate_lines(text):
        # strip bullet prefixes for name
        core = _RE_BULLET_PREFIX.sub("", line)

        # skip obvious headings
        low = core.lower()
        if low in {"наименование", "наименование товара", "товар", "item", "items"}:
            continue

        price_m = _RE_PRICE.search(core)
        qty_m = _RE_QTY.search(core)

        # Heuristic: must have at least one of qty/price and also some letters
        if not (price_m or qty_m):
            continue
        if not re.search(r"[A-Za-zА-Яа-яӘәІіҢңҒғҮүҰұҚқӨө]", core):
            continue

        currency = _detect_currency(core, default=default_currency)
        unit = _detect_unit(core) or (qty_m.group("unit").lower() if qty_m and qty_m.group("unit") else None)

        qty = _parse_number(qty_m.group("qty")) if qty_m else None
        price = _parse_number(price_m.group("price")) if price_m else None

        # Name extraction: remove matched qty/price substrings to keep it clean
        name = core
        if qty_m:
            name = name.replace(qty_m.group(0), " ")
        if price_m:
            name = name.replace(price_m.group(0), " ")
        name = _norm_ws(name)
        # If name becomes too short, fall back to original core
        if len(name) < 3:
            name = _norm_ws(core)

        # Final sanity: avoid treating whole tender paragraphs as item names
        if len(name) > 180:
            continue

        items.append(
            ExtractedItem(
                name=name,
                quantity=qty,
                unit=unit,
                unit_price=price,
                currency=currency,
            )
        )

        # Keep only a small number of items for MVP (deterministic truncation)
        if len(items) >= 30:
            break

    return items
