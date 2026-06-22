# Radiografía del Frontend — TutorPAES
**Fecha de análisis:** 2026-06-21  
**Autor del análisis:** Ingeniero Frontend Senior (GitHub Copilot)  
**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS

---

## 1. Árbol de Directorios

```
tutorpaes/frontend/
│
├── app/                                 # Next.js App Router (rutas de página)
│   ├── layout.tsx                       # Root layout global
│   ├── page.tsx                         # Landing page
│   ├── error.tsx                        # Error boundary global
│   ├── globals.css
│   │
│   ├── api/                             # Route Handlers (proxies al backend)
│   │   ├── ai/explain/route.ts          # ★ Proxy SSE de explicación IA
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   ├── refresh/route.ts
│   │   │   └── register/route.ts
│   │   ├── backend/[...path]/route.ts   # ★ Proxy wildcard a FastAPI
│   │   └── payments/
│   │       ├── confirm/route.ts
│   │       └── create/route.ts
│   │
│   ├── auth/                            # Rutas públicas de autenticación
│   │   ├── login/page.tsx
│   │   ├── sign-up/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── update-password/page.tsx
│   │   └── error/page.tsx
│   │
│   ├── onboarding/page.tsx
│   ├── pricing/page.tsx
│   │
│   └── protected/                       # Rutas autenticadas (bajo middleware)
│       ├── layout.tsx                   # Layout con nav + auth guard
│       ├── loading.tsx                  # Suspense global de zona protegida
│       ├── error.tsx                    # Error boundary de zona protegida
│       ├── page.tsx                     # Dashboard
│       ├── admin/page.tsx
│       ├── billing/page.tsx
│       ├── cursos/
│       │   ├── page.tsx
│       │   └── [subject_id]/page.tsx
│       ├── ensayos/
│       │   ├── page.tsx
│       │   └── [exam_id]/
│       │       ├── page.tsx             # ★ Motor de ensayo completo
│       │       └── resultados/page.tsx
│       ├── perfil/page.tsx
│       ├── progreso/page.tsx
│       ├── quiz/
│       │   └── [subject_code]/[topic_code]/page.tsx  # ★ Motor de quiz por tema
│       ├── ranking/page.tsx
│       └── resultados/page.tsx
│
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── footer.tsx
│   │   │   ├── header.tsx
│   │   │   ├── mobile-nav.tsx
│   │   │   └── sidebar.tsx
│   │   └── ui/                          # Componentes Radix/Shadcn
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── checkbox.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       └── markdown-math-renderer.tsx
│   │
│   ├── core/providers/
│   │   └── query-provider.tsx           # TanStack Query Provider global
│   │
│   ├── features/                        # Módulos de negocio (Feature Slicing)
│   │   ├── ai/
│   │   │   ├── api/index.ts
│   │   │   ├── components/AiTutorChat.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── use-ai-explanation.ts  # ★ Consume /api/ai/explain (SSE)
│   │   │   │   └── use-ai-tutor.ts        # ★ Consume /api/backend/ai/chat (SSE)
│   │   │   └── prompts/
│   │   ├── auth/
│   │   │   ├── api/auth.ts
│   │   │   └── components/ (login, signup, logout...)
│   │   ├── courses/
│   │   │   ├── api/courses.ts
│   │   │   └── hooks/use-courses.ts
│   │   ├── dashboard/
│   │   │   ├── components/ (attempt-history, exam-card, progress-chart...)
│   │   │   └── views/dashboard-view.tsx
│   │   ├── exams/
│   │   │   ├── api/exams.ts             # ★ saveUserAnswer, submitExamAttempt
│   │   │   ├── components/
│   │   │   │   ├── AiExplanation.tsx
│   │   │   │   ├── exam-results-view.tsx
│   │   │   │   ├── exam-timer.tsx
│   │   │   │   └── question-card.tsx    # ★ Componente visual de pregunta
│   │   │   └── hooks/use-exams.ts
│   │   └── profile/ · onboarding/ · pricing/ · ranking/
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useBilling.ts
│   │   └── useVoice.ts
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts                # ★ apiFetch — cliente HTTP base
│   │   │   ├── courses.ts
│   │   │   ├── exams.ts                 # ⚠️ Duplicado — ver Hallazgo #1
│   │   │   └── types.ts                 # Tipos generados desde OpenAPI
│   │   ├── auth/current-user.ts
│   │   └── server/auth-session.ts
│   │
│   └── types/
│       ├── index.ts
│       └── quiz.ts
│
└── e2e/
    ├── auth.spec.ts
    └── quiz.spec.ts
```

