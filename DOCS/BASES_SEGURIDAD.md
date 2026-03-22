# Bases de Seguridad del Proyecto

## 1. Objetivo
Definir controles minimos de seguridad para operacion local, staging y produccion.

## 2. Principios
- Minimo privilegio.
- Secretos fuera del codigo.
- Validacion defensiva de entradas.
- Trazabilidad de errores y eventos.

## 3. Gestion de secretos
1. No almacenar secretos en codigo fuente.
2. Usar variables de entorno para:
   - `SECRET_KEY`
   - `DATABASE_URL`
   - `TBK_API_KEY`
   - `OPENAI_API_KEY`
3. Mantener `.env.example` sin credenciales reales.
4. Rotar secretos en cada incidente o exposicion.

## 4. Autenticacion y sesion
1. JWT con expiracion definida.
2. Validacion de expiracion en cliente y backend.
3. Manejo explicito de 401 para cerrar sesion.
4. Evaluar refresh token y revocacion en roadmap de seguridad.

## 5. Seguridad API
1. Validar payloads con Pydantic.
2. Retornar codigos HTTP coherentes:
   - 401 para auth invalida.
   - 403 para acceso no permitido.
   - 503 para dependencia critica no disponible.
3. Incorporar rate limiting para endpoints sensibles:
   - login
   - register
   - reset/change password

## 6. Seguridad en pagos
1. Todo el procesamiento de transacciones debe residir en backend.
2. Frontend solo consume endpoints proxy/backend.
3. Confirmar firma/estado de pago en backend antes de activar beneficios.
4. Registrar auditoria minima de transacciones.

## 7. Seguridad en IA
1. API keys solo en backend.
2. Sanitizar entradas de prompts y limitar longitud.
3. Definir fallback seguro si proveedor IA falla.
4. Registrar costos, latencia y errores por uso de IA.

## 8. CORS y cabeceras
1. Restringir `CORS_ORIGINS` en produccion a dominios oficiales.
2. Evitar metodos/cabeceras excesivamente permisivos.
3. Aplicar cabeceras de seguridad en gateway/reverse proxy.

## 9. Observabilidad y respuesta
1. Registrar errores con contexto suficiente, sin exponer secretos.
2. Incorporar plataforma de error tracking.
3. Definir runbook de incidentes:
   - deteccion
   - contencion
   - recuperacion
   - postmortem

## 10. Checklist base para release
- Secretos validados en entorno.
- Endpoints criticos probados.
- Dependencias auditadas.
- Logs y alertas activos.
- Backup y rollback definidos.
