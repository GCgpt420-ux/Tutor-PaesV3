#!/usr/bin/env bash
set -euo pipefail

# Apaga demo local canónica.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNTIME_DIR="${ROOT_DIR}/.runtime"

KEEP_DB=0

usage() {
  cat <<'EOF'
Usage: scripts/dev-down.sh [--keep-db]

Stops local demo processes (frontend/backend). By default also runs `docker compose down`.

Options:
  --keep-db   Do not stop/remove docker compose services (leave Postgres running)
  -h, --help  Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --keep-db)
      KEEP_DB=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "[dev-down] Unknown arg: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

kill_pid_file() {
  local pid_file="$1"
  if [[ ! -f "$pid_file" ]]; then
    return 0
  fi

  local pid
  pid="$(cat "$pid_file" 2>/dev/null || true)"
  if [[ -z "$pid" ]]; then
    rm -f "$pid_file"
    return 0
  fi

  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null || true
    # Best-effort wait (avoid hanging if PID is reused)
    for _ in 1 2 3 4 5; do
      if kill -0 "$pid" 2>/dev/null; then
        sleep 0.2
      else
        break
      fi
    done
  fi

  rm -f "$pid_file"
}

kill_by_port_if_matches() {
  local port="$1"
  local expected_proc="$2"

  # ss output example:
  # users:(("uvicorn",pid=71119,fd=14))
  local line pid
  line="$(ss -lntp "sport = :${port}" 2>/dev/null | tail -n +2 | head -n 1 || true)"
  if [[ -z "$line" ]]; then
    return 0
  fi

  if ! echo "$line" | grep -qi "$expected_proc"; then
    return 0
  fi

  pid="$(echo "$line" | sed -n 's/.*pid=\([0-9]\+\).*/\1/p' | head -n 1)"
  if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
    echo "[dev-down] Fallback: killing $expected_proc pid=$pid on :$port"
    kill "$pid" 2>/dev/null || true
  fi
}

echo "[dev-down] Root: ${ROOT_DIR}"

echo "[dev-down] 1) Deteniendo frontend (si existe PID)..."
cd "${ROOT_DIR}/tutorpaes/frontend"
if [[ -f "${RUNTIME_DIR}/frontend.next-dev.pid" ]]; then
  kill_pid_file "${RUNTIME_DIR}/frontend.next-dev.pid"
fi
# Compat: versiones antiguas dejaban el pid en el subdirectorio.
if [[ -f .next-dev.pid ]]; then
  kill_pid_file .next-dev.pid
fi

# Fallback: si no hay pid file (o quedó stale), intentamos por puerto.
kill_by_port_if_matches 3000 "next-server"

echo "[dev-down] 2) Deteniendo backend (si existe PID)..."
cd "${ROOT_DIR}/tutorpaes/backend"
if [[ -f "${RUNTIME_DIR}/backend.uvicorn.pid" ]]; then
  kill_pid_file "${RUNTIME_DIR}/backend.uvicorn.pid"
fi
# Compat: versiones antiguas dejaban el pid en el subdirectorio.
if [[ -f .uvicorn.pid ]]; then
  kill_pid_file .uvicorn.pid
fi

# Fallback: si no hay pid file (o quedó stale), intentamos por puerto.
kill_by_port_if_matches 8000 "uvicorn"

if [[ "$KEEP_DB" -eq 1 ]]; then
  echo "[dev-down] 3) Manteniendo Postgres arriba (--keep-db)"
else
  echo "[dev-down] 3) Apagando Postgres (docker compose down)..."
  docker compose down
fi

echo "[dev-down] OK"
