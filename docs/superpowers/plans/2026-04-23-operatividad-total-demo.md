# Operatividad Total Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** dejar operativa una demo completa con login estable, 500+ preguntas visibles, imágenes conectadas a las preguntas, y flujo de voz funcional desde frontend hasta backend.

**Architecture:** se cerrará el gap en cuatro capas: datos, contrato API, frontend de voz y verificación de entorno. La prioridad es corregir primero los bloqueos de seguridad y de contrato (`image_url` y credenciales), luego integrar el flujo de voz usando el sistema real de cookies/proxy del frontend, y por último dejar pruebas y smoke tests reproducibles.

**Tech Stack:** FastAPI, SQLAlchemy, Alembic, PostgreSQL, Next.js App Router, TypeScript, MediaRecorder, Groq Whisper, ElevenLabs, pytest.

---

## Estado validado al 2026-04-23

- DB accesible con `558` preguntas totales.
- `85` preguntas tienen `image_url` no nulo.
- El JSONL fuente actual tiene `508` líneas no vacías, por lo que el seed masivo puede cargar 500+ preguntas.
- El backend sí expone `/api/v1/voice/transcribe` y `/api/v1/voice/tts`.
- El frontend todavía no implementa voz real.
- El esquema de quiz no expone `image_url`, por lo que las imágenes no llegan al frontend aunque existan en DB.
- `tutorpaes/backend/app/api/v1/endpoints/voice.py` tiene una API key hardcodeada que debe eliminarse antes de cualquier demo.

## Archivos a tocar

- Modify: `tutorpaes/backend/app/api/v1/endpoints/voice.py`
- Modify: `tutorpaes/backend/app/core/config.py`
- Modify: `tutorpaes/backend/.env.example` o archivo de documentación equivalente si existe
- Modify: `tutorpaes/backend/app/schemas/quiz.py`
- Modify: `tutorpaes/backend/app/api/v1/endpoints/quiz.py`
- Modify: `tutorpaes/backend/app/api/v1/endpoints/questions.py`
- Modify: `tutorpaes/frontend/openapi.json`
- Modify: `tutorpaes/frontend/src/lib/api/types.ts`
- Create: `tutorpaes/frontend/src/components/chat/voice-recorder.tsx`
- Modify: el componente real del chat/tutor donde hoy se envían mensajes al agente
- Create: `tutorpaes/frontend/app/api/voice/transcribe/route.ts`
- Create: `tutorpaes/frontend/app/api/voice/tts/route.ts`
- Modify: `INSTRUCCIONES_FRONTEND_VOZ.md`
- Test: `tutorpaes/backend/tests/test_ai_chat_adapter.py`
- Create: `tutorpaes/backend/tests/test_voice_endpoints.py`
- Create: `tutorpaes/frontend` tests del componente/route handlers si la suite vigente lo soporta

### Task 1: Asegurar backend de voz

**Files:**
- Modify: `tutorpaes/backend/app/api/v1/endpoints/voice.py`
- Modify: `tutorpaes/backend/app/core/config.py`
- Test: `tutorpaes/backend/tests/test_voice_endpoints.py`

- [ ] **Step 1: Escribir test fallando para configuración segura de TTS/STT**

```python
def test_tts_requires_configured_api_key(client, monkeypatch):
    monkeypatch.delenv("ELEVENLABS_API_KEY", raising=False)
    response = client.post("/api/v1/voice/tts", json={"text": "hola"})
    assert response.status_code == 500
```

- [ ] **Step 2: Correr solo ese test**

Run: `pytest -q tests/test_voice_endpoints.py -k configured_api_key`
Expected: FAIL mientras siga existiendo default hardcodeado.

- [ ] **Step 3: Mover credenciales a settings sin valores por defecto sensibles**

```python
# app/core/config.py
GROQ_API_KEY: str | None = None
ELEVENLABS_API_KEY: str | None = None
ELEVENLABS_VOICE_ID: str = "Xb7hH8MSUJpSbSDYk0k2"
```

```python
# app/api/v1/endpoints/voice.py
if not settings.ELEVENLABS_API_KEY:
    raise HTTPException(status_code=500, detail="ELEVENLABS_API_KEY not configured")
```

- [ ] **Step 4: Agregar tests de happy path con mocks de httpx**

```python
def test_transcribe_returns_text(client, monkeypatch):
    ...

def test_tts_returns_audio_mpeg(client, monkeypatch):
    ...
```

- [ ] **Step 5: Ejecutar la suite enfocada**

