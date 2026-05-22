# Referencia de Archivos del Proyecto TutorPAES

## Estado del documento
- Tipo: inventario técnico de archivos y carpetas.
- Audiencia: desarrollo y onboarding técnico.
- Última revisión: 2026-03-13.

## Alcance
Este documento describe la función y propósito de los archivos relevantes del proyecto TutorPAES v2.

## Política anti redundancia
1. Este archivo lista y describe componentes.
2. No detalla procedimientos operativos completos.
3. Las guías de ejecución y seguridad viven en documentos específicos:
  - [DOCS/PROCESOS_OPERATIVOS.md](DOCS/PROCESOS_OPERATIVOS.md)
  - [DOCS/BASES_SEGURIDAD.md](DOCS/BASES_SEGURIDAD.md)

---

## Estructura General del Proyecto

```
ia_bot_v2/
├── tutorpaes/
│   ├── backend/          # API FastAPI + lógica de negocio
│   ├── frontend/         # Aplicación Next.js (React)
│   └── whatsapp-bot/     # Bot de WhatsApp (futuro)
├── DOCS/                 # Documentación del proyecto
├── scripts/              # Scripts de desarrollo
└── README.md             # Documentación principal
```

---

## Backend (tutorpaes/backend/)

### Archivos Principales (Raíz)

#### `app/main.py` 
**Función:** Punto de entrada de la aplicación FastAPI.

**Qué hace:**
- Inicializa la aplicación FastAPI con configuración CORS
- Registra todos los routers (endpoints de las distintas capas)
- Gestiona el ciclo de vida de la aplicación (startup/shutdown)
- Opcionalmente crea tablas de BD en desarrollo (AUTO_CREATE_TABLES)

**Importancia:** Es el corazón de la API. Sin este archivo, el servidor no puede arrancar.

**Uso típico:**
```bash
uvicorn app.main:app --reload
```

**Dependencias:**
- FastAPI, CORS middleware
- Todos los routers: quiz, questions, users, auth, payments, ai, admin, catalog

---

#### `requirements.txt` 
**Función:** Lista de dependencias Python del proyecto.

**Contenido principal:**
- `fastapi==0.115.0` - Web framework
- `sqlalchemy==2.0.28` - ORM para base de datos
- `alembic==1.13.0` - Migraciones de BD
- `pydantic==2.7.1` - Validación de datos
- `python-jose==3.3.0` - JWT auth
- `passlib==1.7.4` - Hashing de contraseñas
- `python-multipart==0.0.6` - Manejo de formularios
- `openai==1.33.0` - Integración con OpenAI
- `psycopg==3.1.17` - Driver PostgreSQL
- `uvicorn==0.27.0` - Servidor ASGI

**Cómo actualizar dependencias:**
```bash
pip install -r requirements.txt
pip install --upgrade <package>
pip freeze > requirements.txt
```

---

#### `Dockerfile` 
**Función:** Configuración para containerización del backend.

**Qué hace:**
- Define imagen base (python:3.11-slim)
- Instala dependencias del proyecto
- Expone puerto 8000
- Configura comando de inicio (uvicorn)

**Uso:**
```bash
docker build -t tutorpaes-backend .
docker run -p 8000:8000 tutorpaes-backend
```

---

#### `docker-compose.yml` 
**Función:** Orquestación de servicios (backend + PostgreSQL + Redis).

**Servicios incluidos:**
- `web`: Backend FastAPI en puerto 8000
- `db`: PostgreSQL 16 en puerto 5432
- `redis`: Cache en puerto 6379

**Uso:**
```bash
docker-compose up -d      # Iniciar todo
docker-compose down       # Detener todo
docker-compose logs -f    # Ver logs
```

---

#### `alembic.ini` 
**Función:** Configuración de Alembic para migraciones de BD.

**Qué controla:**
- Conexión a PostgreSQL
- Directorio de migraciones (`migrations/`)
- Opciones de logging y ejecución

**No editar manualmente** (usar comandos `alembic` en su lugar).

---

###  Core (tutorpaes/backend/app/core)

#### `config.py` 
**Función:** Gestión de configuración y variables de entorno.

