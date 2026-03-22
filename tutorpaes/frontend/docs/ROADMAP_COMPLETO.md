#  ROADMAP COMPLETO: DE MONICA A TUTORPAES

**Ruta definitiva desde hoy (Feb 24) hasta producción en AWS**

---

## RESUMEN EJECUTIVO

### Decisión Final
Se fusionarán Monica e ia_bot_v2 en un único sistema profesional.

### Timeline
```
FASE 0 (Semana 1-2)   → Arreglar lo crítico
FASE 1 (Semana 3)     → Reestructuración
FASE 2 (Semana 4-5)   → Migración a AWS (opcional)
FASE 3 (Semana 6-9)   → Fusión Monica + ia_bot
FASE 4 (Semana 10+)   → Escala y optimización

Total: ~10 semanas para sistema profesional listo para producción
```

### Resultado Final
**TutorPAES**: Sistema EdTech escalable con Frontend (Monica) + Backend (FastAPI) + Bot WhatsApp integrado.

---

## FASE 0: ARREGLAR LO CRÍTICO (Semana 1-2)

**Objetivo:** Eliminar riesgos de seguridad en Monica antes de cualquier cambio.

### Tarea 1: Auth Movido a Backend
**Duración:** 3-4 días

**Pasos:**
1. Crear `app/api/auth/login/route.ts` (backend HTTP)
2. Crear `src/features/auth/services/AuthService.ts` (lógica)
3. Actualizar `LoginForm.tsx` para llamar backend
4. Implementar HTTPOnly cookies
5. Tests de auth

**Resultado:** Credenciales ya no en JavaScript 

**Responsable:** Tú

---

### Tarea 2: ORM/Abstracción BD
**Duración:** 4-5 días

**Pasos:**
1. Instalar Prisma: `npm install prisma @prisma/client`
2. Crear `prisma/schema.prisma` (models)
3. Crear `src/infrastructure/db/repositories/`
4. Reemplazar todas las llamadas Supabase
5. Tests de BD

**Resultado:** BD abstracción completa, no más Supabase SDK 

**Responsable:** Tú

---

### Tarea 3: Sanitizar IA
**Duración:** 2-3 días

**Pasos:**
1. Crear `src/infrastructure/ai/DataSanitizer.ts`
2. Hash de user_id en logs
3. Filtros de prompt injection
4. Tests de sanitización

**Resultado:** IA no recibe datos personales 

**Responsable:** Tú

---

### Tarea 4: Secretos Seguros
**Duración:** 1-2 días

**Pasos:**
1. Instalar `@aws-sdk/client-secrets-manager`
2. Crear `src/infrastructure/security/SecretsManager.ts`
3. Mover claves de `process.env` a Secrets Manager

**Resultado:** Secretos protegidos 

**Responsable:** Tú

---

### Tarea 5: Validación Global
**Duración:** 1.5 días

**Pasos:**
1. Instalar `zod`
2. Crear `src/infrastructure/security/validators/`
3. Implementar middleware global
4. Tests de validación

**Resultado:** Todos los inputs validados 

**Responsable:** Tú

**FASE 0 CHECKLIST:**
- [ ] Auth en backend
- [ ] ORM implementado
- [ ] IA data anonimizado
- [ ] Secrets en Secrets Manager
- [ ] Validación global
- [ ] 90%+ tests pasando
- [ ] Build exitoso

**SALIDA:** Monica segura, lista para siguiente fase.

---

## FASE 1: REESTRUCTURACIÓN (Semana 3)

**Objetivo:** Preparar Monica para fusión con ia_bot_v2.

### Tarea 6: Crear Carpeta infrastructure/
**Duración:** 2 días

**De:**
```
src/
├── features/
├── hooks/
├── lib/          ← Ambiguo
├── components/   ← Ambiguo
└── types/
```

