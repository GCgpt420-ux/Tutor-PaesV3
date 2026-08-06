#!/usr/bin/env bash
# scripts/seed-teacher.sh
# Seer script to populate teacher and classroom analytics data.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "=== Seeding Teacher & Classroom Data ==="
cd "${ROOT_DIR}"

if [ ! -f "tutorpaes/backend/.env" ]; then
    echo "Error: backend/.env not found."
    exit 1
fi

export $(cat tutorpaes/backend/.env | grep -v ^# | xargs)
export PYTHONPATH=tutorpaes/backend

echo "Corriendo script de carga..."
./tutorpaes/backend/venv/bin/python /home/gabriel/.gemini/antigravity-cli/brain/7bf0dbbe-aefc-42d4-9346-d8b6f0a46800/scratch/seed_teacher_data.py

echo "=== Carga finalizada exitosamente ==="