**Qué define:**
- `DATABASE_URL` - Conexión a PostgreSQL
- `OPENAI_API_KEY` - Token de OpenAI
- `SECRET_KEY` - Clave para JWT
- `ALGORITHM` - Algoritmo de JWT (HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES` - Duración de tokens (1440 = 24h)
- Otras configuraciones (CORS, logging, etc.)

**Uso:**
```python
from app.core.config import settings
print(settings.DATABASE_URL)
```

**Archivo `.env` esperado:**
```
DATABASE_URL=postgresql://user:pass@localhost/tutorpaes
OPENAI_API_KEY=sk-proj-xxxxx
SECRET_KEY=tu-clave-secreta-aqui
```

---

#### `auth.py` 
**Función:** Autenticación y manejo de tokens JWT.

**Funciones principales:**
- `create_access_token(data: dict)` - Genera token JWT
- `decode_token(token: str)` - Valida y decodifica token
- `get_current_user()` - Dependency para proteger endpoints
- `verify_password(plain, hashed)` - Valida contraseñas
- `get_password_hash(password)` - Hashea contraseñas con Bcrypt

**Ejemplo de uso:**
```python
@router.get("/protected")
async def protected_route(current_user: User = Depends(get_current_user)):
    return {"user": current_user.email}
```

**Flujo de autenticación:**
1. Usuario entra credenciales en login
2. Se valida contra BD y se hashea contraseña
3. Se genera token JWT con user_id
4. Token expira en 24 horas
5. En endpoints protegidos, se valida el token

---

#### `exceptions.py` 
**Función:** Excepciones personalizadas de la aplicación.

**Excepciones definidas:**
- `InvalidCredentialsException` - Usuario/contraseña inválidos
- `InvalidTokenException` - Token JWT inválido o expirado
- `InsufficientPermissionsException` - Usuario sin permisos para acción
- `QuestionNotFound` - Pregunta no existe
- `UserNotFound` - Usuario no existe
- `ResourceConflictException` - Conflicto de datos (ej: usuario duplicado)

**Uso:**
```python
raise QuestionNotFound("ID de pregunta inválido")
```

---

#### `logging_config.py` 
**Función:** Configuración de logging para la aplicación.

**Qué configura:**
- Nivel de logging (DEBUG, INFO, WARNING, ERROR)
- Formato de logs con timestamps
- Salida a consola y archivos
- Filtros por módulo

**Uso típico:**
```python
import logging
logger = logging.getLogger(__name__)
logger.info("Mensaje informativo")
logger.error("Error crítico")
```

---

###  Database (tutorpaes/backend/app/db)

#### `models.py` 
**Función:** Definición de modelos SQLAlchemy (esquema de BD).

**Modelos principales:**

**1. User**
- Campos: id, email, password_hash, full_name, is_admin, created_at
- Relaciones: attempts, chat_messages, payments, progress
- Propósito: Usuarios de la plataforma

**2. Exam (Examen)**
- Campos: id, name (PAES, Diagnóstico, etc.), description
- Relaciones: subjects, questions (a través de Subject)
- Propósito: Clasificar preguntas por tipo de examen

**3. Subject (Asignatura)**
- Campos: id, exam_id, name (Matemática, Lenguaje, etc.)
- Relaciones: topics, questions
- Propósito: Agrupar temas por asignatura

**4. Topic (Tema)**
- Campos: id, subject_id, name (Álgebra, Geometría, etc.)
- Relaciones: questions
- Propósito: Subtemas dentro de asignaturas

**5. Question (Pregunta)**
- Campos: id, topic_id, text, image_url, reading_text, explanation, difficulty (1-3)
- Relaciones: choices, attempts, feedback, explanations
- Propósito: Preguntas del PAES con soporte para LaTeX, imágenes, textos de lectura
- **Importante:** Soporta LaTeX inline ($...$) y display ($$...$$)

**6. QuestionChoice (Alternativas)**
- Campos: id, question_id, letter, text, is_correct
- 4-5 alternativas por pregunta (A, B, C, D, E)

**7. Attempt (Intento)**
- Campos: id, user_id, question_id, selected_choice_id, is_correct, time_spent_seconds, created_at
- Propósito: Registro de cada respuesta de usuario

**8. AttemptFeedback**
- Campos: id, attempt_id, content, ai_explanation, user_level
- Propósito: Feedback personalizado para cada respuesta

**9. QuestionExplanation (Cache)**
- Campos: id, question_id, difficulty_level, explanation, generated_at
- Propósito: Cache de explicaciones generadas por IA (evita regenerar)

**10. ChatMessage**
- Campos: id, user_id, message, response, context, created_at
- Propósito: Historial de chat con IA

**11. AIUsageLog**
- Campos: id, user_id, tokens_used, cost_usd, created_at
- Propósito: Auditoría de uso de API OpenAI

**12. Payment**
- Campos: id, user_id, transaction_id, amount_usd, currency, status, payment_date
- Propósito: Registro de pagos (Transbank)

**13. UserProgress**
- Campos: id, user_id, topic_id, total_questions, correct_answers, percentage_correct, last_attempted, updated_at
- Propósito: Seguimiento de progreso por tema

---

#### `session.py` 
**Función:** Gestión de sesiones de BD con SQLAlchemy.

**Qué define:**
- `engine`: Conexión a PostgreSQL
- `SessionLocal`: Factory para crear sesiones
- `get_db()`: Dependency para inyectar sesión en endpoints

**Uso:**
```python
@router.get("/users")
async def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return users
```

**Importante:** Las sesiones se cierran automáticamente al terminar la request.

---

#### `base.py` 
**Función:** Clase base para todos los modelos SQLAlchemy.

**Define:**
- Configuración común de modelos
- Importa todos los modelos para Alembic

---

###  Services (tutorpaes/backend/app/services)

#### `ai_service.py` 
**Función:** Lógica de IA para feedback personalizado y sugerencias.

**Funciones principales:**
- `_get_user_performance_by_topic()` - Calcula desempeño por tema
- `_get_user_weak_topics()` - Identifica temas débiles del usuario
- `_get_user_overall_level()` - Determina nivel general (principiante/intermedio/avanzado)
- `generate_feedback()` - Genera feedback personalizado tras respuesta

**Qué hace generate_feedback():**
1. Consulta BD para historial del usuario
2. Calcula estadísticas por tema
3. Detecta patrones de errores
4. Llama a OpenAI con prompt personalizado
5. Cachea explicación en BD para futuro uso
6. Retorna feedback adaptado al nivel del usuario

**Ejemplo de uso:**
```python
feedback = await generate_feedback(user_id=5, question_id=23, is_correct=False)
```

**Niveles de usuario:**
- `principiante`: < 40% correcto
- `intermedio`: 40-70% correcto
- `avanzado`: > 70% correcto

---

#### `openai_service.py` 
**Función:** Integración directa con API de OpenAI para generar explicaciones.

**Funciones principales:**
- `_get_openai_client()` - Inicializa cliente de OpenAI
- `_build_personalized_prompt()` - Construye prompt personalizado para usuario
- `generate_llm_explanation(question, user_level)` - Genera explicación con GPT
- `generate_llm_hint(question, user_level)` - Genera pista sin revelar respuesta
- `check_openai_connection()` - Verifica conexión a OpenAI (health check)

**Modelos disponibles:**
- `gpt-4` - Mejor calidad (más caro)
- `gpt-3.5-turbo` - Rápido y barato (default)

**Ejemplo de generación de explicación:**
```python
explanation = await generate_llm_explanation(
    question="¿Cuál es la raíz de $x^2 - 5x + 6 = 0$?",
    user_level="intermedio"
)
```

**Flujo de prompt personalizado:**
1. Incluye contexto del usuario (nivel, historial de errores)
2. Proporciona contexto de la pregunta
3. Especifica que debe ser educativo pero breve
4. Solicita formato específico (párrafos cortos, ejemplos)

---

#### `transbank_service.py` 
**Función:** Integración con Transbank para pagos online.

**Funciones principales:**
- `create_transaction()` - Inicia nueva transacción de pago
- `confirm_transaction()` - Verifica y confirma pago completo
- `refund_transaction()` - Procesa devoluciones

**Flujo de pago:**
1. Usuario inicia compra en frontend
2. Se crea transacción en Transbank
3. Usuario ingresa tarjeta en form seguro de Transbank
4. Se confirma pago y se actualiza BD
5. Usuario recibe acceso a contenido premium

**Credenciales:** Requiere `TRANSBANK_API_KEY` en `.env`

---

###  API (tutorpaes/backend/app/api)

#### `api/v1/endpoints/quiz.py` 
**Función:** Endpoints para quiz y gestión de intentos.

**Endpoints:**
- `POST /api/v1/quiz/start` - Inicia nuevo quiz
- `GET /api/v1/quiz/{quiz_id}/questions` - Obtiene preguntas del quiz
- `POST /api/v1/quiz/{quiz_id}/submit-answer` - Envía respuesta
- `GET /api/v1/quiz/{quiz_id}/results` - Resultados finales
- `GET /api/v1/user/attempts` - Historial de intentos del usuario

**Flujo típico:**
1. Usuario selecciona tema
2. Llamada a `/start` para crear nuevo test
3. Llamadas a `/submit-answer` para cada pregunta
4. Llamada a `/results` para ver calificación

**Validación:**
- Verifica que usuario existe
- Verifica que pregunta pertenece al quiz
- Calcula automáticamente si respuesta es correcta
- Genera feedback con IA

---

#### `api/v1/endpoints/questions.py` 
**Función:** Endpoints para gestión de preguntas (admin).

**Endpoints:**
- `POST /api/v1/questions` - Crear nueva pregunta  Requiere admin
- `GET /api/v1/questions/{question_id}` - Obtener pregunta
- `PUT /api/v1/questions/{question_id}` - Actualizar pregunta  Requiere admin
- `DELETE /api/v1/questions/{question_id}` - Eliminar pregunta  Requiere admin
- `GET /api/v1/questions/topic/{topic_id}` - Preguntas de un tema
- `GET /api/v1/questions/stats` - Estadísticas de preguntas

**Cómo crear pregunta con LaTeX:**
```bash
curl -X POST http://localhost:8000/api/v1/questions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topic_id": 5,
    "text": "Resuelve: $x^2 - 5x + 6 = 0$",
    "choices": [
      {"letter": "A", "text": "x = 2, x = 3", "is_correct": true},
      {"letter": "B", "text": "x = 1, x = 6", "is_correct": false},
      {"letter": "C", "text": "x = -2, x = -3", "is_correct": false}
    ],
    "explanation": "Factorizar: $(x-2)(x-3)=0$",
    "difficulty": 2
  }'
