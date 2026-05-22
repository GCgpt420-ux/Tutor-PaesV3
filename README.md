# Tutor PAES - Proyecto de IA Educativa 🚀

Este repositorio contiene el código fuente completo y estructurado para la plataforma **Tutor PAES**.

## 🧭 Navegación rápida

- Mapa de navegación del repo: `docs/NAVIGATION.md`
- Reportes y estado del proyecto: `docs/status/`
- Documentación canónica técnica: `DOCS/`

## Estado Actualizado (2026-04-23)

- Estado de implementacion: nucleo funcional implementado de punta a punta (auth, catalogo, quiz, IA, pagos y facturacion).
- Nivel de madurez actual: alto para demostracion y pilotos controlados; medio-alto para despliegue productivo inicial.
- Calidad observada: suites de backend y frontend en verde segun ultimo corte de validacion registrado.
- Pendientes criticos: CI unificada, smoke tests automatizados de preproduccion y hardening de observabilidad.

> [!NOTE]
> **Contexto de IA:** Este repositorio ha sido estabilizado y escalado a través de las Fases 1 a 6. El estado actual representa una plataforma conectada en Full-Stack con integración de múltiples LLMs, facturación automática y un sistema de UI moderno de cristal (Glassmorphism).

## 🚀 Runbook de Primer Arranque

Para inicializar este proyecto por primera vez, desde cero, debes seguir **estrictamente** el siguiente orden:

1. `cp backend/.env.example backend/.env`
   - *Abre el archivo `.env` y asegúrate de editar las claves reales (removiendo cualquier credencial hardcodeada que venga del template).*
2. `cd backend && docker compose up -d`
   - *Inicia PostgreSQL y Redis. Si presentas errores de permisos de lectura/escritura en la base de datos (habitual en entornos Linux), utiliza la siguiente solución temporal:*
   - `docker exec -it ia_bot_db chmod -R 777 /var/lib/postgresql/data`
3. `alembic upgrade head`
   - *Ejecutar dentro del proyecto backend. Generará tablas, esquemas y la migración asincrónica pendiente.*
4. `python scripts/seed_paes.py`
   - *Inicializa la estructura básica del contenido.*
5. `python scripts/seed_questions.py`
   - *Puebla la DB con preguntas semilla.*
6. `python scripts/seed_user.py`
   - *Crea un usuario administrador/demo base de prueba (ej. demo@example.com).*
7. `cd ../tutorpaes/frontend && npm install && npm run dev`
   - *Levanta el entorno de la interfaz (Next.js) en el puerto por defecto (3000).*

## 🏛 Estructura del Proyecto

- `/tutorpaes/frontend`: Next.js (App Router), TailwindCSS, TypeScript.
  - El sistema de diseño se basa en **Design Tokens** unificados, estética Premium Dark Mode.
- `/tutorpaes/backend`: Python FastAPI.
  - Bases de PostgreSQL generadas via Alembic y acceso asíncrono.
  - Integración multi-modelo vía `llm_provider_service.py` (Groq, Cerebras, OpenAI).
  - Sistema de **Billing/Facturación** completo (modelos, migraciones y pasarela Transbank stub).

## 🧑‍💻 Instrucciones para Contribución

- `frontend/`: Priorizar el uso de tokens semánticos (ej. `bg-surface-elevated`) para no quebrar el modo oscuro.
- `backend/`: El uso de LLMs se despacha desde factory methods (`get_llm_provider()`) que manejan fallbacks y adaptan las APIs sin tener hard-dependencies en el controlador de chat (`chatbot_service.py`).
- **Secretos:** Nunca commitear tokens de Groq, Cerebras o OpenAI en archivos de texto, solo referenciar vía `os.getenv`.

*(Si deseas revisar en mayor profundidad cada fase aplicada, ver `docs/status/PROGRESS_TRACKING.md`)*
