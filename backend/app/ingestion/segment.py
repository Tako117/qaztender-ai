from __future__ import annotations

from dataclasses import dataclass

# Stable chunking:
# - based ONLY on canonical text
# - deterministic boundaries
# - preserves line ordering
# - does not depend on input mode


@dataclass(frozen=True)
class ChunkingConfig:
    max_chars: int = 1800
    overlap_chars: int = 120


def stable_chunk(canonical_text: str, cfg: ChunkingConfig | None = None) -> list[str]:
    cfg = cfg or ChunkingConfig()

    # We chunk by paragraphs (double newlines) first,
    # but canonicalization preserves single newlines per logical line.
    # So we treat empty lines as paragraph boundaries.
    lines = canonical_text.split("\n")

    paragraphs: list[str] = []
    buf: list[str] = []
    for ln in lines:
        if ln.strip() == "":
            if buf:
                paragraphs.append("\n".join(buf).strip())
                buf = []
        else:
            buf.append(ln)
    if buf:
        paragraphs.append("\n".join(buf).strip())

    chunks: list[str] = []
    cur = ""
    for p in paragraphs:
        if not p:
            continue
        if not cur:
            cur = p
            continue

        if len(cur) + 2 + len(p) <= cfg.max_chars:
            cur = cur + "\n\n" + p
        else:
            chunks.append(cur)
            cur = p

    if cur:
        chunks.append(cur)

    # Add deterministic overlap by characters from previous chunk tail
    if cfg.overlap_chars > 0 and len(chunks) > 1:
        overlapped: list[str] = [chunks[0]]
        for i in range(1, len(chunks)):
            prev = overlapped[-1]
            tail = prev[-cfg.overlap_chars:]
            overlapped.append((tail + "\n\n" + chunks[i]).strip())
        return overlapped

    return chunks