```

---

#### `api/v1/endpoints/users.py` 
**Función:** Endpoints para gestión de usuarios (auth, perfil).

**Endpoints:**
- `POST /api/v1/auth/register` - Registro de usuario
- `POST /api/v1/auth/login` - Login (retorna JWT token)
- `GET /api/v1/users/me` - Perfil del usuario actual
- `PUT /api/v1/users/me` - Actualizar perfil
- `GET /api/v1/users/{user_id}/progress` - Progreso de usuario
- `GET /api/v1/users/{user_id}/stats` - Estadísticas

**Validación de registro:**
- Email único
- Contraseña >= 8 caracteres
- Nombres válidos

---

#### `api/v1/endpoints/ai.py` 
**Función:** Endpoints específicos para IA (explicaciones, hints).

**Endpoints:**
- `POST /api/v1/ai/explain` - Genera explicación para pregunta
- `POST /api/v1/ai/hint` - Genera pista sin respuesta
- `GET /api/v1/ai/health` - Verifica conexión OpenAI

**Ejemplo:**
```bash
curl -X POST http://localhost:8000/api/v1/ai/explain \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question_id": 10, "user_level": "intermedio"}'
```

---

#### `api/v1/endpoints/payments.py` 
**Función:** Endpoints para gestión de pagos.

**Endpoints:**
- `POST /api/v1/payments/create` - Inicia transacción Transbank
- `POST /api/v1/payments/confirm` - Confirma pago
- `GET /api/v1/payments/history` - Historial de pagos

---

#### `api/v1/endpoints/catalog.py` 
**Función:** Endpoints públicos para listar temas disponibles.

**Endpoints:**
- `GET /api/v1/catalog/exams` - Lista exámenes (PAES, etc.)
- `GET /api/v1/catalog/subjects` - Lista asignaturas
- `GET /api/v1/catalog/topics/{subject_id}` - Temas de asignatura

---

#### `api/v1/endpoints/admin.py` 
**Función:** Endpoints administrativos.

**Endpoints:**
- `GET /api/v1/admin/users` - Listar usuarios
- `GET /api/v1/admin/stats` - Estadísticas globales
- `GET /api/v1/admin/logs` - Logs de sistema

**Restricción:** Solo accesible por usuarios con `is_admin=true`

---

###  Schemas (tutorpaes/backend/app/schemas)

#### `user.py`
**Función:** Schemas Pydantic para validación de usuarios.

**Schemas:**
- `UserCreate` - Datos de registro
- `UserLogin` - Credenciales de login
- `UserResponse` - Respuesta con datos públicos
- `UserStats` - Estadísticas del usuario

---

#### `quiz.py`
**Función:** Schemas para quiz y respuestas.

**Schemas:**
- `QuizCreate` - Crear nuevo quiz
- `QuestionResponse` - Pregunta con opciones
- `AnswerSubmit` - Respuesta del usuario
- `QuizResult` - Resultados finales

---

#### `question.py`
**Función:** Schemas para preguntas.

**Schemas:**
- `QuestionCreate` - Crear pregunta (admin)
- `QuestionUpdate` - Actualizar pregunta
- `QuestionResponse` - Pregunta completa con opciones
- `ChoiceResponse` - Alternativa (sin marcar correcta)

---

###  Migrations (alembic/versions)

**Función:** Histórico de cambios de BD.

**Cómo crear nueva migración:**
```bash
cd tutorpaes/backend
alembic revision --autogenerate -m "descripcion del cambio"
alembic upgrade head  # Aplicar migración
```

**Migraciones importantes:**
- `7140ca6c3d65_init_schema.py` - Schema inicial
- `1a2b3c4d5e6f_add_payment_model.py` - Modelo de pagos
- `70130b097505_add_reading_text_to_questions.py` - Campo reading_text

---

###  Scripts (tutorpaes/backend/scripts)

#### `seed_user.py`
**Función:** Crea usuario de prueba en la BD.

**Uso:**
```bash
python scripts/seed_user.py
# Crea usuario: test@example.com / password123
```

---

#### `seed_questions.py`
**Función:** Llena BD con preguntas de ejemplo.

**Usa:** `example_questions.json` con preguntas de Matemática

**Uso:**
```bash
python scripts/seed_questions.py
```

---

#### `seed_paes.py`
**Función:** Estructura inicial de exámenes, asignaturas y temas.

**Crea:**
- Examen "PAES"
- Asignaturas: Matemática, Lenguaje, Cs. Naturales, Cs. Sociales
- Temas por asignatura (Álgebra, Geometría, etc.)

**Uso:**
```bash
python scripts/seed_paes.py
```

---

#### `bulk_import_questions.py` 
**Función:** Importar masivamente preguntas desde JSON.

**Características:**
- Validación de estructura
- Detección de duplicados
- Modo dry-run (simular sin guardar)
- Reportes de estadísticas

**Uso:**
```bash
# Importar todas las preguntas
python scripts/bulk_import_questions.py preguntas.json

