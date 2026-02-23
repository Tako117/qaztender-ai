from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Optional, Literal


class InputMode(str, Enum):
    TEXT = "text"
    FILE = "file"
    URL = "url"


@dataclass(frozen=True)
class AcquiredDocument:
    mode: InputMode
    source: str  # free-form identifier: "pasted", filename, url, etc.
    raw_text: str
    content_type: Optional[str] = None
    url_final: Optional[str] = None


@dataclass(frozen=True)
class CanonicalDocument:
    mode: InputMode
    source: str
    canonical_text: str
    canonical_text_hash: str
    content_type: Optional[str] = None
    url_final: Optional[str] = None


@dataclass(frozen=True)
class SegmentedDocument:
    mode: InputMode
    source: str
    canonical_text: str
    canonical_text_hash: str
    chunks: list[str]
    content_type: Optional[str] = None
    url_final: Optional[str] = None
