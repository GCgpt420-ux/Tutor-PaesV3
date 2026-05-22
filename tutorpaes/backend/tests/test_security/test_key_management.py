"""Tests for API key versioning and rotation framework."""
import pytest
from app.core.key_management import (
    KeyManager,
    KeyVersion,
    get_api_key,
    rotate_provider_key,
    get_provider_status,
    get_key_manager,
)
from datetime import datetime, timedelta


class TestKeyVersion:
    """Test KeyVersion dataclass."""

    def test_key_version_creation(self):
        """Should create KeyVersion with correct fields."""
        now = datetime.now()
        key = KeyVersion(
            version="v1",
            key="sk-test-key",
            created_at=now,
            status="active"
        )
        
        assert key.version == "v1"
        assert key.key == "sk-test-key"
        assert key.created_at == now
        assert key.status == "active"
        assert key.rotated_at is None
        assert key.grace_period_expires_at is None


class TestKeyManager:
    """Test KeyManager class."""

    def test_initialization_with_valid_provider(self):
        """Should initialize with valid provider."""
        manager = KeyManager("openai")
        assert manager.provider == "openai"
        assert isinstance(manager._versions, dict)

    def test_initialization_with_invalid_provider(self):
        """Should raise ValueError for invalid provider."""
        with pytest.raises(ValueError, match="Unknown provider"):
            KeyManager("invalid_provider")

    def test_case_insensitive_provider(self):
        """Should normalize provider name to lowercase."""
        manager = KeyManager("OpenAI")
        assert manager.provider == "openai"

    def test_get_active_key_from_env(self, monkeypatch):
        """Should get active key from environment."""
        monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key-123")
        
        manager = KeyManager("openai")
        key = manager.get_active_key()
        
        assert key == "sk-test-key-123"

    def test_get_active_key_not_found(self):
        """Should raise ValueError if no key found."""
        # Create manager for a provider without any configured keys
        # Use a fresh provider instance
        with pytest.raises(ValueError, match="No API key found"):
            # Create a manager for 'openai' but don't set any env vars
            # The __init__ will not find keys, so get_active_key will fail
            manager = KeyManager("openai")
            # Manually clear versions to simulate no keys
            manager._versions.clear()
            manager.get_active_key()

    def test_mark_deprecated(self, monkeypatch):
        """Should mark key version as deprecated."""
        monkeypatch.setenv("OPENAI_API_KEY_V0", "sk-old-key")
        
        manager = KeyManager("openai")
        manager.mark_deprecated("v0", grace_period_days=7)
        
        assert manager._versions["v0"].status == "deprecated"
        assert manager._versions["v0"].rotated_at is not None
        assert manager._versions["v0"].grace_period_expires_at is not None
        
        # Verify grace period is approximately 7 days
        grace_expires = manager._versions["v0"].grace_period_expires_at
        now = datetime.now()
        days_until_expires = (grace_expires - now).days
        # Allow for clock skew - should be 6 or 7 days
        assert 6 <= days_until_expires <= 7

    def test_mark_revoked(self, monkeypatch):
        """Should mark key version as revoked."""
        monkeypatch.setenv("OPENAI_API_KEY_V0", "sk-old-key")
        
        manager = KeyManager("openai")
        manager.mark_revoked("v0")
        
        assert manager._versions["v0"].status == "revoked"

    def test_rotate_key(self, monkeypatch):
        """Should rotate key to new version."""
        monkeypatch.setenv("OPENAI_API_KEY_V0", "sk-old-key")
        
        manager = KeyManager("openai")
        
        # Verify old key is active
        assert manager.get_active_key() == "sk-old-key"
        
        # Rotate to new key
        new_version = manager.rotate_key("sk-new-key", grace_period_days=7)
        
        assert new_version == "v1"
        assert manager.get_active_key() == "sk-new-key"
        assert manager._versions["v0"].status == "deprecated"
        assert manager._versions["v1"].status == "active"

    def test_rotate_key_multiple_times(self, monkeypatch):
        """Should handle multiple rotations correctly."""
        monkeypatch.setenv("OPENAI_API_KEY_V0", "sk-key-0")
        
        manager = KeyManager("openai")
        
        v1 = manager.rotate_key("sk-key-1")
        assert v1 == "v1"
        
        v2 = manager.rotate_key("sk-key-2")
        assert v2 == "v2"
        
        # Check all versions
        assert manager._versions["v0"].status == "deprecated"
        assert manager._versions["v1"].status == "deprecated"
        assert manager._versions["v2"].status == "active"
        assert manager.get_active_key() == "sk-key-2"

    def test_get_key_version(self, monkeypatch):
        """Should retrieve specific key version."""
        monkeypatch.setenv("OPENAI_API_KEY_V0", "sk-old-key")
        monkeypatch.setenv("OPENAI_API_KEY_V1", "sk-new-key")
        
        manager = KeyManager("openai")
        
        assert manager.get_key_version("v0") == "sk-old-key"
        assert manager.get_key_version("v1") == "sk-new-key"
        assert manager.get_key_version("v99") is None

    def test_get_status(self, monkeypatch):
        """Should return current status of all versions."""
        monkeypatch.setenv("OPENAI_API_KEY_V0", "sk-old-key")
        monkeypatch.setenv("OPENAI_API_KEY_V1", "sk-new-key")
        
        manager = KeyManager("openai")
        manager.mark_deprecated("v0")
        
        status = manager.get_status()
        
        assert status["provider"] == "openai"
        assert len(status["versions"]) == 2
        assert status["versions"][0]["version"] == "v0"
        assert status["versions"][0]["status"] == "deprecated"
        assert status["versions"][1]["version"] == "v1"
        assert status["versions"][1]["status"] == "active"