# Importar solo Matemática, tema Álgebra
python scripts/bulk_import_questions.py preguntas.json M ALG

# Simular sin guardar
python scripts/bulk_import_questions.py preguntas.json --dry-run
```

**Formato JSON esperado:**
```json
[
  {
    "subject_code": "M",
    "topic_code": "ALG",
    "question_text": "Resuelve: $x^2 - 5x + 6 = 0$",
    "reading_text": "[Opcional] Texto complementario",
    "image_url": "[Opcional] URL a imagen",
    "choices": [
      {"letter": "A", "text": "x = 2, x = 3", "is_correct": true},
      {"letter": "B", "text": "x = 1, x = 6", "is_correct": false},
      {"letter": "C", "text": "x = -2, x = -3", "is_correct": false}
    ],
    "explanation": "Factorizar: $(x-2)(x-3)=0$",
    "difficulty": 2
  }
]
```

---

#### `validate_latex.py` 
**Función:** Validar sintaxis de LaTeX en preguntas.

**Uso:**
```bash
# Validar preguntas de archivo JSON
python scripts/validate_latex.py --json preguntas.json

# Validar todos en BD
python scripts/validate_latex.py --db

# Validar tema específico
python scripts/validate_latex.py --db --topic-id 5
```

**Valida:**
- Paréntesis balanceados
- Llaves balanceadas
- Comandos válidos
- Fracciones bien formadas

---

#### `content_report.py` 
**Función:** Generar reporte de contenido e estadísticas.

**Uso:**
```bash
# Reporte estándar
python scripts/content_report.py

