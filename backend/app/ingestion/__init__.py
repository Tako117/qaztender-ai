"""Unified ingestion pipeline for QazTender AI.

All input modes (text / file upload / URL) must flow through:
Acquire -> Canonicalize -> Segment -> Feature extraction -> Risk engine.
"""
