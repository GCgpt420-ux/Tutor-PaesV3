"""Tests for Redis requirement enforcement in production deployments."""
import pytest
from app.core.config import Settings
from app.core.validators import validate_redis_in_production, validate_rate_limiter_backend


class TestRedisValidators:
    """Test Redis validation functions."""

    def test_validate_redis_in_production_with_redis(self):
        """Should pass when Redis is configured in production."""
        # Should not raise
        validate_redis_in_production("redis://localhost:6379", "production")

    def test_validate_redis_in_production_without_redis(self):
        """Should fail when Redis is NOT configured in production."""
        with pytest.raises(ValueError, match="REDIS_URL is REQUIRED for production"):
            validate_redis_in_production(None, "production")

        with pytest.raises(ValueError, match="REDIS_URL is REQUIRED for production"):
            validate_redis_in_production("", "production")

    def test_validate_redis_in_staging_with_redis(self):
        """Should pass when Redis is configured in staging."""
        validate_redis_in_production("redis://localhost:6379", "staging")

    def test_validate_redis_in_staging_without_redis(self):
        """Should fail when Redis is NOT configured in staging."""
        with pytest.raises(ValueError, match="REDIS_URL required for staging"):
            validate_redis_in_production(None, "staging")

    def test_validate_redis_in_development_optional(self):
        """Should allow missing Redis in development."""
        # Should not raise for development without Redis
        validate_redis_in_production(None, "development")
        validate_redis_in_production("", "development")

    def test_rate_limiter_backend_production_with_redis(self):
        """Should return 'redis' for production with Redis."""
        backend = validate_rate_limiter_backend("redis://localhost:6379", "production")
        assert backend == "redis"

    def test_rate_limiter_backend_production_without_redis(self):
        """Should raise for production without Redis."""
        with pytest.raises(ValueError):
            validate_rate_limiter_backend(None, "production")

    def test_rate_limiter_backend_staging_with_redis(self):
        """Should return 'redis' for staging with Redis."""
        backend = validate_rate_limiter_backend("redis://localhost:6379", "staging")
        assert backend == "redis"

    def test_rate_limiter_backend_staging_without_redis(self):
        """Should raise for staging without Redis."""
        with pytest.raises(ValueError):
            validate_rate_limiter_backend(None, "staging")

    def test_rate_limiter_backend_development_with_redis(self):
        """Should return 'redis' for development with Redis."""
        backend = validate_rate_limiter_backend("redis://localhost:6379", "development")
        assert backend == "redis"

    def test_rate_limiter_backend_development_without_redis(self, capsys):
        """Should return 'memory' and warn for development without Redis."""
        backend = validate_rate_limiter_backend(None, "development")
        assert backend == "memory"
        captured = capsys.readouterr()
        assert "WARNING" in captured.out or "WARNING" in captured.err or "warning" in captured.out.lower()


class TestConfigValidateRuntimeRequirements:
    """Test config validator for Redis requirements."""

    def test_production_without_redis_fails(self):
        """Config should warn in production without Redis instead of failing."""
        with pytest.warns(UserWarning, match="no tiene REDIS_URL para rate limiting distribuido"):
            settings = Settings(
                ENVIRONMENT="production",
                DATABASE_URL="postgresql://user:pass@localhost/db",
                SECRET_KEY="test-secret-key-32-characters-long-ok",
                PAYMENT_RETURN_URL="https://example.com/return",
                REDIS_URL=None,  # Missing!
                TBK_ENVIRONMENT="production",
                TBK_COMMERCE_CODE="123456",
                TBK_API_KEY="test-api-key",
            )
            settings.validate_runtime_requirements()

    def test_production_with_redis_passes(self):
        """Config should pass validation in production with Redis."""
        settings = Settings(
            ENVIRONMENT="production",
            DATABASE_URL="postgresql://user:pass@localhost/db",
            SECRET_KEY="test-secret-key-32-characters-long-ok",
            PAYMENT_RETURN_URL="https://example.com/return",
            REDIS_URL="redis://localhost:6379",
            TBK_ENVIRONMENT="production",
            TBK_COMMERCE_CODE="123456",
            TBK_API_KEY="test-api-key",
        )
        # Should not raise
        settings.validate_runtime_requirements()

    def test_staging_without_redis_fails(self):
        """Config should warn in staging without Redis instead of failing."""
        with pytest.warns(UserWarning, match="no tiene REDIS_URL para rate limiting distribuido"):
            settings = Settings(
                ENVIRONMENT="staging",
                DATABASE_URL="postgresql://user:pass@localhost/db",
                SECRET_KEY="test-secret-key-32-characters-long-ok",
                PAYMENT_RETURN_URL="https://example.com/return",
                REDIS_URL=None,  # Missing!
            )
            settings.validate_runtime_requirements()

    def test_staging_with_redis_passes(self):
        """Config should pass validation in staging with Redis."""
        settings = Settings(
            ENVIRONMENT="staging",
            DATABASE_URL="postgresql://user:pass@localhost/db",
            SECRET_KEY="test-secret-key-32-characters-long-ok",
            PAYMENT_RETURN_URL="https://example.com/return",
            REDIS_URL="redis://localhost:6379",
        )
        # Should not raise
        settings.validate_runtime_requirements()

    def test_development_without_redis_passes(self):
        """Config should allow missing Redis in development."""
        settings = Settings(
            ENVIRONMENT="development",
            DATABASE_URL="postgresql://user:pass@localhost/db",
            SECRET_KEY="test-secret-key-32-characters-long-ok",
            PAYMENT_RETURN_URL="https://example.com/return",
            REDIS_URL=None,
        )
        # Should not raise
        settings.validate_runtime_requirements()
