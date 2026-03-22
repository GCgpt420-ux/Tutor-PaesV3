from app.api.v1.endpoints import health as health_endpoints
from app.db.session import get_db


def test_health_endpoint_ok(client):
    response = client.get("/api/v1/health/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_readiness_with_db_ok(client):
    from app.main import app

    class FakeDB:
        def execute(self, _query):
            return 1

    def override_get_db():
        yield FakeDB()

    app.dependency_overrides[get_db] = override_get_db

    response = client.get("/api/v1/health/readiness")
    assert response.status_code == 200
    assert response.json()["status"] == "ready"


def test_readiness_without_db_returns_503(client):
    from app.main import app

    class FakeDB:
        def execute(self, _query):
            raise RuntimeError("db down")

    def override_get_db():
        yield FakeDB()

    app.dependency_overrides[get_db] = override_get_db

    response = client.get("/api/v1/health/readiness")
    assert response.status_code == 503
