#  PLAN DE FUSIÓN: MONICA + IA_BOT_V2
## Arquitectura Unificada TutorPAES

**Decisión:** Fusionar Monica (frontend) e ia_bot_v2 (backend) en sistema único, profesional y escalable.

---

##  VISTA GENERAL DE LA FUSIÓN

### Antes (Estado Actual)
```
Monica                          ia_bot_v2
(Next.js)                      (NextJS + Fastapi)
├── features/                 ├── backend/ (FastAPI)
├── Supabase (acoplado)      │   ├── JWT auth 
├── API Routes (débiles)     │   ├── SQLAlchemy 
└── Sin backend central      │   └── Servicios 
                             └── frontend/ (Next.js)
                                 └── Bien hecho 
                                 
PROBLEMA: Dos sistemas paralelos, sin comunicación.
```

### Después (Objetivo)
```
TutorPAES/
│
├── frontend/                ← Monica (Next.js)
│   ├── src/
│   │   ├── features/
│   │   ├── lib/api/client.ts ← Cliente HTTP (como ia_bot)
│   │   └── tests/
│   └── package.json
│
├── backend/                 ← ia_bot_v2 (FastAPI)
│   ├── app/
│   │   ├── api/v1/          ← APIs versioned
│   │   ├── core/
│   │   ├── db/
│   │   ├── services/
│   │   └── main.py
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
├── whatsapp-bot/           ← Cliente adicional
│   ├── main.py
│   └── requirements.txt
│
├── docker-compose.yml      ← Orquestación
└── README.md
```

**VENTAJA:** Cada componente tiene responsabilidad clara.

---

##  FASE 3: INTEGRACIÓN (3-4 semanas)

### Semana 1: Preparación y Análisis
**Tareas:**
- [ ] Crear repo unificado TutorPAES
- [ ] Copiar Monica → frontend/
- [ ] Copiar ia_bot_v2/backend → backend/
- [ ] Copiar ia_bot_v2/frontend → (eliminar, usar Monica)
- [ ] Copiar ia_bot_v2/scripts → backend/scripts/
- [ ] Documentar mapeo de APIs

**Salida:** Estructura monorepo con 3 carpetas claras

---

### Semana 2: Backend → API Contracts
**Tareas:**
- [ ] Revisar endpoints existentes en ia_bot_v2
- [ ] Documentar todos los endpoints en OpenAPI/Swagger
- [ ] Crear tipos TypeScript en frontend basados en backend
- [ ] Implementar cliente HTTP unificado (como ia_bot_v2)
- [ ] Tests de API backend

**Salida:** Backend con APIs documentadas y tipadas

---

### Semana 3: Frontend → Cliente HTTP
**Tareas:**
- [ ] Reemplazar Supabase SDK con cliente HTTP
- [ ] Eliminar `src/lib/supabase/`
- [ ] Crear `src/lib/api/client.ts` (basado en ia_bot_v2)
- [ ] Migrar autenticación a JWT (del backend)
- [ ] Tests del frontend integrados

**Salida:** Frontend comiendo APIs del backend

---

### Semana 4: Integración y Docker
**Tareas:**
- [ ] docker-compose.yml multiservicio
- [ ] Setup de variables de entorno unificadas
- [ ] Tests e2e (frontend + backend)
- [ ] Documentación de deployment
- [ ] Scripts para development

**Salida:** Sistema listo para AWS

---

##  CAMBIOS ESPECÍFICOS REQUERIDOS

### En Monica (Frontend)

#### 1. Eliminar Supabase
```typescript
//  ELIMINAR:
src/lib/supabase/
└── client.ts, server.ts, proxy.ts

//  REEMPLAZAR CON:
src/lib/api/
└── client.ts (como ia_bot_v2)
```

#### 2. Migrar Autenticación
**De:** `src/features/auth/components/login-form.tsx` (Supabase)
**A:** Cliente backend FastAPI

```typescript
// NUEVO: src/lib/api/auth.ts
export async function login(email: string): Promise<{ access_token: string }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return handleResponse(response);
}

// NUEVO: src/lib/auth/storage.ts (como ia_bot_v2)
export function setAccessToken(token: string) {
  localStorage.setItem('access_token', token);
}

export function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}
```

#### 3. Crear Cliente HTTP Unificado
```typescript
// NUEVO: src/lib/api/client.ts
import type { ErrorOut } from "@/types";
import { getAccessToken } from "@/lib/auth/storage";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL 
  || "http://localhost:8000";

export async function apiFetch(
  input: RequestInfo | URL, 
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers);
  
  const token = getAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  return fetch(input, {
    ...init,
    headers,
  });
}

// Barrels para cada módulo:
export * from "./api/auth";     // login, logout, getMe
export * from "./api/courses";  // getCourses, getTopics
export * from "./api/exams";    // getExams, submitExam
export * from "./api/ai";       // explainQuestion
export * from "./api/users";    // getUserProfile
```

#### 4. Actualizar Imports
**De:**
```typescript
import { getSupabaseClient } from '@/lib/supabase/client';
const supabase = getSupabaseClient();
const { data } = await supabase.from('courses').select('*');
```

