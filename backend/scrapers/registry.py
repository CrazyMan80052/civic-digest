# backend/scrapers/registry.py
"""
Municipal Scraper Adapter Registry & Factory
Maps provider types and client identifiers to appropriate scraper adapters.
"""

import logging
from typing import Any

try:
    from .base import BaseMunicipalClient
    from .dublin import DublinMunicipalClient
    from .legistar import LegistarClient
except (ImportError, ValueError):
    from scrapers.base import BaseMunicipalClient
    from scrapers.dublin import DublinMunicipalClient
    from scrapers.legistar import LegistarClient

logger = logging.getLogger("civicdigest.scrapers.registry")

SCRAPER_PROVIDERS: dict[str, type[BaseMunicipalClient]] = {
    "legistar": LegistarClient,
    "custom_portal": DublinMunicipalClient,
}

# Explicit overrides for custom municipal portals
CUSTOM_CLIENT_REGISTRY: dict[str, type[BaseMunicipalClient]] = {
    "dublin": DublinMunicipalClient,
}


def get_scraper_client(
    client_name: str,
    provider: str | None = None,
    timeout: float = 15.0,
    **kwargs: Any,
) -> BaseMunicipalClient:
    """
    Factory to return the appropriate municipal scraper client.
    Dispatches to custom adapters if registered, or provider-based adapter (defaults to Legistar).
    """
    normalized_name = client_name.lower().strip()

    # Check custom client registry first
    if normalized_name in CUSTOM_CLIENT_REGISTRY:
        client_cls = CUSTOM_CLIENT_REGISTRY[normalized_name]
        return client_cls(timeout=timeout, **kwargs)

    # Check provider type
    if provider and provider.lower() in SCRAPER_PROVIDERS:
        client_cls = SCRAPER_PROVIDERS[provider.lower()]
        return client_cls(client_name=normalized_name, timeout=timeout, **kwargs)

    # Default provider is Legistar OData v1 (standard for 150+ US metros)
    return LegistarClient(client_name=normalized_name, timeout=timeout, **kwargs)
