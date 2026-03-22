#!/usr/bin/env bash
set -euo pipefail

# Restore de backup custom PostgreSQL.
# Variables/argumentos:
# - BACKUP_FILE (o primer argumento): archivo .dump a restaurar
# - TARGET_DATABASE_URL: DB destino (requerida)
# - ALLOW_DESTRUCTIVE_RESTORE=yes para confirmar operación destructiva

BACKUP_FILE="${BACKUP_FILE:-${1:-}}"
TARGET_DATABASE_URL="${TARGET_DATABASE_URL:-}"
ALLOW_DESTRUCTIVE_RESTORE="${ALLOW_DESTRUCTIVE_RESTORE:-no}"

normalize_pg_url() {
  local raw_url="$1"

  # SQLAlchemy URL (postgresql+psycopg://) is not always accepted by pg_dump/pg_restore.
  if [[ "${raw_url}" == postgresql+psycopg://* ]]; then
    printf 'postgresql://%s\n' "${raw_url#postgresql+psycopg://}"
    return
  fi

  printf '%s\n' "${raw_url}"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "[db-restore] ERROR: comando no disponible: $1" >&2
    exit 2
  fi
}

if [[ -z "${BACKUP_FILE}" ]]; then
  echo "[db-restore] ERROR: define BACKUP_FILE o pásalo como primer argumento" >&2
  exit 2
fi

if [[ -z "${TARGET_DATABASE_URL}" ]]; then
  echo "[db-restore] ERROR: TARGET_DATABASE_URL es obligatoria" >&2
  exit 2
fi

PG_TARGET_DATABASE_URL="$(normalize_pg_url "${TARGET_DATABASE_URL}")"

if [[ "${ALLOW_DESTRUCTIVE_RESTORE}" != "yes" ]]; then
  echo "[db-restore] ERROR: operación bloqueada. Exporta ALLOW_DESTRUCTIVE_RESTORE=yes" >&2
  exit 2
fi

if [[ ! -f "${BACKUP_FILE}" ]]; then
  echo "[db-restore] ERROR: backup no encontrado: ${BACKUP_FILE}" >&2
  exit 2
fi

require_cmd pg_restore

# --clean y --if-exists permiten rollback a estado del dump de forma determinística.
pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --dbname="${PG_TARGET_DATABASE_URL}" \
  "${BACKUP_FILE}"

echo "[db-restore] OK: restore completado desde ${BACKUP_FILE}"
