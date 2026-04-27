from types import SimpleNamespace

from app.core.auth import get_password_hash, verify_password
from scripts.seed_user import sync_demo_user


class FakeDB:
    def __init__(self, existing_user=None):
        self.user = existing_user
        self.add_calls = 0
        self.commit_calls = 0

    def scalar(self, _query):
        return self.user

    def add(self, user):
        self.user = user
        self.add_calls += 1

    def commit(self):
        self.commit_calls += 1


def test_sync_demo_user_resets_password_when_user_exists():
    old_password_hash = get_password_hash("OldPass123!")
    existing_user = SimpleNamespace(
        id=1,
        name="Demo User",
        email="demo@example.com",
        hashed_password=old_password_hash,
        is_active=True,
        is_admin=False,
    )
    db = FakeDB(existing_user=existing_user)

    sync_demo_user(db, demo_email="demo@example.com", demo_password="demo123")

    assert db.user.is_admin is True
    assert verify_password("demo123", db.user.hashed_password)
    assert db.commit_calls == 1
