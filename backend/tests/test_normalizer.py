from scrapers.normalizer import (
    clean_html_text,
    generate_ocd_bill_id,
    normalize_legistar_matter,
)


def test_clean_html_text():
    html = "<p>An emergency ordinance <strong>authorizing</strong> the director &amp; staff.</p>"
    result = clean_html_text(html)
    assert "<p>" not in result
    assert "<strong>" not in result
    assert "authorizing the director" in result


def test_clean_html_text_empty():
    assert clean_html_text(None) == ""
    assert clean_html_text("") == ""


def test_generate_ocd_bill_id():
    ocd_id = generate_ocd_bill_id("OH", "Cleveland", 2026, "Ord. 882-2026")
    assert ocd_id == "ocd-bill/2026-oh-cleveland-ord-882-2026"


def test_normalize_legistar_matter():
    raw_matter = {
        "MatterId": 10542,
        "MatterFile": "Ord. 915-2026",
        "MatterName": "Zoning & Parking Reform Ordinance",
        "MatterTitle": "<p>An ordinance modifying minimum parking requirements for downtown transit corridor.</p>",
        "MatterIntroDate": "2026-03-01T14:30:00Z",
        "MatterStatusName": "Passed",
        "MatterRequester": "Councilmember Maurer",
    }

    result = normalize_legistar_matter(
        raw=raw_matter,
        jurisdiction_id="ocd-jurisdiction/country:us/state:oh/place:cleveland/government",
        state_code="OH",
        place_name="Cleveland",
    )

    assert result["id"] == "ocd-bill/2026-oh-cleveland-ord-915-2026"
    assert result["fileNumber"] == "Ord. 915-2026"
    assert "minimum parking requirements" in result["officialTitle"]
    assert result["category"] == "Zoning & Land Use"
    assert result["receipt"] is not None
    assert result["receipt"]["clerkMatterId"] == "LEG-10542"
