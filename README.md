# Tutor PAES - Proyecto de IA Educativa 🚀

Este repositorio contiene el código fuente completo y estructurado para la plataforma **Tutor PAES**.

## 🧭 Navegación rápida

- Mapa de navegación del repo: `docs/NAVIGATION.md`
- Reportes y estado del proyecto: `docs/status/`
- Documentación canónica técnica: `docs/`

## Estado Actualizado (2026-09-22)

- Estado de implementación: núcleo funcional implementado de punta a punta (auth con forgot/reset password, catálogo, quiz adaptativo, IA multi-modelo con fallback, pagos y facturación).
- Nivel de madurez actual: alto (~96% local / 86% producción) para demostración y pilotos controlados; listo para etapa de pre-producción.
- Calidad observada: **97 tests backend (pytest) y 34 tests frontend (jest) en verde (100% passing)**. Compilación a producción Next.js 16 (Turbopack) sin errores.
- Pendientes reales: observabilidad avanzada (Grafana / alertas SLO), generación de PDF binario para facturas y validación de Transbank en producción comercial.

> [!NOTE]
> **Contexto de IA:** Este repositorio ha sido estabilizado y escalado a través de las Fases 1 a 6. El estado actual representa una plataforma conectada en Full-Stack con integración de múltiples LLMs (OpenAI, Groq, Cerebras) con Circuit Breakers, facturación automática y un sistema de UI moderno de cristal (Glassmorphism).

## 🚀 Runbook de Primer Arranque

La forma recomendada y canónica de arrancar el stack completo local es:

```bash
./scripts/dev-up.sh
```

Para inicializar manualmente desde cero:

1. `cp tutorpaes/backend/.env.example tutorpaes/backend/.env`
   - *Abre el archivo `.env` y edita tus claves reales.*
2. `cd tutorpaes/backend && docker compose up -d`
   - *Inicia PostgreSQL y Redis.*
3. `alembic upgrade head`
   - *Aplica migraciones en la base de datos.*
4. Sembrar datos iniciales (desde `tutorpaes/backend`):
   - `python -m scripts.seed_paes`
   - `python -m scripts.seed_questions`
   - `python -m scripts.seed_user`
5. `cd ../frontend && npm install && npm run dev`
   - *Inicia la interfaz Next.js en `:3000` (el backend corre en `:8001`).*

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