# Reporte detallado
python scripts/content_report.py --detailed
```

**Genera:**
- Preguntas por asignatura y tema
- Distribución de dificultades
- Temas vacíos o desbalanceados
- Recomendaciones de contenido

---

##  Frontend (tutorpaes/frontend/)

###  Archivos Principales

#### `package.json` 
**Función:** Dependencias y scripts de Node.js.

**Scripts principales:**
```bash
npm run dev          # Desarrollo local (puerto 3000)
npm run build        # Build optimizado
npm start            # Producción
npm test             # Tests
npm run lint         # ESLint
```

**Dependencias clave:**
- `next@16` - Framework React
- `react@19` - Librería UI
- `tailwindcss@4` - Estilos
- `typescript@5` - Type safety
- `react-hook-form` - Formularios
- `axios` - HTTP client
- `zustand` - Estado global

---

#### `next.config.ts` 
**Función:** Configuración de Next.js.

**Qué define:**
- Alias de rutas (`@/components`, etc.)
- Variables de entorno
- Optimización de imágenes
- Reescritura de API calls

---

#### `tailwind.config.ts` 
**Función:** Personalización de TailwindCSS.

**Qué configura:**
- Colores personalizados
- Fonts
- Breakpoints
- Plugins

---

#### `tsconfig.json` 
**Función:** Configuración de TypeScript.

**Compiler options:**
- `strictest`: Mode strict completo
- `paths`: Alias de rutas
- `lib`: Librerías incluidas

---

#### `.env.local` 
**Función:** Variables de entorno del frontend.

**Ejemplo:**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_OPENAI_API_KEY=sk-proj-xxxxx  # Si se usa OpenAI cliente
```

