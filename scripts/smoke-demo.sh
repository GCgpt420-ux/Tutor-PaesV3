#!/usr/bin/env bash
set -euo pipefail

# Smoke test para demo local.
# Objetivo: validar que DB + backend + frontend están arriba y el flujo mínimo responde.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

BACKEND_BASE="${BACKEND_BASE:-http://127.0.0.1:8000}"
FRONTEND_BASE="${FRONTEND_BASE:-http://127.0.0.1:3000}"
DEMO_EMAIL="${DEMO_EMAIL:-demo@example.com}"
DEMO_PASSWORD="${DEMO_PASSWORD:-demo123}"

wait_for_url() {
  local url="$1"
  local label="$2"
  local attempts="${3:-60}"
  local sleep_s="${4:-0.25}"

  for _ in $(seq 1 "$attempts"); do
    if curl -fsS --max-time 1 "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep "$sleep_s"
  done

  echo "[smoke] ERROR: ${label} no respondió a tiempo (${url})" >&2
  return 1
}

echo "[smoke] Backend:  ${BACKEND_BASE}"
echo "[smoke] Frontend: ${FRONTEND_BASE}"

echo "[smoke] 1) Health..."
wait_for_url "${BACKEND_BASE}/api/v1/health/" "Backend health" 80 0.25
curl -fsS "${BACKEND_BASE}/api/v1/health/" | python3 -c 'import sys, json; print(json.load(sys.stdin))'

echo "[smoke] 2) Frontend responde (HEAD)..."
wait_for_url "${FRONTEND_BASE}" "Frontend" 80 0.25
curl -fsSI "${FRONTEND_BASE}" | head -n 5

echo "[smoke] 3) Login demo (obtener JWT)..."
LOGIN_RESP="$(curl -sS -X POST "${BACKEND_BASE}/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${DEMO_EMAIL}\",\"password\":\"${DEMO_PASSWORD}\"}" \
  -w $'\n%{http_code}')"
LOGIN_STATUS="${LOGIN_RESP##*$'\n'}"
LOGIN_JSON="${LOGIN_RESP%$'\n'*}"

if [[ "${LOGIN_STATUS}" != "200" ]]; then
  echo "[smoke] ERROR: login devolvió HTTP ${LOGIN_STATUS}" >&2
  echo "Respuesta: ${LOGIN_JSON}" >&2
  echo "Hint: corre seeds (al menos scripts.seed_user) o ejecuta ./scripts/dev-up.sh sin --skip-seed" >&2
  exit 1
fi

TOKEN="$(printf '%s' "${LOGIN_JSON}" | python3 -c 'import sys, json; data=json.loads(sys.stdin.read() or "{}"); print(data.get("access_token") or "")')"

if [[ -z "${TOKEN}" ]]; then
  echo "[smoke] ERROR: login no devolvió access_token"
  echo "Respuesta: ${LOGIN_JSON}"
  exit 1
fi

echo "[smoke] 4) /auth/me con token..."
curl -sS "${BACKEND_BASE}/api/v1/auth/me" -H "Authorization: Bearer ${TOKEN}" | python3 -c 'import sys, json; print(json.load(sys.stdin))'

echo "[smoke] 5) Next question (M1/ALG)..."
curl -sS "${BACKEND_BASE}/api/v1/quiz/next-question?subject_code=M1&topic_code=ALG" -H "Authorization: Bearer ${TOKEN}" | python3 -c 'import sys, json; print(json.load(sys.stdin))'

echo "[smoke] OK"
