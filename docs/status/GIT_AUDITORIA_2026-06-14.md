# Auditoria Git - Tutor-PaesV3

Fecha: 2026-06-15 (actualizada)
Repositorio: GCgpt420-ux/Tutor-PaesV3

## 1. Estado General

- Rama actual: main
- Rama principal remota: origin/main
- Remoto configurado: origin
- Sin cambios locales pendientes (working tree limpio)

## 2. Conteo de Commits

- Total commits en todo el repositorio: 60
- Commits en main: 31
- Merges en main: 3

## 3. Inventario de Ramas

### 3.1 Ramas locales (2)

- main
- feature/priority-1-security-testing

### 3.2 Ramas remotas detectadas (4 refs bajo origin)

- origin/main
- origin/feature/priority-1-security-testing
- origin/copilot/fix-pull-request-failure
- origin (referencia simbolica)

## 4. Limpieza Realizada

Se completaron las siguientes acciones de orden:

1. Se eliminó worktree roto de agents/que-es-esto-explained y se aplicó prune.
2. Se eliminaron ramas locales fusionadas:
  - agents/que-es-esto-explained
  - integration/priority1-safe
3. Se eliminaron ramas remotas fusionadas:
  - origin/integration/priority1-safe
  - origin/copilot/explain-repository-structure
  - origin/railway/fix-deploy-11cfd4
4. Se consolidó .gitignore para excluir artefactos locales de pruebas/reportes.

## 5. Ramas Pendientes

### 5.1 Locales no fusionadas en main

- feature/priority-1-security-testing

### 5.2 Divergencia contra main

- feature/priority-1-security-testing: ahead 14, behind 31

Interpretación:
- Esta rama mantiene trabajo no integrado.
- También está atrasada respecto a main, por lo que requiere decisión de integración o archivo.

## 6. Estado de Worktrees

- Solo queda el worktree principal:
  - /home/gabriel/Escritorio/Tutor-PaesV3 [main]

## 7. Arbol Git (ultimos 25 commits)

```text
* 456b627 (HEAD -> main, origin/main, origin/HEAD) chore(git): ignore local test and report artifacts
* 34809dc Actualizacion de docs, implemetaciond fallback y un manejo de errores con un rollback
* c894741 fix(frontend): restore NEXT_PUBLIC_API_URL fallback to fix proxy fetch failed
* 9f047ec fix(tests): expect warning instead of RuntimeError for missing REDIS_URL
*   cafcb8a Merge priority1-safe into main
|\
| * 9db6bde fix(config): change REDIS_URL missing from error to warning to prevent backend crash
* | 73422ae fix(config): change REDIS_URL missing from error to warning to prevent backend crash
* | b2cb5ab priemr marge pull
|\|
| * 4e03ad0 fix(ci): use master tag for trivy and make e2e tests non-blocking
| * fe08166 fix(ci): solve dependency conflicts and make security audits non-blocking
| * 64f4918 fix(ci): stabilize jest, security scans, a11y and e2e db config
| * 3b3f4bd fix(ci): resolve backend quiz and frontend lint/typecheck issues
| * 8974ae8 chore(docs): reorganize status reports and add navigation map
| * cbeda93 feat(integration): integrate priority-1 technical blocks only
| * 4eb6e3f chore(ci): add horizon-0 smoke gate to Railway predeploy
| * daa7d1f docs(strategy): add comprehensive project scenario research
| * c3c996c feat(ai): contextualize tutor chat and upgrade educational persona
|/
* 3095845 fix(csp): usa unsafe-inline en produccion para compatibilidad con Next.js static chunks
* 0de38cf fix(railway): wrap startCommand in sh -c for shell variable expansion
* 53bde84 fix(config): elimina PAYMENT_RETURN_URL del check de arranque (es Optional)
*   861144f Merge pull request #2 from GCgpt420-ux/railway/fix-deploy-11cfd4
|\
| * 37df58d fix: move alembic migrations to preDeployCommand in railway.json
|/
* b2c8ae4 fix(railway): ejecuta alembic upgrade head antes de iniciar uvicorn
* 05fedf2 feat(deploy): integra cambios de voz, auth, quiz, UI y tests para Railway
* 9221cef chore(security): sanitiza hardcodeos y parametriza credenciales locales
```

## 8. Recomendacion para proceder

Siguiente paso recomendado (único foco pendiente):

1. Evaluar feature/priority-1-security-testing.
2. Elegir una ruta:
  - Integrar: traer solo los commits útiles a main (cherry-pick o PR).
  - Archivar: borrar rama local/remota si se confirma que no aporta valor actual.

Mientras esa decisión no se tome, el repo ya está ordenado y estable para trabajo diario en main.

## 9. Resumen corto

- Main del proyecto: main
- Ramas locales: 2
- Ramas remotas activas: 3 + referencia simbolica
- Commits totales: 60
- Commits en main: 31
- Unico pendiente de gobierno de ramas: feature/priority-1-security-testing

