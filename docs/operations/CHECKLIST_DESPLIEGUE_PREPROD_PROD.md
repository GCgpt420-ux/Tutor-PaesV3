# Checklist de Despliegue (Preprod -> Prod)

## Objetivo
Estandarizar el proceso de despliegue para minimizar regresiones en autenticacion, pagos y disponibilidad.

## Alcance
- Backend FastAPI (`tutorpaes/backend`)
- Frontend Next.js (`tutorpaes/frontend`)
- Integracion de pagos (Transbank)
- Integracion de IA (OpenAI)

## 1) Gate de Pre-Deploy (bloqueante)

### 1.1 Seguridad y configuracion
- [ ] Variables criticas presentes en runtime:
  - [ ] `DATABASE_URL`
  - [ ] `SECRET_KEY`
  - [ ] `PAYMENT_RETURN_URL`
  - [ ] `OPENAI_API_KEY` (si IA activa)
- [ ] `SECRET_KEY` con longitud >= 32 y fuera de repositorio.
- [ ] Cookies de sesion en frontend validadas:
  - [ ] `HttpOnly`
  - [ ] `Secure` (en HTTPS)
  - [ ] `SameSite` apropiado al flujo

### 1.2 Calidad y regresion
- [ ] Backend CI en verde (compile + import + tests).
- [ ] Frontend CI en verde (lint/typecheck/build).
- [ ] Suite de backend passing local/staging:
  - [ ] Auth (`tests/test_auth`)
  - [ ] Security (`tests/test_security`)
  - [ ] Payments (`tests/test_payments`)
  - [ ] Health (`tests/test_health`)

### 1.3 Base de datos y migraciones
- [ ] Revisar migraciones pendientes en staging.
- [ ] Ejecutar migraciones en staging y validar arranque de app.
- [ ] Definir ventana de deploy y backup previo de DB de produccion.

## 2) Smoke Tests en Staging (bloqueante)

### 2.1 API/Salud
- [ ] `GET /api/v1/health` -> 200.
- [ ] `GET /api/v1/health/readiness` -> 200 (verifica DB).

### 2.2 Auth
- [ ] Login exitoso crea cookie de sesion.
- [ ] Token expirado refresca via endpoint de refresh.
- [ ] Endpoint protegido rechaza token invalido/expirado.

### 2.3 Pagos
- [ ] Inicio de pago crea transaccion sin error.
- [ ] Callback server-to-server confirma pago sin depender de sesion interactiva.
- [ ] Repetir callback no duplica efectos (idempotencia).
- [ ] Estados finales consistentes (`authorized` o `failed`).

### 2.4 IA
- [ ] Generacion de feedback IA responde en tiempo razonable.
- [ ] Verificar aislamiento por usuario (sin IDOR).

## 3) Deploy a Produccion

### 3.1 Estrategia
- [ ] Deploy en ventana controlada.
- [ ] Responsable tecnico on-call asignado.
- [ ] Canal de incidentes habilitado (Slack/Teams/WhatsApp interno).

### 3.2 Orden recomendado
1. Aplicar migraciones.
2. Desplegar backend.
3. Verificar `health/readiness`.
4. Desplegar frontend.
5. Ejecutar smoke tests minimos de extremo a extremo.

## 4) Post-Deploy (primeros 30 minutos)

### 4.1 Monitoreo operativo
- [ ] Error rate API < umbral definido.
- [ ] Latencia p95 endpoints criticos dentro de rango.
- [ ] Tasa de login fallido anomala = no.
- [ ] Tasa de confirmacion de pagos exitosa en rango esperado.

### 4.2 Monitoreo funcional
- [ ] Usuarios pueden iniciar/cerrar sesion.
- [ ] Flujo de compra completo finaliza correctamente.
- [ ] IA responde para usuarios autenticados sin fuga de datos.

## 5) Criterios de Rollback

Ejecutar rollback si se cumple cualquiera:
- [ ] `readiness` falla por mas de 5 minutos.
- [ ] Incremento sostenido de errores 5xx por sobre umbral.
- [ ] Pagos quedan en estado inconsistente o sin confirmacion.
- [ ] Fallo de autenticacion masivo en usuarios validos.

## 6) Plan de Rollback

1. Congelar nuevos deploys.
2. Revertir frontend a release estable anterior.
3. Revertir backend a imagen estable anterior.
4. Validar `health` y `readiness`.
5. Si aplica, ejecutar plan de restauracion/rollback de migracion.
6. Comunicar estado y ETA al equipo.

## 7) Evidencia Minima a Registrar
- [ ] SHA backend desplegado.
- [ ] SHA frontend desplegado.
- [ ] Resultado de CI (links de ejecucion).
- [ ] Resultado smoke tests (capturas/logs).
- [ ] Decision final: aprobado/no aprobado y responsable.

## 8) Comandos de Referencia

Backend tests:

```bash
cd tutorpaes/backend
python -m pytest -q
```

Frontend checks:

```bash
cd tutorpaes/frontend
npm ci
npm run lint
npm run typecheck
npm run build
```

Health checks:

```bash
curl -fsS https://<host>/api/v1/health
curl -fsS https://<host>/api/v1/health/readiness
```
