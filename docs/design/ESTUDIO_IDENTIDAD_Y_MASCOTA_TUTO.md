# 🎨 Estudio de Identidad Visual, Mascota y Animaciones — TutorPAES

**Fecha:** 2026-10-04  
**Contexto:** Transición de identidad visual desde el arquetipo "High Performance Cockpit" (DevTools) hacia una identidad EdTech cálida, empática y gamificada centrada en estudiantes de enseñanza media (PAES Chile).  
**Referencia de Mascota:** Concepto inicial de la diseñadora en `/home/gabriel/Isaac Sanhueza/TutoV1.jpeg`.

---

## 1. Diagnóstico del Problema de Identidad

El rediseño "Cockpit" implementado recientemente en el frontend utiliza:
- Fondos negros neutros ultra oscuros (`#08080C`, `#0E0E14`).
- Un único acento naranja de alto contraste (`#FF6B35`).
- Tipografía técnica: Geist Sans (títulos) + Geist Mono (código).
- Tarjetas angulares con bordes de 1px `border-white/10` y terminaciones en cristal frío.

### La Trampa del "Arquetipo DevTools":
Esta combinación es el estándar estético de herramientas para desarrolladores de software (Linear, Vercel, Supabase, Claude Code). Sin embargo:
- **Para un estudiante de 16 a 18 años que rinde la PAES:** Resulta visualmente frío, árido, solitario e intimidante. Aumenta la sensación de estrés ante un examen ya estresante.
- **Lo que la investigación EdTech demuestra:** Los estudiantes retienen más y abandonan menos cuando la plataforma transmite **calidez, compañía, validación emocional y recompensas dopamínicas**.

---

## 2. Análisis del Avatar de la Diseñadora (`TutoV1.jpeg`)

El concepto entregado ("Chatie" / Tuto) es una **base de altísimo valor técnico y expresivo**:

```
          ╭──────────────────────╮
   ╭──────╯   [ Tuto Mascot ]    ╰──────╮
   │  Cuerpo azul (#5584bc):            │
   │  Burbuja de diálogo con aletas     │
   │                                    │
   │      ╭────────────────────╮        │   ✦ Chispa coral (#db3333)
   │      │  [ Pantalla Cara ] │        │     (Recompensa / foco)
   │      │     ●        ●     │        │
   │      │         ◡          │  o( \  │
   │      ╰────────────────────╯   \__) │
   ╰────────────────────────────────────╯
```

### Ventajas Técnicas para la Web:
1. **Pantalla Facial Modular:**
   La cara blanca/crema está contenida dentro del cuerpo como la pantalla de un robot o tamagotchi. Esto permite cambiar expresiones (ojos y boca) sin necesidad de redibujar o reanimar el cuerpo completo.
2. **Rango Emocional Pre-diseñado:**
   El mockup de merchandising (cuaderno y stickers) ya cuenta con:
   - Expresión de **duda o concentración** (manos a la cabeza, cejas ladeadas, ojos grandes).
   - Expresión de **guiño cómplice** (con libreta/café).
3. **Chispa de Acento Coral/Rojo (`#db3333`):**
   Funciona como indicador dinámico de logro: se ilumina en rachas de aciertos o gira en espiral cuando Tuto procesa una respuesta socrática.
4. **Paleta Base Armónica:**
   - Azul amigable cuerpo: `#5584bc`
   - Azul marino/índigo profundo: `#30324f`
   - Acento coral/fuego: `#db3333` (o `#FF6B35`)
   - Blanco pantalla: `#FFFFFF` / `#F8FAFC`

---

## 3. Benchmarking Internacional EdTech

