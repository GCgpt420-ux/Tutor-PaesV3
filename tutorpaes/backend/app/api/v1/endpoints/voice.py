import os
import httpx
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Request
from fastapi.responses import Response
from app.core.auth import get_current_user
from app.db.models import User

from app.core.rate_limiter import limiter

router = APIRouter(prefix="/voice", tags=["voice"])

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY", "")
ELEVENLABS_VOICE_ID = os.environ.get("ELEVENLABS_VOICE_ID", "Xb7hH8MSUJpSbSDYk0k2")

@router.post("/transcribe")
@limiter.limit("10/minute")
async def transcribe_audio(
    request: Request,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    """
    Transcribes audio using Groq's whisper-large-v3.
    """
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")

    audio_bytes = await file.read()

    files = {
        "file": (file.filename or "voice.ogg", audio_bytes, file.content_type or "audio/ogg")
    }
    data = {
        "model": "whisper-large-v3",
        "language": "es"
    }
    
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}"
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/audio/transcriptions",
            headers=headers,
            data=data,
            files=files
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code, 
                detail=f"Groq STT Error: {response.text}"
            )
            
        result = response.json()
        return {"text": result.get("text", "")}


from pydantic import BaseModel
class TTSRequest(BaseModel):
    text: str

@router.post("/tts")
@limiter.limit("10/minute")
async def text_to_speech(
    request: Request,
    payload: TTSRequest,
    user: User = Depends(get_current_user),
):
    """
    Converts text to speech using ElevenLabs API.
    """
    if not ELEVENLABS_API_KEY:
        raise HTTPException(status_code=500, detail="ELEVENLABS_API_KEY not configured")

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "text": payload.text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75
        }
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, headers=headers, json=payload)
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code, 
                detail=f"ElevenLabs TTS Error: {response.text}"
            )
            
        return Response(content=response.content, media_type="audio/mpeg")
