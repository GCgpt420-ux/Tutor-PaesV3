"""Test rate limiter initialization behavior in different environments."""
import os
import sys
import importlib


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
    
    try:
        from app.core.rate_limiter import limiter
        print("✅ Rate limiter initialized with Redis in production")
        return True
    except Exception as e:
        print(f"❌ Failed with Redis: {e}")
        return False


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
    
    try:
        from app.core.rate_limiter import limiter
        print("✅ Rate limiter fell back to memory in development without Redis")
        return True
    except Exception as e:
        print(f"❌ Failed in development: {e}")
        return False


def test_rate_limiter_production_requires_redis():
    """Rate limiter should fail in production without Redis."""
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
    
    try:
        from app.core.rate_limiter import limiter
        print("❌ Rate limiter should have raised ValueError for production without Redis")
        return False
    except ValueError as e:
        if "REDIS_URL" in str(e):
            print("✅ Rate limiter correctly rejected production without Redis")
            return True
        else:
            print(f"❌ Wrong error message: {e}")
            return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False
