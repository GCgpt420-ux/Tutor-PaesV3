"""Test rate limiter initialization behavior in different environments."""
import os
import sys
from unittest.mock import patch

import pytest
from slowapi.util import get_remote_address


def test_rate_limiter_with_redis():
    """Rate limiter should initialize successfully with Redis configured."""
    os.environ["REDIS_URL"] = "redis://localhost:6379"
    os.environ["ENVIRONMENT"] = "production"
    os.environ["DATABASE_URL"] = "postgresql://user:pass@localhost/db"
    os.environ["SECRET_KEY"] = "test-secret-key"
    os.environ["PAYMENT_RETURN_URL"] = "https://example.com"
    
    # Force reimport
    if "app.core.rate_limiter" in sys.modules:
        del sys.modules["app.core.rate_limiter"]
    if "app.core.config" in sys.modules:
        del sys.modules["app.core.config"]
    
    with patch("slowapi.Limiter") as limiter_factory:
        limiter_factory.return_value = object()
        from app.core.rate_limiter import limiter

    limiter_factory.assert_called_once()
    limiter_kwargs = limiter_factory.call_args.kwargs
    assert limiter_kwargs["key_func"] is get_remote_address
    assert limiter_kwargs["headers_enabled"] is True
    assert limiter_kwargs["storage_uri"] == "redis://localhost:6379"

    assert limiter is not None


def test_rate_limiter_dev_without_redis():
    """Rate limiter should fall back to memory in development without Redis."""
    os.environ["ENVIRONMENT"] = "development"
    os.environ["REDIS_URL"] = ""
    os.environ["DATABASE_URL"] = "postgresql://user:pass@localhost/db"
    os.environ["SECRET_KEY"] = "test-secret-key"
    os.environ["PAYMENT_RETURN_URL"] = "https://example.com"
    
    # Force reimport
    if "app.core.rate_limiter" in sys.modules:
        del sys.modules["app.core.rate_limiter"]
    if "app.core.config" in sys.modules:
        del sys.modules["app.core.config"]
    
    from app.core.rate_limiter import limiter

    assert limiter is not None


def test_rate_limiter_production_warns_without_redis():
    """Rate limiter should warn when production Redis is not configured."""
    os.environ["ENVIRONMENT"] = "production"
    os.environ["REDIS_URL"] = ""
    os.environ["DATABASE_URL"] = "postgresql://user:pass@localhost/db"
    os.environ["SECRET_KEY"] = "test-secret-key"
    os.environ["PAYMENT_RETURN_URL"] = "https://example.com"
    
    # Force reimport
    if "app.core.rate_limiter" in sys.modules:
        del sys.modules["app.core.rate_limiter"]
    if "app.core.config" in sys.modules:
        del sys.modules["app.core.config"]
    
    with pytest.warns(RuntimeWarning, match="REDIS_URL"):
        from app.core.rate_limiter import limiter

    assert limiter is not None
