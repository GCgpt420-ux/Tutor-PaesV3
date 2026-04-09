from datetime import timezone
from datetime import datetime
from types import SimpleNamespace

from app.api.v1.endpoints import payments as payments_endpoints
from app.db.session import get_db
from app.core.auth import get_current_user


class FakeDB:
    def __init__(self, payment, entitlement):
        self._payment = payment
        self._entitlement = entitlement
        self.scalar_calls = 0
        self.commit_called = False
        self.added = []

    def scalar(self, _query):
        self.scalar_calls += 1
        if self.scalar_calls == 1:
            return self._payment
        return self._entitlement

    def add(self, obj):
        self.added.append(obj)

    def commit(self):
        self.commit_called = True


def test_payment_confirmation_idempotent(client, monkeypatch):
    from app.main import app

    payment = SimpleNamespace(
        id=77,
        user_id=10,
        token_ws="tok-123",
        plan="monthly",
        status="authorized",
        authorized_at=datetime.now(timezone.utc),
    )
    entitlement = SimpleNamespace(meta={"payment_id": 77}, plan="pro", is_active=True)

    fake_db = FakeDB(payment=payment, entitlement=entitlement)

    def override_get_db():
        yield fake_db

    app.dependency_overrides[get_db] = override_get_db

    # El fix de IDOR requiere autenticación. Inyectamos el usuario dueño del pago.
    authenticated_user = SimpleNamespace(id=10, email="user@example.com", name="Test", is_admin=False)
    app.dependency_overrides[get_current_user] = lambda: authenticated_user

    monkeypatch.setattr(
        payments_endpoints,
        "confirm_payment",
        lambda token_ws, db: {"success": True},
    )

    response = client.get("/api/v1/payments/confirm?token_ws=tok-123")

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["plan"] == "monthly"
    assert fake_db.commit_called is False
