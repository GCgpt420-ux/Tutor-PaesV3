import asyncio
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.models import User
from app.db.session import get_db
from app.services.chatbot_service import run_pedagogical_loop_stream

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["ai"])

class ChatIn(BaseModel):
    message: str
    attempt_id: Optional[int] = None
    question_context: Optional[dict] = None

@router.post("/chat")
async def chat_with_tutor(
    payload: ChatIn,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Endpoint principal del Profesor IA Conversacional.
    Soporta streaming via SSE y detecta desconexión del cliente sin bloquear el event loop.
    """
    clean_message = payload.message.strip()
    if not clean_message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El mensaje no puede estar vacio.",
        )

    generator = run_pedagogical_loop_stream(
        db=db,
        user=user,
        user_message=clean_message,
        attempt_id=payload.attempt_id,
        question_context=payload.question_context,
    )

    async def async_generator():
        loop = asyncio.get_running_loop()
        try:
            while True:
                # Ejecuta la obtención del siguiente chunk en un thread pool para no bloquear el event loop
                chunk = await loop.run_in_executor(None, lambda: next(generator, None))
                if chunk is None:
                    break
                if await request.is_disconnected():
                    logger.info(f"Cliente desconectado de chat stream (User ID: {user.id}). Abortando generación.")
                    break
                yield chunk
        except asyncio.CancelledError:
            logger.info(f"Stream cancelado por el loop de eventos (User ID: {user.id}).")
            raise

    return StreamingResponse(async_generator(), media_type="text/event-stream")
