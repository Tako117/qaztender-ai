from __future__ import annotations

from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse

from ..api.schemas import TenderInput, AnalysisResult, AnalyzeTextRequest, AnalyzeUrlRequest, ExtractedDraft
from ..ingestion.acquire import acquire_from_text, acquire_from_url, acquire_from_file_bytes, AcquireError
from ..services.unified_analyzer import analyze_document
from ..ingestion.pipeline import to_canonical
from ..extraction.item_extractor import extract_items_from_text


def _extract_draft_from_acquired(
    acquired,
    *,
    currency: str = "KZT",
    tender_title: str | None = None,
    category: str | None = None,
    region: str | None = None,
) -> dict:
    canonical = to_canonical(acquired)
    text = canonical.canonical_text
    # title: first non-empty line
    first_line = next((ln.strip() for ln in text.splitlines() if ln.strip()), "")
    title = (tender_title or first_line or "Untitled tender")[:140]

    items_ext = extract_items_from_text(text, default_currency=currency)
    items = [
        {
            "item_id": f"I{i+1}",
            "name": it.name,
            "quantity": float(it.quantity) if it.quantity is not None else 1.0,
            "unit": it.unit or "pcs",
            "unit_price": float(it.unit_price) if it.unit_price is not None else 0.0,
        }
        for i, it in enumerate(items_ext)
    ]

    bids = []
    if items:
        up = items[0].get("unit_price")
        if up is not None:
            bids = [{"supplier_id": "S1", "supplier_name": "Bidder", "unit_price": float(up)}]

    return {
        "tender_title": title,
        "category": category or "GENERAL",
        "region": region or "Unknown",
        "currency": currency,
        "spec_text": text,
        "items": items if items else [{"item_id": "I1", "name": "Item", "quantity": 1, "unit": "pcs", "unit_price": 0.0}],
        "bids": bids if bids else [{"supplier_id": "S1", "supplier_name": "Bidder", "unit_price": 0.0}],
    }

router = APIRouter()


@router.post("/analyze", response_model=AnalysisResult, tags=["analysis"])
def analyze_structured(payload: TenderInput):
    # Backward compatible endpoint: treat payload.spec_text as the canonical source text.
    acquired = acquire_from_text(payload.spec_text, source=f"tender:{payload.tender_id}")
    res = analyze_document(
        acquired,
        tender_title=payload.title,
        category=payload.category,
        region=payload.region,
        currency=payload.currency,
        items=[i.model_dump() for i in payload.items] if payload.items else None,
        bids=[b.model_dump() for b in payload.bids] if payload.bids else None,
        participants_count=payload.participants_count,
        debug=False,
        enable_webintel=True,
    )
    return JSONResponse(content=res)


@router.post("/analyze/text", response_model=AnalysisResult, tags=["analysis"])
def analyze_text(payload: AnalyzeTextRequest):
    acquired = acquire_from_text(payload.text, source="pasted")
    res = analyze_document(
        acquired,
        tender_title=payload.tender_title,
        category=payload.category,
        region=payload.region,
        currency=payload.currency,
        items=payload.items,
        bids=payload.bids,
        participants_count=payload.participants_count,
        debug=payload.debug,
        enable_webintel=payload.enable_webintel,
    )
    return JSONResponse(content=res)


@router.post("/analyze/url", response_model=AnalysisResult, tags=["analysis"])
def analyze_url(payload: AnalyzeUrlRequest):
    try:
        acquired = acquire_from_url(payload.url)
    except AcquireError as e:
        raise HTTPException(status_code=400, detail=str(e))

    res = analyze_document(
        acquired,
        tender_title=payload.tender_title,
        category=payload.category,
        region=payload.region,
        currency=payload.currency,
        items=payload.items,
        bids=payload.bids,
        participants_count=payload.participants_count,
        debug=payload.debug,
        enable_webintel=payload.enable_webintel,
    )
    return JSONResponse(content=res)


@router.post("/analyze/file", response_model=AnalysisResult, tags=["analysis"])
async def analyze_file(
    file: UploadFile = File(...),
    tender_title: str | None = None,
    category: str | None = None,
    region: str | None = None,
    currency: str = "KZT",
    debug: bool = False,
    enable_webintel: bool = True,
):
    data = await file.read()
    acquired = acquire_from_file_bytes(file.filename or "upload", data, content_type=file.content_type)

    res = analyze_document(
        acquired,
        tender_title=tender_title,
        category=category,
        region=region,
        currency=currency,
        items=None,
        bids=None,
        participants_count=None,
        debug=debug,
        enable_webintel=enable_webintel,
    )
    return JSONResponse(content=res)


@router.post("/extract/text", response_model=ExtractedDraft, tags=["extract"])
def extract_text(payload: AnalyzeTextRequest):
    acquired = acquire_from_text(payload.text, source="pasted")
    return JSONResponse(
        content=_extract_draft_from_acquired(
            acquired,
            currency=payload.currency,
            tender_title=payload.tender_title,
            category=payload.category,
            region=payload.region,
        )
    )


@router.post("/extract/url", response_model=ExtractedDraft, tags=["extract"])
def extract_url(payload: AnalyzeUrlRequest):
    try:
        acquired = acquire_from_url(payload.url)
    except AcquireError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return JSONResponse(
        content=_extract_draft_from_acquired(
            acquired,
            currency=payload.currency,
            tender_title=payload.tender_title,
            category=payload.category,
            region=payload.region,
        )
    )


@router.post("/extract/file", response_model=ExtractedDraft, tags=["extract"])
async def extract_file(
    file: UploadFile = File(...),
    tender_title: str | None = None,
    category: str | None = None,
    region: str | None = None,
    currency: str = "KZT",
):
    data = await file.read()
    acquired = acquire_from_file_bytes(file.filename or "upload", data, content_type=file.content_type)
    return JSONResponse(
        content=_extract_draft_from_acquired(
            acquired,
            currency=currency,
            tender_title=tender_title,
            category=category,
            region=region,
        )
    )


@router.get("/demo", tags=["demo"])
def demo_payload():
    """Return a ready-to-show demo tender + analysis so UI never looks empty."""

    demo_text = (
        "Поставка ноутбуков для школы\n"
        "Ноутбук 15.6\" i5 16GB 512GB SSD, 30 шт, цена 420 000 тенге\n"
        "Требования: только бренд X, модель Y, без эквивалентов; гарантия 36 мес.\n"
        "Срок поставки: 3 дня.\n"
    )

    acquired = acquire_from_text(demo_text, source="demo")
    draft = _extract_draft_from_acquired(acquired, currency="KZT", tender_title="Demo tender")
    analysis = analyze_document(
        acquired,
        tender_title=draft["tender_title"],
        category=draft["category"],
        region=draft["region"],
        currency=draft["currency"],
        items=draft["items"],
        bids=draft["bids"],
        participants_count=1,
        debug=True,
        enable_webintel=True,
    )
    return JSONResponse(content={"draft": draft, "analysis": analysis})
