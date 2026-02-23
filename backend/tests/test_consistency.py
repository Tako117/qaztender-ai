\
from __future__ import annotations

import threading
import time
from http.server import HTTPServer, BaseHTTPRequestHandler

import pytest

from app.ingestion.acquire import acquire_from_text, acquire_from_url, acquire_from_file_bytes
from app.ingestion.pipeline import to_canonical
from app.services.unified_analyzer import analyze_document


DOC_TEXT = """Tender spec:
- Item: A4 paper 80g/m2
- Quantity: 100 pcs
- Price: 1200 KZT
Equivalents allowed.
"""


class _Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        body = f"<html><body><pre>{DOC_TEXT}</pre></body></html>".encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        return


@pytest.fixture(scope="module")
def http_server():
    server = HTTPServer(("127.0.0.1", 0), _Handler)
    host, port = server.server_address

    t = threading.Thread(target=server.serve_forever, daemon=True)
    t.start()
    time.sleep(0.1)
    yield f"http://{host}:{port}/"
    server.shutdown()
    t.join(timeout=2)


def test_same_hash_text_vs_url(http_server):
    a_text = acquire_from_text(DOC_TEXT)
    a_url = acquire_from_url(http_server)

    c1 = to_canonical(a_text)
    c2 = to_canonical(a_url)

    assert c1.canonical_text_hash == c2.canonical_text_hash
    assert c1.canonical_text == c2.canonical_text


def test_same_score_text_vs_url(http_server):
    a_text = acquire_from_text(DOC_TEXT)
    a_url = acquire_from_url(http_server)

    r1 = analyze_document(a_text, currency="KZT", debug=True, enable_webintel=False)
    r2 = analyze_document(a_url, currency="KZT", debug=True, enable_webintel=False)

    assert r1["debug"]["canonical_text_hash"] == r2["debug"]["canonical_text_hash"]
    assert abs(float(r1["risk_score"]) - float(r2["risk_score"])) <= 1.0


def test_same_hash_text_vs_file_bytes():
    a_text = acquire_from_text(DOC_TEXT)
    a_file = acquire_from_file_bytes("doc.txt", DOC_TEXT.encode("utf-8"), content_type="text/plain")

    c1 = to_canonical(a_text)
    c2 = to_canonical(a_file)

    assert c1.canonical_text_hash == c2.canonical_text_hash


def test_same_score_text_vs_file_bytes():
    a_text = acquire_from_text(DOC_TEXT)
    a_file = acquire_from_file_bytes("doc.txt", DOC_TEXT.encode("utf-8"), content_type="text/plain")

    r1 = analyze_document(a_text, currency="KZT", debug=True, enable_webintel=False)
    r2 = analyze_document(a_file, currency="KZT", debug=True, enable_webintel=False)

    assert abs(float(r1["risk_score"]) - float(r2["risk_score"])) <= 1.0
