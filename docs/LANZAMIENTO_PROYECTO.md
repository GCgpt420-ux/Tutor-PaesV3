# Guía Operativa de Lanzamiento del Proyecto TutorPAES V3

**Fecha de Actualización:** 1 de Octubre de 2026  
**Objetivo:** Instrucciones paso a paso y reproducibles para que Gabriel pueda levantar todo el stack de TutorPAES desde cero en su máquina local antes y durante el piloto.

---

## 1. Pre-requisitos del Sistema

Asegúrate de contar con los siguientes componentes instalados en tu máquina Linux:

- **Docker y Docker Compose:** Motor de contenedores para PostgreSQL 16 y el túnel Cloudflare.
  ```bash
  docker --version
  docker compose version
  ```
- **Python 3.12+ / 3.14:** Entorno virtual configurado en la raíz (`.venv/`) o en `tutorpaes/backend/venv/`.
- **Node.js 20+ y npm:** Para el runtime y construcción de Next.js 16 / React 19.
  ```bash
  node --version
  npm --version
  ```
- **Archivos de Entorno (`.env`):**
  - **Backend:** `tutorpaes/backend/.env`
    - Debe contener: `DATABASE_URL=postgresql+psycopg://mvp:mvp@127.0.0.1:5432/mvp_db`, `SECRET_KEY`, `ALGORITHM=HS256`, llaves de IA (`OPENROUTER_API_KEY`, `OPENAI_API_KEY` o `GROQ_API_KEY`).
  - **Frontend:** `tutorpaes/frontend/.env.local`
    - Debe contener: `NEXT_PUBLIC_API_URL=http://127.0.0.1:8001`, `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8001`.

---

## 2. Paso 1: Levantar la Base de Datos (PostgreSQL)

Levanta el contenedor de PostgreSQL con las credenciales canónicas del proyecto:

```bash
cd /home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3/.worktrees/sprint-backend/tutorpaes/backend
docker compose up -d
```

*Verificación:*
```bash
docker compose ps
# Debe mostrar el servicio 'db' en estado Up (healthy o running en 0.0.0.0:5432->5432/tcp)
```

---

## 3. Paso 2: Ejecutar Migraciones de Base de Datos (Alembic)

Aplica el esquema relacional completo (usuarios, cursos, intentos, preguntas DEMRE, tópicos, etc.):

```bash
cd /home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3/.worktrees/sprint-backend/tutorpaes/backend

# Si es primera vez o las tablas ya existían sin historial alembic:
# /home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3/.venv/bin/python -m alembic stamp head

/home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3/.venv/bin/python -m alembic upgrade head
```

---

## 4. Paso 3: Sembrar Datos Oficiales y Cuentas Piloto

Ejecuta los dos seeders idempotentes certificados para el piloto:

### A. Banco Oficial DEMRE 2026 (329 preguntas + 160 imágenes)
```bash
cd /home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3/.worktrees/sprint-backend/tutorpaes/backend
/home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3/.venv/bin/python scripts/seed_paes_data.py
```
*Salida esperada:*
- 329 preguntas nuevas insertadas (43 M1, 36 M2, 53 BIO, 53 FIS, 53 QUI, 45 HIST, 46 LENG).
- Sincronización de 160 figuras a `tutorpaes/backend/static/imagenes_2026/`.

### B. Cuentas Piloto y Datos para TeacherDashboardView
```bash
cd /home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3/.worktrees/sprint-backend/tutorpaes/backend
/home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3/.venv/bin/python scripts/seed_pilot_users.py
```
*Salida esperada:*
- 1 cuenta docente: `profesor.hermano@tutorpaes.cl`
- 1 curso piloto: `"Curso Piloto PAES 2026"`
- 20 alumnos universitarios (`alumno01@tutorpaes.cl` a `alumno20@tutorpaes.cl`)
- 10 alumnos escolares (`escolar01@tutorpaes.cl` a `escolar10@tutorpaes.cl`)
- 30 alumnos matriculados en el curso con métricas de progreso precargadas.

---

## 5. Paso 4: Levantar el Backend FastAPI

Inicia el servidor uvicorn en el puerto `8001` (o en background según necesidad):

```bash
cd /home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3/.worktrees/sprint-backend/tutorpaes/backend
/home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8001 --workers 2
```

*Swagger UI disponible en:* [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs)

---

## 6. Paso 5: Levantar el Frontend Next.js

En una terminal independiente, levanta el servidor frontend en el puerto `3000`:

```bash
cd /home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3/.worktrees/sprint-backend/tutorpaes/frontend
npm run dev -- --hostname 0.0.0.0 --port 3000
```

