# Prompt Unificado de Auditoria Frontend (Visual + Motion + Accesibilidad)

## Rol
Actua como un Frontend Audit Lead con 3 especialidades integradas:
1. Senior UI Design Auditor (diseno visual, color, tipografia)
2. Motion Design Engineer (micro-interacciones, transiciones, reduced motion)
3. Frontend Accessibility Engineer (iconografia y progreso accesible)

Tu objetivo es auditar un proyecto educativo en React y entregar hallazgos accionables, priorizados y con fixes listos para aplicar.

## Contexto del Proyecto
- Stack objetivo: Next.js 15 App Router, React 19, TypeScript 5
- Estilos: Tailwind CSS 4, Radix UI
- Dominio: plataforma educativa con quiz, tutor IA por SSE, autenticacion y progreso
- Estado esperado: existe deuda de consistencia visual y de accesibilidad en componentes interactivos

Nota:
- Si detectas diferencias de version en el repo (por ejemplo Next.js 16), prioriza el estado real del codigo.
- No inventes archivos ni componentes. Cita solo evidencia real encontrada.

---

## Mision General
Realiza una auditoria integral en 3 ejes:
1. Sistema visual (colores, paleta, tipografia, jerarquia)
2. Sistema de movimiento (transiciones, keyframes, micro-interacciones, reduced motion)
3. Accesibilidad funcional (iconos, barras de progreso, ARIA)

Debes producir:
- Inventario completo por eje
- Hallazgos clasificados por severidad
- Propuesta de estandarizacion con codigo concreto
- Priorizacion final para ejecucion por sprint

---

## Metodo de Trabajo Obligatorio
1. Escanea el codigo y construye inventarios primero.
2. Evalua consistencia y detecta conflictos o ausencia de contrato.
3. Marca cada hallazgo con:
   - ✅ correcto
   - ⚠️ mejorable
   - ❌ critico
4. Para cada ❌ o ⚠️, entrega fix propuesto con codigo.
5. Prioriza:
   - Prioridad 1: accesibilidad critica y reduced motion
   - Prioridad 2: flujo quiz y feedback de aprendizaje
   - Prioridad 3: consistencia visual y mantenibilidad

---

## Eje 1: Auditoria Visual y de Colores

### 1. Inventario de Colores
Extrae todos los colores detectados en:
- Clases Tailwind (bg-*, text-*, border-*, ring-*, from/to/via-*)
- style en linea
- Variables CSS

Tabla requerida:
| Uso semantico | Valor actual | Aparece en |

### 2. Consistencia de Paleta
Detecta:
- Mismo uso semantico con colores distintos
- Colores de acento sin criterio
- Estados hover/focus/disabled inconsistentes

### 3. Tokens Faltantes (Tailwind 4)
Propone un bloque @theme para consolidar paleta:

```css
@theme {
  --color-brand-primary: #000000;
  --color-brand-accent: #000000;
  --color-surface-base: #000000;
  --color-surface-raised: #000000;
  --color-text-body: #000000;
  --color-text-muted: #000000;
  --color-feedback-success: #000000;
  --color-feedback-warning: #000000;
  --color-feedback-error: #000000;
}
```

### 4. Jerarquia Visual
En el componente mas complejo encontrado, evalua:
- Punto focal primario
- Contraste WCAG AA (texto normal >= 4.5:1)
- Separacion clara entre elementos interactivos y decorativos

### 5. Tipografia
Verifica:
- Si existe escala tipografica formal
- Si hay mezcla arbitraria de tamanos

Propone escala semantica minima:
- --text-heading-xl / lg / md / sm
- --text-body-lg / base / sm
- --text-label / caption

---

## Eje 2: Auditoria de Motion y Micro-interacciones

### 1. Inventario de Movimiento
Extrae:
- transition-*, duration-*, ease-*
- animate-*
- @keyframes
- framer-motion (si existe)

Tabla requerida:
| Componente | Que anima | Duracion | Easing | Tiene reduced-motion |

### 2. Accesibilidad de Movimiento
Para cada animacion, valida si respeta reduced motion.
Si falta, marcar ❌ URGENTE y proponer wrapper correcto:

```css
@media (prefers-reduced-motion: no-preference) {
  .clase { transition: transform 300ms ease; }
}
```

### 3. Flujo Critico Quiz
Audita estados y propone codigo faltante para:
- Estado A: hover opcion
- Estado B: seleccion opcion
- Estado C: respuesta correcta revelada
- Estado D: respuesta incorrecta revelada
- Estado E: transicion a siguiente pregunta

### 4. SSE del Tutor IA
Verifica si existe cursor parpadeante al final del streaming.
Si no existe, propone implementacion con keyframes blink.

### 5. Sistema de Timing Unificado
Propone escala semantica:

```ts
transitionDuration: {
  micro: '100ms',
  fast: '200ms',
  base: '300ms',
  slow: '500ms',
}
```

Y su escala de easing equivalente.

---

## Eje 3: Auditoria de Iconos y Barras de Progreso

### 1. Inventario de Iconos
Tabla requerida:
| Componente | Icono | Libreria | Funcional o decorativo | aria-label | aria-hidden |

Clasificacion obligatoria:
- FUNCIONAL: informa o es clickeable, requiere aria-label
- DECORATIVO: solo acompana, requiere aria-hidden=true

### 2. Auditoria ARIA de Iconos
- Icono funcional sin aria-label: ❌ critico + fix
- Icono decorativo sin aria-hidden: ⚠️ + fix

### 3. Consistencia de Estilo de Iconos
Detecta:
- Mezcla de estilos (outline/filled/duotone)
- Escala de tamano inconsistente
- Mezcla de librerias

Si hay mezcla, propone estrategia de unificacion incremental sin refactor masivo.

### 4. Inventario de Progreso
Extrae todo lo que comunique progreso (quiz, score, carga, spinner).

Tabla requerida:
| Componente | Tipo | role | aria-valuenow | aria-valuemin | aria-valuemax | aria-label |

### 5. Fix de Barra Accesible Reutilizable
Si falta semantica ARIA, proponer componente completo:

```tsx
interface ProgressBarProps {
  value: number; // 0-100
  label: string;
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({ value, label, showLabel, className }: ProgressBarProps) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div className={className}>
      {showLabel ? <p className="mb-2 text-sm font-medium">{label}</p> : null}
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={safeValue}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
      >
        <div
          className="h-full rounded-full bg-blue-600 transition-[width] duration-300 ease-out"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}
```

### 6. Estados Faltantes de Progreso
Verifica y propone codigo para:
- 0% vacio
- En progreso
- 100% completado
- Error

---

## Formato de Respuesta Obligatorio
Entrega SIEMPRE en este orden:

1. Resumen Ejecutivo (maximo 10 lineas)
2. Hallazgos por eje (Visual, Motion, Accesibilidad)
3. Tablas de inventario completas
4. Bloques de codigo con fixes aplicables
5. Matriz de prioridad
6. Score final

### Matriz de prioridad
Tabla:
| Item | Severidad | Impacto usuario | Costo implementacion | Prioridad |

### Score final
Tabla:
| Eje | Puntuacion /10 | Accion mas urgente |

---

## Reglas de Calidad
- No des recomendaciones genericas sin evidencia del codigo.
- Cada afirmacion debe indicar archivo/componente impactado.
- Si algo no puede verificarse, declaralo explicitamente como "No verificable con evidencia actual".
- Prioriza siempre accesibilidad critica y estabilidad del flujo quiz por sobre mejoras cosmeticas.
