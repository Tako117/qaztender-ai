"""DEPRECATED.

This file previously contained Settings and/or extraction utilities.
QazTender AI uses `app.core.config` for settings and `app.ingestion.acquire` for extraction.

Kept only to avoid breaking old imports.
"""

from .core.config import settings  # noqa: F401
