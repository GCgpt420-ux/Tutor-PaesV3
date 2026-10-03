from types import SimpleNamespace
from fastapi.testclient import TestClient
from app.core.auth import require_admin_user
from app.db.session import get_db
from app.main import app
from app.db.models import User


def test_pilot_audit_endpoint_forbidden_for_non_admin(client: TestClient):
    # Sin autenticación/admin debe retornar 401 o 403
    response = client.get("/api/v1/admin/pilot-audit")
    assert response.status_code in (401, 403)


def test_pilot_audit_endpoint_success():
    admin_user = SimpleNamespace(
        id=1,
        email="demo@example.com",
        name="Demo Admin",
        is_admin=True,
        role="admin",
    )

    test_user_1 = SimpleNamespace(
        id=1,
        email="demo@example.com",
        name="Demo Admin",
        role="admin",
        is_admin=True,
        is_active=True,
    )
    test_user_2 = SimpleNamespace(
        id=126,
        email="alumno01@tutorpaes.cl",
        name="Patricio Aylwin",
        role="student",
        is_admin=False,
        is_active=True,
    )

    class FakeQuery:
        def __init__(self, items):
            self.items = items

        def order_by(self, *args, **kwargs):
            return self

        def all(self):
            return self.items

        def filter(self, *args, **kwargs):
            return self

        def scalar(self):
            return 2

        def join(self, *args, **kwargs):
            return self

    class FakeDB:
        def query(self, model):
            if model is User:
                return FakeQuery([test_user_1, test_user_2])
            return FakeQuery([])

    app.dependency_overrides[require_admin_user] = lambda: admin_user
    app.dependency_overrides[get_db] = lambda: (yield FakeDB())

    try:
        with TestClient(app) as test_client:
            response = test_client.get("/api/v1/admin/pilot-audit")
            assert response.status_code == 200
            data = response.json()
            assert "summary" in data
            assert data["summary"]["total_users"] == 2
            assert data["summary"]["active_users"] == 2
            assert len(data["users"]) == 2
            assert data["users"][0]["cohort"] == "Administrador"
            assert data["users"][1]["cohort"] == "Egresado DEMRE 2026"
    finally:
        app.dependency_overrides.pop(require_admin_user, None)
        app.dependency_overrides.pop(get_db, None)
