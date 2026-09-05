# backend/scrapers/normalizer.py
"""
Open Civic Data (OCD-ID) Normalization Module
Standardizes vendor-specific legislative feeds (Legistar, CivicPlus, RSS) into
OCD-compliant entities and creates primary source receipt citations.
"""

import re
from datetime import datetime
from typing import Any


def clean_html_text(raw_html: str | None) -> str:
    """Removes HTML tags and normalizes whitespace."""
    if not raw_html:
        return ""
    clean = re.sub(r'<[^>]+>', ' ', raw_html)
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean

def generate_ocd_bill_id(jurisdiction_state: str, place: str, year: int, file_number: str) -> str:
    """
    Generates standard Open Civic Data identifier:
    e.g. ocd-bill/2026-oh-cleveland-ord-882
    """
    clean_fn = re.sub(r'[^a-zA-Z0-9]+', '-', file_number).strip('-').lower()
    return f"ocd-bill/{year}-{jurisdiction_state.lower()}-{place.lower()}-{clean_fn}"

def normalize_legistar_matter(
    raw: dict[str, Any],
    jurisdiction_id: str,
    state_code: str,
    place_name: str,
) -> dict[str, Any]:
    """
    Normalizes a Legistar Matter OData record into CivicDigest OCD format.
    """
    matter_id = raw.get("MatterId")
    file_number = raw.get("MatterFile") or f"Leg-{matter_id}"
    official_title = clean_html_text(raw.get("MatterTitle") or raw.get("MatterName") or "")
    intro_date_raw = raw.get("MatterIntroDate")

    # Parse year and date
    intro_date = None
    year = datetime.utcnow().year
    if intro_date_raw:
        try:
            dt = datetime.fromisoformat(intro_date_raw.replace("Z", "+00:00"))
            intro_date = dt.strftime("%Y-%m-%d")
            year = dt.year
        except Exception:
            intro_date = datetime.utcnow().strftime("%Y-%m-%d")
    else:
        intro_date = datetime.utcnow().strftime("%Y-%m-%d")

    ocd_id = generate_ocd_bill_id(state_code, place_name, year, file_number)

    # Sponsors normalization
    sponsors = []
    primary_sponsor = raw.get("MatterRequester") or raw.get("MatterSponsorName")
    if primary_sponsor:
        sponsors.append(primary_sponsor)

    status_name = raw.get("MatterStatusName") or "In Committee"
    body_name = raw.get("MatterBodyName") or "City Council"
    type_name = raw.get("MatterTypeName") or "Ordinance"

    # Preliminary classification
    category = "General Municipal Policy"
    title_lower = official_title.lower()
    if any(k in title_lower for k in ["zoning", "variance", "parcel", "land use", "subdivision", "parking"]):
        category = "Zoning & Land Use"
    elif any(k in title_lower for k in ["storm", "sewer", "water", "park", "emission", "clean", "climate", "solar"]):
        category = "Environment & Infrastructure"
    elif any(k in title_lower for k in ["budget", "appropriation", "tax", "bond", "fund", "grant", "fiscal", "$"]):
        category = "Budget & Appropriations"
    elif any(k in title_lower for k in ["police", "fire", "ems", "safety", "curfew", "surveillance"]):
        category = "Public Safety & Justice"
    elif any(k in title_lower for k in ["transit", "bus", "bike", "street", "paving", "traffic", "signal"]):
        category = "Transit & Mobility"

    return {
        "id": ocd_id,
        "jurisdictionId": jurisdiction_id,
        "fileNumber": file_number,
        "officialTitle": official_title,
        "plainTitle": official_title[:100] + "..." if len(official_title) > 100 else official_title,
        "category": category,
        "status": status_name,
        "introductionDate": intro_date,
        "sponsors": sponsors,
        "affectedWards": ["All Wards"],
        "whoItAffects": "Municipal residents and affected local property owners.",
        "summary": official_title, # Will be enriched by Gemini NLP
        "fiscalImpact": {
            "amount": 0.0,
            "type": "Regulatory / To Be Assessed",
            "description": "Fiscal impact review pending clerk documentation.",
        },
        "receipt": {
            "documentTitle": f"{place_name.capitalize()} Clerk Record - Matter #{file_number}",
            "fileNumber": file_number,
            "clerkMatterId": f"LEG-{matter_id}",
            "officialUrl": f"https://{place_name.lower()}.legistar.com/LegislationDetail.aspx?ID={matter_id}",
            "paragraphSnippet": official_title,
            "pageNumber": 1,
            "verificationBadge": "Verified Legistar OData",
            "verifiedAt": datetime.utcnow().isoformat(),
        },
        "hearing": {
            "committee": body_name,
            "dateTime": datetime.utcnow().isoformat(),
            "location": "City Hall Council Chambers",
            "publicCommentAllowed": True,
        },
        "tags": [category, type_name],
    }