---

## 2. Dependencias Clave

| Librería | Versión | Rol |
|---|---|---|
| `@tanstack/react-query` | ^5.95.2 | Fetching y caché de datos del servidor |
| `next` | latest | Framework SSR/SSG — App Router |
| `react` + `react-dom` | ^19.0.0 | UI y reconciliación |
| `react-markdown` + `remark-math` + `rehype-katex` | — | Renderizado de respuestas IA con soporte LaTeX |
| `katex` | ^0.16.38 | Motor de fórmulas matemáticas |
| `@radix-ui/*` | — | Primitivos de accesibilidad (checkbox, dropdown, label) |
| `lucide-react` | ^0.511.0 | Iconografía |
| `next-themes` | ^0.4.6 | Modo oscuro/claro |
| `@upstash/ratelimit` + `@upstash/redis` | — | Rate limiting serverless en route handlers |
| `tailwind-merge` + `class-variance-authority` | — | Composición de clases Tailwind |
| `@splinetool/react-spline` | ^4.1.0 | 3D interactivo en landing |

> **Importante:** No hay `axios`, `swr`, `zustand`, ni ninguna librería de estado global. El fetching usa **`fetch` nativo** envuelto en `apiFetch`. El estado de servidor usa **TanStack Query**, pero el motor de quiz usa **`useState` local puro**.

---

## 3. Análisis de Consumo de API

### Capa de transporte: `src/lib/api/client.ts` — `apiFetch`

Todas las llamadas de negocio pasan por esta función. Características clave:

```typescript
// URL resuelta automáticamente al proxy Next.js
const API_PROXY_BASE = process.env.NEXT_PUBLIC_API_URL?.startsWith('/')
  ? process.env.NEXT_PUBLIC_API_URL
  : '/api/backend';

// Auto-refresh de token JWT en 401
if (res.status === 401 && allowRefresh) {
  const refreshed = await refreshSession();
  if (refreshed) return apiFetch<T>(endpoint, options, false);
  redirectToLogin();  // window.location.href = '/auth/login'
}
```

**✅ Fortaleza:** Manejo de 401 con refresh automático y singleton (`refreshPromise`) para evitar llamadas paralelas de refresco.  
**⚠️ Riesgo:** `redirectToLogin()` usa `window.location.href` — bloquea y descarta el estado local del quiz activo sin mostrar confirmación.

---

### Endpoint: `POST /api/v1/quiz/answer`

**Archivo:** `src/features/exams/api/exams.ts` → `saveUserAnswer()`  
**También:** `app/protected/quiz/[subject_code]/[topic_code]/page.tsx` → `handleSubmitAnswer()`

```typescript
// En page.tsx (motor de quiz):
const response = await apiFetch<BackendAnswerOut>('/quiz/answer', {
  method: 'POST',
  body: JSON.stringify({ ... }),
});
```

| Aspecto | Estado |
|---|---|
| Herramienta de fetching | `fetch` nativo via `apiFetch` |
| `try/catch` | ✅ Presente en `handleSubmitAnswer` |
| Timeout configurado | ❌ No hay timeout — request puede colgar indefinidamente |
| Estado de error en UI | ✅ Se setea `quiz.error` |
| Manejo de error visible | ⚠️ `quiz.error` se guarda pero **no se renderiza en UI** — el usuario ve pantalla congelada |

---

### Endpoint: `POST /api/v1/ai/explain/stream` (SSE)

**Archivo:** `src/features/ai/hooks/use-ai-explanation.ts`  
**Ruta proxy:** `app/api/ai/explain/route.ts`

```typescript
// AbortController con timeout de 35 segundos
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), timeoutMs); // 35000ms

// Manejo del abort
if (err instanceof Error && err.name === 'AbortError') {
  setError('El Tutor IA tardó demasiado (35s)...');
}
```

