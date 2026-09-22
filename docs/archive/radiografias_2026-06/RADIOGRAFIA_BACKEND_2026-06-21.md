# Radiografía del Backend — TutorPAES
**Fecha de análisis:** 2026-06-21  
**Autor del análisis:** Ingeniero Backend Senior (GitHub Copilot)  
**Estado del sistema:** Post-MVP · Listo para separación de monorepo

---

## 1. Árbol de Directorios

```
tutorpaes/backend/
├── alembic.ini                         # Config de Alembic
├── docker-compose.yml                  # Stack local (Postgres + Redis + API)
├── Dockerfile                          # Imagen de producción
├── pytest.ini                          # Config de tests
├── railway.json                        # Config de despliegue Railway
├── requirements.txt                    # Dependencias Python
├── SCHEMA_UPDATE_SUMMARY.md            # Historial de cambios de esquema
│
├── app/
│   ├── main.py                         # ★ Punto de entrada FastAPI
│   │
│   ├── api/v1/endpoints/
│   │   ├── admin.py                    # Rutas de administración
│   │   ├── ai.py                       # Explicaciones y feedback IA
│   │   ├── ai_chat.py                  # Chat conversacional IA
│   │   ├── auth.py                     # Autenticación y sesión
│   │   ├── catalog.py                  # Catálogo de materias/temas
│   │   ├── health.py                   # Health check
│   │   ├── payments.py                 # Pagos Transbank
│   │   ├── questions.py                # CRUD de preguntas
│   │   ├── quiz.py                     # Motor de ensayos
│   │   ├── users.py                    # Perfil y estadísticas
│   │   └── voice.py                    # STT y TTS
│   │
│   ├── core/
│   │   ├── auth.py                     # JWT, tokens revocados
│   │   ├── config.py                   # Settings desde .env (Pydantic)
│   │   ├── exceptions.py               # Excepciones de dominio
│   │   ├── key_management.py           # Rotación de API keys
│   │   ├── logging_config.py           # Structured logging
│   │   ├── rate_limiter.py             # SlowAPI rate limiting
│   │   ├── request_context.py          # Correlation ID por request
│   │   └── validators.py               # Validadores reutilizables
│   │
│   ├── db/
│   │   ├── base.py                     # DeclarativeBase SQLAlchemy
│   │   ├── models.py                   # ★ Modelos activos (16 entidades)
│   │   ├── models_backup_20260226.py   # ⚠️ MUERTO — ver Hallazgo #1
│   │   ├── models_v2_production.py     # ⚠️ MUERTO — ver Hallazgo #1
│   │   └── session.py                  # Engine + SessionLocal
│   │
│   ├── schemas/
│   │   ├── errors.py
│   │   ├── questions.py
│   │   ├── quiz.py
│   │   └── quiz_completion.py
│   │
│   └── services/
│       ├── ai_service.py               # ★ Personalización y feedback IA
│       ├── chatbot_service.py          # ★ Loop pedagógico socrático
│       ├── email.py                    # Envío SMTP
│       ├── invoice_service.py          # Generación de facturas
│       ├── llm_provider_service.py     # ★ Abstracción multi-LLM
│       ├── openai_service.py           # ★ Llamadas directas a OpenAI
│       └── transbank_service.py        # Pagos Transbank
│
├── migrations/
│   ├── env.py
│   └── versions/                       # 12 migraciones Alembic
│       ├── 7140ca6c3d65_init_schema.py
│       ├── f37af5091e6a_production_schema.py
│       └── ... (10 más)
│
├── scripts/
│   ├── predeploy.sh                    # Hook pre-deploy
│   ├── rotate_api_keys.py              # Rotación manual de claves
│   ├── seed_paes.py / seed_paes_data.py
│   ├── seed_questions.py
│   └── seed_user.py
│
├── static/imagenes/                    # Imágenes de preguntas PAES (PNG)
│   └── 1829_ex_catedra_n_6_matematica_2016/
│       └── p005_q006.png ... (22+ imágenes)
│
└── tests/
    ├── test_auth/
    ├── test_catalog/
    ├── test_health/
    ├── test_payments/
    ├── test_quiz/
    ├── test_security/
    └── test_voice/
```

---

## 2. Inventario de Endpoints (API v1)

Todos los endpoints tienen el prefijo base `/api/v1`.

### `POST /auth/register`
Registra un nuevo usuario. Devuelve JWT.

### `POST /auth/login`
Autenticación por email/contraseña. Devuelve JWT.

