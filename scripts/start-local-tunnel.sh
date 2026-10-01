#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# TutorPAES: Servidor Local de Respaldo con Túnel Seguro Cloudflare
# ==============================================================================
# Este script levanta el backend FastAPI + PostgreSQL en tu máquina
# y expone el puerto 8001 a Internet con HTTPS instantáneo vía Cloudflare Tunnel.
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/tutorpaes/backend"

echo "=========================================================="
echo "🚀 Levantando Servidor Local TutorPAES (Plan de Respaldo)"
echo "=========================================================="

# 1. Verificar y levantar PostgreSQL
echo "📦 [1/4] Verificando PostgreSQL (Docker)..."
cd "${BACKEND_DIR}"
docker compose up -d

echo "⏳ Esperando 2 segundos para que PostgreSQL esté listo..."
sleep 2

# 2. Aplicar migraciones
echo "🔄 [2/4] Verificando migraciones de base de datos..."
uv run alembic upgrade head

# 3. Iniciar backend FastAPI en segundo plano
echo "⚡ [3/4] Iniciando FastAPI en el puerto 8001..."
uv run uvicorn app.main:app --host 0.0.0.0 --port 8001 --workers 2 > "${ROOT_DIR}/.runtime_backend.log" 2>&1 &
BACKEND_PID=$!

cleanup() {
    echo ""
    echo "🛑 Apagando backend local (PID: ${BACKEND_PID})..."
    kill "${BACKEND_PID}" 2>/dev/null || true
    echo "✅ Servidor local detenido."
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Esperar que el backend responda en local
echo "⏳ Esperando respuesta del backend..."
for i in {1..30}; do
    if curl -s http://127.0.0.1:8001/api/v1/health >/dev/null 2>&1; then
        echo "✅ Backend respondiendo en http://127.0.0.1:8001"
        break
    fi
    sleep 0.5
done

# 4. Iniciar túnel de Cloudflare
echo "🌐 [4/4] Estableciendo Túnel HTTPS Seguro con Cloudflare..."
echo "----------------------------------------------------------"
echo "👇 Tu URL pública aparecerá a continuación:"
echo "----------------------------------------------------------"

docker run --rm --net=host cloudflare/cloudflared:latest tunnel --url http://127.0.0.1:8001