**A:**
```
src/
├── features/         ← Lógica de negocio
├── shared/          ← Componentes compartidos
│   ├── components/
│   ├── hooks/
│   └── types/
└── infrastructure/  ← Detalles técnicos
    ├── db/
    ├── cache/
    ├── security/
    ├── ai/
    └── api-client/
```

**Responsable:** Tú

---

### Tarea 7: Crear Cliente API Unificado
**Duración:** 2 días

**Crear:**
```
src/infrastructure/api/
├── client.ts        ← HTTP client base
├── auth.ts          ← Auth endpoints
├── courses.ts       ← Courses endpoints
├── exams.ts         ← Exams endpoints
├── ai.ts            ← IA endpoints
└── users.ts         ← User endpoints
```

**Basado en:** Patrón de ia_bot_v2

**Responsable:** Tú

---

### Tarea 8: Implementar RBAC
**Duración:** 2 días

**Crear:**
```
src/infrastructure/security/
├── roles.ts         ← Enums USER, PREMIUM, ADMIN
├── permissions.ts   ← Permisos por rol
└── rbac.ts          ← Middleware de roles
```

**Responsable:** Tú

---

**FASE 1 CHECKLIST:**
- [ ] Carpetas reestructuradas
- [ ] Cliente API unificado
- [ ] RBAC implementado
- [ ] Tests pasando
- [ ] Build exitoso

**SALIDA:** Monica reestructurado, pronta para fusión.

---

## FASE 2: MIGRACIÓN AWS (Opcional, Semana 4-5)

**Objetivo:** Mover Monica a AWS (si no esperas a FASE 3).

### En AWS:
```
1. RDS PostgreSQL
2. ECS Fargate → Monica container
3. CloudFront → CDN
4. Route53 → DNS
5. Secrets Manager → Env vars
```

**O espera a FASE 3 para desplegar ambos juntos.**

**SALIDA:** Monica en producción (sin backend = limited).

---

## FASE 3: FUSIÓN MONICA + IA_BOT (Semana 6-9)

**OBJETIVO FINAL: Sistema profesional unificado**

### Semana 6: Setup Repo
**Tarea 9: Crear Repo TutorPAES**

```bash
mkdir TutorPAES
cd TutorPAES

# Copiar Monica
cp -r ~/monica-master ./frontend

# Copiar ia_bot_v2
cp -r ~/ia_bot_v2/backend ./backend
cp -r ~/ia_bot_v2/scripts ./backend/scripts

# Crear bot (future)
mkdir whatsapp-bot

# Files
touch docker-compose.yml
touch README.md
touch .env.example
touch ARCHITECTURE.md
```

**Resultado:**
```
TutorPAES/
├── frontend/...    (Monica)
├── backend/...     (ia_bot FastAPI)
├── whatsapp-bot/
└── docker-compose.yml
```

**Duración:** 1 día

---

### Semana 6-7: Backend Preparado
**Tarea 10: Backend APIs Documentadas**

**Pasos:**
1. Agregar OpenAPI docs a FastAPI
2. Documentar todos los endpoints
3. Generar tipos TypeScript desde OpenAPI
4. CORS configurado
5. Tests backend exhaustivos

**Endpoints a documentar:**
```
POST   /api/v1/auth/login
GET    /api/v1/auth/me
GET    /api/v1/courses
GET    /api/v1/courses/{id}/topics
GET    /api/v1/exams
POST   /api/v1/exams/{id}/submit
POST   /api/v1/ai/explain
GET    /api/v1/users/profile
POST   /api/v1/users/profile
...
```

**Duración:** 3-4 días

---

### Semana 7-8: Frontend Se Conecta
**Tarea 11: Reemplazar Supabase con Backend**

**Pasos:**
1. Eliminar `src/infrastructure/api/client.ts` (viejo)
2. Actualizar a consumir backend real
3. Reemplazar tipos Supabase con tipos Backend
4. Tests e2e frontend + backend
5. Verificar build

