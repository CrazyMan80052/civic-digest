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
