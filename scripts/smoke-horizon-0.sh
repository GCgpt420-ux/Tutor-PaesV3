#!/usr/bin/env bash
set -euo pipefail

# Smoke test Horizonte 0 (estabilizacion inteligente)
# Flujos criticos:
# 1) Login
# 2) Apertura de Quiz
# 3) Respuesta de Pregunta
# 4) Conversacion con IA (SSE)
# 5) Inicio de Pago

BACKEND_BASE="${BACKEND_BASE:-http://127.0.0.1:8000}"
FRONTEND_BASE="${FRONTEND_BASE:-http://127.0.0.1:3000}"
DEMO_EMAIL="${DEMO_EMAIL:-demo@example.com}"
DEMO_PASSWORD="${DEMO_PASSWORD:-demo123}"
SUBJECT_CODE="${SUBJECT_CODE:-M1}"
TOPIC_CODE="${TOPIC_CODE:-ALG}"
PAYMENT_PLAN="${PAYMENT_PLAN:-monthly}"

if [[ "${PAYMENT_PLAN}" != "monthly" && "${PAYMENT_PLAN}" != "annual" ]]; then
  echo "[h0-smoke] ERROR: PAYMENT_PLAN debe ser monthly o annual" >&2
  exit 1
fi

wait_for_url() {
  local url="$1"
  local label="$2"
  local attempts="${3:-80}"
  local sleep_s="${4:-0.25}"

  for _ in $(seq 1 "$attempts"); do
    if curl -fsS --max-time 2 "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep "$sleep_s"
  done

  echo "[h0-smoke] ERROR: ${label} no respondio a tiempo (${url})" >&2
  return 1
}

http_json_post() {
  local url="$1"
  local token="$2"
  local body="$3"

  if [[ -n "$token" ]]; then
    curl -sS -X POST "$url" \
      -H 'Content-Type: application/json' \
      -H "Authorization: Bearer ${token}" \
      -d "$body" \
      -w $'\n%{http_code}'
  else
    curl -sS -X POST "$url" \
      -H 'Content-Type: application/json' \
      -d "$body" \
      -w $'\n%{http_code}'
  fi
}

echo "[h0-smoke] Backend:  ${BACKEND_BASE}"
echo "[h0-smoke] Frontend: ${FRONTEND_BASE}"

echo "[h0-smoke] Pre-check: health backend/frontend"
wait_for_url "${BACKEND_BASE}/api/v1/health/" "Backend health"
wait_for_url "${FRONTEND_BASE}" "Frontend"

HEALTH_JSON="$(curl -fsS "${BACKEND_BASE}/api/v1/health/")"
python3 - <<'PY' "$HEALTH_JSON"
import json, sys
health = json.loads(sys.argv[1])
status = health.get("status")
if status != "ok":
    raise SystemExit(f"Health invalido: {health}")
print("[h0-smoke] Health OK:", health)
PY

echo "[h0-smoke] 1/5 Login"
LOGIN_RESP="$(http_json_post "${BACKEND_BASE}/api/v1/auth/login" "" "{\"email\":\"${DEMO_EMAIL}\",\"password\":\"${DEMO_PASSWORD}\"}")"
LOGIN_STATUS="${LOGIN_RESP##*$'\n'}"
LOGIN_JSON="${LOGIN_RESP%$'\n'*}"

if [[ "${LOGIN_STATUS}" != "200" ]]; then
  echo "[h0-smoke] ERROR: login fallo HTTP ${LOGIN_STATUS}" >&2
  echo "[h0-smoke] Body: ${LOGIN_JSON}" >&2
  echo "[h0-smoke] Hint: define DEMO_EMAIL/DEMO_PASSWORD con un usuario valido del entorno objetivo." >&2
  echo "[h0-smoke] Ejemplo: DEMO_EMAIL='tu@correo.cl' DEMO_PASSWORD='tu_clave' ./scripts/smoke-horizon-0.sh" >&2
  exit 1
fi

TOKEN="$(python3 - <<'PY' "$LOGIN_JSON"
import json, sys
obj = json.loads(sys.argv[1])
print(obj.get("access_token", ""))
PY
)"

USER_ID="$(python3 - <<'PY' "$LOGIN_JSON"
import json, sys
obj = json.loads(sys.argv[1])
print(obj.get("user_id", ""))
PY
)"

if [[ -z "${TOKEN}" || -z "${USER_ID}" ]]; then
  echo "[h0-smoke] ERROR: login no devolvio access_token/user_id" >&2
  exit 1
fi

echo "[h0-smoke] Login OK user_id=${USER_ID}"

echo "[h0-smoke] 2/5 Apertura de Quiz"
QUESTION_RESP="$(curl -sS "${BACKEND_BASE}/api/v1/quiz/next-question?subject_code=${SUBJECT_CODE}&topic_code=${TOPIC_CODE}" -H "Authorization: Bearer ${TOKEN}" -w $'\n%{http_code}')"
QUESTION_STATUS="${QUESTION_RESP##*$'\n'}"
QUESTION_JSON="${QUESTION_RESP%$'\n'*}"

if [[ "${QUESTION_STATUS}" != "200" ]]; then
  echo "[h0-smoke] ERROR: next-question fallo HTTP ${QUESTION_STATUS}" >&2
  echo "[h0-smoke] Body: ${QUESTION_JSON}" >&2
  exit 1
fi