**A:**
```typescript
import { getCourses } from '@/lib/api/courses';
const courses = await getCourses();
```

#### 5. Actualizar package.json
```json
{
  "dependencies": {
    //  REMOVER:
    "@supabase/auth-helpers-nextjs": "delete",
    "@supabase/ssr": "delete",
    "@supabase/supabase-js": "delete",
    
    //  AGREGAR:
    "openapi-fetch": "^0.10.0"  // Para cliente tipado
  }
}
```

---

### En ia_bot_v2 (Backend)

#### 1. Restructurarse como Backend Central
```python
# NUEVA ESTRUCTURA:
backend/
├── app/
│   ├── main.py                  ← Setup FastAPI
│   ├── api/                      ← REST endpoints
│   │   ├── v1/                   ← Version 1
│   │   │   ├── endpoints/
│   │   │   │   ├── auth.py       ← Autenticación
│   │   │   │   ├── courses.py    ← Cursos
│   │   │   │   ├── exams.py      ← Exámenes
│   │   │   │   ├── ai.py         ← IA
│   │   │   │   ├── users.py      ← Usuarios
│   │   │   │   └── questions.py  ← Preguntas
│   │   │   └── __init__.py
│   │   └── __init__.py
│   ├── core/                     ← Config central
│   │   ├── config.py             ← Variables de entorno
│   │   ├── auth.py               ← JWT
│   │   ├── security.py           ← Validación
│   │   └── exceptions.py         ← Error handling
│   ├── db/                       ← Base de datos
│   │   ├── models.py             ← ORM models
│   │   ├── session.py            ← Connection pool
│   │   └── base.py
│   ├── services/                 ← Lógica de negocio
│   │   ├── __init__.py
│   │   ├── auth_service.py       ← Auth logic
│   │   ├── ai_service.py         ← IA logic
│   │   ├── exam_service.py       ← Exam logic
│   │   └── user_service.py       ← User logic
│   ├── schemas/                  ← Validación
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── courses.py
│   │   └── exams.py
│   └── __init__.py
├── migrations/                   ← Alembic
├── tests/                        ← Tests
├── .env.example
├── requirements.txt
└── Dockerfile
```

#### 2. Documentar APIs
```python
# En app/main.py, agregar OpenAPI docs:
app = FastAPI(
    title="TutorPAES API",
    version="2.0.0",
    description="API central para plataforma educativa PAES",
    openapi_url="/api/openapi.json",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Resultado:
# - http://localhost:8000/api/docs → Swagger UI
# - http://localhost:8000/api/redoc → ReDoc
```

#### 3. Asegurar Endpoints
```python
# Todos los endpoints requieren autenticación:
@router.get("/api/v1/courses")
async def get_courses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener cursos del usuario autenticado"""
    return service.get_user_courses(current_user.id, db)

# Roles y permisos:
@router.post("/api/v1/admin/questions")
async def create_question(
    question: QuestionCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Solo admins pueden crear preguntas"""
    return service.create_question(question, db)
```

#### 4. CORS Configuración
```python
# En app/main.py:
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",     # Monica dev
        "http://localhost:3001",     # Alternativo
        "https://app.tutopaes.com",  # Producción
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### 5. Logging y Monitoreo
```python
# En app/core/logging_config.py:
import logging

logger = logging.getLogger(__name__)

# Log accesos a endpoints:
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"{request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"Response: {response.status_code}")
    return response
```

---

### Nuevo: WhatsApp Bot

#### Cliente del Backend
```python
# whatsapp-bot/main.py
from fastapi import FastAPI, Request
from backend_client import BackendClient

app = FastAPI()
client = BackendClient(api_url="http://backend:8000")

@app.post("/webhook/whatsapp")
async def whatsapp_webhook(request: Request):
    """Webhook de WhatsApp"""
    data = await request.json()
    
    # 1. Obtener mensaje
    user_phone = data['from']
    message_text = data['body']
    
    # 2. Llamar al backend
    response = await client.process_message(
        phone=user_phone,
        message=message_text
    )
    
    # 3. Enviar respuesta
    await send_whatsapp_message(user_phone, response)
    
    return {"status": "ok"}
```

**IMPORTANTE:** El bot NO tiene autenticación local.  
Todo pasa por el backend.

---

##  FLUJOS DESPUÉS DE LA FUSIÓN

### Flujo 1: Usuario en Web (Monica)
```
Usuario web
    ↓
[Monica Frontend]
    ↓ (GET /api/v1/auth/me)
[Backend FastAPI]
    ↓ (Verifica JWT)
[BD PostgreSQL]
    ↓
Respuesta JSON
    ↓
[Monica] renderiza
```

### Flujo 2: Usuario en WhatsApp
```
Usuario WhatsApp
    ↓
[WhatsApp Bot]
    ↓ (POST /api/v1/process-message)
[Backend FastAPI]
    ↓ (Autentica bot como usuario)
[BD PostgreSQL] + [OpenAI]
    ↓
JSON response
    ↓
