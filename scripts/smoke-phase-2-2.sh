#!/usr/bin/env bash
set -euo pipefail

# Smoke check específico Fase 2.2
# Verifica endpoints usados por hooks frontend:
# - GET /api/v1/catalog/exams/
# - GET /api/v1/catalog/subjects/?exam_id=<PAES>
# - GET /api/v1/auth/me (autenticado)

BACKEND_BASE="${BACKEND_BASE:-http://127.0.0.1:8000}"
FRONTEND_BASE="${FRONTEND_BASE:-http://127.0.0.1:3000}"
DEMO_EMAIL="${DEMO_EMAIL:-demo@example.com}"
DEMO_PASSWORD="${DEMO_PASSWORD:-demo123}"

wait_for_url() {
  local url="$1"
  local label="$2"
  local attempts="${3:-80}"
  local sleep_s="${4:-0.25}"

  for _ in $(seq 1 "$attempts"); do
    if curl -fsS --max-time 1 "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep "$sleep_s"
  done

  echo "[phase-2.2] ERROR: ${label} no respondió a tiempo (${url})" >&2
  return 1
}

echo "[phase-2.2] Backend:  ${BACKEND_BASE}"
echo "[phase-2.2] Frontend: ${FRONTEND_BASE}"

echo "[phase-2.2] 1) Health backend + frontend..."
wait_for_url "${BACKEND_BASE}/api/v1/health/" "Backend health"
wait_for_url "${FRONTEND_BASE}" "Frontend"

echo "[phase-2.2] 2) Obtener exámenes de catálogo..."
EXAMS_JSON="$(curl -fsS "${BACKEND_BASE}/api/v1/catalog/exams/")"
EXAMS_JSON_PAYLOAD="${EXAMS_JSON}" python3 - <<'PY'
import json, os
exams = json.loads(os.environ.get("EXAMS_JSON_PAYLOAD", "[]") or "[]")
print(f"Exámenes: {len(exams)}")
print("Codes:", ", ".join(sorted({e.get('code','?') for e in exams})))
PY

PAES_ID="$(EXAMS_JSON_PAYLOAD="${EXAMS_JSON}" python3 - <<'PY'
import json, os
exams = json.loads(os.environ.get("EXAMS_JSON_PAYLOAD", "[]") or "[]")
paes = next((e for e in exams if e.get('code') == 'PAES'), None)
print(paes.get('exam_id','') if paes else '')
PY
)"

if [[ -z "${PAES_ID}" ]]; then
  echo "[phase-2.2] ERROR: no se encontró examen PAES en /catalog/exams/" >&2
  exit 1
fi

echo "[phase-2.2] 3) Obtener subjects del examen PAES (exam_id=${PAES_ID})..."
SUBJECTS_JSON="$(curl -fsS "${BACKEND_BASE}/api/v1/catalog/subjects/?exam_id=${PAES_ID}")"
SUBJECTS_JSON_PAYLOAD="${SUBJECTS_JSON}" python3 - <<'PY'
import json, os
subjects = json.loads(os.environ.get("SUBJECTS_JSON_PAYLOAD", "[]") or "[]")
print(f"Subjects PAES: {len(subjects)}")
if subjects:
    first = subjects[0]
    print("Ejemplo:", {
        "subject_id": first.get("subject_id"),
        "subject_code": first.get("subject_code"),
        "name": first.get("name"),
        "topics": len(first.get("topics") or []),
    })
PY

echo "[phase-2.2] 4) Login demo para validar /auth/me..."
LOGIN_RESP="$(curl -sS -X POST "${BACKEND_BASE}/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${DEMO_EMAIL}\",\"password\":\"${DEMO_PASSWORD}\"}" \
  -w $'\n%{http_code}')"
LOGIN_STATUS="${LOGIN_RESP##*$'\n'}"
LOGIN_JSON="${LOGIN_RESP%$'\n'*}"

if [[ "${LOGIN_STATUS}" != "200" ]]; then
  echo "[phase-2.2] ERROR: login devolvió HTTP ${LOGIN_STATUS}" >&2
  echo "Respuesta: ${LOGIN_JSON}" >&2
  echo "Hint: ejecutar dev-up sin --skip-seed o correr seed_user.py" >&2
  exit 1
fi

TOKEN="$(LOGIN_JSON_PAYLOAD="${LOGIN_JSON}" python3 - <<'PY'
import json, os
print(json.loads(os.environ.get("LOGIN_JSON_PAYLOAD", "{}") or "{}").get("access_token") or "")
PY
)"

if [[ -z "${TOKEN}" ]]; then
  echo "[phase-2.2] ERROR: login no devolvió access_token" >&2
  exit 1
fi

echo "[phase-2.2] 5) Validar /auth/me..."
ME_JSON="$(curl -fsS "${BACKEND_BASE}/api/v1/auth/me" -H "Authorization: Bearer ${TOKEN}")"
ME_JSON_PAYLOAD="${ME_JSON}" python3 - <<'PY'
import json, os
me = json.loads(os.environ.get("ME_JSON_PAYLOAD", "{}") or "{}")
required = ["user_id", "email", "name", "is_admin"]
missing = [k for k in required if k not in me]
if missing:
    print("Faltan campos:", missing)
    raise SystemExit(1)
print("/auth/me OK:", {k: me.get(k) for k in required})
PY

echo "[phase-2.2] ✅ OK - Endpoints de Fase 2.2 validados"
