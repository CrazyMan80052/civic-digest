from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "CivicDigest-FastAPI-Engine" in data["service"]
    assert "standards" in data
    assert any("OCD-ID" in s for s in data["standards"])


def test_scraper_registry_dispatch():
    from scrapers.dublin import DublinMunicipalClient
    from scrapers.legistar import LegistarClient
    from scrapers.registry import get_scraper_client

    # Dublin should dispatch to DublinMunicipalClient
    dub_client = get_scraper_client("dublin")
    assert isinstance(dub_client, DublinMunicipalClient)

    # Cleveland, Austin, Chicago should dispatch to LegistarClient
    cle_client = get_scraper_client("cleveland")
    assert isinstance(cle_client, LegistarClient)
    assert cle_client.client_name == "cleveland"

    atx_client = get_scraper_client("austin", provider="legistar")
    assert isinstance(atx_client, LegistarClient)
    assert atx_client.client_name == "austin"