**Cambios:**
```typescript
// VIEJO:
import { getSupabaseClient } from '@/infrastructure/db';
const supabase = getSupabaseClient();
const { data } = await supabase.from('courses').select();

// NUEVO:
import { getCourses } from '@/infrastructure/api/courses';
const courses = await getCourses();
```

**Duración:** 3-4 días

---

### Semana 8-9: Docker + Tests
**Tarea 12: docker-compose.yml**

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://...
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    ports:
      - "8000:8000"

  frontend:
    build: ./frontend
    environment:
      NEXT_PUBLIC_API_BASE_URL: http://backend:8000
    ports:
      - "3000:3000"

volumes:
  postgres_data:
```

**Tarea 13: Tests E2E**
```bash
npm run test:e2e      # Frontend tests
pytest backend/tests  # Backend tests
```

**Duración:** 2-3 días

---

**FASE 3 CHECKLIST:**
- [ ] Repo TutorPAES creado
- [ ] Backend APIs documentadas
- [ ] Frontend conectado a backend
- [ ] docker-compose funciona
- [ ] Tests E2E pasando
- [ ] Deployment docs ready

**SALIDA:** Sistema profesional unificado, listo para producción.

---

## FASE 4: ESCALA (Semana 10+)

**Opcional, depende de tus necesidades.**

### 4.1 WhatsApp Bot
**Duración:** 1-2 semanas

```python
# whatsapp-bot/main.py
from backend_client import BackendClient

@app.post("/webhook/whatsapp")
async def webhook(request: Request):
    # Recibe mensaje de WhatsApp
    # Llama al backend
    # Envía respuesta
    pass
```

### 4.2 Monitoreo y Observabilidad
```
- Prometheus para métricas
- Grafana para dashboards
- ELK stack para logs
- Sentry para errores
```

### 4.3 Performance
```
- Redis para cache
- Database connection pooling
- CDN para assets
- Load testing con K6
```

### 4.4 Seguridad Advanced
```
- Rate limiting global
- WAF (Cloudflare)
- Penetration testing
- Security audit
```

---

## LÍNEA DE TIEMPO

```
Semana 1-2 (Feb 25 - Mar 10)      FASE 0: Arreglar crítico
Semana 3 (Mar 11 - Mar 17)        FASE 1: Reestructuración
Semana 4-5 (Mar 18 - Mar 31)      FASE 2: AWS opcional
Semana 6-9 (Apr 1 - Apr 28)       FASE 3: Fusión
Semana 10+ (May onwards)          FASE 4: Escala

 Mayo: Sistema profesional en producción
```

---

## CHECKLIST FINAL

### Monica (Antes de Fusión)
- [ ] FASE 0: Auth, ORM, Secrets, Validación
- [ ] FASE 1: Reestructuración completa
- [ ] Build limpio, tests pasando
- [ ] Zero critical security issues

### ia_bot_v2 (Antes de Fusión)
- [ ] Backend APIs documentadas
- [ ] Tests exhaustivos
- [ ] Docker ready
- [ ] CORS configurado

### Fusión (FASE 3)
- [ ] Repo TutorPAES creado
- [ ] Frontend + Backend comunicando
- [ ] docker-compose funciona
- [ ] E2E tests pasando

### Producción
- [ ] AWS resources creados
- [ ] Secrets en Secrets Manager
- [ ] CI/CD pipeline
- [ ] Monitoring activo
- [ ] Backup automático

---

## DECISIÓN ARCHITECÓNICA FINAL

### ESTRUCTURA
```
TutorPAES (Monorepo)
├── Frontend (Monica + Next.js)
├── Backend (ia_bot + FastAPI)
└── Bot (WhatsApp)
```

### FLOW de Datos
```
Usuarios
    ↓
Frontend (Next.js) → Backend (FastAPI) → DB (PostgreSQL)
                       ↓
                    IA (OpenAI)
                       ↓
                    Respuesta JSON
