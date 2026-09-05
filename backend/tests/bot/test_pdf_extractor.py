"""
Tests for Municipal Attachment PDF Extractor
Validates text extraction, section identification, scanned PDF detection,
and robust error handling on corrupted / empty files.
"""

import io
from unittest.mock import AsyncMock, patch

import pytest
from pypdf import PdfWriter

from bot.pdf_extractor import MunicipalPDFExtractor
from bot.schemas import AttachmentMetadata


def _build_test_pdf(text: str) -> bytes:
    """Generates a minimal valid PDF byte sequence containing target text."""
    encoded_text = text.replace("(", r"\(").replace(")", r"\)")
    stream_content = f"BT /F1 12 Tf 50 700 Td ({encoded_text}) Tj ET\n"
    stream_len = len(stream_content)

    pdf_str = (
        "%PDF-1.4\n"
        "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
        "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
        "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        "/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n"
        f"4 0 obj << /Length {stream_len} >> stream\n{stream_content}endstream endobj\n"
        "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n"
        "xref\n0 6\n"
        "0000000000 65535 f \n"
        "0000000009 00000 n \n"
        "0000000058 00000 n \n"
        "0000000115 00000 n \n"
        "0000000244 00000 n \n"
        "0000000350 00000 n \n"
        "trailer << /Size 6 /Root 1 0 R >>\n"
        "startxref\n400\n%%EOF"
    )
    return pdf_str.encode("latin-1")


@pytest.fixture
def extractor():
    return MunicipalPDFExtractor(timeout=5.0, max_file_size_mb=5)


@pytest.fixture
def sample_metadata():
    return AttachmentMetadata(
        matter_id=882,
        file_number="Ord-882-2026",
        attachment_id=101,
        name="Ordinance_882_Final.pdf",
        official_url="https://cityclerk.gov/dockets/882.pdf",
    )


def test_extract_text_valid_pdf(extractor, sample_metadata):
    content = "SECTION 1. Upzoning for commercial parcels on Euclid Ave.\nFISCAL IMPACT: $250,000 appropriation."
    pdf_bytes = _build_test_pdf(content)

    result = extractor.extract_text_from_pdf(pdf_bytes, sample_metadata)

    assert result.extraction_status == "success"
    assert result.page_count == 1
    assert "SECTION 1" in result.raw_text
    assert "Euclid Ave" in result.raw_text
    assert len(result.key_sections) >= 1
    assert any("SECTION 1" in s["title"] for s in result.key_sections)


def test_extract_text_empty_input(extractor, sample_metadata):
    result = extractor.extract_text_from_pdf(b"", sample_metadata)
    assert result.extraction_status == "empty"
    assert result.page_count == 0
    assert result.raw_text == ""


def test_extract_text_corrupted_input(extractor, sample_metadata):
    corrupted_bytes = b"NOT_A_VALID_PDF_HEADER_DATA_123456"
    result = extractor.extract_text_from_pdf(corrupted_bytes, sample_metadata)

    assert result.extraction_status == "failed"
    assert result.page_count == 0
    assert result.raw_text == ""


def test_extract_text_scanned_pdf_detection(extractor, sample_metadata):
    # A blank page with 0 text
    writer = PdfWriter()
    writer.add_blank_page(width=300, height=300)
    buf = io.BytesIO()
    writer.write(buf)
    blank_pdf = buf.getvalue()

    result = extractor.extract_text_from_pdf(blank_pdf, sample_metadata)
    assert result.extraction_status == "ocr_required"
    assert result.page_count == 1
    assert result.raw_text == ""


@pytest.mark.asyncio
async def test_download_attachment_size_limit_rejection(extractor):
    mock_response = AsyncMock()
    mock_response.status_code = 200
    # Set header exceeding max_file_size_mb (5MB = 5242880 bytes)
    mock_response.headers = {"Content-Length": "10000000"}

    with patch("httpx.AsyncClient.stream") as mock_stream:
        mock_stream.return_value.__aenter__.return_value = mock_response
        with pytest.raises(ValueError, match="exceeds maximum allowed size"):
            await extractor.download_attachment("https://cityclerk.gov/huge.pdf")


@pytest.mark.asyncio
async def test_process_matter_attachments_filters_non_pdfs(extractor):
    raw_attachments = [
        {"MatterAttachmentName": "Agenda.pdf", "MatterAttachmentHyperlink": "https://clerk.gov/a.pdf"},
        {"MatterAttachmentName": "Photo.jpg", "MatterAttachmentHyperlink": "https://clerk.gov/p.jpg"},
    ]

    pdf_bytes = _build_test_pdf("WHEREAS, City Council ordains.")

    with patch.object(extractor, "download_attachment", return_value=pdf_bytes):
        results = await extractor.process_matter_attachments(
            client_name="cleveland",
            matter_id=999,
            file_number="Ord-999",
            attachments=raw_attachments,
        )

        # Only 1 PDF attachment should have been processed
        assert len(results) == 1
        assert results[0].attachment.name == "Agenda.pdf"
        assert results[0].extraction_status == "success"
        assert "WHEREAS" in results[0].raw_text
