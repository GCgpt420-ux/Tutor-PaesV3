# Configuración de OpenAI para TutorPAES

## Estado del documento
- Tipo: Guía canónica de configuración.
- Audiencia: Desarrollo, QA y operación.
- Última revisión: 2026-03-13.

## Relación con otros documentos
- Inicio rápido: [DOCS/OPENAI_QUICK_START.md](DOCS/OPENAI_QUICK_START.md)
- Validación histórica: [OPENAI_VALIDATION_REPORT.md](../docs/status/OPENAI_VALIDATION_REPORT.md)
- Resumen de implementación: [OPENAI_INTEGRATION_COMPLETE.md](../docs/status/OPENAI_INTEGRATION_COMPLETE.md)

## Objetivo
Configurar OpenAI en backend de forma segura y verificable, con fallback a reglas cuando el proveedor no esté disponible.

## Requisitos previos
1. Backend levantado en entorno local.
2. Archivo `.env` en `tutorpaes/backend`.
3. Dependencia `openai` instalada en el entorno Python del backend.

## Variables de entorno requeridas
Agregar o actualizar en `tutorpaes/backend/.env`:

```env
OPENAI_API_KEY=sk-proj-REEMPLAZAR
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=500
OPENAI_TIMEOUT_SECONDS=25
OPENAI_MAX_RETRIES=1
AI_ENABLE_LLM=true
```

## Procedimiento de configuración
1. Ir a `tutorpaes/backend`.
2. Verificar que existe `.env` (si no, crear desde `.env.example`).
3. Definir `OPENAI_API_KEY` con una clave válida.
4. Confirmar instalación de dependencia:

```bash
cd /home/gcuevas/ia_bot_v2/tutorpaes/backend
./venv/bin/python -m pip install -r requirements.txt
```

## Verificación funcional
### 1. Verificación de health

```bash
curl http://127.0.0.1:8000/api/v1/ai/health
```

Resultado esperado:
- `status: ok`
- `ai_systems.openai.status: ok`
- `llm_enabled: true`

### 2. Verificación de explicación real

```bash
TOKEN=$(curl -sS -X POST http://127.0.0.1:8000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@example.com","password":"demo123"}' \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["access_token"])')

curl -X POST http://127.0.0.1:8000/api/v1/ai/explain \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"question_id": 1}'
```

## Fallback y comportamiento esperado
- Si OpenAI falla o no está configurado:
  - El sistema debe responder con fallback basado en reglas.
  - No debe romper el flujo del usuario.

## Troubleshooting
### Caso A: `OPENAI_API_KEY` vacía
- Síntoma: health reporta OpenAI no configurado.
- Acción: definir clave válida en `.env` y reiniciar backend.

### Caso B: timeout con proveedor
- Síntoma: latencia alta o error de red en explain.
- Acción:
  1. Revisar conectividad.
  2. Ajustar `OPENAI_TIMEOUT_SECONDS`.
  3. Verificar fallback activo.

### Caso C: dependencia no instalada
- Síntoma: error de import en backend.
- Acción: reinstalar `requirements.txt` en venv.

## Buenas prácticas de seguridad
1. No exponer API key en frontend.
2. No commitear `.env` real.
3. Rotar clave ante sospecha de exposición.
4. Monitorear costos y volumen de requests.
