from app.db.session import get_db


def test_register_rejects_weak_password(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "name": "Nuevo Usuario",
            "password": "password123",
        },
    )

    assert response.status_code == 422
    payload = response.json()
    assert payload["error"] == "validation_error"


def test_register_accepts_strong_password_with_8_chars(client):
    from app.main import app

    class FakeDB:
        def scalar(self, _query):
            return None

        def add(self, _obj):
            _obj.id = 123
            if getattr(_obj, "is_admin", None) is None:
                _obj.is_admin = False
            return None

        def commit(self):
            return None

        def refresh(self, _obj):
            return None

    def override_get_db():
        yield FakeDB()

    app.dependency_overrides[get_db] = override_get_db

    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "min8@example.com",
            "name": "Min Ocho",
            "password": "Aa1#abcd",
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["email"] == "min8@example.com"


def test_register_rejects_password_longer_than_14_chars(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "max14@example.com",
            "name": "Max Catorce",
            "password": "Aa1#abcdefghijkl",  # 16 chars
        },
    )

    assert response.status_code == 422
    payload = response.json()
    assert payload["error"] == "validation_error"
