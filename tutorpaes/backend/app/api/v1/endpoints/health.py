from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import get_db

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/")
def health_check():
    """
    Health check endpoint
    
    GET /api/v1/health/
    Returns: {"status": "ok"}
    """
    return {"status": "ok"}


@router.get("/readiness")
def readiness_check(db: Session = Depends(get_db)):
    """Readiness probe: valida que la API y la base de datos estén operativas."""
    try:
        db.execute(text("SELECT 1"))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not ready",
        ) from exc

    return {"status": "ready"}
