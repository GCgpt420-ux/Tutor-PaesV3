import importlib
import os
import sys
from contextlib import contextmanager

TARGET_ENV_VARS = ["ENVIRONMENT", "REDIS_URL"]


@contextmanager
def patched_env(updates: dict):
    old = {k: os.environ.get(k) for k in TARGET_ENV_VARS}
    try:
        for k in TARGET_ENV_VARS:
            os.environ.pop(k, None)
        for k, v in updates.items():
            if v is None:
                os.environ.pop(k, None)
            else:
                os.environ[k] = v
        yield
    finally:
        for k in TARGET_ENV_VARS:
            os.environ.pop(k, None)
        for k, v in old.items():
            if v is not None:
                os.environ[k] = v


def fresh_import_rate_limiter():
    for mod in ["app.core.rate_limiter", "app.core.config"]:
        sys.modules.pop(mod, None)
    config = importlib.import_module("app.core.config")
    importlib.reload(config)
    rate_limiter = importlib.import_module("app.core.rate_limiter")
    importlib.reload(rate_limiter)
    return rate_limiter


def test_init_success_with_redis_url():
    with patched_env({"ENVIRONMENT": "production", "REDIS_URL": "redis://localhost:6379/0"}):
        rl = fresh_import_rate_limiter()
        limiter = rl.limiter
        assert limiter is not None
        storage = getattr(limiter, "_storage", None)
        assert storage is not None
        print("[PASS] initializes with REDIS_URL configured")


def test_fail_production_without_redis_url():
    with patched_env({"ENVIRONMENT": "production", "REDIS_URL": None}):
        try:
            fresh_import_rate_limiter()
        except ValueError as e:
            msg = str(e)
            assert "REDIS_URL" in msg
            print("[PASS] fails in production without REDIS_URL")
            return
        raise AssertionError("Expected ValueError for production without REDIS_URL")


def test_development_fallback_to_memory_without_redis():
    with patched_env({"ENVIRONMENT": "development", "REDIS_URL": None}):
        rl = fresh_import_rate_limiter()
        limiter = rl.limiter
        storage = getattr(limiter, "_storage", None)
        assert storage is not None
        assert "MemoryStorage" in storage.__class__.__name__
        assert getattr(limiter, "_headers_enabled", None) is False
        print("[PASS] development fallback to in-memory without REDIS_URL")


if __name__ == "__main__":
    test_init_success_with_redis_url()
    test_fail_production_without_redis_url()
    test_development_fallback_to_memory_without_redis()
    print("\nAll rate limiter initialization behavior checks passed.")