### `POST /auth/refresh`
Renueva el access token usando refresh token.

### `POST /auth/logout`
Revoca el token activo en la blacklist.

### `GET /auth/me` · `PUT /auth/me`
Perfil propio del usuario autenticado (lectura y edición).

### `POST /auth/change-password` · `POST /auth/forgot-password` · `POST /auth/reset-password`
Flujo completo de gestión de contraseña.

---

### `GET /quiz/next-question`
Devuelve la siguiente pregunta adaptada al nivel y tema del usuario.

### `POST /quiz/answer`
Registra una respuesta. Dispara generación de feedback IA.

### `POST /quiz/exam-attempts`
Crea un intento de ensayo completo.

### `POST /quiz/exam-attempts/submit`
Cierra y evalúa un ensayo.

### `GET /quiz/attempts/{attempt_id}/results`
Devuelve los resultados con métricas de un intento.

---

### `POST /ai/explain`
Genera explicación síncrona de una pregunta vía LLM.

### `POST /ai/explain/stream`
Misma explicación pero en streaming (SSE).

### `GET /ai/health`
Verifica conectividad con el proveedor LLM activo.

### `GET /ai/feedback/{feedback_id}`
Recupera feedback ya generado de la BD.

### `POST /ai/chat`
Chat conversacional con el tutor IA (socrático, con historial).

---

### `POST /voice/transcribe`
STT: recibe audio y devuelve texto transcrito (OpenAI Whisper).

### `POST /voice/tts`
TTS: recibe texto y devuelve audio sintetizado.

---

### `POST /payments/create`
Inicia una transacción Transbank Webpay.

### `GET /payments/confirm`
Callback de confirmación de pago (Transbank redirect).

### `GET /payments/history`
Historial de pagos y facturas del usuario.

### `GET /payments/invoices/{invoice_id}` · `/download`
Consulta y descarga de facturas.

---

### `GET /users/ranking`
Ranking global de usuarios por puntaje.

### `GET /users/{user_id}/stats`
Estadísticas de rendimiento del usuario.

### `GET /users/{user_id}/exam-attempts`
Lista de ensayos completados por el usuario.

---

### `GET /catalog/...`
Catálogo de exámenes, materias y temas disponibles.

### `GET /questions/...`
CRUD de preguntas (solo admin).

### `/admin/...`
Rutas de administración (gestión de usuarios, contenido).

### `GET /health`
Health check del sistema.

---

## 3. Dependencias Críticas

| Librería | Versión mínima | Rol |
|---|---|---|
| `fastapi` | ≥ 0.115.0 | Framework HTTP principal |
| `sqlalchemy` | ≥ 2.0.0 | ORM — modelos y queries |
| `alembic` | ≥ 1.13.0 | Migraciones de base de datos |
| `pydantic` + `pydantic-settings` | ≥ 2.0.0 | Validación de datos y configuración desde `.env` |
| `openai` | ≥ 1.0.0 | SDK de OpenAI (chat, whisper, TTS) |
| `python-jose` + `passlib[bcrypt]` | — | JWT y hashing de contraseñas |
| `transbank-sdk` | ≥ 4.0.0 | Pagos con Webpay Plus |
| `slowapi` | ≥ 0.1.9 | Rate limiting por ruta |
| `sentry-sdk[fastapi]` | ≥ 2.14.0 | Observabilidad y alertas de errores |
| `groq` + `cerebras-cloud-sdk` | — | Proveedores LLM alternativos (fallback) |
| `aiosmtplib` | ≥ 3.0.0 | Envío de email asíncrono (reset de contraseña) |

> **Nota de separación:** El único acoplamiento de infraestructura externo directo es PostgreSQL (via `psycopg[binary]`). No hay dependencia hacia el frontend Next.js en ningún módulo Python.

---

## 4. Análisis de la Capa IA

La lógica IA está distribuida en 4 archivos de servicio con responsabilidades claras:

### `services/llm_provider_service.py` — Capa de abstracción multi-LLM ⭐

```
class LLMProvider (abstracta)
    └── call(messages, stream) -> str | Generator

class OpenAIProvider(LLMProvider)
    └── Usa openai.ChatCompletion. Soporta streaming SSE.

class GroqProvider(LLMProvider)
    └── Usa el SDK de Groq. Mismo contrato que OpenAI.

class CerebrasProvider(LLMProvider)
    └── Usa cerebras-cloud-sdk. Tercer proveedor de fallback.

def get_llm_provider() -> LLMProvider
    └── Lee ACTIVE_LLM_PROVIDER desde config y devuelve la instancia correcta.
        Hot-swappable: cambiar proveedor no requiere modificar código de negocio.

def stream_llm_response(system_prompt, user_message, ...) -> Generator
    └── Función de alto nivel que delega al proveedor activo y hace streaming SSE.
```

