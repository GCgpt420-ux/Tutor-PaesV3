# Fase 7 — Plan de automatización de accesibilidad y capturas visuales

Objetivo: añadir comprobaciones automáticas de accesibilidad y pruebas visuales para evitar regresiones UI.

Resumen de acciones propuestas:

1) Accessibility checks (CI)

  - Herramientas recomendadas:
    - `playwright` + `axe-playwright` (ejecutar tests E2E que carguen stories o páginas y corran `axe`)
    - Alternativa ligera: `@axe-core/cli` o `pa11y` contra `storybook-static` generado.

  - Job CI propuesto:
    - `npm ci`
    - `npm run build-storybook`
    - Servir `storybook-static` (p.e. `npx http-server storybook-static -p 6006`) o usar `playwright` para abrir archivos locales.
    - Ejecutar script que corra `axe` en un conjunto de rutas (stories principales) y falle si se detectan violaciones graves.

2) Capturas visuales / snapshots

  - Opciones:
    - `Chromatic` (servicio SaaS) — fácil de integrar con Storybook, pero requiere cuenta.
    - `Percy` — similar a Chromatic.
    - `playwright` + `expect.toMatchSnapshot()` para comparaciones de imagen locales/CI.

  - Job CI propuesto:
    - `npm run build-storybook`
    - Ejecutar Playwright visual tests y almacenar resultados o publicar en servicio (si aplica).

3) Implementación incremental sugerida

  - Paso A (rápido): Añadir job CI que genere `storybook-static` y ejecute `@axe-core/cli` o `pa11y` contra las rutas relevantes. Reporte como artefacto o fallo en CI.
  - Paso B (medio): Añadir Playwright y un pequeño set de tests visuales para 6–8 stories críticas (Button, Input, Card, ChoiceButton, QuizTopBar, Badge). Comparar con snapshots en PRs.
  - Paso C (opcional): Integrar Chromatic/Percy si buscas una solución gestionada y revisiones visuales en PR.

4) Repositorio: cambios mínimos a añadir

  - `package.json`:
    - `devDependency`: `playwright`, `@axe-core/playwright` (o `axe-playwright`), `http-server` (opcional)
    - `scripts`: `test:a11y`, `test:visual` que ejecuten los pasos anteriores.

  - `.github/workflows/frontend-a11y.yml` (nuevo): job que haga `npm ci`, `npm run build-storybook`, `npm run test:a11y`.

5) Criterios de aceptación

  - CI falla en PR si se detectan violaciones A o AA según regla acordada.
  - Capturas visuales aprobadas / sin cambios inesperados en stories críticas.

---

Si quieres, implemento el Paso A ahora (añadir workflow que ejecuta `@axe-core/cli`/`pa11y` contra `storybook-static`). Esto requiere elegir la herramienta que prefieres; te recomiendo `axe-playwright` si vas a usar Playwright después, o `pa11y` para una configuración rápida sin tests E2E.