QUESTION_KIND="$(python3 - <<'PY' "$QUESTION_JSON"
import json, sys
obj = json.loads(sys.argv[1])
print(obj.get("kind", ""))
PY
)"

if [[ "${QUESTION_KIND}" != "question" ]]; then
  echo "[h0-smoke] ERROR: no se obtuvo pregunta activa. kind=${QUESTION_KIND}" >&2
  echo "[h0-smoke] Body: ${QUESTION_JSON}" >&2
  exit 1
fi

read -r QUESTION_ID SELECTED_CHOICE_ID SELECTED_LABEL SELECTED_TEXT <<EOF
$(python3 - <<'PY' "$QUESTION_JSON"
import json, sys
obj = json.loads(sys.argv[1])
choices = obj.get("choices") or []
if not choices:
    raise SystemExit("No hay alternativas en question payload")
first = choices[0]
qid = obj.get("question_id")
cid = first.get("id")
label = first.get("label", "")
text = (first.get("text", "") or "").replace("\n", " ").replace("\t", " ")
if not qid or not cid:
    raise SystemExit(f"Payload invalido: question_id={qid}, choice_id={cid}")
print(qid, cid, label, text[:80])
PY
)
EOF

echo "[h0-smoke] Quiz OK question_id=${QUESTION_ID} choice=${SELECTED_LABEL}"

echo "[h0-smoke] 3/5 Respuesta de Pregunta"
ANSWER_BODY="{\"subject_code\":\"${SUBJECT_CODE}\",\"topic_code\":\"${TOPIC_CODE}\",\"question_id\":${QUESTION_ID},\"selected_choice_id\":${SELECTED_CHOICE_ID}}"
ANSWER_RESP="$(http_json_post "${BACKEND_BASE}/api/v1/quiz/answer" "${TOKEN}" "${ANSWER_BODY}")"
ANSWER_STATUS="${ANSWER_RESP##*$'\n'}"
ANSWER_JSON="${ANSWER_RESP%$'\n'*}"

if [[ "${ANSWER_STATUS}" != "200" ]]; then
  echo "[h0-smoke] ERROR: submit answer fallo HTTP ${ANSWER_STATUS}" >&2
  echo "[h0-smoke] Body: ${ANSWER_JSON}" >&2
  exit 1
fi

ATTEMPT_ID="$(python3 - <<'PY' "$ANSWER_JSON"
import json, sys
obj = json.loads(sys.argv[1])
print(obj.get("attempt_id", ""))
PY
)"

IS_CORRECT="$(python3 - <<'PY' "$ANSWER_JSON"
import json, sys
obj = json.loads(sys.argv[1])
print(obj.get("is_correct"))
PY
)"

if [[ -z "${ATTEMPT_ID}" ]]; then
  echo "[h0-smoke] ERROR: answer no devolvio attempt_id" >&2
  echo "[h0-smoke] Body: ${ANSWER_JSON}" >&2
  exit 1
fi

echo "[h0-smoke] Answer OK attempt_id=${ATTEMPT_ID} is_correct=${IS_CORRECT}"

echo "[h0-smoke] 4/5 Conversacion con IA (SSE)"
CHAT_BODY="{\"message\":\"Explícame en un paso corto por qué esta alternativa puede estar bien o mal.\",\"attempt_id\":${ATTEMPT_ID},\"question_context\":{\"subject_code\":\"${SUBJECT_CODE}\",\"topic_code\":\"${TOPIC_CODE}\",\"question_id\":${QUESTION_ID},\"selected_choice_label\":\"${SELECTED_LABEL}\",\"selected_choice_text\":\"${SELECTED_TEXT}\"}}"

SSE_OUTPUT="$(curl -sS -N -m 40 "${BACKEND_BASE}/api/v1/ai/chat" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "${CHAT_BODY}")"

if [[ -z "${SSE_OUTPUT}" ]]; then
  echo "[h0-smoke] ERROR: chat SSE sin salida" >&2
  exit 1
fi

if ! printf '%s' "${SSE_OUTPUT}" | grep -q "data:"; then
  echo "[h0-smoke] ERROR: chat SSE no contiene eventos data:" >&2
  echo "[h0-smoke] Output: ${SSE_OUTPUT}" >&2
  exit 1
fi

echo "[h0-smoke] Chat IA OK (SSE recibido)"

echo "[h0-smoke] 5/5 Inicio de Pago"
PAYMENT_RESP="$(http_json_post "${BACKEND_BASE}/api/v1/payments/create" "${TOKEN}" "{\"plan\":\"${PAYMENT_PLAN}\"}")"
PAYMENT_STATUS="${PAYMENT_RESP##*$'\n'}"
PAYMENT_JSON="${PAYMENT_RESP%$'\n'*}"

if [[ "${PAYMENT_STATUS}" != "200" ]]; then
  echo "[h0-smoke] ERROR: payment create fallo HTTP ${PAYMENT_STATUS}" >&2
  echo "[h0-smoke] Body: ${PAYMENT_JSON}" >&2
  exit 1
fi

python3 - <<'PY' "$PAYMENT_JSON"
import json, sys
obj = json.loads(sys.argv[1])
required = ["url", "buy_order", "token_ws"]
missing = [k for k in required if not obj.get(k)]
if missing:
    raise SystemExit(f"Payment response incompleta. Faltan: {missing} | body={obj}")
print("[h0-smoke] Payment create OK:", {k: obj.get(k) for k in required})
PY

echo "[h0-smoke] ✅ TODO OK - 5/5 flujos criticos validados"
