from __future__ import annotations

import json
import sqlite3
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional


@dataclass
class CachedResult:
    key: str
    created_at: int
    payload: dict


class WebCache:
    def __init__(self, db_path: str = "backend/app/storage/web_cache.sqlite"):
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)
        self.db_path = db_path
        self._init()

    def _init(self) -> None:
        con = sqlite3.connect(self.db_path)
        try:
            con.execute(
                """CREATE TABLE IF NOT EXISTS web_cache (
                    key TEXT PRIMARY KEY,
                    created_at INTEGER NOT NULL,
                    payload_json TEXT NOT NULL
                )"""
            )
            con.commit()
        finally:
            con.close()

    def get(self, key: str, ttl_s: int) -> Optional[CachedResult]:
        now = int(time.time())
        con = sqlite3.connect(self.db_path)
        try:
            cur = con.execute("SELECT key, created_at, payload_json FROM web_cache WHERE key = ?", (key,))
            row = cur.fetchone()
            if not row:
                return None
            k, created_at, payload_json = row
            if now - int(created_at) > ttl_s:
                return None
            return CachedResult(key=k, created_at=int(created_at), payload=json.loads(payload_json))
        finally:
            con.close()

    def set(self, key: str, payload: dict) -> None:
        now = int(time.time())
        con = sqlite3.connect(self.db_path)
        try:
            con.execute(
                "INSERT OR REPLACE INTO web_cache(key, created_at, payload_json) VALUES(?,?,?)",
                (key, now, json.dumps(payload, ensure_ascii=False)),
            )
            con.commit()
        finally:
            con.close()
