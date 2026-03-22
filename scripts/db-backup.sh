#!/usr/bin/env bash
set -euo pipefail

# Backup lógico PostgreSQL en formato custom (.dump) con metadata y checksum.
# Variables esperadas:
# - DATABASE_URL: conexión PostgreSQL origen (requerida)
# - BACKUP_DIR: carpeta destino (default: ./backups/db)
# - BACKUP_RETENTION_DAYS: retención en días (default: 14)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-${ROOT_DIR}/backups/db}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
DATABASE_URL="${DATABASE_URL:-}"

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
    echo "[db-backup] ERROR: comando no disponible: $1" >&2
    exit 2
  fi
}

if [[ -z "${DATABASE_URL}" ]]; then
  echo "[db-backup] ERROR: DATABASE_URL es obligatoria" >&2
  exit 2
fi

PG_DATABASE_URL="$(normalize_pg_url "${DATABASE_URL}")"

require_cmd pg_dump
require_cmd sha256sum
require_cmd find

mkdir -p "${BACKUP_DIR}"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_name="tutorpaes_${timestamp}.dump"
backup_file="${BACKUP_DIR}/${backup_name}"
metadata_file="${BACKUP_DIR}/${backup_name}.meta"
checksum_file="${BACKUP_DIR}/${backup_name}.sha256"

# Export en formato custom para permitir restore granular con pg_restore.
pg_dump \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file="${backup_file}" \
  "${PG_DATABASE_URL}"

# Metadata mínima para trazabilidad operativa.
{
  echo "timestamp_utc=${timestamp}"
  echo "backup_file=${backup_name}"
  echo "retention_days=${BACKUP_RETENTION_DAYS}"
  echo "created_by=db-backup.sh"
} >"${metadata_file}"

sha256sum "${backup_file}" >"${checksum_file}"

# Limpieza por antigüedad para evitar crecimiento indefinido.
find "${BACKUP_DIR}" -type f -name "tutorpaes_*.dump" -mtime "+${BACKUP_RETENTION_DAYS}" -delete
find "${BACKUP_DIR}" -type f -name "tutorpaes_*.dump.meta" -mtime "+${BACKUP_RETENTION_DAYS}" -delete
find "${BACKUP_DIR}" -type f -name "tutorpaes_*.dump.sha256" -mtime "+${BACKUP_RETENTION_DAYS}" -delete

echo "[db-backup] OK: ${backup_file}"