Run: `pytest -q tests/test_voice_endpoints.py`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add tutorpaes/backend/app/core/config.py tutorpaes/backend/app/api/v1/endpoints/voice.py tutorpaes/backend/tests/test_voice_endpoints.py
git commit -m "fix: secure voice endpoint configuration"
```

### Task 2: Exponer image_url en el contrato de preguntas

**Files:**
- Modify: `tutorpaes/backend/app/schemas/quiz.py`
- Modify: `tutorpaes/backend/app/api/v1/endpoints/quiz.py`
- Modify: `tutorpaes/backend/app/api/v1/endpoints/questions.py`

- [ ] **Step 1: Escribir test fallando para `image_url` en respuesta de quiz**

```python
def test_next_question_includes_image_url(client, db_session, seeded_question_with_image):
    response = client.get("/api/v1/quiz/next-question?topic_code=ALG&subject_code=M1")
    assert response.status_code == 200
    assert response.json()["image_url"].endswith(".png")
```

- [ ] **Step 2: Ejecutar el test y verificar que falle por campo ausente**

Run: `pytest -q tests/test_quiz_image_contract.py -k image_url`
Expected: FAIL con ausencia de `image_url`.

- [ ] **Step 3: Agregar `image_url` al schema de salida**

```python
class QuestionOut(BaseModel):
    kind: Literal["question"] = "question"
    question_id: int
    prompt: str
    topic: str
    reading_text: Optional[str] = None
    image_url: Optional[str] = None
    choices: List[ChoiceOut]
