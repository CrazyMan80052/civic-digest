"""
Tests for Visual Card Generator
Asserts valid 1200x675 dimensions, PNG header signatures, SVG markup structure,
and long-text word wrapping resilience.
"""

import io

import pytest
from PIL import Image

from bot.card_generator import CivicCardGenerator, format_fiscal_amount
from bot.schemas import EnrichedCivicMatter, ImpactPriority


@pytest.fixture
def sample_matter():
    return EnrichedCivicMatter(
        ocd_bill_id="ocd-bill/2026-oh-cleveland-ord-882",
        file_number="Ord-882-2026",
        plain_title="Euclid Avenue Commercial Rezoning for Ground-Floor Retail Development",
        the_what="Reclassifies 14 parcels to allow active ground-floor commercial storefronts.",
        the_who="Ward 5 residents and Euclid Avenue merchants.",
        fiscal_impact_amount=250000.0,
        fiscal_impact_type="Capital Grant",
        impact_priority=ImpactPriority.HIGH,
        affected_wards=["Ward 5", "Ward 7"],
        official_source_url="https://cleveland.legistar.com/882.pdf",
        clerk_matter_id="882",
        receipt_snippet="authorized to expend $250,000",
        receipt_page_number=2,
    )


def test_generate_card_png_dimensions_and_header(sample_matter):
    generator = CivicCardGenerator()
    png_bytes = generator.generate_card_png(sample_matter, jurisdiction_name="Cleveland")

    # Standard PNG header signature
    assert png_bytes.startswith(b"\x89PNG\r\n\x1a\n")

    # Valid image that PIL can load
    img = Image.open(io.BytesIO(png_bytes))
    assert img.size == (1200, 675)
    assert img.format == "PNG"


def test_generate_card_svg_markup(sample_matter):
    generator = CivicCardGenerator()
    svg_str = generator.generate_card_svg(sample_matter, jurisdiction_name="Cleveland")

    assert svg_str.startswith("<svg")
    assert svg_str.endswith("</svg>")
    assert 'viewBox="0 0 1200 675"' in svg_str
    assert "CLEVELAND" in svg_str
    assert "Ord-882-2026" in svg_str
    assert "Euclid Avenue" in svg_str
    assert "VERIFIED CLERK RECEIPT" in svg_str
    assert "$250,000.00" in svg_str


def test_format_fiscal_amount():
    assert format_fiscal_amount(0.0, "None") == "Regulatory / $0 Direct Budget"
    assert format_fiscal_amount(-5.0, "None") == "Regulatory / $0 Direct Budget"
    assert format_fiscal_amount(1500000.50, "Capital Bond") == "$1,500,000.50 (Capital Bond)"


def test_card_wrapping_extreme_length():
    super_long_matter = EnrichedCivicMatter(
        ocd_bill_id="ocd-bill/test-long",
        file_number="Ord-999-2026",
        plain_title="Emergency Ordinance Authorizing Municipal Transportation Infrastructure Overhaul and Public Safety Programs",
        the_what=(
            "Extensive citywide infrastructure adjustment reallocating substantial capital funds toward "
            "comprehensive street repair, signal modernization, bike corridor expansion, and automated pedestrian safety."
        ),
        the_who="All municipal residents and regional commuters traveling through designated corridors.",
        fiscal_impact_amount=500000.0,
        impact_priority=ImpactPriority.CRITICAL,
        official_source_url="https://clerk.gov/long.pdf",
        clerk_matter_id="999",
        receipt_snippet="emergency ordinance authorizing comprehensive municipal reforms",
    )

    generator = CivicCardGenerator()
    png_bytes = generator.generate_card_png(super_long_matter, jurisdiction_name="Cleveland")
    svg_str = generator.generate_card_svg(super_long_matter, jurisdiction_name="Cleveland")

    assert len(png_bytes) > 1000
    assert len(svg_str) > 500