```

### DEPLOYMENT
```
AWS:
- Frontend → ECS Fargate
- Backend → ECS Fargate
- DB → RDS PostgreSQL
- Bot → Lambda/Fargate
```

---

## RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|-----------|
| Pérdida de código Monica | Baja | Crítico | Backup + Git |
| API incompatible | Media | Alto | Tests E2E |
| Downtime en migración | Baja | Alto | Blue-green deployment |
| Performance issues | Media | Medio | Load testing |
| Errores de auth | Baja | Crítico | Tests de seguridad |

---

## CRITERIOS DE ÉXITO

### FASE 0 
- [ ] 0 critical security issues
- [ ] 90%+ test coverage
- [ ] Build exitoso

### FASE 1 
- [ ] Código claro y mantenible
- [ ] Tests pasando
- [ ] Build exitoso

### FASE 3 
- [ ] Sistema profesional funcionando
- [ ] APIs documentadas
- [ ] Tests E2E pasando
- [ ] Docker ready

### PRODUCCIÓN 
- [ ] 99.9% uptime
- [ ] Latencia < 200ms
- [ ] 0 data leaks
- [ ] Escala a 10K+ usuarios

---

## PRÓXIMOS PASOS INMEDIATOS

### HOY (Feb 24)
- [ ] Leer y entender este roadmap
- [ ] Crear backup de Monica
- [ ] Setup dev environment

### MAÑANA (Feb 25)
- [ ] Comenzar TAREA 1: Auth a Backend
- [ ] Daily standup (si hay equipo)

### Esta semana
- [ ] FASE 0: Completar tareas 1-5
- [ ] Tests pasando
- [ ] Build limpio

---

## DOCUMENTACIÓN A CREAR

Durante el roadmap:

1. `ARCHITECTURE.md` — Visión general
2. `PHASE0.md` — Detalles FASE 0
3. `PHASE3.md` — Detalles FASE 3
4. `API.md` — Documentación de endpoints (auto-generada)
5. `DEPLOYMENT.md` — Cómo desplegar
6. `SECURITY.md` — Consideraciones de seguridad
7. `CONTRIBUTING.md` — Guía para contribuidores

---

## PRESUPUESTO (Si tienes equipo)

```
FASE 0 (2 semanas):   1 dev
FASE 1 (1 semana):    1 dev
FASE 3 (4 semanas):   1-2 devs
FASE 4 (2+ semanas):  1 dev (DevOps)

Total: ~6-8 semanas de 1 dev
```

**O solo tú, a tu ritmo: 10-12 semanas**

---

## PREGUNTAS FRECUENTES

### ¿Puedo hacer FASE 3 sin FASE 0 y 1?
No recomendado. FASE 0 arregla riesgos críticos.

### ¿Necesito AWS desde el inicio?
No. Puedes desarrollar localmente con `docker-compose`.
AWS es para producción (FASE 2 o después de FASE 3).

### ¿Y el bot de WhatsApp?
Es FASE 4, opcional. Primero termina FASE 3.

### ¿Cuánto cuesta desplegar en AWS?
Estimado:
- Frontend: $20/mes (CloudFront + ECS)
- Backend: $100/mes (ECS + RDS)
- Total: ~$120/mes para empezar

### ¿Puedo monetizar después?
Sí. La arquitectura permite:
- Suscripciones (Premium plans)
- API pública (para otros desarrolladores)
- Bot WhatsApp (canal adicional)

---

## VISIÓN FINAL (JULIO 2026)

```
TutorPAES 2.0
├──  Web: 10K+ usuarios mensuales
├──  WhatsApp: 5K+ usuarios
├──  API pública (para partners)
├──  Dashboard admin
├──  Analytics y reportes
├──  Integración con colegios
├──  Certificaciones PAES
└──  Listo para Series A 
```

---

**¿Comenzamos?**

**Próximo paso:** Confirmar que entiendes el roadmap.  
**Luego:** Comenzar FASE 0 (Tarea 1: Auth al Backend).

¿Confirmado? 