**Importante:** Prefijo `NEXT_PUBLIC_` hace variables accesibles en navegador

---

#### `openapi.json`
**Función:** Especificación OpenAPI de la API backend.

**Usada por:**
- Documentación automática
- Generadores de código cliente
- Herramientas comme StopLight

---

###  Estructura de Carpetas

#### `app/` - Rutas (Next.js App Router)

**`app/layout.tsx`** 
- Layout raíz
- Proveedores globales
- Metadatos

**`app/page.tsx`**
- Landing page
- Hero section, features, CTA

**`app/auth/`**
- Login page
- Registro page

**`app/protected/`** - Rutas protegidas por autenticación
- `dashboard/` - Panel principal
- `cursos/[subject_id]/` - Temas de asignatura
- `ensayos/` - Tests largos
- `progreso/` - Historial y estadísticas
- `quiz/[quiz_id]/` - Quiz interactivo

**`app/api/`** - Route handlers (backend en Next.js)
- `api/auth/login` - Login proxy
- `api/auth/logout` - Logout
- `api/ai/explain` - Proxy a OpenAI
- `api/payments/create` - Crear transacción
- `api/payments/confirm` - Confirmar pago

---

#### `src/components/` - Componentes React reutilizables

**`components/auth/`**
- LoginForm
- RegisterForm
- ProtectedRoute

**`components/common/`**
- Header
- Sidebar
- Footer

**`components/layout/`**
- MainLayout

**`components/quiz/`**
- QuestionCard
- ChoiceButton
- Timer
- ProgressBar

**`components/ui/`** - Componentes base (shadcn/ui)
- Button
- Card
- Dialog
- Form
- Input
- Select
- Toast

---

#### `src/features/` - Módulos de funcionalidad

**`features/auth/`**
- Auth context
- Auth hooks
- Session management

**`features/quiz/`**
- Quiz context
- Quiz logic
- QuestionCard component (versión feature)

**`features/dashboard/`**
- Dashboard layout
- TopicCard (temas)
- QuickAccess (accesos rápidos)
- TopicStats (estadísticas)