| Aspecto | Estado |
|---|---|
| Herramienta de fetching | `fetch` nativo (SSE manual) |
| `try/catch` | ✅ Presente |
| Timeout | ✅ 35 segundos con `AbortController` |
| Estado 429 | ✅ Capturado explícitamente con mensaje de upgrade |
| SSE buffer | ⚠️ Procesa chunks directamente sin buffer de línea — puede partir eventos SSE a la mitad si el chunk llega fragmentado |

---

### Endpoint: `POST /api/v1/ai/chat` (SSE streaming)

**Archivo:** `src/features/ai/hooks/use-ai-tutor.ts`  
**Ruta proxy:** `app/api/backend/[...path]/route.ts` (proxy wildcard)

```typescript
const response = await fetch('/api/backend/ai/chat', { ... });
const reader = response.body?.getReader();

// Buffer SSE:
let sseBuffer = '';
// ✅ Correcto: acumula chunks antes de dividir por '\n\n'
const events = sseBuffer.split('\n\n');
sseBuffer = events.pop() ?? '';
```

| Aspecto | Estado |
|---|---|
| Herramienta de fetching | `fetch` nativo (SSE manual) |
| `try/catch` | ✅ Presente |
| Timeout | ❌ No hay timeout — un chat puede colgar sin fin |
| Buffer SSE | ✅ Correcto — acumula residuo entre chunks |
| Condición de carrera | ✅ Resuelta: usa functional `setState` para actualizar el último mensaje del asistente |

> **Diferencia crítica entre los dos hooks SSE:** `use-ai-tutor.ts` tiene el buffer SSE implementado correctamente; `use-ai-explanation.ts` **no lo tiene** — divide por `\n\n` dentro de cada chunk individual, lo que puede silenciar tokens si el chunk llega partido entre eventos.

---

## 4. Análisis del Motor de Quiz (`quiz/[subject_code]/[topic_code]/page.tsx`)

### Estado global del componente

```typescript
const [quiz, setQuiz] = useState<QuizState>({
  question: null,
  selectedChoice: null,
  submitted: false,
  isCorrect: null,
  feedbackText: null,
  aiPayload: null,
  isFinished: false,
  loading: true,      // ← Empieza en true
  error: null,
  attemptId: null,
  questionsAnswered: 0,
  correctAnswers: 0,
});
```

Todo el estado del ensayo vive en un **único objeto `useState`**. Esto tiene implicancias directas en los crashes:

---

### Pantallas de carga y error

| Situación | ¿Qué muestra? |
|---|---|
| Carga inicial (primer `loadNextQuestion`) | ✅ Spinner de pantalla completa con `Loader` |
| Carga entre preguntas | ✅ Botón "Fijar Respuesta" cambia a `Sincronizando...` |
| Error en `loadNextQuestion` | ⚠️ Se guarda en `quiz.error` pero **no hay JSX que lo renderice** — pantalla en blanco |
| Error en `handleSubmitAnswer` | ⚠️ Igual — `quiz.error` se setea pero no se muestra |
| Quiz terminado (`isFinished: true`) | ✅ Pantalla de resultados con porcentaje |

**El estado `quiz.error` no tiene un `if (quiz.error) return <ErrorUI />` en ningún punto del render.** Si `loadNextQuestion` falla (backend caído, 500, red), el componente no muestra nada y queda visualmente congelado.

---

### Flujo de `handleSubmitAnswer` y el disparo proactivo de IA

```typescript
const handleSubmitAnswer = async () => {
  // 1. Setea loading: true y bloquea botón
  setQuiz((prev) => ({ ...prev, loading: true }));
  aiTutor.setExternalLoading(true);

  // 2. Llama POST /quiz/answer
  const response = await apiFetch<BackendAnswerOut>('/quiz/answer', { ... });

  // 3. setTimeout 800ms para mostrar feedback en el chat ANTES de lanzar IA
  setTimeout(() => {
    aiTutor.setExternalLoading(false);
    aiTutor.addAssistantMessage(tutorFeedback);
  }, 800);

  // 4. Actualiza estado del quiz
  setQuiz((prev) => ({ ...prev, submitted: true, loading: false, ... }));
};
```

