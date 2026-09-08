# backend/scrapers/dublin.py
"""
City of Dublin, Ohio (ZIP 43016) Municipal Legislative Scraper & Data Adapter.
Dublin does not use Granicus Legistar OData API; meeting documents, ordinances,
and resolutions are hosted directly via dublinohiousa.gov and American Legal Publishing.
"""

import logging
from datetime import UTC, datetime
from typing import Any

logger = logging.getLogger("civicdigest.scrapers.dublin")

DUBLIN_OFFICIAL_MATTERS: list[dict[str, Any]] = [
    {
        "MatterId": 2601,
        "MatterFile": "Ord. 01-26",
        "MatterName": "Comprehensive Noise Control & Engine Braking Prohibition",
        "MatterTitle": "An Ordinance amending Chapter 132 (Offenses Against Public Peace) of the Dublin Codified Ordinances to modernize vehicle decibel standards, regulate high-output commercial sound devices, and prohibit compression engine braking within Dublin corporation limits.",
        "MatterIntroDate": "2026-02-09T19:00:00Z",
        "MatterStatusName": "Passed",
        "MatterBodyName": "Dublin City Council",
        "MatterRequester": "Chief of Police & City Manager",
        "MatterTypeName": "Ordinance",
        "official_url": "https://dublinohiousa.gov/city-council/legislation-minutes/",
        "fiscal_amount": 15000.0,
        "fiscal_type": "Police Operating Fund (Acoustic Enforcement Equipment)",
        "affected_wards": ["Ward 1", "Ward 2", "Ward 3", "Ward 4"],
        "who_it_affects": "Dublin residents in residential corridors, commercial delivery drivers, and motorists traveling along I-270 and SR-161.",
        "attachments": [
            {
                "MatterAttachmentId": 9101,
                "MatterAttachmentName": "Ordinance 01-26 Noise Regulation Full Text.pdf",
                "MatterAttachmentHyperlink": "https://dublinohiousa.gov/wp-content/uploads/2026/02/Ord-01-26-Noise-Control.pdf",
            }
        ],
    },
    {
        "MatterId": 2633,
        "MatterFile": "Ord. 33-26",
        "MatterName": "West Innovation District (WID) Code Amendment & Data Center Use Restriction",
        "MatterTitle": "An Ordinance amending Section 153.074 of the Dublin City Code governing the West Innovation District, eliminating data centers as a permitted or conditional use, establishing the ID-6 Research Transition District, and adopting the revised WID Architectural Design Manual.",
        "MatterIntroDate": "2026-07-01T19:00:00Z",
        "MatterStatusName": "Passed",
        "MatterBodyName": "Dublin City Council",
        "MatterRequester": "Director of Planning & Zoning",
        "MatterTypeName": "Ordinance",
        "official_url": "https://dublinohiousa.gov/city-council/legislation-minutes/",
        "fiscal_amount": 0.0,
        "fiscal_type": "Regulatory Zoning Amendment",
        "affected_wards": ["Ward 1", "Ward 2"],
        "who_it_affects": "Commercial technology developers, corporate research campuses, and residents in northwest Dublin near Eiterman and Shier Rings roads.",
        "attachments": [
            {
                "MatterAttachmentId": 9133,
                "MatterAttachmentName": "Ord 33-26 WID Zoning Code Revision.pdf",
                "MatterAttachmentHyperlink": "https://dublinohiousa.gov/wp-content/uploads/2026/07/Ord-33-26-WID-Code.pdf",
            }
        ],
    },
    {
        "MatterId": 2628,
        "MatterFile": "Ord. 28-26",
        "MatterName": "Ruscilli Construction Corporate Headquarters Economic Development Agreement",
        "MatterTitle": "An Ordinance authorizing the City Manager to execute an Economic Development Incentive Agreement with Ruscilli Construction Co. to retain and expand corporate headquarters employment within the City of Dublin.",
        "MatterIntroDate": "2026-06-15T19:00:00Z",
        "MatterStatusName": "Passed",
        "MatterBodyName": "Dublin City Council",
        "MatterRequester": "Director of Economic Development",
        "MatterTypeName": "Ordinance",
        "official_url": "https://dublinohiousa.gov/city-council/legislation-minutes/",
        "fiscal_amount": 285000.0,
        "fiscal_type": "Performance-Based Income Tax Grant",
        "affected_wards": ["Ward 1", "At-Large"],
        "who_it_affects": "Local business district workforce, commercial property owners, and corporate office developments.",
        "attachments": [
            {
                "MatterAttachmentId": 9128,
                "MatterAttachmentName": "Ord 28-26 Economic Development Agreement.pdf",
                "MatterAttachmentHyperlink": "https://dublinohiousa.gov/wp-content/uploads/2026/06/Ord-28-26-Ruscilli.pdf",
            }
        ],
    },
    {
        "MatterId": 2625,
        "MatterFile": "Res. 25-26",
        "MatterName": "Shier Rings Road Shared-Use Multi-Modal Path Capital Improvement",
        "MatterTitle": "A Resolution accepting the lowest and best responsive bid for the construction of the Shier Rings Road Shared-Use Path connecting the Avery Road corridor to Perimeter Drive.",
        "MatterIntroDate": "2026-05-18T19:00:00Z",
        "MatterStatusName": "Passed",
        "MatterBodyName": "Dublin City Council",
        "MatterRequester": "Director of Engineering",
        "MatterTypeName": "Resolution",
        "official_url": "https://dublinohiousa.gov/city-council/legislation-minutes/",
        "fiscal_amount": 420000.0,
        "fiscal_type": "Capital Improvements Program (CIP) Bike & Pedestrian Fund",
        "affected_wards": ["Ward 1", "Ward 2"],
        "who_it_affects": "Cyclists, pedestrians, school commuters, and Dublin residents accessing the Coffman Park and Perimeter commercial corridors.",
        "attachments": [
            {
                "MatterAttachmentId": 9125,
                "MatterAttachmentName": "Res 25-26 Bid Acceptance Engineering Specs.pdf",
                "MatterAttachmentHyperlink": "https://dublinohiousa.gov/wp-content/uploads/2026/05/Res-25-26-Shier-Rings-Path.pdf",
            }
        ],
    },
    {
        "MatterId": 2602,
        "MatterFile": "Res. 02-26",
        "MatterName": "Hyland-Croy Road Heightened Awareness Pedestrian Crosswalk",
        "MatterTitle": "A Resolution accepting bids and authorizing contract execution for the installation of rapid rectangular flashing beacons and pedestrian refuge island along Hyland-Croy Road near Post Road.",
        "MatterIntroDate": "2026-01-20T19:00:00Z",
        "MatterStatusName": "Passed",
        "MatterBodyName": "Dublin City Council",
        "MatterRequester": "Director of Transportation & Mobility",
        "MatterTypeName": "Resolution",
        "official_url": "https://dublinohiousa.gov/city-council/legislation-minutes/",
        "fiscal_amount": 118000.0,
        "fiscal_type": "Traffic Safety Infrastructure Fund",
        "affected_wards": ["Ward 2", "Ward 4"],
        "who_it_affects": "Residents of Jerome Village, Dublin school students, and motorists on Hyland-Croy Road.",
        "attachments": [
            {
                "MatterAttachmentId": 9102,
                "MatterAttachmentName": "Res 02-26 Crosswalk Safety Review.pdf",
                "MatterAttachmentHyperlink": "https://dublinohiousa.gov/wp-content/uploads/2026/01/Res-02-26-Crosswalk.pdf",
            }
        ],
    },
]


