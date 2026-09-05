"""
Municipal Attachment PDF Extractor
Streams municipal PDF attachments, extracts clean text with page indexing,
and detects scanned / OCR-required documents.
"""

import io
import logging
import re
from typing import Any

import httpx
from pypdf import PdfReader
from pypdf.errors import PdfReadError

from .schemas import AttachmentMetadata, ExtractedAttachmentText

logger = logging.getLogger("civicdigest.bot.pdf_extractor")


class MunicipalPDFExtractor:
    def __init__(self, timeout: float = 20.0, max_file_size_mb: int = 25):
        self.timeout = timeout
        self.max_file_size_bytes = max_file_size_mb * 1024 * 1024
        self.headers = {
            "User-Agent": "CivicDigest-Bot-PDFExtractor/1.0 (+https://civicdigest.org)",
            "Accept": "application/pdf,*/*",
        }

    async def download_attachment(self, url: str) -> bytes:
        """
        Streams a remote attachment with strict size enforcement and timeout.
        """
        async with httpx.AsyncClient(timeout=self.timeout, headers=self.headers) as client:
            async with client.stream("GET", url, follow_redirects=True) as response:
                if response.status_code != 200:
                    raise httpx.HTTPStatusError(
                        f"Failed to download attachment: HTTP {response.status_code}",
                        request=response.request,
                        response=response,
                    )

                content_length = response.headers.get("Content-Length")
                if content_length and int(content_length) > self.max_file_size_bytes:
                    raise ValueError(
                        f"Attachment exceeds maximum allowed size ({self.max_file_size_bytes} bytes)"
                    )

                downloaded = bytearray()
                async for chunk in response.aiter_bytes(chunk_size=65536):
                    downloaded.extend(chunk)
                    if len(downloaded) > self.max_file_size_bytes:
                        raise ValueError("Attachment stream exceeded maximum allowed size limit")

                return bytes(downloaded)

    def extract_text_from_pdf(
        self, pdf_bytes: bytes, metadata: AttachmentMetadata
    ) -> ExtractedAttachmentText:
        """
        Extracts plain text, page count, and key sections from in-memory PDF bytes.
        Catches corrupted or empty PDF inputs safely.
        """
        if not pdf_bytes:
            return ExtractedAttachmentText(
                attachment=metadata,
                raw_text="",
                page_count=0,
                key_sections=[],
                extraction_status="empty",
            )

        try:
            reader = PdfReader(io.BytesIO(pdf_bytes))
            page_count = len(reader.pages)
            if page_count == 0:
                return ExtractedAttachmentText(
                    attachment=metadata,
                    raw_text="",
                    page_count=0,
                    key_sections=[],
                    extraction_status="empty",
                )

            extracted_pages: list[str] = []
            key_sections: list[dict[str, Any]] = []

            for page_idx, page in enumerate(reader.pages, start=1):
                page_text = page.extract_text() or ""
                # Normalize whitespace
                normalized = re.sub(r"[ \t]+", " ", page_text).strip()
                extracted_pages.append(normalized)

                # Identify major section headers
                lines = [line.strip() for line in normalized.split("\n") if line.strip()]
                for line in lines:
                    if re.match(
                        r"^(SECTION\s+\d+|WHEREAS|AN\s+ORDINANCE|A\s+RESOLUTION|BE\s+IT\s+ORDAINED|FISCAL\s+IMPACT)",
                        line,
                        re.IGNORECASE,
                    ):
                        key_sections.append({"page": page_idx, "title": line[:120]})

            full_text = "\n\n".join(extracted_pages).strip()

            # Scanned PDF check: if average characters per page is under 40
            if len(full_text) < (page_count * 40):
                status = "ocr_required" if len(full_text) < 50 else "success"
            else:
                status = "success"

            return ExtractedAttachmentText(
                attachment=metadata,
                raw_text=full_text,
                page_count=page_count,
                key_sections=key_sections,
                extraction_status=status,
            )

        except (PdfReadError, Exception) as e:
            logger.warning(f"PDF extraction failed for matter {metadata.file_number}: {e}")
            return ExtractedAttachmentText(
                attachment=metadata,
                raw_text="",
                page_count=0,
                key_sections=[],
                extraction_status="failed",
            )

    async def process_matter_attachments(
        self,
        client_name: str,
        matter_id: int,
        file_number: str,
        attachments: list[dict[str, Any]] | None = None,
    ) -> list[ExtractedAttachmentText]:
        """
        Fetches and extracts all PDF attachments for a given municipal matter.
        """
        if attachments is None:
            from ..scrapers.legistar import LegistarClient

            client = LegistarClient(client_name=client_name, timeout=self.timeout)
            attachments = await client.fetch_matter_attachments(matter_id=matter_id)

        results: list[ExtractedAttachmentText] = []
        for att in attachments:
            name = att.get("MatterAttachmentName") or "Attachment.pdf"
            hyperlink = att.get("MatterAttachmentHyperlink") or ""

            # Only process PDF attachments
            if not hyperlink or not (
                hyperlink.lower().endswith(".pdf") or "pdf" in name.lower()
            ):
                continue

            metadata = AttachmentMetadata(
                matter_id=matter_id,
                file_number=file_number,
                attachment_id=att.get("MatterAttachmentId"),
                name=name,
                official_url=hyperlink,
            )

            try:
                pdf_bytes = await self.download_attachment(hyperlink)
                extracted = self.extract_text_from_pdf(pdf_bytes, metadata)
                results.append(extracted)
            except Exception as e:
                logger.warning(f"Could not download attachment {name} from {hyperlink}: {e}")
                results.append(
                    ExtractedAttachmentText(
                        attachment=metadata,
                        raw_text="",
                        page_count=0,
                        key_sections=[],
                        extraction_status="failed",
                    )
                )

        return results