**⚠️ Hallazgo crítico — `setTimeout` en flujo async:**  
El `setTimeout(() => aiTutor.setExternalLoading(false), 800)` se programa **antes** de que `setQuiz` actualice `loading: false`. Si el componente se desmonta en esos 800ms (navegación rápida, token expirado → redirect), el `setTimeout` ejecuta `setState` en un componente desmontado — en React 19 esto es silencioso pero genera logs de warning y puede corromper estado si el componente se remonta.

---

### Manejo de opciones en `QuestionCard` (feature/exams/components)

```typescript
// ⚠️ shuffle por Math.random() en useMemo sin seed
const options = useMemo(() => {
  return [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);
}, [correctAnswer, distractors]);
```

El shuffle ocurre **en render** dentro de `useMemo`. Si `correctAnswer` o `distractors` cambian de referencia (por re-render del padre), las opciones se reordenan visualmente en medio de una respuesta en progreso.

> **Nota:** Este `QuestionCard` de `features/exams/` es distinto al `QuestionCard` local definido inline en `quiz/[subject_code]/[topic_code]/page.tsx`. El de la página de quiz **no tiene esta vulnerabilidad** porque renderiza `quiz.question.choices` directamente desde el backend, sin shuffle local.

---

## 5. Análisis del Proxy Wildcard (`app/api/backend/[...path]/route.ts`)

```typescript
const backendResponse = await fetch(targetUrl, {
  method,
  headers,
  body,
  duplex: body ? 'half' : undefined,  // SSE / streaming
});

// Retorna el body del backend directamente (streaming preservado)
return new NextResponse(backendResponse.body, {
  status: backendResponse.status,
  headers: responseHeaders,
});
```

**✅ Fortaleza:** El body se pasa directamente como `ReadableStream` — el streaming SSE llega al cliente sin buffering intermedio.  
**⚠️ Riesgo:** No hay timeout en el `fetch` al backend. Si FastAPI tarda en responder o la conexión se cuelga, el Route Handler de Next.js queda colgado indefinidamente. El cliente verá la rueda de carga sin fin.

---

## 6. Hallazgos y Vulnerabilidades

### 🔴 Hallazgo #1 — `quiz.error` nunca se renderiza (causa principal de "pantalla congelada")

**Archivo:** `app/protected/quiz/[subject_code]/[topic_code]/page.tsx`

En ambas funciones asíncronas (`loadNextQuestion` y `handleSubmitAnswer`) se captura el error y se guarda en `quiz.error`, pero no existe ningún bloque JSX que lo muestre:

```typescript
// El catch existe:
} catch (err) {
  setQuiz((prev) => ({
    ...prev,
    loading: false,
    error: err instanceof Error ? err.message : 'Error al cargar pregunta',
  }));
}

// Pero en el render NO existe:
// if (quiz.error) return <ErrorScreen message={quiz.error} />;
```

**Impacto:** Si el backend devuelve un error, el usuario ve una pantalla completamente vacía o congelada (spinner detenido) sin posibilidad de recuperarse.

**Fix mínimo:**
```tsx
if (quiz.error && !quiz.loading) {
  return (
    <div className="flex h-screen items-center justify-center flex-col gap-4">
      <p className="text-red-400">{quiz.error}</p>
      <button onClick={loadNextQuestion}>Reintentar</button>
    </div>
  );
}
```

---

### 🔴 Hallazgo #2 — `use-ai-explanation.ts`: buffer SSE roto bajo fragmentación

**Archivo:** `src/features/ai/hooks/use-ai-explanation.ts`

```typescript
// ❌ Divide por '\n\n' dentro del chunk individual:
while (!done) {
  const { value, done: readerDone } = await reader.read();
  const chunk = decoder.decode(value, { stream: true });
  const events = chunk.split('\n\n');  // ← Sin buffer acumulador
  for (const event of events) { ... }
}
```

Si un evento SSE `data: texto\n\n` llega partido en dos chunks de red (`data: tex` / `to\n\n`), el primer chunk no matchea el split y **el token se pierde**. El streaming de explicaciones puede aparecer incompleto o cortado.

**Fix:** Replicar el patrón de `use-ai-tutor.ts`:
```typescript
let sseBuffer = '';
// Dentro del while:
sseBuffer += decoder.decode(value, { stream: true });
const events = sseBuffer.split('\n\n');
sseBuffer = events.pop() ?? '';
```

