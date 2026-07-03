import logging
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.db.models import UserProgress

logger = logging.getLogger(__name__)


def update_user_progress(
    db: Session, user_id: int, topic_id: int, is_correct: bool
) -> None:
    """
    Actualiza incrementalmente el progreso de un usuario para un tema.
    Es seguro ante concurrencia y previene colisiones mediante savepoints.
    """
    try:
        # Obtener el registro existente con bloqueo transaccional
        progress = db.scalar(
            select(UserProgress)
            .where(
                UserProgress.user_id == user_id,
                UserProgress.topic_id == topic_id,
            )
            .with_for_update()
        )
        
        now = datetime.now(timezone.utc)
        if not progress:
            try:
                # Usar SAVEPOINT para proteger inserción contra colisiones
                with db.begin_nested():
                    progress = UserProgress(
                        user_id=user_id,
                        topic_id=topic_id,
                        total_answered=1,
                        total_correct=1 if is_correct else 0,
                        accuracy=100 if is_correct else 0,
                        last_activity_at=now,
                        streak=1,
                        updated_at=now,
                    )
                    db.add(progress)
                logger.info(
                    f"Creado progreso user_id={user_id}, topic_id={topic_id}"
                )
            except IntegrityError:
                # Si otro request insertó en paralelo, lo recuperamos
                progress = db.scalar(
                    select(UserProgress)
                    .where(
                        UserProgress.user_id == user_id,
                        UserProgress.topic_id == topic_id,
                    )
                    .with_for_update()
                )
                if progress:
                    progress.total_answered += 1
                    if is_correct:
                        progress.total_correct += 1
                    progress.accuracy = int(
                        (progress.total_correct / progress.total_answered)
                        * 100
                    )
                    progress.last_activity_at = now
                    progress.updated_at = now
                    logger.info(
                        f"Progreso colisionado recuperado y actualizado "
                        f"para user_id={user_id}, topic_id={topic_id}"
                    )
        else:
            progress.total_answered += 1
            if is_correct:
                progress.total_correct += 1
            
            # Recalcular precisión
            progress.accuracy = int(
                (progress.total_correct / progress.total_answered) * 100
            )
            progress.last_activity_at = now
            progress.updated_at = now
            logger.info(
                f"Actualizado progreso user_id={user_id}, "
                f"topic_id={topic_id} | Total: {progress.total_answered}, "
                f"Precisión: {progress.accuracy}%"
            )
            
        db.flush()
    except Exception:
        logger.exception(
            f"Error al sincronizar UserProgress para "
            f"user_id={user_id}, topic_id={topic_id}"
        )
        raise
