from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User
from app.core.auth import get_current_user
from app.services.chatbot_service import run_pedagogical_loop
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/ai", tags=["ai"])

class ChatIn(BaseModel):
    message: str
    attempt_id: Optional[int] = None
    question_context: Optional[dict] = None

class ChatOut(BaseModel):
    response: str

from fastapi.responses import StreamingResponse
from app.services.chatbot_service import run_pedagogical_loop, run_pedagogical_loop_stream

@router.post("/chat")
async def chat_with_tutor(
    payload: ChatIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Endpoint principal del Profesor IA Conversacional.
    Soporta streaming via SSE.
    """
    generator = run_pedagogical_loop_stream(
        db=db,
        user=user,
        user_message=payload.message,
        attempt_id=payload.attempt_id,
        question_context=payload.question_context,
    )
    return StreamingResponse(generator, media_type="text/event-stream")