*Aplicación Web disponible en:* [http://localhost:3000](http://localhost:3000)

---

## 7. Paso 6: Acceso Público para el Piloto (Túnel Cloudflare)

Para dar acceso a los alumnos sin abrir puertos en el router hogareño ni lidiar con IPs públicas dinámicas:

```bash
cd /home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3/.worktrees/sprint-backend
./scripts/start-local-tunnel.sh
```

El script verificará Postgres, migraciones, uvicorn en segundo plano y lanzará el túnel seguro de Cloudflare:
```text
https://[subdominio-aleatorio].trycloudflare.com -> http://127.0.0.1:8001
```
Comparte esa URL con el frontend configurando `NEXT_PUBLIC_API_URL` para acceso móvil directo en 4G/5G.

---

## 8. Verificación Rápida del Sistema

Ejecuta desde otra terminal las siguientes comprobaciones de salud:

```bash
# 1. Health check de backend y base de datos
curl -s http://127.0.0.1:8001/api/v1/health | jq .

# 2. Servidor de imágenes estáticas DEMRE 2026
curl -I http://127.0.0.1:8001/static/imagenes_2026/matematicas_q01.png
# Respuesta esperada: HTTP/1.1 200 OK, content-type: image/png

# 3. Catálogo de materias cargadas
curl -s "http://127.0.0.1:8001/api/v1/catalog/subjects/?exam_id=1" | jq '.[].subject_code'
# Debe listar: "BIO", "CIEN", "FIS", "HIST", "LECT", "LENG", "M1", "M2", "QUI"
```

---

## 9. Cuentas de Acceso para el Piloto

Todas las cuentas del piloto utilizan la contraseña unificada: **`paes2026`**.

### A. Panel Docente (Teacher Dashboard)
| Rol | Email | Contraseña | Nombre | Funcionalidad Clave |
| :--- | :--- | :---: | :--- | :--- |
| **Teacher** | `profesor.hermano@tutorpaes.cl` | `paes2026` | Profesor Hermano | Vista del curso piloto, monitoreo de 30 alumnos, semáforo de temas críticos (<50% acierto) y alumnos en riesgo (<60%). |

### B. Cuentas Universitarias (20 Alumnos - Piloto Sábado)
| Correo | Contraseña | Carrera Objetivo | Universidad Objetivo |
| :--- | :---: | :--- | :--- |
| `alumno01@tutorpaes.cl` | `paes2026` | Ingeniería Civil | Universidad de Chile |
| `alumno02@tutorpaes.cl` | `paes2026` | Medicina | Pontificia Universidad Católica |
| `alumno03@tutorpaes.cl` | `paes2026` | Derecho | Universidad de Santiago |
| `alumno04@tutorpaes.cl` | `paes2026` | Psicología (En riesgo) | Universidad de Concepción |
| `alumno05@tutorpaes.cl` | `paes2026` | Arquitectura (En riesgo) | Univ. Técnica Federico Santa María |
| `alumno06@tutorpaes.cl` | `paes2026` | Astronomía (En riesgo) | Universidad de Chile |
| `alumno07@tutorpaes.cl` | `paes2026` | Bioquímica | Pontificia Universidad Católica |
| `alumno08@tutorpaes.cl` | `paes2026` | Ingeniería Comercial | Universidad de Santiago |
| `alumno09@tutorpaes.cl` | `paes2026` | Enfermería | Universidad de Concepción |
| `alumno10@tutorpaes.cl` | `paes2026` | Geología | Univ. Técnica Federico Santa María |
| `alumno11@tutorpaes.cl` a `alumno20@tutorpaes.cl` | `paes2026` | Varios | Varios |

### C. Cuentas Escolares (10 Alumnos - Piloto Colegio)
| Correo | Contraseña | Nivel | Carrera Objetivo |
| :--- | :---: | :---: | :--- |
| `escolar01@tutorpaes.cl` | `paes2026` | 4to medio | Ingeniería Comercial |
| `escolar02@tutorpaes.cl` | `paes2026` | 4to medio | Medicina |
| `escolar03@tutorpaes.cl` | `paes2026` | 4to medio | Odontología |
| `escolar04@tutorpaes.cl` | `paes2026` | 4to medio | Periodismo |
| `escolar05@tutorpaes.cl` a `escolar10@tutorpaes.cl` | `paes2026` | 4to medio | Varios |

---

## 10. Comando de Lanzamiento Todo-en-Uno (Atajo)

Si prefieres levantar todo el stack automáticamente en segundo plano con un solo comando:

```bash
cd /home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3/.worktrees/sprint-backend
./scripts/dev-up.sh
```

Para detener todos los servicios locales:
```bash
./scripts/dev-down.sh
```
