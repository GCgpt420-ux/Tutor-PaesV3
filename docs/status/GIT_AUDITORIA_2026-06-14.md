# Auditoria Git - Tutor-PaesV3

Fecha: 2026-06-14
Repositorio: GCgpt420-ux/Tutor-PaesV3

## 1. Estado General

- Rama actual: main
- Rama principal remota: origin/main
- Remoto configurado: origin

## 2. Conteo de Commits

- Total commits en todo el repositorio: 58
- Commits en main: 29
- Merges en main: 3

## 3. Inventario de Ramas

### 3.1 Ramas locales (4)

- main
- integration/priority1-safe
- agents/que-es-esto-explained
- feature/priority-1-security-testing

### 3.2 Ramas remotas detectadas (7 refs)

- origin/main
- origin/integration/priority1-safe
- origin/feature/priority-1-security-testing
- origin/copilot/explain-repository-structure
- origin/copilot/fix-pull-request-failure
- origin/railway/fix-deploy-11cfd4
- origin/HEAD (referencia simbolica)

## 4. Ramas Fusionadas y Pendientes

### 4.1 Locales ya fusionadas en main

- agents/que-es-esto-explained
- integration/priority1-safe

### 4.2 Locales no fusionadas en main

- feature/priority-1-security-testing

## 5. Divergencia contra main (ramas locales)

- agents/que-es-esto-explained: ahead 0, behind 10
- integration/priority1-safe: ahead 0, behind 5
- feature/priority-1-security-testing: ahead 14, behind 29

Interpretacion rapida:
- agents/que-es-esto-explained e integration/priority1-safe no aportan commits nuevos sobre main.
- feature/priority-1-security-testing si tiene trabajo propio (14 commits) y esta desactualizada respecto a main (29 commits por detras).

## 6. Ultima Actividad por Rama (resumen)

- main: 2026-05-22, c894741, fix(frontend): restore NEXT_PUBLIC_API_URL fallback...
- integration/priority1-safe: 2026-05-22, 9db6bde
- agents/que-es-esto-explained: 2026-05-22, 8974ae8
- feature/priority-1-security-testing: 2026-04-27, c665f99

## 7. Arbol Git (ultimos 35 commits)

```text
* c894741 (HEAD -> main, origin/main, origin/HEAD) fix(frontend): restore NEXT_PUBLIC_API_URL fallback to fix proxy fetch failed
* 9f047ec fix(tests): expect warning instead of RuntimeError for missing REDIS_URL
*   cafcb8a Merge priority1-safe into main
|\
| * 9db6bde (origin/integration/priority1-safe, integration/priority1-safe) fix(config): change REDIS_URL missing from error to warning to prevent backend crash
* | 73422ae fix(config): change REDIS_URL missing from error to warning to prevent backend crash
* | b2cb5ab priemr marge pull
|\|
| * 4e03ad0 fix(ci): use master tag for trivy and make e2e tests non-blocking
| * fe08166 fix(ci): solve dependency conflicts and make security audits non-blocking
| * 64f4918 fix(ci): stabilize jest, security scans, a11y and e2e db config
| * 3b3f4bd fix(ci): resolve backend quiz and frontend lint/typecheck issues
| * 8974ae8 (agents/que-es-esto-explained) chore(docs): reorganize status reports and add navigation map
| * cbeda93 feat(integration): integrate priority-1 technical blocks only
| * 4eb6e3f chore(ci): add horizon-0 smoke gate to Railway predeploy
| * daa7d1f docs(strategy): add comprehensive project scenario research
| * c3c996c feat(ai): contextualize tutor chat and upgrade educational persona
|/
* 3095845 (origin/copilot/explain-repository-structure) fix(csp): usa unsafe-inline en produccion para compatibilidad con Next.js static chunks
* 0de38cf fix(railway): wrap startCommand in sh -c for shell variable expansion
* 53bde84 fix(config): elimina PAYMENT_RETURN_URL del check de arranque (es Optional)
*   861144f Merge pull request #2 from GCgpt420-ux/railway/fix-deploy-11cfd4
|\
| * 37df58d (origin/railway/fix-deploy-11cfd4) fix: move alembic migrations to preDeployCommand in railway.json
|/
* b2c8ae4 fix(railway): ejecuta alembic upgrade head antes de iniciar uvicorn
* 05fedf2 feat(deploy): integra cambios de voz, auth, quiz, UI y tests para Railway
* 9221cef chore(security): sanitiza hardcodeos y parametriza credenciales locales
* 5cf44a2 chore(deploy): preparacion para despliegue en Vercel/Railway
...
```

## 8. Estado del Working Tree (importante antes de ordenar)

Se detectaron cambios sin commit:

- Modificado:
  - tutorpaes/backend/app/services/chatbot_service.py

- No trackeados (ejemplos):
  - DOCS/CONTEXTO_GLOBAL_TUTOR_PAES.md
  - docs/status/ARTEFACTO6_CONTEXTO_INTEGRAL_2026-05-28.txt
  - docs/status/INVESTIGACION_CHAT_MULTIVOCAL_2026-05-28.txt
  - venvs y reportes de test/playwright

Conclusión:
Antes de borrar ramas o hacer limpieza fuerte, conviene guardar el estado actual (commit o stash selectivo).

## 9. Que Commits necesitas revisar para organizar desde hoy

Si quieres priorizar lo realmente util para ordenar el repo, revisa en este orden:

1. Los 14 commits unicos de feature/priority-1-security-testing (porque no estan en main).
2. Los commits de integracion ya absorbidos en main (para documentar cierre de ramas).
3. Los commits con prefijo fix(ci), fix(config), feat(ai), chore(security) para agrupar por tema.

## 10. Plan de Organizacion Recomendado

### Fase A - Higiene inmediata

1. Respaldar cambios locales actuales.
2. Confirmar si feature/priority-1-security-testing se conserva, integra o archiva.
3. Eliminar ramas locales ya fusionadas:
   - agents/que-es-esto-explained
   - integration/priority1-safe

### Fase B - Orden historico

1. Crear un changelog por bloques tematicos:
   - Infra/CI
   - Seguridad
   - IA/chat
   - Frontend/proxy
2. Etiquetar hitos (tags) por entregas importantes.

### Fase C - Politica de ramas

1. Mantener main como estable.
2. Usar ramas cortas por feature/fix.
3. Cerrar ramas remotas de Copilot o deploy que ya no aportan.

## 11. Respuesta directa a tu pregunta

- Main del proyecto: main
- Ramas locales: 4
- Ramas remotas (refs): 7
- Commits totales del repo: 58
- Commits en main: 29
- Ramas sueltas utiles hoy: feature/priority-1-security-testing (porque tiene 14 commits no integrados)

