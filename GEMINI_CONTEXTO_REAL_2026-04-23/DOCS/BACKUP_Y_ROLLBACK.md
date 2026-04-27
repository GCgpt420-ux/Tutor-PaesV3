# Backup y Rollback de Base de Datos

## Estado del documento
- Tipo: documento operativo.
- Estado: vigente.
- Ultima actualizacion: 2026-03-15.

## Objetivo
Definir un proceso automatizado y repetible para backup y rollback de PostgreSQL, minimizando tiempo de recuperacion ante incidentes.

## Alcance
- Base de datos del backend TutorPAES.
- Backups logicos mediante `pg_dump`.
- Restore/rollback mediante `pg_restore`.

## Procedimiento principal

### 1. Backup automatizado (CI)
- Workflow: `.github/workflows/db-backup.yml`.
- Frecuencia: diaria (cron) y manual (`workflow_dispatch`).
- Secret requerido:
  - `BACKUP_DATABASE_URL`: URL de conexion a PostgreSQL a respaldar.

Resultado esperado:
- Artefacto con archivos `.dump`, `.meta` y `.sha256`.

### 2. Backup manual (local/servidor)
Comando:

```bash
DATABASE_URL="postgresql+psycopg://user:pass@host:5432/db" \
BACKUP_DIR="./backups/db" \
BACKUP_RETENTION_DAYS=14 \
bash scripts/db-backup.sh
```

### 3. Restore controlado
Comando:

```bash
BACKUP_FILE="./backups/db/tutorpaes_YYYYMMDDTHHMMSSZ.dump" \
TARGET_DATABASE_URL="postgresql+psycopg://user:pass@host:5432/db" \
ALLOW_DESTRUCTIVE_RESTORE=yes \
bash scripts/db-restore.sh
```

### 4. Rollback rapido al ultimo backup
Comando:

```bash
TARGET_DATABASE_URL="postgresql+psycopg://user:pass@host:5432/db" \
ALLOW_DESTRUCTIVE_RESTORE=yes \
bash scripts/db-rollback.sh
```

## Criterios de validacion
- Se genera archivo `.dump` con checksum asociado.
- El restore finaliza sin errores de `pg_restore`.
- El sistema responde `200` en `/api/v1/health/readiness` despues del rollback.
- Smoke tests minimos de auth y pagos pasan tras restauracion.

## Referencias relacionadas
- `scripts/db-backup.sh`
- `scripts/db-restore.sh`
- `scripts/db-rollback.sh`
- `DOCS/CHECKLIST_DESPLIEGUE_PREPROD_PROD.md`
- `DOCS/PROCESOS_OPERATIVOS.md`
