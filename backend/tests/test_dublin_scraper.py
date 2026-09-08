"""
Unit tests for Dublin, Ohio (ZIP 43016) Municipal Scraper and Ingestion Pipeline.
"""

import pytest

from scrapers.dublin import DublinMunicipalClient
from scrapers.normalizer import normalize_legistar_matter
from scrapers.pipeline import IngestionPipeline


@pytest.mark.asyncio
async def test_dublin_client_matters():
    client = DublinMunicipalClient()
    matters = await client.fetch_recent_matters(top=10)
    assert len(matters) >= 5

    file_numbers = [m["MatterFile"] for m in matters]
    assert "Ord. 01-26" in file_numbers
    assert "Ord. 33-26" in file_numbers
    assert "Res. 25-26" in file_numbers


@pytest.mark.asyncio
async def test_dublin_client_attachments():
    client = DublinMunicipalClient()
    attachments = await client.fetch_matter_attachments(matter_id=2601)
    assert len(attachments) >= 1
    assert "Noise" in attachments[0]["MatterAttachmentName"]
    assert "dublinohiousa.gov" in attachments[0]["MatterAttachmentHyperlink"]


@pytest.mark.asyncio
async def test_dublin_client_upcoming_events():
    client = DublinMunicipalClient()
    events = await client.fetch_upcoming_events()
    assert len(events) >= 1
    assert "5555 Perimeter Drive" in events[0]["EventLocation"]


def test_dublin_matter_normalization():
    raw = {
        "MatterId": 2601,
        "MatterFile": "Ord. 01-26",
        "MatterName": "Noise Control Ordinance",
        "MatterTitle": "An Ordinance amending Chapter 132 to modernize vehicle decibel standards and prohibit compression engine braking.",
        "MatterIntroDate": "2026-02-09T19:00:00Z",
        "MatterStatusName": "Passed",
        "MatterBodyName": "Dublin City Council",
        "official_url": "https://dublinohiousa.gov/city-council/legislation-minutes/",
        "fiscal_amount": 15000.0,
        "fiscal_type": "Police Operating Fund",
        "affected_wards": ["Ward 1", "Ward 2", "Ward 3", "Ward 4"],
        "who_it_affects": "Dublin residents and commercial motorists along I-270 and SR-161.",
    }

    normalized = normalize_legistar_matter(
        raw=raw,
        jurisdiction_id="ocd-jurisdiction/country:us/state:oh/place:dublin/government",
        state_code="OH",
        place_name="Dublin",
    )

    assert normalized["id"] == "ocd-bill/2026-oh-dublin-ord-01-26"
    assert normalized["fileNumber"] == "Ord. 01-26"
    assert normalized["category"] == "Public Safety & Justice"
    assert normalized["fiscalImpact"]["amount"] == 15000.0
    assert "Ward 1" in normalized["affectedWards"]
    assert normalized["receipt"]["verificationBadge"] == "Verified Municipal Portal"
    assert "dublinohiousa.gov" in normalized["receipt"]["officialUrl"]


@pytest.mark.asyncio
async def test_dublin_ingestion_pipeline_run():
    pipeline = IngestionPipeline(
        jurisdiction_id="ocd-jurisdiction/country:us/state:oh/place:dublin/government",
        client_name="dublin",
        state_code="OH",
        place_name="Dublin",
    )

    assert isinstance(pipeline.client, DublinMunicipalClient)
    results = await pipeline.run(top=3)

    assert results["jurisdiction"] == "Dublin"
    assert results["total_fetched"] == 3
    assert results["status"] in ["completed", "completed_in_memory"]
    assert len(results["enriched_dockets"]) == 3