| Plataforma | Mascota / Elemento Clave | Implementación de Animación | Efecto Psicológico en el Usuario |
|---|---|---|---|
| **Duolingo** | *Duo (Búho)* | Máquinas de estado vectoriales reactivas a cada respuesta (alegría, llanto, shock). Botones con física 3D y rebote. | Dopamina inmediata, ludificación, hábito diario. |
| **Brilliant.org** | *Blorb* y gráficos matemáticos | Animaciones interactivas al deslizar el dedo. Celebración sutil y elegante al resolver acertijos. | Estimulante, inteligente, cero condescendiente. |
| **Knowt** | *Kai (Dragón IA)* | Mascota que acompaña el estudio nocturno y modula gestos durante el procesamiento del LLM. | Compañero de estudio ("no estoy solo a las 11 PM"). |
| **Quizlet / Photomath** | Microinteracciones | Confeti vectorial, barras de racha líquidas, transiciones suaves de tarjetas. | Reducción de fatiga cognitiva y refuerzo positivo. |

---

## 4. Opciones Técnicas de Animación en Next.js

### 🥇 Opción A: Rive ([rive.app](https://rive.app)) — *Estándar recomendado*
- **Herramienta de la diseñadora:** Rive Web App (gratuita para diseñadores). Dibuja y anima con *State Machines*.
- **Integración React:** `@rive-app/react-canvas` (peso inferior a 30 KB, renderizado WebGL/Canvas a 60 FPS).
- **Capacidades interactivas:**
  - Los ojos de Tuto pueden seguir el cursor del mouse o la posición del dedo en mobile.
  - Parpadeo aleatorio y orgánico cada 3-5 segundos.
  - Sincronización labial en tiempo real con el estado de voz de `useVoice` (`isPlaying`).

### 🥈 Opción B: SVG Reactivo por Capas (React + Framer Motion / CSS)
- **Entrega de la diseñadora:** Archivo SVG con IDs y capas nombradas (`#cuerpo`, `#ojos-abiertos`, `#ojos-cerrados`, `#boca-feliz`, `#boca-hablando`, `#chispa`).
- **Implementación:** Componente `<TutoAvatar state="idle|thinking|speaking|celebrating|empathy" />`.
- **Ventaja:** Cero dependencias externas pesadas, control 100% en código.

### 🥉 Opción C: Lottie / DotLottie (After Effects)
- **Entrega:** Clips JSON exportados desde After Effects con Bodymovin.
- **Limitación:** Animaciones pregrabadas en loop; menor interactividad con el cursor que Rive.

---

## 5. Matriz de Estados Emocionales para Tuto

| Estado en la App | Disparador | Expresión de Tuto | Comportamiento Visual |
|---|---|---|---|
| **Idle / Reposo** | Esperando interacción en dashboard o chat | Sonrisa tranquila, mirada atenta | Parpadeo natural cada 4s, respiración sutil |
| **Pensando** | LLM generando respuesta (`loading = true`) | Mirada hacia arriba, ojos en `o` | Chispa coral pulsando o girando |
| **Hablando** | Audio TTS reproduciéndose (`isPlaying = true`) | Boca modulando apertura/cierre | Ondas sonoras tenues alrededor de la burbuja |
| **Acierto / Racha** | Respuesta correcta en quiz (`streak >= 3`) | Ojos cerrados felices, salto de victoria | Chispa se enciende con micro-confeti |
| **Error / Bloqueo** | Respuesta incorrecta o duda del alumno | Mano al mentón, expresión empática | Postura de apoyo ("Tranquilo, veamos el paso a paso") |

---

## 6. Guía de Entrega para la Diseñadora

1. Si la diseñadora utiliza **Figma / Illustrator**:
   - Diseñar el personaje en vista frontal o 3/4 leve.
   - Exportar SVG en capas separadas:
     - `layer_body` (silueta de burbuja + extremidades).
     - `layer_screen` (óvalo facial blanco).
     - `layer_eyes` (estados: abierto, cerrado/parpadeo, mirando arriba, guiño).
     - `layer_mouth` (estados: sonrisa cerrada, boca abierta fonema A/O, recta dudosa).
     - `layer_spark` (estrella coral independiente).
2. Si la diseñadora explora **Rive**:
   - Crear el rig con huesos para las manos y parámetros booleanos/triggers: `is_speaking`, `is_thinking`, `is_happy`, `look_x`, `look_y`.
