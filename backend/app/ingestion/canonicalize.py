from __future__ import annotations

import hashlib
import re
import unicodedata
from collections import Counter
from typing import Iterable

# Minimal multilingual unit normalization (ru/kk/en)
_UNIT_MAP = {
    # bytes
    "гб": "GB",
    "гиг": "GB",
    "гигабайт": "GB",
    "gigabyte": "GB",
    "gb": "GB",
    "мб": "MB",
    "мегабайт": "MB",
    "megabyte": "MB",
    "mb": "MB",
    # pieces
    "шт": "pcs",
    "штук": "pcs",
    "дана": "pcs",
    "pcs": "pcs",
    "piece": "pcs",
    "pieces": "pcs",
    # kilograms
    "кг": "kg",
    "килограмм": "kg",
    "kilogram": "kg",
    "kg": "kg",
    # liters
    "л": "L",
    "литр": "L",
    "liter": "L",
    "l": "L",
}

# Currency normalization tokens (does not convert amounts; just standardizes tokens)
_CCY_MAP = {
    "₸": "KZT",
    "тг": "KZT",
    "тенге": "KZT",
    "kzt": "KZT",
    "руб": "RUB",
    "₽": "RUB",
    "rub": "RUB",
    "$": "USD",
    "usd": "USD",
    "€": "EUR",
    "eur": "EUR",
}

# Common tender boilerplate fragments that often appear as repeated headers/footers
_HEADER_FOOTER_HINTS = (
    "страница",
    "page",
    "конфиденциально",
    "confidential",
    "подпись",
    "signature",
)


def _normalize_newlines(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    return text


def _normalize_unicode(text: str) -> str:
    # NFKC makes visually-identical characters consistent (e.g., fullwidth, etc.)
    return unicodedata.normalize("NFKC", text)


def _normalize_numbers(text: str) -> str:
    # 2,4 -> 2.4 (common in RU/KZ)
    text = re.sub(r"(\d),(\d)", r"\1.\2", text)
    # unify thin spaces in numbers: 10 000 -> 10000, 10\u00a0000 -> 10000
    text = re.sub(r"(?<=\d)[ \u00a0\u202f](?=\d{3}(\D|$))", "", text)
    return text


def _normalize_currency_tokens(text: str) -> str:
    for k, v in _CCY_MAP.items():
        text = re.sub(rf"(?<!\w){re.escape(k)}(?!\w)", v, text, flags=re.IGNORECASE)
    return text


def _normalize_units(text: str) -> str:
    def repl(m: re.Match) -> str:
        token = m.group(0)
        key = token.lower()
        return _UNIT_MAP.get(key, token)

    # replace standalone word-like unit tokens
    text = re.sub(r"\b[\w\-]+\b", repl, text, flags=re.UNICODE)
    return text


def _squash_whitespace_preserve_lines(text: str) -> str:
    # Keep line breaks (important for stable table-ish layouts), but normalize within a line.
    lines = []
    for line in text.split("\n"):
        line = re.sub(r"[\t\f\v]+", " ", line)
        line = re.sub(r"\s+", " ", line).strip()
        lines.append(line)
    # remove leading/trailing empty lines
    while lines and lines[0] == "":
        lines.pop(0)
    while lines and lines[-1] == "":
        lines.pop()
    return "\n".join(lines)


def _drop_repeated_headers_footers(lines: list[str]) -> list[str]:
    # Heuristic:
    # - normalize each line (lower, collapse spaces)
    # - if a short-ish line repeats many times, drop it
    norm = [re.sub(r"\s+", " ", ln).strip().lower() for ln in lines]
    counts = Counter([n for n in norm if n])
    # candidate repeated lines
    repeated = {n for n, c in counts.items() if c >= 3 and len(n) <= 80}
    def is_header_footer(ln_norm: str) -> bool:
        if ln_norm in repeated:
            return True
        if any(h in ln_norm for h in _HEADER_FOOTER_HINTS) and len(ln_norm) <= 80:
            # often page footer/header line
            return True
        return False

    out = []
    for ln, ln_norm in zip(lines, norm):
        if ln_norm and is_header_footer(ln_norm):
            continue
        out.append(ln)
    return out


def canonicalize_text(raw_text: str) -> str:
    """Canonical, deterministic normalization.

    Guarantee: identical underlying content => identical canonical text
    regardless of acquisition mode.
    """
    text = _normalize_newlines(raw_text)
    text = _normalize_unicode(text)
    text = _normalize_numbers(text)
    text = _normalize_currency_tokens(text)
    text = _normalize_units(text)
    text = _squash_whitespace_preserve_lines(text)

    # header/footer removal
    lines = text.split("\n")
    lines = _drop_repeated_headers_footers(lines)

    # remove consecutive empty lines (already mostly removed but be safe)
    cleaned = []
    prev_empty = False
    for ln in lines:
        empty = (ln.strip() == "")
        if empty and prev_empty:
            continue
        cleaned.append(ln)
        prev_empty = empty

    return "\n".join(cleaned).strip()


def canonical_hash(canonical_text: str) -> str:
    return hashlib.sha256(canonical_text.encode("utf-8")).hexdigest()


def canonicalize_and_hash(raw_text: str) -> tuple[str, str]:
    text = canonicalize_text(raw_text)
    return text, canonical_hash(text)
