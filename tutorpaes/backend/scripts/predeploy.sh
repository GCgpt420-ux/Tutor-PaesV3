#!/usr/bin/env bash
set -euo pipefail

# Predeploy seguro para Railway:
# 1) Siempre aplica migraciones.
# 2) Opcionalmente ejecuta smoke tests horizonte 0 si RUN_SMOKE_PREDEPLOY=true.

RUN_SMOKE_PREDEPLOY="${RUN_SMOKE_PREDEPLOY:-false}"

echo "[predeploy] Running DB migrations..."
alembic upgrade head

echo "[predeploy] Migrations OK"

if [[ "${RUN_SMOKE_PREDEPLOY}" != "true" ]]; then
  echo "[predeploy] RUN_SMOKE_PREDEPLOY=false -> skipping smoke tests"
  exit 0
fi

# Si smoke está habilitado, las credenciales/URLs son obligatorias.
: "${SMOKE_BACKEND_BASE:?SMOKE_BACKEND_BASE is required when RUN_SMOKE_PREDEPLOY=true}"
: "${SMOKE_FRONTEND_BASE:?SMOKE_FRONTEND_BASE is required when RUN_SMOKE_PREDEPLOY=true}"
: "${SMOKE_EMAIL:?SMOKE_EMAIL is required when RUN_SMOKE_PREDEPLOY=true}"
: "${SMOKE_PASSWORD:?SMOKE_PASSWORD is required when RUN_SMOKE_PREDEPLOY=true}"

SMOKE_SCRIPT=""
if [[ -x "./scripts/smoke-horizon-0.sh" ]]; then
  SMOKE_SCRIPT="./scripts/smoke-horizon-0.sh"
elif [[ -x "../../scripts/smoke-horizon-0.sh" ]]; then
  SMOKE_SCRIPT="../../scripts/smoke-horizon-0.sh"
else
  echo "[predeploy] ERROR: smoke-horizon-0.sh not found in expected paths" >&2
  exit 1
fi

export BACKEND_BASE="${SMOKE_BACKEND_BASE}"
export FRONTEND_BASE="${SMOKE_FRONTEND_BASE}"
export DEMO_EMAIL="${SMOKE_EMAIL}"
export DEMO_PASSWORD="${SMOKE_PASSWORD}"
export PAYMENT_PLAN="${SMOKE_PAYMENT_PLAN:-monthly}"

echo "[predeploy] Running smoke tests from ${SMOKE_SCRIPT}"
"${SMOKE_SCRIPT}"

echo "[predeploy] Smoke tests OK"
