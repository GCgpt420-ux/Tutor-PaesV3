import logging
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db.models import UserProgress

logger = logging.getLogger(__name__)

def update_user_progress(db: Session, user_id: int, topic_id: int, is_correct: bool) -> None:
    """
    Actualiza incrementalmente el progreso de un usuario para un tema específico.
    Es seguro ante concurrencia gracias al bloqueo transaccional.
    """
    try:
        # Intentar obtener el registro existente con bloqueo transaccional
        progress = db.scalar(
            select(UserProgress)
            .where(UserProgress.user_id == user_id, UserProgress.topic_id == topic_id)
            .with_for_update()
        )
        
        now = datetime.now(timezone.utc)
        if not progress:
            progress = UserProgress(
                user_id=user_id,
                topic_id=topic_id,
                total_answered=1,
                total_correct=1 if is_correct else 0,
                accuracy=100 if is_correct else 0,
                last_activity_at=now,
                streak=1,
                updated_at=now
            )
            db.add(progress)
            logger.info(f"Creado nuevo registro de UserProgress para user_id={user_id}, topic_id={topic_id}")
        else:
            progress.total_answered += 1
            if is_correct:
                progress.total_correct += 1
            
            # Recalcular precisión
            progress.accuracy = int((progress.total_correct / progress.total_answered) * 100)
            progress.last_activity_at = now
            progress.updated_at = now
            logger.info(f"Actualizado UserProgress para user_id={user_id}, topic_id={topic_id} | Total: {progress.total_answered}, Precisión: {progress.accuracy}%")
            
        db.flush()
    except Exception as exc:
        logger.error(f"Error al sincronizar UserProgress para user_id={user_id}, topic_id={topic_id}: {exc}")
        raise
