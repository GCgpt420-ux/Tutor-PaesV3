# Deuda Técnica y Hardcodeo — TutorPAES V3
**Fecha de auditoría:** 1 de Octubre de 2026  
**Auditor:** Orquestador Agy (w3:p1)  
**Estado:** Solo documentar — no cambiar antes del sábado 3 de Octubre.

---

## 1. TODOs Pendientes en el Código

| Archivo | Línea | Descripción |
|:---|:---:|:---|
| `tutorpaes/backend/app/services/invoice_service.py` | L221 | `TODO: Implementar generación real de PDF` — actualmente el endpoint de facturas devuelve un placeholder |
| `tutorpaes/backend/app/api/v1/endpoints/payments.py` | L352 | `TODO: Implementar generación real de PDF` — duplicado del anterior |

**Impacto para el piloto:** Ninguno. El sistema de pagos no se usa en el piloto.

---

## 2. Valores Hardcodeados

### Backend (`tutorpaes/backend/app/core/config.py`)

| Valor | Descripción | Riesgo |
|:---|:---|:---:|
| `default="http://localhost:3000"` (L40, L149, L197) | URL del frontend hardcodeada como default para CORS | Bajo — es un default que se puede overridear con ENV |
| `DEMO_PASSWORD: str = "demo123"` (L59) | Contraseña de la cuenta demo en el código fuente | Medio — debería estar solo en `.env` |
| `DEMO_STUDENT_PASSWORD: str = "demo123"` (L61) | Ídem | Medio |

### Frontend (`tutorpaes/frontend/src/lib/server/auth-session.ts`)

| Valor | Descripción | Riesgo |
|:---|:---:|:---:|
| `'http://127.0.0.1:8001'` (L9) | URL del backend hardcodeada en el server-side auth | Alto — en producción/túnel esto falla si el backend no está en localhost |

> ⚠️ **Este último punto es crítico para el sábado.** Si el frontend se sirve desde el túnel pero llama a `http://127.0.0.1:8001` en el server-side, la autenticación fallará para los alumnos. **Verificar que este valor se resuelve correctamente via variable de entorno `NEXT_PUBLIC_API_URL` o `API_BASE_URL`.**

### Scripts de Seed

| Archivo | Valor Hardcodeado | Descripción |
|:---|:---|:---|
| `scripts/seed_pilot_users.py` | `PILOT_PASSWORD = "paes2026"` | Contraseña de todas las cuentas piloto en el código |
| `scripts/seed_pilot_users.py` | `subject_id == 1`, `subject_id == 4`, etc. | IDs de materias hardcodeados — si cambia el orden de inserción, las métricas sintéticas se rompen |
| `scripts/seed_pilot_users.py` | Emails `alumno01@tutorpaes.cl` | Hardcodeados en lista Python |

---

## 3. Inconsistencia de Tokens Tailwind

Existe un **sistema dual de tokens** que genera inconsistencias visuales:

### Sistema Antiguo (por eliminar eventualmente)
```
paes-dark, paes-darker, paes-card, paes-border
paes-text, paes-text-secondary
paes-emerald, paes-blue
```

### Sistema Nuevo (canónico)
```
brand-primary, brand-accent, brand-secondary, brand-danger
surface-base, surface-default, surface-raised, surface-container
text-primary, text-secondary, text-tertiary
```

**Dónde se usa cada sistema:**
- Las vistas viejas (billing, auth form) usan el sistema `paes-*`.
- Las vistas nuevas (dashboard, teacher view, quiz) usan el sistema `brand-*`.
- El resultado es que hay inconsistencia de colores entre secciones.

**Acción post-sábado:** Migración completa al sistema `brand-*` + coordinar con el diseñador para Noviembre.

---

## 4. Componentes con Lógica Duplicada

| Patrón | Ubicación | Descripción |
|:---|:---|:---|
| Cálculo de precisión | `exam-results-view.tsx` y `teacher.py` | El % de accuracy se calcula en frontend y backend con lógicas similares pero no idénticas |
| Auth check | Varios components | `getCurrentUser()` se llama en múltiples componentes en vez de un contexto global |
| Error states | Múltiples vistas | Cada vista tiene su propio bloque de error UI en vez de un componente compartido `<ErrorCard>` |

---

## 5. Deuda de Seguridad (Menor, No Bloquea Piloto)

| Item | Descripción |
|:---|:---|
| `SECRET_KEY` por default | Si `.env` no está configurado, el sistema usa una clave de ejemplo — bloquear arranque en `ENVIRONMENT=production` |
| Contraseñas en código fuente | `DEMO_PASSWORD` debería ser siempre obligatoria via ENV, nunca default en código |
| Sin rate limit en `/ai/chat` para el sábado | Con 20 alumnos simultáneos podría haber presión sobre el LLM. El circuit breaker ya existe pero considerar un límite más bajo. |

---

*Próxima revisión: Después del Piloto 1 (Sábado 3 Oct) — priorizar fixes según impacto real.*