---

### 🟡 Hallazgo #3 — Sin timeout en `/quiz/answer` ni en el proxy wildcard

Ninguna de las llamadas a `POST /quiz/answer` o al proxy wildcard tiene un `AbortController` con timeout. Una respuesta lenta del backend bloqueará la UI con `loading: true` indefinidamente.

**Contexto cruzado con backend:** El backend tiene rate limiting y Sentry, pero no tiene un timeout explícito por request. Si el LLM tarda (timeouts de OpenAI son de 600s por defecto), el usuario espera sin límite.

---

### 🟡 Hallazgo #4 — Duplicado de módulo API: `src/lib/api/exams.ts` vs `src/features/exams/api/exams.ts`

Existen dos archivos con la misma responsabilidad. El primero parece un legado migrado, el segundo es el activo con `apiFetch`. Si se llama al módulo equivocado desde una página, las respuestas pueden fallar silenciosamente.

---

### 🟡 Hallazgo #5 — `setTimeout` en flujo async de `handleSubmitAnswer`

El `setTimeout(800ms)` que dispara la respuesta del tutor IA puede ejecutarse después de que el componente se desmonte (navegación rápida, expiración de sesión). En React 19 no genera crash, pero sí puede causar estado corrupto si el componente se remonta rápidamente.

**Fix:** Cancelar el timeout en cleanup:
```typescript
const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
// Dentro del catch/finally:
useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);
```

---

### ✅ Fortaleza #1 — Arquitectura Feature Slicing sólida

La organización en `features/[dominio]/api + components + hooks` es limpia y escalable. Cada feature es independiente y fácil de extraer.

### ✅ Fortaleza #2 — Proxy wildcard preserva streaming sin buffering

El proxy `[...path]/route.ts` retorna `backendResponse.body` directamente. Los tokens SSE llegan al cliente en tiempo real sin el problema común de buffering de Vercel.

### ✅ Fortaleza #3 — Auto-refresh de JWT con singleton

`refreshSession()` usa un singleton `refreshPromise` que evita múltiples llamadas paralelas de refresh ante 401 concurrentes — patrón difícil de implementar bien y aquí está correcto.

---

## 7. Mapa de Crashes/Congelamientos Cruzado con Backend

| Escenario | Origen | Síntoma en UI | Causa |
|---|---|---|---|
| Backend lento en `/quiz/answer` | Backend o red | Botón "Sincronizando..." congelado | Sin timeout en `apiFetch` |
| Backend caído (500) en `loadNextQuestion` | Backend | Pantalla en blanco | `quiz.error` nunca se renderiza |
| Stream SSE fragmentado en `/ai/explain` | Red/proxy | Explicación truncada o vacía | Buffer SSE roto en `use-ai-explanation.ts` |
| OpenAI timeout (>35s) en `/ai/explain` | OpenAI | Mensaje "tardó demasiado" | ✅ Manejado |
| Token expirado durante quiz activo | Auth | Redirect forzado a `/auth/login` | `window.location.href` descarta estado |
| Rate limit 429 en `/ai/explain` | Backend | ✅ Mensaje de upgrade visible | Manejado |
| Desmontaje durante `setTimeout` 800ms | Nav rápida | Warning en consola / estado corrupto | `setTimeout` sin cleanup |

---

## 8. Checklist de Mejoras Prioritarias

- [ ] **🔴 Crítico:** Agregar renderizado de `quiz.error` con botón "Reintentar" en `quiz/page.tsx`
- [ ] **🔴 Crítico:** Corregir buffer SSE en `use-ai-explanation.ts` (acumulador `sseBuffer`)
- [ ] **🟡 Importante:** Agregar `AbortController` con timeout (~30s) a `POST /quiz/answer`
- [ ] **🟡 Importante:** Eliminar `src/lib/api/exams.ts` o renombrarlo para evitar confusión
- [ ] **🟡 Importante:** Refactorizar `setTimeout` en `handleSubmitAnswer` con `useRef` + cleanup
- [ ] **🟢 Mejora:** Agregar timeout al proxy wildcard (`fetch` con `signal: AbortSignal.timeout(30000)`)
- [ ] **🟢 Mejora:** Agregar error boundary específico en la página de quiz para capturar errores no controlados de React 19