```

- [ ] **Step 4: Poblar `image_url` en endpoint(s) que devuelven preguntas**

```python
return {
    "question_id": question.id,
    "prompt": question.prompt,
    "reading_text": question.reading_text,
    "image_url": question.image_url,
    ...
}
```

- [ ] **Step 5: Correr tests de quiz y preguntas recientes**

Run: `pytest -q tests/test_quiz* tests/test_catalog*`
Expected: PASS en contrato actualizado.

- [ ] **Step 6: Commit**

```bash
git add tutorpaes/backend/app/schemas/quiz.py tutorpaes/backend/app/api/v1/endpoints/quiz.py tutorpaes/backend/app/api/v1/endpoints/questions.py
git commit -m "feat: expose question image_url in quiz responses"
```

### Task 3: Integrar voz real en frontend usando cookies y proxy

**Files:**
- Create: `tutorpaes/frontend/app/api/voice/transcribe/route.ts`
- Create: `tutorpaes/frontend/app/api/voice/tts/route.ts`
- Create: `tutorpaes/frontend/src/components/chat/voice-recorder.tsx`
- Modify: componente real del chat/tutor en `tutorpaes/frontend/app/**` o `tutorpaes/frontend/src/**`

- [ ] **Step 1: Crear route handler proxy para transcribe usando cookies del request**

```ts
export async function POST(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const formData = await request.formData();
  return fetch(`${API_BASE_URL}/api/v1/voice/transcribe`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
}
```

- [ ] **Step 2: Crear route handler proxy para TTS**

```ts
export async function POST(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const body = await request.text();
  return fetch(`${API_BASE_URL}/api/v1/voice/tts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body,
  });
}
```

- [ ] **Step 3: Implementar componente `voice-recorder.tsx` con MediaRecorder**

```tsx
'use client';

export function VoiceRecorder({ onTranscription }: { onTranscription: (text: string) => void }) {
  // start / stop / upload blob to /api/voice/transcribe
}
```

- [ ] **Step 4: Integrar el componente en el chat existente**

```tsx
<VoiceRecorder onTranscription={(text) => {
  appendMessage({ role: 'user', content: text });
  sendMessage(text);
}} />
```

- [ ] **Step 5: Reproducir TTS después de cada respuesta del agente**

```tsx
const response = await fetch('/api/voice/tts', { method: 'POST', body: JSON.stringify({ text }) });
const blob = await response.blob();
new Audio(URL.createObjectURL(blob)).play();
```

- [ ] **Step 6: Verificar lint/typecheck del frontend**

Run: `npm run lint` y `npm run test` o el comando equivalente del frontend.
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add tutorpaes/frontend/app/api/voice tutorpaes/frontend/src/components/chat/voice-recorder.tsx tutorpaes/frontend/app tutorpaes/frontend/src
git commit -m "feat: add end-to-end voice flow in frontend"
```

### Task 4: Alinear documentación y contrato generado

**Files:**
- Modify: `INSTRUCCIONES_FRONTEND_VOZ.md`
- Modify: `tutorpaes/frontend/openapi.json`
- Modify: `tutorpaes/frontend/src/lib/api/types.ts`

- [ ] **Step 1: Reescribir el MD de voz para usar el flujo real de cookies/proxy**

```md
- No usar localStorage para tokens.
- Consumir /api/voice/transcribe y /api/voice/tts en el frontend.
- La autenticación viaja por cookie httpOnly y la inyecta el route handler.
```

- [ ] **Step 2: Regenerar OpenAPI desde backend**

Run: comando del proyecto para regenerar spec, por ejemplo `python scripts/export_openapi.py` o equivalente real.
Expected: el spec contiene `/api/v1/voice/transcribe` y `/api/v1/voice/tts`.

- [ ] **Step 3: Regenerar tipos del frontend**

Run: comando de generación de tipos usado por el proyecto.
Expected: tipos y clientes incluyen endpoints de voz y `image_url` cuando corresponda.

- [ ] **Step 4: Commit**

```bash
git add INSTRUCCIONES_FRONTEND_VOZ.md tutorpaes/frontend/openapi.json tutorpaes/frontend/src/lib/api/types.ts
git commit -m "docs: align voice integration with frontend auth flow"
```

### Task 5: Validar dataset e imágenes de demo

**Files:**
- Modify: `tutorpaes/backend/scripts/seed_paes_data.py`
- Create: `tutorpaes/backend/tests/test_seed_paes_data.py`

- [ ] **Step 1: Escribir test para `get_image_url()` y mapeo de rutas**

```python
def test_get_image_url_maps_jsonl_path_to_static_url():
    item = {
        "visual_asset": {
            "strategy": "image_extract_candidate",
            "payload": {"image_path": "salida_lista_hoy/imagenes/ensayo_1_l/p035_q058.png"},
        }
    }
    assert get_image_url(item).endswith('/static/imagenes/ensayo_1_l/p035_q058.png')
```

- [ ] **Step 2: Hacer configurable `JSONL_FILE` por entorno o argumento**

```python
JSONL_FILE = os.getenv("PAES_JSONL_FILE", "/ruta/default")
```

- [ ] **Step 3: Agregar validación previa del archivo y conteo esperado**

```python
if not Path(JSONL_FILE).exists():
    raise FileNotFoundError(f"JSONL no encontrado: {JSONL_FILE}")
```

- [ ] **Step 4: Ejecutar prueba del script y consulta post-seed**

Run: `pytest -q tests/test_seed_paes_data.py`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tutorpaes/backend/scripts/seed_paes_data.py tutorpaes/backend/tests/test_seed_paes_data.py
git commit -m "fix: make PAES data seed deterministic and testable"
```

### Task 6: Cierre operativo y smoke test de demo

**Files:**
- Modify: `E2E_AUDIT_COMPLETE.md`
- Modify: `PROGRESS_TRACKING.md`

- [ ] **Step 1: Levantar stack local completo**

Run: el script real del proyecto (`scripts/dev-up.sh` o secuencia equivalente corregida).
Expected: DB, backend y frontend en estado saludable.

- [ ] **Step 2: Verificar login demo**

Run: login vía frontend o `curl` contra `/api/v1/auth/login`.
Expected: 200 y cookies/tokens correctos.

- [ ] **Step 3: Verificar preguntas con imagen en quiz**

Run: navegar hasta una pregunta con `image_url` y confirmar render.
Expected: la imagen carga desde `/static/imagenes/...` sin 404.

- [ ] **Step 4: Verificar voz end-to-end**

Run: grabar una pregunta corta, transcribir, enviar al chat y escuchar TTS.
Expected: STT + respuesta del agente + audio reproducido.

- [ ] **Step 5: Actualizar docs de estado real**

```md
- Preguntas totales
- Preguntas con imagen
- Endpoints de voz verificados
- Tests ejecutados
- Riesgos residuales
```

- [ ] **Step 6: Commit**

```bash
git add E2E_AUDIT_COMPLETE.md PROGRESS_TRACKING.md
git commit -m "docs: record demo readiness verification"
```

## Riesgos que este plan elimina

- Secretos expuestos en código.
- Imágenes presentes en DB pero invisibles en frontend por contrato incompleto.
- MD de voz incompatible con auth real.
- Voz backend lista pero sin integración usable.
- Dataset masivo dependiente de ruta fija y difícil de repetir.

## Criterio de salida

Se considera “operativo” solo si se cumplen juntos estos puntos:

- login demo 200,
- catálogo y quiz funcionales,
- preguntas con `image_url` visibles,
- flujo de voz STT/TTS usable desde frontend,
- OpenAPI y tipos regenerados,
- tests backend y frontend relevantes en verde,
- sin credenciales hardcodeadas.
