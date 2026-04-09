"""
Tests for billing endpoints:
  GET /api/v1/payments/history
  GET /api/v1/payments/invoices/{invoice_id}
  GET /api/v1/payments/invoices/{invoice_id}/download
"""
from datetime import datetime, timezone
from types import SimpleNamespace

from app.api.v1.endpoints import payments as payments_endpoints
from app.core.auth import get_current_user
from app.db.session import get_db


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------

def _make_invoice(invoice_id: int, user_id: int):
    return SimpleNamespace(
        id=invoice_id,
        user_id=user_id,
        invoice_number=f"INV-20260406-{invoice_id:05d}",
        status="issued",
        issue_date=datetime.now(timezone.utc),
        due_date=datetime.now(timezone.utc),
        total_amount=29990,
        pdf_file_url=None,
    )


def _override_db():
    yield SimpleNamespace()


# ---------------------------------------------------------------------------
# GET /payments/history
# ---------------------------------------------------------------------------

def test_billing_history_returns_data(client, test_user, monkeypatch):
    from app.main import app

    app.dependency_overrides[get_db] = _override_db
    app.dependency_overrides[get_current_user] = lambda: test_user

    monkeypatch.setattr(
        payments_endpoints,
        "get_user_billing_history",
        lambda user_id, db, limit=50: {
            "payments": [],
            "total_spent": 0,
            "count": 0,
        },
    )

    response = client.get("/api/v1/payments/history")
    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 0
    assert body["total_spent"] == 0
    assert body["payments"] == []


def test_billing_history_requires_auth(client):
    response = client.get("/api/v1/payments/history")
    assert response.status_code == 401


def test_billing_history_respects_limit_param(client, test_user, monkeypatch):
    from app.main import app

    captured = {}

    def fake_history(user_id, db, limit=50):
        captured["limit"] = limit
        return {"payments": [], "total_spent": 0, "count": 0}

    app.dependency_overrides[get_db] = _override_db
    app.dependency_overrides[get_current_user] = lambda: test_user
    monkeypatch.setattr(payments_endpoints, "get_user_billing_history", fake_history)

    client.get("/api/v1/payments/history?limit=10")
    assert captured.get("limit") == 10


# ---------------------------------------------------------------------------
# GET /payments/invoices/{invoice_id}  — IDOR
# ---------------------------------------------------------------------------

def test_get_invoice_success(client, test_user, monkeypatch):
    from app.main import app

    invoice = _make_invoice(7, user_id=test_user.id)

    app.dependency_overrides[get_db] = _override_db
    app.dependency_overrides[get_current_user] = lambda: test_user
    monkeypatch.setattr(payments_endpoints, "get_invoice_by_id", lambda inv_id, db: invoice)

    response = client.get("/api/v1/payments/invoices/7")
    assert response.status_code == 200
    body = response.json()
    assert body["invoice_number"] == invoice.invoice_number
    assert body["total_amount"] == invoice.total_amount


def test_get_invoice_not_found(client, test_user, monkeypatch):
    from app.main import app

    app.dependency_overrides[get_db] = _override_db
    app.dependency_overrides[get_current_user] = lambda: test_user
    monkeypatch.setattr(payments_endpoints, "get_invoice_by_id", lambda inv_id, db: None)

    response = client.get("/api/v1/payments/invoices/999")
    assert response.status_code == 404


def test_get_invoice_idor_blocked(client, test_user, other_user, monkeypatch):
    """User cannot access another user's invoice."""
    from app.main import app

    invoice = _make_invoice(8, user_id=other_user.id)  # owned by other_user

    app.dependency_overrides[get_db] = _override_db
    app.dependency_overrides[get_current_user] = lambda: test_user  # different user
    monkeypatch.setattr(payments_endpoints, "get_invoice_by_id", lambda inv_id, db: invoice)

    response = client.get("/api/v1/payments/invoices/8")
    assert response.status_code == 403


def test_get_invoice_requires_auth(client):
    response = client.get("/api/v1/payments/invoices/1")
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# GET /payments/invoices/{invoice_id}/download
# ---------------------------------------------------------------------------

def test_download_invoice_idor_blocked(client, test_user, other_user, monkeypatch):
    from app.main import app

    invoice = _make_invoice(9, user_id=other_user.id)

    app.dependency_overrides[get_db] = _override_db
    app.dependency_overrides[get_current_user] = lambda: test_user
    monkeypatch.setattr(payments_endpoints, "get_invoice_by_id", lambda inv_id, db: invoice)

    response = client.get("/api/v1/payments/invoices/9/download")
    assert response.status_code == 403


def test_download_invoice_placeholder_response(client, test_user, monkeypatch):
    from app.main import app

    invoice = _make_invoice(10, user_id=test_user.id)

    app.dependency_overrides[get_db] = _override_db
    app.dependency_overrides[get_current_user] = lambda: test_user
    monkeypatch.setattr(payments_endpoints, "get_invoice_by_id", lambda inv_id, db: invoice)

    response = client.get("/api/v1/payments/invoices/10/download")
    assert response.status_code == 200
    assert "invoice_number" in response.json()
