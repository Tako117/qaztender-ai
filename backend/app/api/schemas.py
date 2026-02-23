from __future__ import annotations

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal


# ===== Legacy structured input (kept for compatibility) =====
class Bid(BaseModel):
    supplier_id: str = Field(..., examples=["SUP-001"])
    supplier_name: str = Field(..., examples=["Supplier A"])
    unit_price: float = Field(..., examples=[12345.0])


class Item(BaseModel):
    item_id: str = Field(..., examples=["ITEM-001"])
    name: str = Field(..., examples=["Laptop"])
    quantity: float = Field(..., examples=[10])
    unit: str = Field(..., examples=["pcs"])


class TenderInput(BaseModel):
    tender_id: str
    title: str
    category: str
    region: str
    currency: str = "KZT"
    spec_text: str
    items: List[Item] = Field(default_factory=list)
    bids: List[Bid] = Field(default_factory=list)
    participants_count: int = 0


# ===== Unified ingestion requests =====
class AnalyzeTextRequest(BaseModel):
    text: str = Field(..., description="Pasted tender text (any language).")
    tender_title: Optional[str] = None
    category: Optional[str] = None
    region: Optional[str] = None
    currency: str = "KZT"
    items: Optional[List[Dict[str, Any]]] = None
    bids: Optional[List[Dict[str, Any]]] = None
    participants_count: Optional[int] = None
    debug: bool = False
    enable_webintel: bool = True


class AnalyzeUrlRequest(BaseModel):
    url: str = Field(..., description="Tender URL (HTML or direct PDF link).")
    tender_title: Optional[str] = None
    category: Optional[str] = None
    region: Optional[str] = None
    currency: str = "KZT"
    items: Optional[List[Dict[str, Any]]] = None
    bids: Optional[List[Dict[str, Any]]] = None
    participants_count: Optional[int] = None
    debug: bool = False
    enable_webintel: bool = True


# ===== Unified output =====
class AnalysisResult(BaseModel):
    risk_score: float
    risk_category: str
    factors: Dict[str, float]
    web_intel: Dict[str, Any]
    graphs: Dict[str, Any]
    explainability: Dict[str, Any]
    # Canonical text used by ALL modes (debug-friendly; can be hidden in UI unless needed)
    canonical_text: Optional[str] = None
    debug: Optional[Dict[str, Any]] = None


class ExtractedDraft(BaseModel):
    tender_title: str
    category: str = "GENERAL"
    region: str = "Unknown"
    currency: str = "KZT"
    spec_text: str
    items: List[Dict[str, Any]] = Field(default_factory=list)
    bids: List[Dict[str, Any]] = Field(default_factory=list)
