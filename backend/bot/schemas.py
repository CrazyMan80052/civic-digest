"""
Pydantic Schemas for CivicDigest Social Media Bot Subsystem
Adheres to Open Civic Data (OCD-ID v3) and Receipt Verification Protocol standards.
"""

from datetime import UTC, datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field


class AttachmentMetadata(BaseModel):
    matter_id: int
    file_number: str
    attachment_id: int | None = None
    name: str
    official_url: str
    mime_type: str = "application/pdf"


class ExtractedAttachmentText(BaseModel):
    attachment: AttachmentMetadata
    raw_text: str
    page_count: int
    key_sections: list[dict[str, Any]] = Field(
        default_factory=list, description="Section headers and corresponding page numbers"
    )
    extraction_status: str = Field(
        default="success",
        description="Extraction status: 'success', 'empty', 'ocr_required', or 'failed'",
    )
    extracted_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class ImpactPriority(StrEnum):
    ROUTINE = "ROUTINE"  # Ceremonial proclamations, minor permits (weekly digest)
    MODERATE = "MODERATE"  # Standard contracts, minor zoning (daily digest)
    HIGH = "HIGH"  # Budget allocations >$100k, citywide policy (immediate post)
    CRITICAL = "CRITICAL"  # Emergency ordinances, public safety alerts (urgent post)


class EnrichedCivicMatter(BaseModel):
    ocd_bill_id: str
    file_number: str
    plain_title: str = Field(..., max_length=120, description="Clear, non-bureaucratic title")
    the_what: str = Field(..., description="1-2 sentences on core policy adjustment or operational change")
    the_who: str = Field(..., description="Direct demographic or geographic ward/zone impacted")
    fiscal_impact_amount: float = Field(default=0.0, description="Exact dollar value extracted from docket")
    fiscal_impact_type: str = Field(default="None", description="e.g. Capital Expenditure, ARPA Grant, Tax Abatement")
    impact_priority: ImpactPriority = Field(default=ImpactPriority.MODERATE)
    affected_wards: list[str] = Field(default_factory=list, description="Specific ward numbers or ['All Wards']")
    official_source_url: str
    clerk_matter_id: str
    receipt_snippet: str = Field(..., description="Verbatim quote from source PDF proving accuracy")
    receipt_page_number: int = Field(default=1)
    neutrality_score: float = Field(default=1.0, ge=0.0, le=1.0, description="Factual neutrality score")
