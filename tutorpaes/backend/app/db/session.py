from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

settings.validate_runtime_requirements()

# Pool sizing: 20 base connections + 30 overflow = 50 max per worker.
# For multi-worker deployments, set DB_POOL_SIZE via env to avoid exhausting
# Postgres max_connections (default 100). Example: 2 workers * 20 = 40 base.
# SQLite (used in tests) does not support pool_size or max_overflow.
_is_sqlite = settings.DATABASE_URL.startswith("sqlite")
_pool_kwargs: dict = {}
if not _is_sqlite:
    _pool_kwargs = {
        "pool_size": int(settings.DB_POOL_SIZE),
        "max_overflow": int(settings.DB_POOL_MAX_OVERFLOW),
        "pool_timeout": 30,
        "pool_recycle": 1800,  # Recycle connections every 30min to avoid stale TCP
    }

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    **_pool_kwargs,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
