# 🚀 Cómo Lanzar TutorPAES — Guía Completa de Despliegue Local
**Fecha:** Octubre 2026  
**Repo:** `/home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3`

---

## Pre-requisitos

Antes de arrancar, verifica que tienes instalado:

```bash
# Docker (para PostgreSQL)
docker --version        # >= 24.x

# Node.js (para el frontend)
node --version          # >= 20.x
npm --version           # >= 10.x

# Python (para el backend)
python3 --version       # >= 3.12

# uv (gestor de paquetes Python rápido, usado por los scripts)
uv --version            # >= 0.4.x
# Instalar si no lo tienes: curl -LsSf https://astral.sh/uv/install.sh | sh

# Cloudflare Tunnel (para acceso público el día del piloto)
docker pull cloudflare/cloudflared:latest
```

Archivos `.env` necesarios:
- `tutorpaes/backend/.env` — Variables del backend. Copia desde `.env.example` si existe.

```bash
# Contenido mínimo de tutorpaes/backend/.env
DATABASE_URL=postgresql+psycopg://mvp:mvp@127.0.0.1:5432/mvp_db
ALEMBIC_DATABASE_URL=postgresql+psycopg://mvp:mvp@127.0.0.1:5432/mvp_db
OPENAI_API_KEY=sk-...          # Tu API key de OpenAI o OpenRouter
GROQ_API_KEY=gsk_...           # API key de Groq (proveedor principal)
SECRET_KEY=una-clave-muy-secreta-de-al-menos-32-chars
ENVIRONMENT=development
AI_ENABLE_LLM=true
```

---

## Opción A: Lanzamiento Completo con Un Solo Comando (Desarrollo)

```bash
cd /home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3
bash scripts/dev-up.sh
```

Este script hace automáticamente:
1. Levanta PostgreSQL con Docker Compose.
2. Crea y activa el entorno virtual Python.
3. Instala dependencias.
4. Ejecuta migraciones Alembic.
5. Ejecuta seeds básicos (preguntas demo y usuario demo).
6. Levanta el backend FastAPI en `http://localhost:8001`.
7. Levanta el frontend Next.js en `http://localhost:3000`.

**Para detenerlo todo:**
```bash
bash scripts/dev-down.sh
```

---

## Opción B: Lanzamiento Manual Paso a Paso

### Paso 1 — Levantar PostgreSQL
```bash
cd /home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3/tutorpaes/backend
docker compose up -d

# Verificar que está corriendo:
docker ps | grep ia_bot_db
```

### Paso 2 — Configurar entorno Python del Backend
```bash
cd /home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3/tutorpaes/backend

# Crear entorno virtual (solo la primera vez)
python3 -m venv venv

# Activar
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

### Paso 3 — Ejecutar Migraciones de Base de Datos
```bash
cd /home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3/tutorpaes/backend
source venv/bin/activate

PYTHONPATH=. alembic upgrade head
```

### Paso 4 — Sembrar los Datos del Piloto

> ⚠️ Este paso es **idempotente**: se puede ejecutar múltiples veces sin duplicar datos.

```bash
cd /home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3/tutorpaes/backend
source venv/bin/activate

# Seed 1: Preguntas DEMRE 2026 (329 preguntas oficiales)
PYTHONPATH=. python scripts/seed_paes_data.py

# Seed 2: Usuarios piloto (1 docente + 20 universitarios + 10 escolares)
PYTHONPATH=. python scripts/seed_pilot_users.py
```

**Resultado esperado:**
```
[Dataset] 329 preguntas DEMRE 2026 inyectadas en PostgreSQL.
[Docente] Cuenta creada: profesor.hermano@tutorpaes.cl
[Matrícula] 30 estudiantes matriculados en Curso Piloto PAES 2026.
```

### Paso 5 — Levantar el Backend (FastAPI)
```bash
cd /home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3/tutorpaes/backend
source venv/bin/activate

# Desarrollo (con hot reload)
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

