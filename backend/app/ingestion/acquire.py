from __future__ import annotations

import mimetypes
import os
import re
import tempfile
from dataclasses import dataclass
from typing import Optional, Tuple

import requests
from bs4 import BeautifulSoup
from pdfminer.high_level import extract_text as pdf_extract_text
import docx2txt

from .types import AcquiredDocument, InputMode


class AcquireError(RuntimeError):
    pass


def acquire_from_text(text: str, source: str = "pasted") -> AcquiredDocument:
    return AcquiredDocument(mode=InputMode.TEXT, source=source, raw_text=text, content_type="text/plain")


def _guess_content_type_from_url(url: str, headers: dict) -> str | None:
    ct = headers.get("Content-Type")
    if ct:
        return ct.split(";")[0].strip().lower()
    # fallback by extension
    ext = os.path.splitext(url.split("?")[0])[1].lower()
    if ext:
        return mimetypes.types_map.get(ext)
    return None


def _extract_text_from_html(html: str) -> str:
    soup = BeautifulSoup(html, "lxml")
    # Remove scripts/styles
    for tag in soup(["script", "style", "noscript"]):
        tag.extract()
    # Prefer main/article if present
    main = soup.find("main") or soup.find("article") or soup.body
    text = main.get_text(separator="\n") if main else soup.get_text(separator="\n")
    return text


def _extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as f:
        f.write(pdf_bytes)
        tmp_path = f.name
    try:
        return pdf_extract_text(tmp_path)
    finally:
        try:
            os.remove(tmp_path)
        except OSError:
            pass


def acquire_from_url(url: str, source: str | None = None, timeout_s: int = 20) -> AcquiredDocument:
    source = source or url
    try:
        resp = requests.get(url, timeout=timeout_s, headers={"User-Agent": "QazTenderAI/1.0"})
        resp.raise_for_status()
    except Exception as e:
        raise AcquireError(f"URL fetch failed: {e}") from e

    content_type = _guess_content_type_from_url(resp.url, resp.headers) or "application/octet-stream"
    ct = content_type.lower()

    if ct in ("application/pdf",) or resp.url.lower().endswith(".pdf"):
        raw_text = _extract_text_from_pdf_bytes(resp.content)
        return AcquiredDocument(
            mode=InputMode.URL,
            source=source,
            raw_text=raw_text,
            content_type="application/pdf",
            url_final=resp.url,
        )

    # Basic HTML/text handling
    if "text/html" in ct or resp.text.lstrip().startswith("<!") or "<html" in resp.text[:500].lower():
        raw_text = _extract_text_from_html(resp.text)
        return AcquiredDocument(
            mode=InputMode.URL,
            source=source,
            raw_text=raw_text,
            content_type="text/html",
            url_final=resp.url,
        )

    # Fallback: treat as plain text
    return AcquiredDocument(
        mode=InputMode.URL,
        source=source,
        raw_text=resp.text,
        content_type=ct,
        url_final=resp.url,
    )


def acquire_from_file_bytes(filename: str, file_bytes: bytes, content_type: str | None = None) -> AcquiredDocument:
    # Determine by content_type or extension
    ext = os.path.splitext(filename)[1].lower()
    ct = (content_type or mimetypes.types_map.get(ext) or "application/octet-stream").lower()

    if ext == ".pdf" or ct == "application/pdf":
        raw_text = _extract_text_from_pdf_bytes(file_bytes)
        return AcquiredDocument(mode=InputMode.FILE, source=filename, raw_text=raw_text, content_type="application/pdf")

    if ext in (".docx",) or ct in ("application/vnd.openxmlformats-officedocument.wordprocessingml.document",):
        with tempfile.TemporaryDirectory() as td:
            p = os.path.join(td, filename)
            with open(p, "wb") as f:
                f.write(file_bytes)
            raw_text = docx2txt.process(p) or ""
        return AcquiredDocument(mode=InputMode.FILE, source=filename, raw_text=raw_text, content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")

    # plain text
    try:
        raw_text = file_bytes.decode("utf-8")
    except UnicodeDecodeError:
        raw_text = file_bytes.decode("utf-8", errors="ignore")
    return AcquiredDocument(mode=InputMode.FILE, source=filename, raw_text=raw_text, content_type=ct)