class TestKeyManagerFunctions:
    """Test top-level KeyManager functions."""

    def test_get_key_manager(self):
        """Should return same manager instance for same provider."""
        mgr1 = get_key_manager("openai")
        mgr2 = get_key_manager("openai")
        
        assert mgr1 is mgr2

    def test_get_api_key(self, monkeypatch):
        """Should get active API key via helper function."""
        monkeypatch.setenv("GROQ_API_KEY", "gsk-test-key")
        
        key = get_api_key("groq")
        assert key == "gsk-test-key"

    def test_get_provider_status(self, monkeypatch):
        """Should get provider status via helper function."""
        monkeypatch.setenv("CEREBRAS_API_KEY_V0", "csk-key-0")
        
        status = get_provider_status("cerebras")
        
        assert status["provider"] == "cerebras"
        assert len(status["versions"]) >= 1
        assert status["active_key"] is not None


class TestKeyRotationWorkflow:
    """Test complete key rotation workflow."""

    def test_rotation_workflow_with_grace_period(self, monkeypatch):
        """Test full rotation workflow: old active → deprecated, new → active."""
        # Setup: Old key is active
        monkeypatch.setenv("TRANSBANK_API_KEY_V0", "tbk-old-key-123")
        
        manager = KeyManager("transbank")
        
        # Step 1: Verify old key is active
        assert manager.get_active_key() == "tbk-old-key-123"
        status = manager.get_status()
        assert status["versions"][0]["status"] == "active"
        
        # Step 2: Rotate to new key
        new_version = manager.rotate_key("tbk-new-key-456", grace_period_days=7)
        
        # Step 3: Verify rotation
        assert new_version == "v1"
        assert manager.get_active_key() == "tbk-new-key-456"
        
        # Step 4: Check both keys still accessible
        assert manager.get_key_version("v0") == "tbk-old-key-123"
        assert manager.get_key_version("v1") == "tbk-new-key-456"
        
        # Step 5: Verify grace period
        old_version = manager._versions["v0"]
        assert old_version.status == "deprecated"
        assert old_version.grace_period_expires_at is not None
        days_left = (old_version.grace_period_expires_at - datetime.now()).days
        # Allow for clock skew - should be 6 or 7 days
        assert 6 <= days_left <= 7

    def test_emergency_revocation(self, monkeypatch):
        """Test emergency key revocation (immediate, no grace period)."""
        monkeypatch.setenv("OPENAI_API_KEY_V0", "sk-compromised-key")
        
        manager = KeyManager("openai")
        original_key = manager.get_active_key()
        
        # Emergency: immediately revoke old key
        manager.mark_revoked("v0")
        
        # Verify revocation
        assert manager._versions["v0"].status == "revoked"
        
        # Add new key as active
        manager.rotate_key("sk-emergency-new-key", grace_period_days=0)
        
        assert manager.get_active_key() == "sk-emergency-new-key"
        assert manager._versions["v0"].status == "revoked"
