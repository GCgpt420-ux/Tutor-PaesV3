# Refinamiento Frontend Para Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refinar el Dashboard estudiantil y el Quiz para la demo, conservando la identidad oscura de Tutor PAES y sin modificar lógica de negocio.

**Architecture:** Primero se corrige la integración entre variables CSS y Tailwind 3 para que los tokens semánticos y sus opacidades produzcan CSS real. Luego se aplican ajustes pequeños de responsive y accesibilidad en las dos vistas activas, manteniendo los componentes y flujos existentes.

**Tech Stack:** Next.js 16.2.4, React 19.2.4, TypeScript 5, TailwindCSS 3.4.1, Jest, Testing Library.

---

### Task 1: Reparar Los Tokens Semánticos De Tailwind 3

**Files:**
- Modify: `tutorpaes/frontend/app/globals.css:16-71,168-174`
- Modify: `tutorpaes/frontend/tailwind.config.ts:1-3,81-97`

- [ ] **Step 1: confirmar el defecto actual**

Generar el CSS y verificar que una clase crítica con opacidad no tenga una regla útil:

```bash
npx tailwindcss -i ./app/globals.css -o /tmp/opencode/tutorpaes-before.css --minify
```

Revisar `bg-brand-primary\/10`, `border-surface-container\/60` y `bg-surface-default\/80` en el archivo generado.

- [ ] **Step 2: declarar los canales RGB como CSS estándar**

Reemplazar el bloque `@theme` por `:root`, eliminar las autorreferencias de fuentes y expresar los tokens consumidos por Tailwind como canales RGB:

```css
:root {
  --color-brand-primary: 99 102 241;
  --color-brand-primary-hover: 79 70 229;
  --color-brand-primary-active: 67 56 202;
  --color-brand-accent: 168 85 247;
  --color-brand-accent-hover: 147 51 234;
  --color-brand-accent-active: 126 34 206;
  --color-brand-danger: 239 68 68;
  --color-surface-base: 2 6 23;
  --color-surface-default: 15 23 42;
  --color-surface-raised: 30 41 59;
  --color-surface-container: 51 65 85;
  --color-text-primary: 248 250 252;
  --color-text-secondary: 203 213 225;
  --color-text-tertiary: 148 163 184;
}
```

Mantener los tokens no conectados a Tailwind con su formato actual para no ampliar el cambio.

- [ ] **Step 3: hacer que Tailwind acepte modificadores de opacidad**

Añadir el helper y mapear estados explícitos:

```ts
const withOpacity = (variable: string) =>
  `rgb(var(${variable}) / <alpha-value>)`;
```

```ts
brand: {
  primary: {
    DEFAULT: withOpacity("--color-brand-primary"),
    hover: withOpacity("--color-brand-primary-hover"),
    active: withOpacity("--color-brand-primary-active"),
  },
  accent: {
    DEFAULT: withOpacity("--color-brand-accent"),
    hover: withOpacity("--color-brand-accent-hover"),
    active: withOpacity("--color-brand-accent-active"),
  },
  secondary: withOpacity("--color-brand-accent-active"),
  danger: withOpacity("--color-brand-danger"),
},
surface: {
  base: withOpacity("--color-surface-base"),
  default: withOpacity("--color-surface-default"),
  raised: withOpacity("--color-surface-raised"),
  container: withOpacity("--color-surface-container"),
},
text: {
  primary: withOpacity("--color-text-primary"),
  secondary: withOpacity("--color-text-secondary"),
  tertiary: withOpacity("--color-text-tertiary"),
},
```

Actualizar el cursor IA a `rgb(var(--color-brand-accent, 168 85 247))`.

- [ ] **Step 4: verificar el CSS generado**

```bash
npx tailwindcss -i ./app/globals.css -o /tmp/opencode/tutorpaes-after.css --minify
npm run typecheck
```

Expected: las variantes con opacidad y `hover:bg-brand-primary-hover` aparecen; TypeScript termina sin errores.

### Task 2: Cerrar El Ciclo De Pistas De Tuto

**Files:**
- Modify: `tutorpaes/frontend/app/protected/quiz/[subject_code]/[topic_code]/page.test.tsx`
- Modify: `tutorpaes/frontend/app/protected/quiz/[subject_code]/[topic_code]/page.tsx:130-225`

- [ ] **Step 1: escribir la regresión para IDs repetidos**

Extender la prueba de la página para simular dos cargas consecutivas con el mismo `question_id`. Verificar que la segunda carga reinicia `lastHintQuestionIdRef` y solicita una pista nueva.

