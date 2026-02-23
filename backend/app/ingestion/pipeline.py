from __future__ import annotations

from .acquire import acquire_from_text, acquire_from_url, acquire_from_file_bytes
from .canonicalize import canonicalize_and_hash
from .segment import stable_chunk, ChunkingConfig
from .types import InputMode, AcquiredDocument, CanonicalDocument, SegmentedDocument


def to_canonical(doc: AcquiredDocument) -> CanonicalDocument:
    canonical_text, h = canonicalize_and_hash(doc.raw_text)
    return CanonicalDocument(
        mode=doc.mode,
        source=doc.source,
        canonical_text=canonical_text,
        canonical_text_hash=h,
        content_type=doc.content_type,
        url_final=doc.url_final,
    )


def to_segmented(doc: CanonicalDocument, cfg: ChunkingConfig | None = None) -> SegmentedDocument:
    chunks = stable_chunk(doc.canonical_text, cfg=cfg)
    return SegmentedDocument(
        mode=doc.mode,
        source=doc.source,
        canonical_text=doc.canonical_text,
        canonical_text_hash=doc.canonical_text_hash,
        chunks=chunks,
        content_type=doc.content_type,
        url_final=doc.url_final,
    )
