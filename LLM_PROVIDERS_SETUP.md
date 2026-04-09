# LLM Providers Setup - TutorPAES

## Overview

TutorPAES ahora soporta **múltiples proveedores de LLM** para mayor flexibilidad en desarrollo y producción:

- **OpenAI** (API oficial, cuotas pagas)
- **Groq** (Inference muy rápida, cuota gratuita con límites)
- **Cerebras** (Llama 3.1, cuota gratuita con límites)

## Configuración Actual (Desarrollo)

### Variables de Entorno

```bash
# En tutorpaes/backend/.env

# Proveedor activo
LLM_PROVIDER=groq

# Configuración general LLM
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=500
LLM_TIMEOUT_SECONDS=25
LLM_MAX_RETRIES=1
AI_ENABLE_LLM=True

# OpenAI (backup)
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini

# Groq (ACTIVO - Desarrollo)
GROQ_API_KEY=your_groq_key_here
GROQ_MODEL=mixtral-8x7b-32768

# Cerebras (backup)
CEREBRAS_API_KEY=your_cerebras_key_here
CEREBRAS_MODEL=llama-3.1-70b
```

## Cambiar de Proveedor

### Opción 1: Usar Groq (Recomendado para desarrollo)

```env
LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_key_here
GROQ_MODEL=mixtral-8x7b-32768
```

**Ventajas:**
- ✅ Gratis con cuotas razonables
- ✅ Modelos open-source (Mixtral)
- ✅ Inferencia ultra-rápida
- ✅ Perfecto para desarrollo/testing

**Limitaciones:**
- ~100 tokens/min (gratuito)
- Sin historial de conversación persistente

---

### Opción 2: Usar Cerebras (Alternativa)

```env
LLM_PROVIDER=cerebras
CEREBRAS_API_KEY=your_cerebras_key_here
CEREBRAS_MODEL=llama-3.1-70b
```

**Ventajas:**
- ✅ Llama 3.1 (modelo top-tier open-source)
- ✅ Cuota gratuita con límites
- ✅ Buena calidad de respuestas

**Limitaciones:**
- Cuota limitada (varía)

---

### Opción 3: Usar OpenAI (Producción)

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-proj-...  # Tu key con suscripción activa
OPENAI_MODEL=gpt-4o-mini
```

**Ventajas:**
- ✅ Mejor calidad de respuestas
- ✅ Modelos más potentes (GPT-4o)
- ✅ Soporte de imagen/audio

**Limitaciones:**
- ❌ Costo por uso (requiere tarjeta de crédito válida)
- ❌ Quota agotada si no hay suscripción activa

**Estado actual:** OpenAI tiene suscripción agotada (429 insufficient_quota)

---

## Instalación de Dependencias

### Primero verificar que requirements.txt tiene:

```bash
# Alternative LLM Providers (for development/testing with free tiers)
groq>=0.4.0
cerebras-cloud-sdk>=0.1.0
```

### Instalar/actualizar:

```bash
cd tutorpaes/backend

# Opción 1: Usando dev-up.sh (recomendado)
../../../scripts/dev-up.sh

# Opción 2: Manual
pip install -r requirements.txt
```

---

## Testing de Providers

### Test directo en Python

```bash
cd tutorpaes/backend
python

>>> from app.services.llm_provider_service import stream_llm_response
>>> from app.core.config import settings

# Test Groq
>>> for chunk in stream_llm_response(
...     system_prompt="Eres un tutor de PAES",
...     user_message="¿Cómo se calcula una derivada?",
...     temperature=0.7,
...     max_tokens=100
... ):
...     print(chunk, end='', flush=True)

# Deberías ver respuesta en tiempo real (streaming)
```

### Test via API Backend

```bash
# Con backend corriendo en localhost:8000

curl -X POST http://localhost:8000/api/v1/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"message": "¿Cómo se resuelve una inecuación?", "attempt_id": 1}'
```

---

## Comprobación de Cuotas

### Groq
- Dashboard: https://console.groq.com
- Ver límites actuales y uso

### Cerebras
- Dashboard: https://cloud.cerebras.ai
- Ver límites actuales y uso

### OpenAI
- Dashboard: https://platform.openai.com/account/
- Check billing status
- Agregar payment method si quota está agotada

---

## Ejemplos de Uso en Código

### Usar LLM Provider Service

```python
from app.services.llm_provider_service import stream_llm_response

# Streaming (recomendado para chat)
for chunk in stream_llm_response(
    system_prompt="Eres un tutor PAES",
    user_message="Explícame derivadas",
    temperature=0.7,
    max_tokens=300
):
    print(chunk, end='')

# O recopilar todo
response = "".join(stream_llm_response(...))
```

### En Endpoints FastAPI

```python
from fastapi.responses import StreamingResponse
from app.services.chatbot_service import run_pedagogical_loop_stream

@router.post("/chat")
async def chat_endpoint(req: ChatRequest, db: Session = Depends(get_db)):
    return StreamingResponse(
        run_pedagogical_loop_stream(db, user, req.message, req.attempt_id),
        media_type="text/event-stream"
    )
```

---

## Variables de Configuración en config.py

Todas las configuraciones están en `tutorpaes/backend/app/core/config.py`:

```python
# Seleccionar proveedor
LLM_PROVIDER: str = "openai"  # openai | groq | cerebras

# Parámetros generales
LLM_TEMPERATURE: float = 0.7           # 0.0-1.0
LLM_MAX_TOKENS: int = 500              # Máximo de tokens por respuesta
LLM_TIMEOUT_SECONDS: int = 25          # Timeout para requests
LLM_MAX_RETRIES: int = 1               # Reintentos en error
AI_ENABLE_LLM: bool = True             # On/off global

# Configuración por proveedor
OPENAI_API_KEY: str = ""
OPENAI_MODEL: str = "gpt-3.5-turbo"

GROQ_API_KEY: str = ""
GROQ_MODEL: str = "mixtral-8x7b-32768"

CEREBRAS_API_KEY: str = ""
CEREBRAS_MODEL: str = "llama-3.1-70b"
```

---

## Troubleshooting

### Error: "groq library not installed"
```bash
pip install groq
```

### Error: "cerebras-cloud-sdk library not installed"
```bash
pip install cerebras-cloud-sdk
```

### Error: "Unknown LLM provider: [name]"
- Verifica que `LLM_PROVIDER` en `.env` sea uno de: openai, groq, cerebras
- Asegúrate de tener la API key correspondiente configurada

### Error: "API key not configured"
- Verifica que la variable de entorno tiene un valor válido
- Asegúrate de ejecutar `dev-up.sh` para que lea `.env`
- Reinicia el backend: `python -m uvicorn app.main:app --reload`

### Respuestas muy lentas o timeout
- Aumenta `LLM_TIMEOUT_SECONDS` en `.env`
- Verifica que el proveedor está disponible (status page)
- Intenta con otro proveedor como fallback

---

## Next Steps

### Producción
1. Decidir proveedor principal (OpenAI o alternativa)
2. Configurar `LLM_PROVIDER` en variables de entorno
3. Testear con carga real
4. Monitorear costos y performance

### Mejoras Futuras
- [ ] Fallback automático entre proveedores si uno falla
- [ ] Logging de costos/latencia por proveedor
- [ ] Admin panel para cambiar proveedor sin redeploy
- [ ] Rate limiting por usuario/proveedor
- [ ] Cache de respuestas comunes (embeddings)

---

**Última actualización:** 2026-04-05  
**Estado:** ✅ Groq activo para desarrollo (testing)
