#!/usr/bin/env bash
set -euo pipefail

# Wrapper de rollback: selecciona backup (último o explícito) y ejecuta restore.
# Variables esperadas:
# - BACKUP_DIR: carpeta de backups (default: ./backups/db)
# - BACKUP_FILE: archivo .dump específico (opcional)
# - TARGET_DATABASE_URL: DB destino (requerida)
# - ALLOW_DESTRUCTIVE_RESTORE=yes

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-${ROOT_DIR}/backups/db}"
BACKUP_FILE="${BACKUP_FILE:-}"

if [[ -z "${BACKUP_FILE}" ]]; then
  BACKUP_FILE="$(ls -1t "${BACKUP_DIR}"/tutorpaes_*.dump 2>/dev/null | head -n 1 || true)"
fi

if [[ -z "${BACKUP_FILE}" ]]; then
  echo "[db-rollback] ERROR: no se encontró backup en ${BACKUP_DIR}" >&2
  exit 2
fi

"${ROOT_DIR}/scripts/db-restore.sh" "${BACKUP_FILE}"

echo "[db-rollback] OK: rollback aplicado con ${BACKUP_FILE}"
