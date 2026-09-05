"""
Pydantic Schemas for CivicDigest Social Media Bot Subsystem
Adheres to Open Civic Data (OCD-ID v3) and Receipt Verification Protocol standards.
"""

from datetime import UTC, datetime
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