**`features/exams/`**
- ExamList
- ExamModal
- AiExplanation (mostrar explicaciones IA)
- CreateExamModal

---

#### `src/hooks/` - Custom React hooks

**`useAuth`** - Manejo de autenticación
```typescript
const { user, login, logout, isLoading } = useAuth();
```

**`useQuiz`** - Lógica de quiz
```typescript
const { questions, currentQuestion, submit, progress } = useQuiz(quizId);
```

**`useApi`** - Fetch genérico con manejo de errores
```typescript
const { data, loading, error } = useApi('/api/users/me');
```

---

#### `src/lib/` - Utilidades

**`api/client.ts`**  
- Cliente Axios configurado
- Interceptores para JWT
- Error handling global

**`utils.ts`**
- Funciones helper (formatear, validar, etc.)

---

#### `src/types/` - Tipos TypeScript

**`user.ts`** - User, UserProfile, UserStats
**`quiz.ts`** - Quiz, Question, Answer, QuizResult
**`auth.ts`** - LoginCredentials, AuthToken
**`api.ts`** - ApiResponse, ApiError

---

#### `styles/` - CSS global

**`globals.css`**
- Reset global
- Variables CSS
- Estilos base

---

###  Componentes Renderizando LaTeX

#### React con KaTeX 

**Instalación:**
```bash
npm install katex react-katex
```

**Uso en componentes:**
```typescript
import { InlineMath, BlockMath } from 'react-katex';

export function QuestionText({ text }) {
  return (
    <div>
      {/* LaTeX inline: $x^2 + 5x + 6 = 0$ */}
      <InlineMath math="x^2 + 5x + 6 = 0" />
      
      {/* LaTeX display */}
      <BlockMath math="x = \frac{-5 \pm \sqrt{25-24}}{2} = \frac{-5 \pm 1}{2}" />
    </div>
  );
}
```

**Frontend detección automática de LaTeX:**
```typescript
// Detectar y reemplazar LaTeX en texto
function renderMarkdown(text: string) {
  return text
    .replace(/\$\$([^\$]+)\$\$/g, '<BlockMath math="$1" />')
    .replace(/\$([^\$]+)\$/g, '<InlineMath math="$1" />');
}
```

---

##  Flujos Principales

### 1⃣ Flujo de Quiz

```
Frontend                      Backend                  Database
   |
   |--POST /quiz/start------->|
   |                          |--Crear sesión quiz--->|
   |<-----Quiz{questions}-----|                        |
   |
   |--POST /submit-answer---->|
   |                          |--Validar respuesta----->|
   |                          |--Generar feedback IA   |
   |<-----{feedback, score}----|                        |
   |
   |--GET /results----------->|
   |<-----{total, stats}------|
```

---

### 2⃣ Flujo de Importación Masiva

```
Admin (terminal)
   |
   |--python bulk_import.py
   |  (lee JSON)
   |
   |--Validar estructura
   |--Detectar duplicados (por texto)
   |--Crear preguntas en BD
   |--Generar reporte
```

---

### 3⃣ Flujo de Autenticación

```
Frontend           Backend            Database
   |
   |--POST /login----->|
   |  (email, pass)    |--Buscar usuario---->|
   |                   |<---User object------|
   |                   |--Validar contraseña
   |                   |--Generar JWT
   |<---{token}--------|
   |
   | Almacenar token en localStorage
   |
   |--GET /protected--->|
   |  (headers: {       |--Validar JWT
   |   Authorization})  |--Obtener user_id
   |                    |--Responder
   |<---{data}---------|
```

---

##  Archivos por Prioridad

###  CRÍTICOS (Funcionamiento básico)
1. `app/main.py` - Servidor web
2. `models.py` - Esquema BD
3. `session.py` - Conexión BD
4. `auth.py` - Autenticación
5. `config.py` - Configuración
6. `ai_service.py` - Lógica de feedback
7. `openai_service.py` - OpenAI integration
8. `quiz.py` (endpoints) - Lógica de quiz
9. `users.py` (endpoints) - Login/registro
10. `app/page.tsx` - Landing
11. `package.json` - Dependencias frontend

