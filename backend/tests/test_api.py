import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_health():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_detect_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/logs/detect",
            data={"sample_content": "Sep 13 10:32:21 server01 sshd: Failed password"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["detected_format"] == "syslog"
        assert data["confidence"] > 0.8


@pytest.mark.asyncio
async def test_parsers_list():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/parsers")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 5
        keys = [p["format_key"] for p in data]
        assert "json" in keys
        assert "apache" in keys
        assert "syslog" in keys


@pytest.mark.asyncio
async def test_benchmark_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/v1/analytics/benchmark?num_records=500")
        assert response.status_code == 200
        data = response.json()
        assert data["total_records_tested"] == 500
        assert data["pipeline_throughput_logs_per_sec"] > 1000
        assert data["success_rate_percent"] == 100.0
