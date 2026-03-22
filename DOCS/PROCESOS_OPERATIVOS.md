# Procesos Operativos del Proyecto

## 1. Alcance
Este documento define los procesos tecnicos para operar, validar y mantener el proyecto en entorno local y de despliegue.

## 2. Proceso de arranque local
## 2.1 Prerrequisitos
- Docker activo.
- Node.js y npm instalados.
- Python con entorno virtual funcional en backend.

## 2.2 Secuencia
1. Levantar stack local:
   - `scripts/dev-up.sh`
2. Verificar disponibilidad:
   - Backend health: `GET /api/v1/health/`
   - Frontend: puerto 3000.
3. Apagar stack:
   - `scripts/dev-down.sh`

## 3. Proceso de migraciones y seed
1. Ejecutar migraciones Alembic.
2. Cargar seed idempotente de examenes, preguntas y usuario demo.
3. Confirmar que endpoints de auth y quiz responden en entorno local.

## 4. Proceso de QA funcional minimo
## 4.1 Auth
1. Login exitoso con usuario demo.
2. Login con DB caida debe devolver 503.
3. Ruta protegida con token expirado debe redirigir a login.

## 4.2 Quiz
1. Obtener pregunta de tema.
2. Responder pregunta.
3. Validar feedback y estado del intento.

## 4.3 Pagos
1. Crear orden de pago.
2. Verificar que retorna URL y token.
3. Consultar estado de pago por ID.

## 5. Proceso de cambios y revision
1. Crear cambio pequeno y autocontenido.
2. Ejecutar pruebas locales del modulo afectado.
3. Revisar errores en backend/frontend.
4. Documentar decisiones tecnicas y riesgos.

## 6. Convenciones de documentacion
- Sin emojis.
- En espanol tecnico claro.
- Secciones con objetivo, pasos y resultado esperado.
- Mantener archivos cortos y orientados a accion.

## 7. Criterios de aceptacion por entrega
- Compila frontend.
- Backend responde en health.
- No introduce errores nuevos en problemas del editor.
- Incluye nota de impacto y validacion realizada.

## 8. Mantenimiento continuo
- Revisar dependencias periodicamente.
- Limpiar archivos legacy no usados.
- Verificar que `node_modules`, `.next` y artefactos no afecten estado del repositorio.

## 9. Backup y rollback de base de datos
1. Ejecutar respaldo automatico diario por workflow `db-backup.yml`.
2. Validar restauracion de prueba al menos una vez por sprint.
3. Ante incidente, ejecutar rollback con `scripts/db-rollback.sh`.
4. Usar runbook canónico: `DOCS/BACKUP_Y_ROLLBACK.md`.