###  IMPORTANTES (Características clave)
1. Todos los endpoints (`questions.py`, `payments.py`, etc.)
2. Todos los schemas Pydantic
3. Scripts de seed
4. Componentes principales (QuizCard, Dashboard, etc.)
5. `bulk_import_questions.py` - Importar contenido
6. Páginas protegidas (quiz, dashboard)

###  ÚTILES (Nice-to-have)
1. Scripts de validación (validate_latex.py)
2. Scripts de reportes (content_report.py)
3. Componentes UI menores
4. Documentación

---

##  Comandos Comunes

### Backend

```bash
# Desarrollo
cd tutorpaes/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Migraciones
alembic revision --autogenerate -m "message"
alembic upgrade head
alembic downgrade -1

# Seeds
python scripts/seed_paes.py
python scripts/seed_questions.py
python scripts/seed_user.py

# Importación masiva
python scripts/bulk_import_questions.py preguntas.json

# Validación
python scripts/validate_latex.py --json preguntas.json
python scripts/content_report.py --detailed

# Docker
docker-compose up -d
docker-compose logs -f
docker-compose down
```

### Frontend

```bash
# Desarrollo
cd tutorpaes/frontend
npm install
npm run dev    # http://localhost:3000

# Build
npm run build
npm start

# Linting
npm run lint

# Tests
npm test
```

### Completo (dev-up.sh)

```bash
./scripts/dev-up.sh  # Inicia backend + frontend + BD
```

---

##  FAQ

**P: ¿Dónde almacenar imágenes?**
R: Usar Cloudinary (gratuito hasta 25GB). Campo `image_url` en Question model.

**P: ¿Cómo renderizar ecuaciones en frontend?**
R: Usar KaTeX (`react-katex`) para LaTeX almacenado en BD como texto.

**P: ¿Cómo proteger un endpoint?**
R: Agregar `current_user: User = Depends(get_current_user)` en la función.

**P: ¿Cómo generar explicación con IA?**
R: Llamar a `generate_llm_explanation()` en `openai_service.py`.

**P: ¿Cómo agregar nueva asignatura?**
R: Crear registro en Subject con exam_id. Usar admin endpoint o script.

**P: ¿Cuál es la contraseña del usuario test?**
R: Email: `test@example.com`, Password: `password123` (crear con `seed_user.py`)

**P: ¿Cómo resetear BD?**
R: `docker-compose down -v` (elimina volúmenes) + `alembic downgrade base` + `alembic upgrade head`

**P: ¿Dónde ver logs?**
R: `docker-compose logs -f web` para backend, navegador DevTools para frontend

**P: ¿Por qué mi token JWT expira?**
R: Configurado a 24 horas en `config.py` (`ACCESS_TOKEN_EXPIRE_MINUTES`). Implementar refresh tokens para producción.

---

##  Glosario

| Término | Explicación |
|---------|-------------|
| **PAES** | Prueba de Acceso a Educación Superior (examen chileno) |
| **JWT** | JSON Web Token - Token criptográfico para autenticación |
| **ORM** | Object-Relational Mapping - Mapeo de tablas a clases Python |
| **LaTeX** | Lenguaje para escribir ecuaciones matemáticas |
| **KaTeX** | Librería JS para renderizar LaTeX rápidamente |
| **Pydantic** | Librería para validación de datos con TypeScript |
| **Alembic** | Herramienta para migraciones de BD |
| **CORS** | Cross-Origin Resource Sharing - Permite requests desde otros dominios |
| **PostgreSQL** | Sistema gestor de BD relacional |
| **SQLAlchemy** | ORM Python más popular |
| **FastAPI** | Framework web Python moderno |
| **Next.js** | Framework React con SSR y rutas automáticas |
| **TailwindCSS** | Framework CSS utility-first |
| **TypeScript** | JavaScript con tipos estáticos |
| **React** | Librería para UI declarativa |
| **Axios** | Cliente HTTP simpler que fetch |
| **Docker** | Containerización de aplicaciones |
| **Transbank** | Pasarela de pagos chilena |
| **OpenAI** | API de GPT para IA generativa |

---

**Última actualización:** Marzo 5, 2026
**Versión:** 2.0 (Estructura TutorPAES reorganizada)
