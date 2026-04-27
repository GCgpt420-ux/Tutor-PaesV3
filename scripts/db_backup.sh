#!/bin/bash

# ==============================================================================
# TutorPAES - Database Backup Script
# ==============================================================================
# Description: Creates a compressed PostgreSQL dump and manages local rotation.
# Usage: ./db_backup.sh
# ==============================================================================

# 1. CONFIGURATION
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
DB_NAME="mvp_db" # Change if different
DB_USER="mvp"
DB_HOST="localhost"
BACKUP_NAME="tutorpaes_db_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=7

# Load environment variables if .env exists
if [ -f ../backend/.env ]; then
    export $(grep -v '^#' ../backend/.env | xargs)
    # Extract DB name from DATABASE_URL if needed
    # (Simplified for this script)
fi

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "--- Starting Backup: $TIMESTAMP ---"

# 2. CREATE DUMP
# Note: Assumes .pgpass is configured or PG_PASSWORD env is set
pg_dump -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" | gzip > "${BACKUP_DIR}/${BACKUP_NAME}"

if [ $? -eq 0 ]; then
    echo "✅ Backup successful: ${BACKUP_DIR}/${BACKUP_NAME}"
else
    echo "❌ Backup failed!"
    exit 1
fi

# 3. ROTATION (Keep last N days)
echo "--- Cleaning up old backups (Retention: $RETENTION_DAYS days) ---"
find "$BACKUP_DIR" -name "tutorpaes_db_*.sql.gz" -mtime +"$RETENTION_DAYS" -exec rm {} \;

# 4. OPTIONAL: S3/Cloud Storage Upload
# If you have AWS CLI configured:
# aws s3 cp "${BACKUP_DIR}/${BACKUP_NAME}" s3://your-bucket/backups/

echo "--- Backup process finished ---"
