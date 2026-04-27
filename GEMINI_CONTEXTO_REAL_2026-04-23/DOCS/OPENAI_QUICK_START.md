# OpenAI Quick Start para TutorPAES

## Estado del documento
- Tipo: guía rápida operacional.
- Audiencia: integración local y verificación rápida.
- Fuente de verdad ampliada: [DOCS/OPENAI_SETUP.md](DOCS/OPENAI_SETUP.md).

## Objetivo
Habilitar OpenAI en menos de 5 minutos y verificar que responde desde backend.

## Pasos
1. Configurar clave en `tutorpaes/backend/.env`:

```env
OPENAI_API_KEY=sk-proj-REEMPLAZAR
AI_ENABLE_LLM=true
OPENAI_MODEL=gpt-3.5-turbo
```

2. Instalar dependencias backend:

```bash
cd /home/gcuevas/ia_bot_v2/tutorpaes/backend
./venv/bin/python -m pip install -r requirements.txt
```

3. Levantar stack:

```bash
cd /home/gcuevas/ia_bot_v2
./scripts/dev-up.sh
```

4. Verificar health:

```bash
curl http://127.0.0.1:8000/api/v1/ai/health
```

5. Probar endpoint de explicación con token de usuario.

## Resultado esperado
- Backend reporta OpenAI operativo.
- Endpoint de explicación responde sin romper flujo.
- Si OpenAI falla, se mantiene fallback por reglas.

## Nota de mantenimiento
Este documento evita duplicar detalle técnico. Para troubleshooting y parámetros completos usar [DOCS/OPENAI_SETUP.md](DOCS/OPENAI_SETUP.md).
