# backend/scrapers/base.py
"""
Base interface for Municipal Scraper Clients / Adapters.
Standardizes querying municipal dockets across various vendors:
Legistar OData v1, CivicPlus, Municode, and Custom Municipal Portals.
"""

from abc import ABC, abstractmethod
from typing import Any


class BaseMunicipalClient(ABC):
    client_name: str
    place_name: str = ""
    state_code: str = ""

    @abstractmethod
    async def fetch_recent_matters(self, days_back: int = 30, top: int = 50) -> list[dict[str, Any]]:
        """Fetch recent matters / ordinances / resolutions."""
        pass

    @abstractmethod
    async def fetch_matter_attachments(self, matter_id: int) -> list[dict[str, Any]]:
        """Fetch attachments for a matter."""
        pass

    @abstractmethod
    async def fetch_upcoming_events(self, days_ahead: int = 14) -> list[dict[str, Any]]:
        """Fetch upcoming committee / council meetings."""
        pass
