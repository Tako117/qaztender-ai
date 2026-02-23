from __future__ import annotations

import re
import time
from dataclasses import dataclass
from typing import Optional
from urllib.parse import quote_plus, urlparse

import requests
from bs4 import BeautifulSoup


@dataclass(frozen=True)
class SearchHit:
    url: str
    title: str
    snippet: str
    domain: str


class WebFetchError(RuntimeError):
    pass


def search_duckduckgo(query: str, max_hits: int = 8, timeout_s: int = 20) -> list[SearchHit]:
    # DuckDuckGo HTML endpoint (no API key). May be rate-limited; we handle failures upstream.
    url = "https://duckduckgo.com/html/?q=" + quote_plus(query)
    r = requests.get(url, timeout=timeout_s, headers={"User-Agent": "QazTenderAI/1.0"})
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "lxml")

    hits: list[SearchHit] = []
    for a in soup.select("a.result__a"):
        href = a.get("href") or ""
        title = a.get_text(" ", strip=True)
        # snippet container (best effort)
        parent = a.find_parent("div", class_="result")
        snippet = ""
        if parent:
            sn = parent.select_one(".result__snippet")
            snippet = sn.get_text(" ", strip=True) if sn else ""
        domain = urlparse(href).netloc.lower()
        if href and domain:
            hits.append(SearchHit(url=href, title=title, snippet=snippet, domain=domain))
        if len(hits) >= max_hits:
            break
    return hits


def fetch_page_text(url: str, timeout_s: int = 25) -> str:
    r = requests.get(url, timeout=timeout_s, headers={"User-Agent": "QazTenderAI/1.0"})
    r.raise_for_status()
    ct = (r.headers.get("Content-Type") or "").lower()
    if "text/html" not in ct and "<html" not in r.text[:300].lower():
        return r.text
    soup = BeautifulSoup(r.text, "lxml")
    for tag in soup(["script", "style", "noscript"]):
        tag.extract()
    main = soup.find("main") or soup.find("article") or soup.body
    return (main.get_text(separator="\n") if main else soup.get_text(separator="\n"))