---

### `services/openai_service.py` — Llamadas directas a OpenAI

```
def _get_openai_client() -> OpenAI
    └── Lazy init del cliente OpenAI. Valida que la API key esté configurada.

def _build_personalized_prompt(user, question, attempt_history, ...) -> str
    └── Construye el system prompt personalizado con perfil académico del usuario
        (nivel, universidad objetivo, historial de errores).

def generate_llm_explanation(question, user, db, ...) -> dict
    └── Genera explicación síncrona de una pregunta (bloquea hasta obtener respuesta).
        Guarda resultado en caché (tabla QuestionExplanation).

def generate_llm_explanation_stream(question, user, db, ...) -> Generator
    └── Igual que la anterior pero devuelve un generador para SSE.
        El cliente recibe tokens en tiempo real.

def generate_llm_hint(question, user, attempt, ...) -> dict
    └── Genera una pista socrática (sin revelar la respuesta).
        Usa historial de intentos para personalizar el nivel de ayuda.

def check_openai_connection() -> dict
    └── Ping de salud al endpoint de OpenAI. Devuelve latencia y estado.
```

---

### `services/ai_service.py` — Personalización y feedback adaptativo ⭐

```
def _get_user_performance_by_topic(user, db, limit_days=30) -> Dict
    └── Calcula tasa de acierto del usuario por tema en los últimos N días.
        Fuente de datos para personalización del prompt.

def _get_user_weak_topics(user, db, threshold=0.6) -> List[str]
    └── Filtra los temas donde el usuario tiene acierto < 60%.
        Se inyectan en el prompt como "áreas de refuerzo".

def _get_user_overall_level(user, db) -> Tuple[str, float]
    └── Devuelve nivel global (básico/intermedio/avanzado) y score numérico.
        Calibra la complejidad del lenguaje del tutor.

def _get_common_wrong_options(user, question, db) -> List[str]
    └── Identifica qué opciones incorrectas elige más frecuentemente el usuario.
        Permite al LLM abordar específicamente esos distractores.

def _build_personalized_hint(user, question, attempt, db) -> str
    └── Orquesta las funciones anteriores y construye el string del hint personalizado.

def _build_core_explanation(question, correct_choice) -> str
    └── Construye explicación base (no personalizada) para cachear en BD.

def generate_feedback_phase1(feedback, db, user) -> dict
    └── Primera fase del feedback: explicación inmediata post-respuesta.
        Si el usuario es premium, llama a OpenAI; si no, usa template local.

def generate_feedback(feedback, db, user) -> dict
    └── Feedback completo: orquesta phase1 + análisis de patrón de errores.
        Punto de entrada principal desde el endpoint POST /quiz/answer.
```

---

### `services/chatbot_service.py` — Loop pedagógico socrático ⭐

```
def _fallback_tutor_reply(user_message) -> str
    └── Respuesta de fallback cuando el LLM no está disponible.
        Basada en reglas simples de palabras clave.

def _load_chat_history(db, user_id, attempt_id, limit=10) -> List[ChatMessage]
    └── Carga las últimas N interacciones del usuario en esta sesión de chat.
        Mantiene contexto conversacional sin sobrecargar el contexto del LLM.

def _extract_feedback_text(ai_payload, fallback_text) -> Optional[str]
    └── Extrae el texto de feedback de un payload IA para inyectarlo como contexto.

def _load_recent_topic_errors(user, db, ...) -> dict
    └── Carga los errores recientes del usuario por tema para contextualizar el chat.

def _format_attempt_context(context) -> Optional[str]
    └── Formatea el contexto de un intento (pregunta, respuesta) para el prompt.

def _build_conversation_messages(history, system_prompt, user_message) -> List
    └── Construye el array de mensajes en formato OpenAI con historial incluido.

def _load_attempt_context(db, attempt_id, user_id) -> Optional[Dict]
    └── Carga la pregunta y respuesta de un intento para dar contexto al chat.

async def run_pedagogical_loop(user_message, user, db, attempt_id) -> dict
    └── ★ Función principal asíncrona del chat.
        Orquesta: cargar historial → cargar contexto → construir prompt socrático
        → llamar LLM → guardar respuesta → devolver al cliente.

def run_pedagogical_loop_stream(user_message, user, db, attempt_id) -> Generator
    └── Igual que la anterior pero en streaming SSE para el endpoint POST /ai/chat.
```

