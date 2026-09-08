# backend/scrapers/legistar.py
"""
Legistar OData API Municipal Scraper Client
Handles querying official Granicus/Legistar Web APIs for public municipal dockets,
legislation (Matters), and committee agendas (Events).
"""

import logging
from datetime import datetime, timedelta
from typing import Any

import httpx

try:
    from .base import BaseMunicipalClient
except (ImportError, ValueError):
    from scrapers.base import BaseMunicipalClient

logger = logging.getLogger("civicdigest.legistar")

class LegistarClient(BaseMunicipalClient):
    BASE_URL = "https://webapi.legistar.com/v1"

    def __init__(self, client_name: str, timeout: float = 15.0, *args: Any, **kwargs: Any):
        """
        :param client_name: Municipal identifier (e.g., 'cleveland', 'austin', 'chicago', 'seattle')
        """
        self.client_name = client_name.lower().strip()
        self.place_name = kwargs.get("place_name", client_name.title())
        self.state_code = kwargs.get("state_code", "")
        self.timeout = timeout
        self.headers = {
            "Accept": "application/json",
            "User-Agent": "CivicDigest-OCD-Scraper/1.0 (+https://civicdigest.org)",
        }

    async def fetch_recent_matters(self, days_back: int = 30, top: int = 50) -> list[dict[str, Any]]:
        """
        Queries Legistar OData endpoint for recently introduced or modified legislative matters.
        OData Filter: MatterIntroDate or MatterLastModifiedUtc
        """
        cutoff_date = (datetime.utcnow() - timedelta(days=days_back)).strftime("%Y-%m-%d")
        endpoint = f"{self.BASE_URL}/{self.client_name}/matters"
        params = {
            "$top": top,
            "$orderby": "MatterIntroDate desc",
            "$filter": f"MatterIntroDate ge datetime'{cutoff_date}'",
        }

        async with httpx.AsyncClient(timeout=self.timeout, headers=self.headers) as client:
            try:
                response = await client.get(endpoint, params=params)
                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"Retrieved {len(data)} matters from Legistar for {self.client_name}")
                    return data
                elif response.status_code == 404:
                    logger.warning(f"Legistar client '{self.client_name}' not found or OData not publicly enabled.")
                    return []
                else:
                    logger.error(f"Legistar API returned HTTP {response.status_code}: {response.text}")
                    return []
            except Exception as e:
                logger.error(f"Network error querying Legistar for {self.client_name}: {str(e)}")
                return []

    async def fetch_matter_attachments(self, matter_id: int) -> list[dict[str, Any]]:
        """
        Fetches official PDF attachments, fiscal notes, and committee reports for a specific matter.
        """
        endpoint = f"{self.BASE_URL}/{self.client_name}/matters/{matter_id}/attachments"
        async with httpx.AsyncClient(timeout=self.timeout, headers=self.headers) as client:
            try:
                response = await client.get(endpoint)
                if response.status_code == 200:
                    return response.json()
                return []
            except Exception as e:
                logger.warning(f"Failed to fetch attachments for matter {matter_id}: {e}")
                return []

    async def fetch_upcoming_events(self, days_ahead: int = 14) -> list[dict[str, Any]]:
        """
        Queries upcoming City Council and Committee hearings.
        """
        start_date = datetime.utcnow().strftime("%Y-%m-%d")
        end_date = (datetime.utcnow() + timedelta(days=days_ahead)).strftime("%Y-%m-%d")
        endpoint = f"{self.BASE_URL}/{self.client_name}/events"
        params = {
            "$orderby": "EventDate asc",
            "$filter": f"EventDate ge datetime'{start_date}' and EventDate le datetime'{end_date}'",
        }

        async with httpx.AsyncClient(timeout=self.timeout, headers=self.headers) as client:
            try:
                response = await client.get(endpoint, params=params)
                if response.status_code == 200:
                    return response.json()
                return []
            except Exception as e:
                logger.error(f"Failed to fetch events for {self.client_name}: {e}")
                return []