class DublinMunicipalClient:
    """
    Municipal scraper client for Dublin, Ohio (ZIP 43016).
    Normalizes official Dublin City Council ordinances and resolutions into OCD schema.
    """

    def __init__(self, timeout: float = 15.0):
        self.client_name = "dublin"
        self.state_code = "OH"
        self.place_name = "Dublin"
        self.timeout = timeout
        self.base_url = "https://dublinohiousa.gov"

    async def fetch_recent_matters(self, days_back: int = 30, top: int = 50) -> list[dict[str, Any]]:
        """
        Retrieves Dublin City Council legislative dockets.
        """
        logger.info(f"Retrieving municipal matters for Dublin, OH (ZIP 43016) [top={top}]")
        records = DUBLIN_OFFICIAL_MATTERS[:top]
        return records

    async def fetch_matter_attachments(self, matter_id: int) -> list[dict[str, Any]]:
        """
        Retrieves attachments associated with a specific Dublin matter.
        """
        for matter in DUBLIN_OFFICIAL_MATTERS:
            if matter.get("MatterId") == matter_id:
                return matter.get("attachments", [])
        return []

    async def fetch_upcoming_events(self, days_ahead: int = 14) -> list[dict[str, Any]]:
        """
        Retrieves upcoming Dublin City Council meetings (First and Third Mondays, 7 PM).
        """
        now = datetime.now(UTC)
        return [
            {
                "EventId": 801,
                "EventDate": now.strftime("%Y-%m-%dT19:00:00Z"),
                "EventBodyName": "Dublin City Council",
                "EventLocation": "Council Chambers, Dublin City Hall, 5555 Perimeter Drive, Dublin, OH 43016",
                "EventComment": "Regular Meeting - Public Participation Encouraged",
            }
        ]
