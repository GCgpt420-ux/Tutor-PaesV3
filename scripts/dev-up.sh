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

ensure_port_free_or_stop_known() {
	local port="$1"
	local label="$2"
	local expected_proc="$3"

	local line pid
	line="$(ss -lntp "sport = :${port}" 2>/dev/null | tail -n +2 | head -n 1 || true)"
	if [[ -z "$line" ]]; then
		return 0
	fi

	pid="$(echo "$line" | sed -n 's/.*pid=\([0-9]\+\).*/\1/p' | head -n 1)"
	if [[ -n "$pid" ]] && echo "$line" | grep -Eqi "$expected_proc"; then
		echo "[dev-up] ${label}: puerto :${port} ocupado por proceso previo (pid=${pid}), cerrando..."
		kill "$pid" 2>/dev/null || true
		for _ in 1 2 3 4 5 6 7 8 9 10; do
			if ss -lntp "sport = :${port}" 2>/dev/null | tail -n +2 | head -n 1 | grep -q .; then
				sleep 0.2
			else
				break
			fi
		done
	fi

	if ss -lntp "sport = :${port}" 2>/dev/null | tail -n +2 | head -n 1 | grep -q .; then
		echo "[dev-up] ERROR: ${label}: puerto :${port} sigue ocupado por otro proceso." >&2
		echo "[dev-up] Sugerencia: ejecuta scripts/dev-down.sh o libera el puerto manualmente." >&2
		ss -lntp "sport = :${port}" 2>/dev/null >&2 || true
		exit 1
	fi
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

# Normaliza DATABASE_URL para ejecución local en host.
# Si no viene definida, usa credenciales canónicas del docker-compose local.
# Si viene con host `db` (resoluble solo dentro de red Docker), la adapta a localhost.
DEFAULT_LOCAL_DATABASE_URL="postgresql+psycopg://mvp:mvp@127.0.0.1:5432/mvp_db"
ENV_FILE_PATH="${ROOT_DIR}/tutorpaes/backend/.env"
if [[ -z "${DATABASE_URL:-}" && -f "${ENV_FILE_PATH}" ]]; then
	ENV_DATABASE_URL="$(grep -E '^DATABASE_URL=' "${ENV_FILE_PATH}" | tail -n1 | cut -d '=' -f2- | sed -E 's/^"(.*)"$/\1/')"
	if [[ -n "${ENV_DATABASE_URL}" ]]; then
		export DATABASE_URL="${ENV_DATABASE_URL}"
		echo "[dev-up] DATABASE_URL cargada desde backend/.env"
	fi
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
	export DATABASE_URL="${DEFAULT_LOCAL_DATABASE_URL}"
	echo "[dev-up] DATABASE_URL no definida en entorno ni backend/.env; usando default local (${DEFAULT_LOCAL_DATABASE_URL})"
elif [[ "${DATABASE_URL}" == *"@db:"* ]]; then
	export DATABASE_URL="${DATABASE_URL//@db:/@127.0.0.1:}"
	echo "[dev-up] DATABASE_URL detectada con host 'db'; adaptada a localhost para host-run"
fi

# Defaults locales para requisitos runtime del backend.
# En producción deben venir desde entorno seguro; aquí solo evitamos fricción de demo local.
if [[ -z "${SECRET_KEY:-}" ]]; then
	export SECRET_KEY="dev-only-secret-key-change-in-production"
	echo "[dev-up] SECRET_KEY no definida; usando default local de desarrollo"
fi

if [[ -z "${PAYMENT_RETURN_URL:-}" ]]; then
	export PAYMENT_RETURN_URL="http://${FRONTEND_HOST}:${FRONTEND_PORT}/api/payments/confirm"
	echo "[dev-up] PAYMENT_RETURN_URL no definida; usando default local (${PAYMENT_RETURN_URL})"
fi

# Defaults para LLM providers en desarrollo (fallback si no estan configurados)
if [[ -z "${OPENAI_API_KEY:-}" ]] && [[ -z "${GEMINI_API_KEY:-}" ]]; then
	export OPENAI_API_KEY="sk-dev-placeholder-for-local-testing"
	echo "[dev-up] LLM API keys no definidas; usando placeholder de desarrollo (no funcional)"
	echo "[dev-up] Para usar IA real, configura OPENAI_API_KEY o GEMINI_API_KEY en .env"
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

ensure_port_free_or_stop_known "${BACKEND_PORT}" "Backend" "uvicorn|python"

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

ensure_port_free_or_stop_known "${FRONTEND_PORT}" "Frontend" "next-server|next dev|node"

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
