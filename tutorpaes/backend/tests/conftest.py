import os
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient


os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret-key-1234567890")
os.environ.setdefault("PAYMENT_RETURN_URL", "http://localhost:3000/api/payments/confirm")
os.environ.setdefault("ENVIRONMENT", "test")

from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(autouse=True)
def clear_dependency_overrides():
    app.dependency_overrides = {}
    yield
    app.dependency_overrides = {}


@pytest.fixture
def test_user():
    return SimpleNamespace(id=1, email="test@example.com", name="Test User", is_admin=False, is_active=True)


@pytest.fixture
def other_user():
    return SimpleNamespace(id=2, email="other@example.com", name="Other User", is_admin=False, is_active=True)