- [ ] **Step 2: ejecutar la prueba y comprobar el fallo**

```bash
npm test -- --runInBand --runTestsByPath "app/protected/quiz/[subject_code]/[topic_code]/page.test.tsx"
```

Expected: FAIL porque el guard conserva el ID anterior.

- [ ] **Step 3: reiniciar el guard al comenzar una carga**

Después de cancelar peticiones anteriores y antes de solicitar la pregunta:

```ts
lastHintQuestionIdRef.current = null;
```

- [ ] **Step 4: verificar la regresión**

Ejecutar nuevamente el comando focalizado. Expected: PASS.

### Task 3: Mejorar Accesibilidad Y Responsive Del Quiz

**Files:**
- Modify: `tutorpaes/frontend/app/protected/quiz/[subject_code]/[topic_code]/page.tsx:29-40,320-560`
- Test: `tutorpaes/frontend/app/protected/quiz/[subject_code]/[topic_code]/page.test.tsx`

- [ ] **Step 1: añadir aserciones de semántica**

Comprobar en la prueba que el progreso tiene `role="progressbar"`, una alternativa expone `aria-pressed`, y el botón de cierre móvil tiene `aria-label="Cerrar tutor IA"`.

- [ ] **Step 2: ejecutar la prueba y comprobar el fallo**

Usar el comando focalizado de Task 2. Expected: FAIL por atributos ausentes.

- [ ] **Step 3: implementar semántica mínima**

Añadir al progreso:

```tsx
role="progressbar"
aria-label="Progreso del ensayo"
aria-valuemin={0}
aria-valuemax={total}
aria-valuenow={Math.min(current, total)}
```

Añadir `aria-pressed={isSelected}` a cada alternativa y un estado accesible tras responder:

```tsx
<p role="status" aria-live="polite" className="sr-only">
  {quiz.submitted ? (quiz.isCorrect ? 'Respuesta correcta.' : 'Respuesta incorrecta.') : ''}
</p>
```

Configurar el cierre del tutor con `type="button"`, `aria-label="Cerrar tutor IA"`, foco visible e icono decorativo.

- [ ] **Step 4: corregir superficies y altura móvil**

Reemplazar `bg-surface` por `bg-surface-base`. En el contenedor principal usar altura basada en `svh` sin `min-h-[600px]` en móvil, conservar el mínimo solo desde `lg`, y aumentar la reserva inferior del área desplazable para que la barra de acción no cubra alternativas.

- [ ] **Step 5: verificar la prueba focalizada**

Expected: todas las pruebas de `page.test.tsx` pasan.

### Task 4: Ajustar El Dashboard En Pantallas Estrechas

**Files:**
- Modify: `tutorpaes/frontend/src/features/dashboard/views/dashboard-view.tsx:247-400`
- Modify: `tutorpaes/frontend/src/features/dashboard/components/quick-access.tsx:13-96`

- [ ] **Step 1: ajustar el hero**

Hacer que el grupo de racha y CTA se apile y ocupe el ancho disponible antes de `sm`; mantener la disposición horizontal desde `sm`.

- [ ] **Step 2: ajustar las métricas**

Cambiar la grilla KPI de `grid-cols-2` a `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`. Mantener `tabular-nums` y reducir el tamaño numérico solo en el breakpoint base si es necesario.

- [ ] **Step 3: permitir títulos extensos en acceso rápido**

Añadir `min-w-0`, `break-words` y una escala tipográfica base más contenida a los encabezados que comparten fila con iconos.

- [ ] **Step 4: revisar alcance**

No modificar Dashboard de profesor/admin, Ensayo por ID ni `src/features/exams/components/question-card.tsx` en esta tarea.

### Task 5: Verificación Final

**Files:**
- Verify only.

- [ ] **Step 1: ejecutar pruebas y análisis estático**

```bash
npm test -- --runInBand
npm run typecheck
npx eslint "app/protected/quiz/[subject_code]/[topic_code]/page.tsx" "app/protected/quiz/[subject_code]/[topic_code]/page.test.tsx" "src/features/dashboard/components/quick-access.tsx" "src/features/dashboard/views/dashboard-view.tsx" "tailwind.config.ts"
```

Expected: cero fallos; documentar advertencias previas sin ampliar el alcance.

- [ ] **Step 2: compilar producción**

```bash
npm run build
```

Expected: compilación exitosa.

- [ ] **Step 3: smoke test manual**

Validar Dashboard y Quiz a 375×667, 768×1024, 1024×768 y 1440×900. Recorrer selección, fijar respuesta, siguiente pregunta, pista de Tuto y apertura/cierre móvil usando teclado.
