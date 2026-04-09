from datetime import timezone
from datetime import datetime
from types import SimpleNamespace

from app.api.v1.endpoints import payments as payments_endpoints
from app.db.models import UserEntitlement
from app.db.session import get_db
from app.core.auth import get_current_user


class FakeDB:
    def __init__(self, payment):
        self._payment = payment
        self.scalar_calls = 0
        self.commit_called = False
        self.added = []

    def scalar(self, _query):
        self.scalar_calls += 1
        if self.scalar_calls == 1:
            return self._payment
        return None

    def add(self, obj):
        self.added.append(obj)

    def commit(self):
        self.commit_called = True


def test_server_to_server_callback_creates_entitlement(client, monkeypatch):
    from app.main import app

    payment = SimpleNamespace(
        id=99,
        user_id=55,
        token_ws="tok-server",
        plan="annual",
        status="pending",
        authorized_at=datetime.now(timezone.utc),
    )

    fake_db = FakeDB(payment)

    def override_get_db():
        yield fake_db

    app.dependency_overrides[get_db] = override_get_db

    # El fix de IDOR requiere autenticación. Inyectamos el usuario dueño del pago.
    authenticated_user = SimpleNamespace(id=55, email="user@example.com", name="Test", is_admin=False)
    app.dependency_overrides[get_current_user] = lambda: authenticated_user

    monkeypatch.setattr(
        payments_endpoints,
        "confirm_payment",
        lambda token_ws, db: {"success": True},
    )

    response = client.get("/api/v1/payments/confirm?token_ws=tok-server")

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert fake_db.commit_called is True
    assert len(fake_db.added) == 1
    assert isinstance(fake_db.added[0], UserEntitlement)
    assert fake_db.added[0].user_id == payment.user_id