---

## 5. Mapa de Entidades (Base de Datos)

16 modelos activos en `app/db/models.py`:

```
Exam ──────────┐
               ├── Subject ──── Topic ──── Question ──── QuestionChoice
               │                               │
               └── Attempt ────────────────────┘
                      │
                      ├── AttemptFeedback
                      └── (via user_id) ──── User
                                               │
                              ┌────────────────┼────────────────┐
                              │                │                │
                         ChatMessage    AIUsageLog    UserEntitlement
                              │
                         Payment ──── Invoice
                              │
                         UserProgress
                         StudySession
                         RevokedToken (blacklist JWT)
                         QuestionExplanation (caché LLM)
```

---

## 6. Hallazgos y Deuda Técnica

### ⚠️ Hallazgo #1 — Archivos de modelo muertos en `app/db/`

`models_backup_20260226_120421.py` y `models_v2_production.py` definen las mismas entidades que `models.py` pero **no están importados en ningún módulo**. Son archivos de respaldo que se quedaron en el código vivo.

**Riesgo:** Al separar el backend en su propio repo, estos archivos confunden a cualquier colaborador nuevo sobre cuál es el modelo canónico.

**Acción recomendada:** Moverlos a `docs/archive/` o eliminarlos, confirmando primero con `git log` que no tienen cambios recientes no aplicados.

---

### ⚠️ Hallazgo #2 — Schemas incompletos

La carpeta `app/schemas/` solo tiene 4 archivos pero el backend expone 11 routers. La mayoría de los schemas de request/response están definidos inline dentro de cada endpoint o importados directamente desde `models.py` vía SQLAlchemy. Esto complica:
- Versionado de la API
- Generación automática de OpenAPI spec
- Tests de contrato

**Acción recomendada antes de separar:** Consolidar todos los Pydantic schemas en `app/schemas/` organizados por dominio (`auth.py`, `quiz.py`, `payments.py`, `ai.py`, `users.py`).

---

### ⚠️ Hallazgo #3 — Dos archivos de seed duplicados

`scripts/seed_paes.py` y `scripts/seed_paes_data.py` hacen la misma función (sembrar datos PAES). Existe el riesgo de ejecutar el incorrecto y duplicar datos en la BD.

**Acción recomendada:** Consolidar en un solo script con `--dry-run` flag.

---

### ✅ Fortaleza #1 — Abstracción LLM excelente

El patrón `LLMProvider` con `get_llm_provider()` permite cambiar entre OpenAI, Groq y Cerebras cambiando una variable de entorno. Esto es exactamente lo necesario para controlar costos en producción sin tocar código.

---

### ✅ Fortaleza #2 — Seguridad bien implementada

- JWT con blacklist (tabla `RevokedToken`) + limpieza automática en startup
- Rate limiting por ruta (`slowapi`)
- Security headers en middleware global
- Correlation ID en cada request para trazabilidad
- Sentry integrado con FastAPI + SQLAlchemy

---

### ✅ Fortaleza #3 — Separación limpia para microservicio

El backend **no tiene imports hacia el frontend**. Todas sus dependencias son internas (`app/*`) o librerías de PyPI. La separación del monorepo es inmediata: copiar `tutorpaes/backend/` a un repo nuevo, ajustar `CORS_ORIGINS` en `.env`, y listo.

---

## 7. Checklist para Separación del Monorepo

- [ ] Copiar `tutorpaes/backend/` como raíz del nuevo repo
- [ ] Crear `.env` nuevo con variables de producción
- [ ] Mover `models_backup_*.py` y `models_v2_production.py` fuera del código activo
- [ ] Confirmar que `CORS_ORIGINS` apunta al dominio del frontend en producción
- [ ] Ejecutar `alembic upgrade head` en la BD objetivo
- [ ] Ejecutar seeds: `seed_paes.py`, `seed_questions.py`, `seed_user.py`
- [ ] Correr suite de tests: `pytest -q` (debe dar 49 passed)
- [ ] Verificar `GET /api/v1/health` y `GET /api/v1/ai/health`
- [ ] Configurar Railway / Docker con las variables del nuevo repo