# Producción / Piloto (con múltiples workers, sin reload)
uvicorn app.main:app --host 0.0.0.0 --port 8001 --workers 2
```

**Verificar que funciona:**
```bash
curl http://localhost:8001/api/v1/health/
# Respuesta esperada: {"status": "ok"}
```

Documentación interactiva (Swagger UI):
```
http://localhost:8001/docs
```

### Paso 6 — Levantar el Frontend (Next.js)
```bash
cd /home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3/tutorpaes/frontend

# Instalar dependencias (solo la primera vez o si cambia package.json)
npm install

# Desarrollo (con hot reload)
npm run dev

# Producción (build + start)
npm run build
npm run start
```

**Acceso:** `http://localhost:3000`

---

## Paso 7 — Acceso Público para el Piloto (Túnel Cloudflare)

> Para el Sábado 3 de Octubre, los 20 alumnos accederán desde laptops en la universidad. Necesitas una URL pública.

### Opción Recomendada: Script Todo-en-Uno
```bash
cd /home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3
bash scripts/start-local-tunnel.sh
```

Este script levanta el backend + el túnel Cloudflare. El frontend corre localmente en :3000 — para que los alumnos accedan al frontend también, debes correr un segundo túnel o cambiar la estrategia:

### Para exponer el Frontend también:
```bash
# Terminal 1: Backend (ya corriendo)
uvicorn app.main:app --host 0.0.0.0 --port 8001 --workers 2

# Terminal 2: Frontend
cd tutorpaes/frontend && npm run dev

# Terminal 3: Túnel para el FRONTEND (el que comparten los alumnos)
docker run --rm --net=host cloudflare/cloudflared:latest tunnel --url http://localhost:3000
```

La URL pública que aparece (ej. `https://random-name.trycloudflare.com`) es la que das a los 20 alumnos.

### Verificar el túnel desde un dispositivo móvil (4G):
1. Abre la URL pública en el celular.
2. Ve a `/login`.
3. Ingresa con `alumno01@tutorpaes.cl` / `paes2026`.
4. Verifica que puedes iniciar un quiz.
5. Verifica que el Tutor IA responde.

---

## Cuentas del Piloto (Para el Sábado)

| Tipo | Emails | Contraseña |
|:---|:---|:---|
| **Docente** | `profesor.hermano@tutorpaes.cl` | `paes2026` |
| **Alumnos Universitarios (20)** | `alumno01@tutorpaes.cl` hasta `alumno20@tutorpaes.cl` | `paes2026` |
| **Alumnos Escolares (10)** | `escolar01@tutorpaes.cl` hasta `escolar10@tutorpaes.cl` | `paes2026` |
| **Admin / Demo** | `demo@example.com` | `demo123` |

---

## Checklist Pre-Piloto del Sábado

```
[ ] docker ps → ia_bot_db está Up
[ ] curl http://localhost:8001/api/v1/health/ → {"status": "ok"}
[ ] http://localhost:3000/login carga correctamente
[ ] Login con alumno01@tutorpaes.cl / paes2026 funciona
[ ] Login con profesor.hermano@tutorpaes.cl / paes2026 muestra panel docente
[ ] Túnel Cloudflare activo y accesible desde celular 4G
[ ] El Tutor IA responde (SSE streaming funciona)
[ ] Al fallar una pregunta → botón "Preguntar a la Tuto" aparece
[ ] La pantalla de resultados muestra el puntaje PAES en escala 100-1000
```

---

## Comandos Útiles de Monitoreo

```bash
# Ver logs del backend en vivo
tail -f .runtime/backend.uvicorn.log

# Ver logs del frontend en vivo
tail -f .runtime/frontend.next-dev.log

# Contar intentos en tiempo real (durante el piloto)
docker exec ia_bot_db psql -U mvp -d mvp_db -c "SELECT count(*) FROM attempts WHERE started_at > NOW() - INTERVAL '2 hours';"

# Ver alumnos activos en los últimos 10 minutos
docker exec ia_bot_db psql -U mvp -d mvp_db -c "SELECT u.email, count(a.id) as intentos FROM users u JOIN attempts a ON a.user_id = u.id WHERE a.started_at > NOW() - INTERVAL '10 minutes' GROUP BY u.email;"
```

---

*Generado automáticamente por el Orquestador Agy (w3:p1) — 1 de Octubre de 2026*