[Bot] → Envía por WhatsApp
```

### Flujo 3: IA Explicación
```
Usuario Monica
    ↓ (POST /api/v1/ai/explain)
[Backend FastAPI]
    ↓
[Validación Pydantic]
    ↓
[Data Sanitizer]
    ↓
[OpenAI API]
    ↓
[BD] (Guarda log)
    ↓
Explicación JSON
    ↓
[Monica] renderiza
```

---

##  CHECKLIST DETALLADO

### Before Starting
- [ ] Backup de Monica y ia_bot_v2
- [ ] Crear repo vacío TutorPAES
- [ ] Branch para experimental

### Semana 1: Setup
- [ ] Copiar Monica → TutorPAES/frontend/
- [ ] Copiar ia_bot_v2/backend → TutorPAES/backend/
- [ ] Copiar ia_bot_v2/frontend → TutorPAES/backend/frontend_reference/
- [ ] Crear docker-compose.yml
- [ ] Crear .env.example unificado

### Semana 2: Backend Preparado
- [ ] Documentar todas las APIs en OpenAPI
- [ ] Generar tipos TypeScript desde OpenAPI
- [ ] Tests backend pasando
- [ ] CORS configurado correctamente
- [ ] Logging y monitoreo activo

### Semana 3: Frontend Migrando
- [ ] Eliminar Supabase SDK
- [ ] Crear src/lib/api/client.ts
- [ ] Reemplazar todas las llamadas Supabase
- [ ] Migrar auth a JWT
- [ ] Tests frontend pasando
- [ ] Build successful

### Semana 4: Integración Total
- [ ] docker-compose up funciona
- [ ] E2E tests pasando
- [ ] WhatsApp bot conectado (opcional)
- [ ] Deployment docs
- [ ] README actualizado

### Production Ready
- [ ] Zero vulnerabilities (npm audit)
- [ ] All tests passing
- [ ] Load testing
- [ ] Security audit
- [ ] Deployment a staging

---

##  DEPLOYMENT FINAL

### docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: tutorpaes_db
      POSTGRES_USER: tutorpaes
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql+psycopg://tutorpaes:${DB_PASSWORD}@postgres:5432/tutorpaes_db
      SECRET_KEY: ${SECRET_KEY}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      CORS_ORIGINS: http://frontend:3000,http://localhost:3000
    ports:
      - "8000:8000"

  frontend:
    build: ./frontend
    depends_on:
      - backend
    environment:
      NEXT_PUBLIC_API_BASE_URL: http://backend:8000
    ports:
      - "3000:3000"

  whatsapp-bot:
    build: ./whatsapp-bot
    depends_on:
      - backend
    environment:
      BACKEND_URL: http://backend:8000
      WHATSAPP_TOKEN: ${WHATSAPP_TOKEN}
    ports:
      - "3001:3001"

volumes:
  postgres_data:
```

### AWS Deployment
```bash
# En AWS:
# - RDS PostgreSQL (backend DB)
# - ECS Fargate → Backend container
# - ECS Fargate → Frontend container
# - ECS Fargate → WhatsApp bot
# - CloudFront → CDN para assets
# - Route53 → DNS
# - Secrets Manager → Env vars
# - CloudWatch → Logs
# - GuardDuty → Security
```

---

##  RIESGOS Y MITIGACIÓN

| Riesgo | Mitigation |
|--------|-----------|
| Pérdida de datos Monica | Backup antes de comenzar |
| API incompatible | Tests e2e exhaustivos |
| Downtime durante migración | Versiones de API (v1, v2) |
| Secrets expuestos | Usar Secrets Manager desde día 1 |
| Performance | Load testing con K6 |

---

##  DOCUMENTACIÓN NECESARIA

**Crear durante la fusión:**

1. `ARCHITECTURE.md` → Visión general del sistema
2. `API.md` → Documentación de endpoints (Auto-generated Swagger)
3. `DEPLOYMENT.md` → Cómo desplegar
4. `CONTRIBUTING.md` → Cómo contribuir
5. `SECURITY.md` → Consideraciones de seguridad
6. `DATABASE.md` → Schema y migraciones

---

##  RESULTADO FINAL

Después de la fusión:

```
TutorPAES/
├──  Arquitectura profesional
├──  Frontend moderno (Monica)
├──  Backend robusto (FastAPI)
├──  BD centralizada (PostgreSQL)
├──  Autenticación segura (JWT)
├──  API documentada (OpenAPI)
├──  Tests exhaustivos
├──  Docker ready
├──  AWS ready
└──  WhatsApp integrado (bonus)
```

**Sistema listo para escalar a 100K+ usuarios.**

---

##  TIMELINE

```
Feb 25 - Mar 3   (Semana 1) → Setup + Prep
Mar 4 - Mar 10   (Semana 2) → Backend APIs
Mar 11 - Mar 17  (Semana 3) → Frontend Migration
Mar 18 - Mar 24  (Semana 4) → Integration + Tests

Mar 25           → Production deployment candidate
```

---

**¿Comenzamos la Semana 1?**

Primero paso: Crear repo TutorPAES y hacer backup de ambos proyectos.
