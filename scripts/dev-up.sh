#!/usr/bin/env bash
set -euo pipefail

# Demo local canónica (HOY):
# - Postgres por docker compose (backend/docker-compose.yml)
# - Backend con uvicorn (FastAPI)
# - Frontend con Next.js dev
#
# Este script NO hace deploy, no toca UI.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNTIME_DIR="${ROOT_DIR}/.runtime"

BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_HOST="${FRONTEND_HOST:-127.0.0.1}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

SKIP_DB=0
SKIP_MIGRATE=0
SKIP_SEED=0

usage() {
	cat <<'EOF'
Usage: scripts/dev-up.sh [options]

Starts the local demo stack (DB + backend + frontend).

Options:
	--skip-db       Do not run `docker compose up -d` (assumes DB already running)
	--skip-migrate  Do not run `alembic upgrade head`
	--skip-seed     Do not run seed scripts
	-h, --help      Show this help
EOF
}

while [[ $# -gt 0 ]]; do
	case "$1" in
		--skip-db)
			SKIP_DB=1
			shift
			;;
		--skip-migrate)
			SKIP_MIGRATE=1
			shift
			;;
		--skip-seed)
			SKIP_SEED=1
			shift
			;;
		-h|--help)
			usage
			exit 0
			;;
		*)
			echo "[dev-up] Unknown arg: $1" >&2
			usage >&2
			exit 2
			;;
	esac
done

wait_for_url() {
	local url="$1"
	local label="$2"
	local attempts="${3:-60}"
	local sleep_s="${4:-0.25}"

	for _ in $(seq 1 "$attempts"); do
		if curl -fsS --max-time 1 "$url" >/dev/null 2>&1; then
			echo "[dev-up] OK: ${label}"
			return 0
		fi
		sleep "$sleep_s"
	done

	echo "[dev-up] ERROR: ${label} no respondió a tiempo (${url})" >&2
	return 1
}

mkdir -p "${RUNTIME_DIR}"

echo "[dev-up] Root: ${ROOT_DIR}"

cd "${ROOT_DIR}/tutorpaes/backend"
if [[ "$SKIP_DB" -eq 1 ]]; then
	echo "[dev-up] 1) DB: skip (--skip-db)"
else
	echo "[dev-up] 1) Levantando Postgres (docker compose)..."
	docker compose up -d
	echo "[dev-up] Esperando a que Postgres esté listo..."
	sleep 3
fi

VENV_BIN="venv/bin"
VENV_PY="${VENV_BIN}/python"

if [[ ! -x "${VENV_PY}" ]]; then
	echo "[dev-up] Preparando entorno Python (venv inexistente/incompleto)..."
	rm -rf venv
	python3 -m venv venv
fi

if ! "${VENV_PY}" -m pip --version >/dev/null 2>&1; then
	echo "[dev-up] Inicializando pip en venv..."
	"${VENV_PY}" -m ensurepip --upgrade
fi

if ! "${VENV_PY}" -c "import alembic, openai, transbank" >/dev/null 2>&1; then
	echo "[dev-up] Instalando dependencias Python en venv..."
	"${VENV_PY}" -m pip install --upgrade pip
	"${VENV_PY}" -m pip install -r requirements.txt
fi

if [[ "$SKIP_MIGRATE" -eq 1 ]]; then
	echo "[dev-up] 2) Migraciones: skip (--skip-migrate)"
else
	echo "[dev-up] 2) Migraciones (alembic upgrade head)..."
	"${VENV_PY}" -m alembic upgrade head
fi

if [[ "$SKIP_SEED" -eq 1 ]]; then
	echo "[dev-up] 3) Seed: skip (--skip-seed)"
else
	echo "[dev-up] 3) Seed (idempotente): exam + preguntas + usuario demo..."
	"${VENV_PY}" -m scripts.seed_paes
	"${VENV_PY}" -m scripts.seed_questions
	"${VENV_PY}" -m scripts.seed_user
fi

echo "[dev-up] 4) Backend (uvicorn) en background: ${BACKEND_HOST}:${BACKEND_PORT}"
# Compat: limpiamos archivos antiguos si existen.
rm -f .uvicorn.pid .uvicorn.log
rm -f "${RUNTIME_DIR}/backend.uvicorn.pid" "${RUNTIME_DIR}/backend.uvicorn.log"
nohup "${VENV_PY}" -m uvicorn app.main:app --host "${BACKEND_HOST}" --port "${BACKEND_PORT}" > "${RUNTIME_DIR}/backend.uvicorn.log" 2>&1 &
echo $! > "${RUNTIME_DIR}/backend.uvicorn.pid"

# Espera activa: evita race conditions con smoke tests.
if ! wait_for_url "http://${BACKEND_HOST}:${BACKEND_PORT}/api/v1/health/" "Backend health" 80 0.25; then
	echo "[dev-up] Backend log (tail):" >&2
	tail -n 120 "${RUNTIME_DIR}/backend.uvicorn.log" >&2 || true
	exit 1
fi

echo "[dev-up] 5) Frontend (next dev) en background: ${FRONTEND_HOST}:${FRONTEND_PORT}"
cd "${ROOT_DIR}/tutorpaes/frontend"
rm -f .next-dev.pid .next-dev.log
rm -f "${RUNTIME_DIR}/frontend.next-dev.pid" "${RUNTIME_DIR}/frontend.next-dev.log"
API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-http://${BACKEND_HOST}:${BACKEND_PORT}}"
nohup env NEXT_PUBLIC_API_BASE_URL="${API_BASE_URL}" npm run dev -- --hostname 0.0.0.0 --port "${FRONTEND_PORT}" > "${RUNTIME_DIR}/frontend.next-dev.log" 2>&1 &
echo $! > "${RUNTIME_DIR}/frontend.next-dev.pid"

if ! wait_for_url "http://${FRONTEND_HOST}:${FRONTEND_PORT}" "Frontend" 80 0.25; then
	echo "[dev-up] Frontend log (tail):" >&2
	tail -n 120 "${RUNTIME_DIR}/frontend.next-dev.log" >&2 || true
	exit 1
fi

echo "[dev-up] OK"
echo "- Frontend: http://${FRONTEND_HOST}:${FRONTEND_PORT}"
echo "- Backend:  http://${BACKEND_HOST}:${BACKEND_PORT}/docs"
echo "- Health:   http://${BACKEND_HOST}:${BACKEND_PORT}/api/v1/health/"
echo "- Logs/PIDs: ${RUNTIME_DIR}/ (backend.uvicorn.* / frontend.next-dev.*)"
