"""
Tests for LLM Docket Enricher & Receipt Verification Engine
Validates schema adherence, deterministic mock output, markdown fence cleaning,
and strict rejection of hallucinated citation quotes.
"""

import pytest

from bot.enricher import (
    CivicLLMEnricher,
    MockLLMProvider,
    ReceiptVerificationError,
    clean_json_response,
    verify_receipt,
)
from bot.schemas import EnrichedCivicMatter, ImpactPriority


@pytest.fixture
def sample_docket_text():
    return (
        "AN ORDINANCE to amend the zoning map for Euclid Avenue parcels 101 through 114.\n"
        "SECTION 1. The Council of the City of Cleveland hereby ordains that the designated parcels "
        "are rezoned to Urban Mixed-Use Commercial.\n"
        "SECTION 2. FISCAL IMPACT: The Department of Community Development is authorized to expend "
        "$250,000 from the Capital Improvement Grant Fund for pedestrian infrastructure improvements."
    )


@pytest.fixture
def sample_metadata():
    return {
        "place_name": "Cleveland",
        "state_code": "OH",
        "file_number": "Ord-882-2026",
        "status": "In Committee",
        "official_url": "https://cleveland.legistar.com/LegislationDetail.aspx?ID=882",
        "clerk_matter_id": "882",
        "ocd_bill_id": "ocd-bill/2026-oh-cleveland-ord-882",
    }


@pytest.mark.asyncio
async def test_mock_enricher_success(sample_docket_text, sample_metadata):
    canned = {
        "plain_title": "Euclid Avenue Commercial Rezoning",
        "the_what": "Reclassifies 14 parcels on Euclid Ave to Urban Mixed-Use Commercial.",
        "the_who": "Local business owners and residents near Euclid Ave.",
        "fiscal_impact_amount": 250000.0,
        "fiscal_impact_type": "Capital Improvement Grant",
        "impact_priority": "HIGH",
        "affected_wards": ["Ward 5", "Ward 7"],
        "receipt_snippet": "authorized to expend $250,000 from the Capital Improvement Grant Fund",
        "receipt_page_number": 1,
        "neutrality_score": 0.98,
    }

    mock_provider = MockLLMProvider(canned_response=canned)
    enricher = CivicLLMEnricher(provider=mock_provider)

    enriched = await enricher.enrich_docket(
        raw_title="AN ORDINANCE rezoning Euclid Avenue",
        raw_text=sample_docket_text,
        metadata=sample_metadata,
        enforce_receipt=True,
    )

    assert isinstance(enriched, EnrichedCivicMatter)
    assert enriched.plain_title == "Euclid Avenue Commercial Rezoning"
    assert enriched.fiscal_impact_amount == 250000.0
    assert enriched.impact_priority == ImpactPriority.HIGH
    assert enriched.file_number == "Ord-882-2026"
    assert "Ward 5" in enriched.affected_wards
    assert "authorized to expend $250,000" in enriched.receipt_snippet


def test_receipt_verification_strict_rejection(sample_docket_text, sample_metadata):
    fake_matter = EnrichedCivicMatter(
        ocd_bill_id="ocd-bill/test",
        file_number="Ord-123",
        plain_title="Hallucinated Item",
        the_what="Something invented by an LLM.",
        the_who="Nobody",
        fiscal_impact_amount=1000000.0,
        fiscal_impact_type="None",
        impact_priority=ImpactPriority.HIGH,
        official_source_url="https://clerk.gov/123",
        clerk_matter_id="123",
        receipt_snippet="This exact quote does not appear anywhere in the docket text.",
    )

    with pytest.raises(ReceiptVerificationError, match="not found verbatim"):
        verify_receipt(fake_matter, sample_docket_text)


def test_receipt_verification_whitespace_tolerant(sample_docket_text):
    matter = EnrichedCivicMatter(
        ocd_bill_id="ocd-bill/test",
        file_number="Ord-882",
        plain_title="Zoning Amendment",
        the_what="Rezoning",
        the_who="Residents",
        fiscal_impact_amount=0.0,
        impact_priority=ImpactPriority.MODERATE,
        official_source_url="https://clerk.gov",
        clerk_matter_id="882",
        receipt_snippet="Council  of the City of Cleveland   hereby ordains",
    )

    # Should pass despite extra spaces
    assert verify_receipt(matter, sample_docket_text) is True


def test_clean_json_response_markdown_fences():
    raw_markdown = '```json\n{"plain_title": "Cleaned Title"}\n```'
    cleaned = clean_json_response(raw_markdown)
    assert cleaned == '{"plain_title": "Cleaned Title"}'


def test_impact_priority_enum_values():
    assert ImpactPriority.ROUTINE == "ROUTINE"
    assert ImpactPriority.MODERATE == "MODERATE"
    assert ImpactPriority.HIGH == "HIGH"
    assert ImpactPriority.CRITICAL == "CRITICAL"
