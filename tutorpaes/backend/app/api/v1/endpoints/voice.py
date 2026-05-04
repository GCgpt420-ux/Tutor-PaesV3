import re
import httpx
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from fastapi.responses import Response
from app.core.auth import get_current_user
from app.core.config import settings
from app.db.models import User
from pydantic import BaseModel

from app.core.rate_limiter import limiter

router = APIRouter(prefix="/voice", tags=["voice"])

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
    if not settings.GROQ_API_KEY:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "voice_service_unavailable",
                "detail": "Transcripcion de voz no disponible en este entorno",
                "code": "VOICE_STT_UNAVAILABLE",
            },
        )

    audio_bytes = await file.read()

    files = {
        "file": (file.filename or "voice.ogg", audio_bytes, file.content_type or "audio/ogg")
    }
    data = {
        "model": "whisper-large-v3",
        "language": "es"
    }
    
    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}"
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
                status_code=502,
                detail={
                    "error": "voice_provider_error",
                    "detail": "No se pudo transcribir audio con el proveedor externo",
                    "code": "VOICE_STT_PROVIDER_ERROR",
                    "provider_status": response.status_code,
                },
            )
            
        result = response.json()
        return {"text": result.get("text", "")}


class TTSRequest(BaseModel):
    text: str

def clean_text_for_speech(text: str) -> str:
    """Removes markdown formatting like bold (**), italics (*), code blocks (`), etc."""
    # Quitar negritas y cursivas
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
    text = re.sub(r'\*(.*?)\*', r'\1', text)
    # Quitar comillas invertidas
    text = re.sub(r'`(.*?)`', r'\1', text)
    # Quitar hashtags de títulos
    text = re.sub(r'#+\s*(.*)', r'\1', text)
    # Limpiar espacios extra
    return text.strip()

async def text_to_speech_openai(text: str):
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "voice_service_unavailable",
                "detail": "OpenAI API Key no configurada",
                "code": "VOICE_TTS_UNAVAILABLE",
            },
        )

    url = "https://api.openai.com/v1/audio/speech"
    headers = {
        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": settings.OPENAI_TTS_MODEL,
        "input": text,
        "voice": settings.OPENAI_TTS_VOICE,
        "response_format": "mp3"
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, headers=headers, json=payload)
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail={
                    "error": "voice_provider_error",
                    "detail": "No se pudo sintetizar audio con OpenAI",
                    "code": "VOICE_TTS_PROVIDER_ERROR",
                    "provider_status": response.status_code,
                },
            )
            
        return Response(content=response.content, media_type="audio/mpeg")

async def text_to_speech_elevenlabs(text: str):
    if not settings.ELEVENLABS_API_KEY:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "voice_service_unavailable",
                "detail": "Sintesis de voz ElevenLabs no disponible en este entorno",
                "code": "VOICE_TTS_UNAVAILABLE",
            },
        )

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{settings.ELEVENLABS_VOICE_ID}"
    headers = {
        "xi-api-key": settings.ELEVENLABS_API_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "text": text,
        "model_id": settings.ELEVENLABS_MODEL_ID,
        "voice_settings": {
            "stability": settings.ELEVENLABS_STABILITY,
            "similarity_boost": settings.ELEVENLABS_SIMILARITY_BOOST,
            "style": settings.ELEVENLABS_STYLE,
            "speed": settings.ELEVENLABS_SPEED,
            "use_speaker_boost": settings.ELEVENLABS_USE_SPEAKER_BOOST,
        }
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, headers=headers, json=payload)
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail={
                    "error": "voice_provider_error",
                    "detail": "No se pudo sintetizar audio con ElevenLabs",
                    "code": "VOICE_TTS_PROVIDER_ERROR",
                    "provider_status": response.status_code,
                },
            )
            
        return Response(content=response.content, media_type="audio/mpeg")

@router.post("/tts")
@limiter.limit("10/minute")
async def text_to_speech(
    request: Request,
    payload: TTSRequest,
    user: User = Depends(get_current_user),
):
    """
    Converts text to speech using the configured provider (OpenAI or ElevenLabs).
    """
    cleaned_text = clean_text_for_speech(payload.text)
    
    if not cleaned_text:
        # Texto vacío después de limpiar
        return Response(content=b'', media_type="audio/mpeg")

    if getattr(settings, "TTS_PROVIDER", "elevenlabs").lower() == "openai":
        return await text_to_speech_openai(cleaned_text)
    else:
        return await text_to_speech_elevenlabs(cleaned_text)
