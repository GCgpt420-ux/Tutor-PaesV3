# DESIGN SYSTEM & UX SPECIFICATION — TUTORPAES
> **Versión:** 1.0 (Octubre 2026)  
> **Destino:** Google Stitch / Stitch Generative UI & Design System  
> **Enfoque:** EdTech Gamificada, Luminosa, Moderna y Amigable (PAES Chile)  
> **Mascota Oficial:** Tuto (El tutor interactivo en forma de globo de diálogo inteligente)

---

## 1. Visión y Filosofía de Diseño

### 1.1 El Problema Actual (Legacy UI)
La interfaz previa sufría del síndrome *"Claude Code / Hacker Terminal"*:
- Fondo ultra oscuro (`#08080C`) con contraste agresivo de naranja flúor (`#FF6B35`).
- Tarjetas angulares con corchetes técnicos `[ ]` que parecían racks de servidores o consolas Linux.
- Jerga intimidante ("Líderes de Operación", "Eficacia por Vector", "Módulos").
- Ausencia de calidez humana, empatía o gamificación para estudiantes de 16 a 18 años.

### 1.2 La Nueva Dirección Visual
TutorPAES evoluciona hacia una experiencia **luminosa, fresca, motivadora y gamificada**, inspirada en los mejores referentes globales de EdTech (Duolingo, Brilliant, Notion Campus, Knowt):
- **Superficies Luminosas y Limpias:** Fondos claros (`#F8FAFC`), tarjetas blancas flotantes con sombras suaves multicapa y bordes redondeados orgánicos (`16px` a `24px`).
- **Paleta de Marca Guiada por "Tuto":** Tonos azul cielo / índigo sereno que transmiten confianza académica, combinados con un coral cálido para acciones clave y oro radiante para gamificación (XP, rachas, medallas).
- **Gamificación Integrada:** Barras de nivel, rachas con fuego, podio visual con medallas y estados de ánimo de la mascota.
- **Tuto como Co-piloto:** La mascota no es un adorno estático, sino un compañero activo que aparece en banners de ánimo, celebra logros, explica errores en los ensayos y acompaña al alumno en cada pantalla.

---

## 2. Tokens de Diseño (Design Tokens)

### 2.1 Paleta de Color (Color Palette)

#### Primarios (Brand Identity — Inspirados en Tuto)
- **Tuto Blue (Principal):** `#4B7BEC` / `#3B82F6` (Azul sereno, inteligente y cercano)
- **Tuto Blue Light (Tinte sutil):** `#EFF6FF` (Fondos de tarjetas activas, badges primarios)
- **Tuto Slate Navy (Contraste profundo):** `#1E2438` (Texto principal de alta legibilidad, headers oscuros)

#### Acentos y Gamificación (High Energy Accents)
- **Coral Spark (Acento / CTA):** `#FF5A5F` / `#EE5253` (Inspirado en la estrella de Tuto; botones principales, llamadas de urgencia amigable)
- **Coral Soft:** `#FFF1F2` (Fondos de alerta suave y acentos secundarios)
- **XP Gold (Gamificación / Trofeos):** `#FFB800` / `#F59E0B` (Estrellas, barras de XP, medalla Puesto 1)
- **Streak Fire (Rachas de estudio):** `#FF7A00` (Icono de fuego de constancia diaria)
- **Success Mint (Aciertos y Progreso):** `#10B981` (Porcentaje de precisión, respuestas correctas)
- **Demre Cyan (Módulo PAES):** `#06B6D4` (Identificador de ciencias / tecnología)

#### Superficies y Neutros (Luminosos y Suaves)
- **Background Base:** `#F8FAFC` (Slate 50 — lienzo general limpio, descansado para la vista)
- **Surface Card (Elevación 1):** `#FFFFFF` (Blanco puro, tarjetas de cursos y módulos)
- **Surface Hover (Elevación 2):** `#F1F5F9` (Hover states interactivos)
- **Surface Border:** `#E2E8F0` (Borde sutil de 1px con `rgba(226, 232, 240, 0.8)`)
- **Text Primary:** `#0F172A` (Slate 900 — texto principal nítido)
- **Text Secondary:** `#475569` (Slate 600 — subtítulos, metadatos, descripciones)
- **Text Muted:** `#94A3B8` (Slate 400 — placeholders, etiquetas menores)

### 2.2 Tipografía (Typography Scale)
- **Familia Tipográfica Principal:** `Plus Jakarta Sans` o `Poppins` (Google Fonts, moderna, geométrica pero redondeada y amigable).
- **Familia Secundaria / Código & Fórmulas:** `JetBrains Mono` (para valores numéricos de puntaje) y soporte de renderizado KaTeX para expresiones matemáticas PAES (e.g. $\frac{x^2 - 9}{x - 3}$).

```css
/* Escala de Fuentes */
--font-display: 'Plus Jakarta Sans', sans-serif;
--text-h1: 700 32px/40px var(--font-display);      /* Títulos principales */
--text-h2: 700 24px/32px var(--font-display);      /* Títulos de sección */
--text-h3: 600 20px/28px var(--font-display);      /* Títulos de tarjetas */
--text-body: 400 15px/22px var(--font-display);    /* Texto de lectura */
--text-body-bold: 600 15px/22px var(--font-display);
--text-small: 500 13px/18px var(--font-display);   /* Badges y chips */
--text-caption: 400 11px/16px var(--font-display); /* Metadatos */
```

### 2.3 Radios y Sombras (Radii & Elevation)
- **Border Radius:**
  - Botones pequeños / Badges: `rounded-lg` (`8px`) o `rounded-full` (Pills)
  - Botones principales / Inputs: `rounded-xl` (`12px`)
  - Tarjetas de contenido / Cursos / Dashboard: `rounded-2xl` (`16px` a `20px`)
  - Modales / Hero Banners: `rounded-3xl` (`24px`)
- **Sombras (Soft Modern Elevation):**
  - Card Shadow: `0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.03)`
  - Floating Shadow (Tuto / Modales): `0 20px 40px -8px rgba(75, 123, 236, 0.18)`
  - Button Glow (Coral CTA): `0 8px 16px -4px rgba(255, 90, 95, 0.35)`

---

## 3. Identidad de la Mascota: "Tuto"

### 3.1 Anatomía y Rasgos Visuales
- **Cuerpo:** Silueta de globo de diálogo flotante, color azul periwinkle suave (`#5584BC` / `#4B7BEC`).
- **Rostro Pantalla:** Pantalla digital redondeada en azul marino (`#1E2438` / `#30324F`) con ojos expresivos luminosos en color cian/blanco que parpadean y sonríen.
- **Antena:** Estrella coral vibrante (`#DB3333` / `#FF5A5F`) sobre la cabeza, símbolo de la estrella PAES y de metas alcanzadas.
- **Manos flotantes:** Guantes estilizados blancos o azul claro que apuntan, saludan con el pulgar arriba o sostienen un lápiz.

### 3.2 Estados y Micro-interacciones de Tuto en la UI
1. **Tuto Saludador (Wave):** Se asoma en el banner superior del Dashboard diciendo *"¡Hola Patricio! Hoy es un gran día para subir 30 puntos en M1"*.
2. **Tuto Coach / Celebración (Party Hat / Star Spark):** Salta con chispas cuando el alumno completa un ensayo o sube de nivel XP.
3. **Tuto Analista (Lupa / Fórmulas):** Aparece al lado de los ejercicios fallados en los ensayos para ofrecer una pista sin frustración: *"¿Te trabaste con la diferencia de cuadrados? ¡Revisemos la factorización juntos!"*.
4. **Tuto Botón Flotante:** Presente en la barra lateral o esquina inferior derecha como acceso directo a "Consultar Tutor IA".

---

## 4. Estructura de Navegación Global (Sidebar)

La plataforma cuenta con un **Sidebar Lateral Izquierdo** fijo o retráctil:
- **Logo Superior:** Isotipo de Tuto con su estrella coral + tipografía *"TutorPAES"* con badge *"Prep 2026"*.
- **Enlaces Principales:**
  - 🏠 **Dashboard** (Inicio del alumno)
  - 📚 **Cursos** (Materias y temarios PAES)
  - 📝 **Ensayos** (Simulacros Oficiales y Pruebas Custom)
  - 🏆 **Ranking** (Gamificación y Liga Semanal)
  - 👤 **Mi Perfil** (Objetivos universitarios y configuración)
- **Botón Destacado de Acción Rápida:**
  - Botón redondeado con gradiente Tuto Blue a Coral: `[ ✨ Consultar a Tuto IA ]`
- **Footer del Sidebar:**
  - Indicador de estado de conexión + Botón de Soporte/Ayuda y Cerrar Sesión.

---

## 5. Especificaciones Detalladas por Pantalla (7 Pantallas Clave)

### Pantalla 1: Landing Page / Inicio (Pública)
* **Objetivo:** Captar al estudiante y a sus apoderados con un mensaje inspirador, eliminando el estrés de la PAES.
* **Hero Section:**
  * **Titular Principal:** *"Entrena para la PAES sin adivinar."* (Tipografía grande, limpia, con acento de color en "sin adivinar").
  * **Subtítulo:** *"Diagnóstico adaptativo, simulacros oficiales cronometrados y Tuto, tu tutor IA 24/7 que te explica paso a paso hasta que lo entiendas."*
  * **CTAs:** Botón Coral *"Comenzar Preparación Gratis"* (con flecha) + Botón secundario *"Ver Demo en Vivo"*.
  * **Visual Hero:** Ilustración 3D/vectorial de Tuto saludando junto a una tarjeta flotante interactiva que muestra una pregunta PAES resuelta con KaTeX y una racha de fuego activa.
* **Sección de Beneficios (3 Tarjetas Suaves):**
  1. 🎯 *Diagnóstico Adaptativo:* Sabe exactamente qué contenido te cuesta más.
  2. ⏱️ *Simulacros Oficiales:* Ensayos DEMRE reales con temporizador y puntaje PAES escala 100-1000.
  3. 🤖 *Tutor IA Conversacional:* Pregunta lo que no te atreves a preguntar en el colegio.
* **Prueba Social / Métricas:** Banderas con "+15.000 preguntas resueltas", "+120 pts promedio de mejora".

---

### Pantalla 2: Pantalla de Login / Autenticación
* **Objetivo:** Acceso amigable y acogedor; que iniciar sesión no parezca ingresar a un búnker.
* **Layout:** Centrado en fondo luminoso `#F8FAFC` con patrón de fondo de estrellas y fórmulas sutiles en marca de agua.
* **Tarjeta de Login (`rounded-3xl`, blanco puro, sombra flotante):**
  * **Cabecera:** Avatar sonriente de Tuto asomándose por la parte superior de la tarjeta (Tuto peeking) sosteniendo un cartelito *"¡Bienvenido de vuelta!"*.
  * **Campos:**
    * *Identificador (Correo):* Icono de sobre, placeholder amigable `tu@email.com`, foco con anillo Tuto Blue.
    * *Contraseña:* Icono de candado, botón de ojo para mostrar/ocultar contraseña, y enlace `¿Olvidaste tu contraseña?` en color Coral.
  * **Botón Principal:** `[ Ir a mi Panel → ]` en color Coral Spark (`#FF5A5F`) con sombra cálida.
  * **Divisor:** `ó ingresa rápido`
  * **Botón Secundario:** `[ ⚡ Demo Rápida de Exploración ]` en botón blanco con borde suave y texto azul.
  * **Footer de Tarjeta:** *"¿Aún no tienes cuenta? Crea tu cuenta gratis en 1 minuto"*.

---

### Pantalla 3: Dashboard Principal del Alumno (Command Center)
* **Objetivo:** Motivar al alumno al instante, mostrar su progreso claro y darle el siguiente paso obvio de estudio.
* **Banner de Bienvenida y Nivel:**
  * Fondo en gradiente sutil blanco a celeste suave (`#EFF6FF`).
  * Mensaje cálido: *"¡Hola Patricio! Vamos con todo hoy."*
  * **Barra de Progreso XP:** Barra horizontal con gradiente dorado `[ Nivel 2 • 475 / 500 XP ]` + cápsula de racha: `🔥 1 Día de Racha`.
  * **Mascota Tuto en el Banner:** Tuto animado con pose de guía señalando el botón de acción: *"Tienes 1 ensayo recomendado listo"*.
  * **CTA Inmediato:** Botón Coral `[ Iniciar Ensayo Rápido → ]`.
* **Módulo "Tu Rendimiento PAES" (Reemplazo del antiguo Alto Rendimiento):**
  * Gráfico de líneas o barras redondeadas con curva de evolución de puntaje (ej. 680 → 740 → 810 pts).
  * Selector de materia: [Todas] [M1] [Lectora] [Ciencias].
  * Tarjeta de resumen: *"Tu precisión global es del 78% (+12% esta semana)"*.
* **Cuadrícula de Accesos Rápidos (Quick Cards):**
  * 🧠 *Tutores IA Especialistas:* Tarjeta interactiva con avatares de Tuto tematizados (Tuto Matemático, Tuto Científico, Tuto Lector).
  * 📋 *Ensayos Oficiales DEMRE:* Acceso directo con duración estimada (ej. 65 preguntas • 2h 20m).
* **Métricas de Eficacia por Materia (Tarjetas Redondeadas con Colores Distintivos):**
  * *Competencia Lectora:* 72% de dominio (barra morada/azul).
  * *Matemática 1 (M1):* 61% de dominio (barra cian).
  * *Ciencias (Módulo Común):* 55% de dominio (barra menta).
  * *Historia y Cs. Sociales:* 40% de dominio (barra ámbar).

---

### Pantalla 4: Catálogo de Cursos (Nueva Cuadrícula Lúdica)
* **Objetivo:** Reemplazar el aspecto de "módulos de servidor Linux" por tarjetas de asignaturas atractivas, gamificadas y apetecibles de estudiar.
* **Layout:** Grid responsive de 3 o 4 columnas con filtros superiores: `[ Todos los Cursos ] [ Obligatorios ] [ Electivos ]`.
* **Anatomía de cada Tarjeta de Curso (`rounded-2xl`):**
  * **Cabecera Visual:** Ilustración temático-vectorial suave según la materia (ej. compás y parábola para M1, microscopio para Biología, libro abierto para Lectura).
  * **Badge de Categoría:** Pill redondeado: `M1 • Obligatoria`.
  * **Título del Curso:** Tipografía destacada (ej. *Matemática 1 — Álgebra y Funciones*).
  * **Indicador de Progreso:** Barra de completado estilo Duolingo: `5 / 12 temas dominados (42%)`.
  * **Contenido Destacado:** E.g. *"Incluye: Factorización, Ecuaciones Cuadráticas, Función Afín"*.
  * **Botón de Acción:** Botón accesible `[ Continuar Aprendizaje → ]` o `[ Empezar Curso ]`.
  * Si el alumno tiene dudas en el temario, una pequeña viñeta de Tuto dice: *"M1 pondera 35% en tu carrera favorita. ¡Dale foco hoy!"*.

---

### Pantalla 5: Sección de Ensayos (Simulacros + Panel de Revisión con Tuto)
* **Objetivo:** Realizar ensayos oficiales y permitir una revisión profunda de fallos guiada por el tutor IA.
* **Pestañas Superiores:** `[ Ensayos Oficiales DEMRE (1) ]` y `[ Ensayos Custom / Personalizados (2) ]`.
* **Fila de Ensayo Disponible:**
  * Tarjeta amplia con badge de dificultad, fecha sugerida y duración (180 min).
  * Historial de intentos anteriores con chips de puntajes: `Último puntaje: 835 pts (+45)`.
  * Botón primario: `[ Rendir Ensayo ]` y botón secundario `[ Revisar Respuestas ]`.
* **Modal / Panel Lateral "Revisión Inteligente con Tuto":**
  * Al hacer clic en "Revisar", se despliega un panel lateral interactivo:
  * Tuto aparece con expresión reflexiva: *"Analicé tus 65 respuestas. Tuviste 52 aciertos y 13 errores. La mayoría de los errores se concentraron en Geometría 3D. ¿Quieres que repasemos esos 3 ejercicios juntos paso a paso?"*.
  * Botones de acción del tutor: `[ Explicar con Fórmulas Simples ]` `[ Darme un ejercicio similar ]`.

---

### Pantalla 6: Ranking / Gamificación (Liga Semanal PAES)
* **Objetivo:** Fomentar una sana competencia entre postulantes de todo Chile mediante un podio visual estimulante y no intimidante.
* **Cabecera:** *"Liga Diamante — Semana 42"* con contador de días restantes para el reinicio semanal y explicación de premios en XP.
* **Podio Visual Superior (Top 3 3D/Ilustrado):**
  * **1° Lugar (Centro, Plataforma Más Alta):** Avatar del estudiante coronado con corona dorada, nombre destacado (*Martín Rojas*), medalla de oro reluciente, `903 pts` y precisión del `89%`. Tuto a su lado lanzando confeti.
  * **2° Lugar (Izquierda, Plataforma Media):** Plataforma plateada, medalla de plata, *Patricio Aylwin*, `835 pts`.
  * **3° Lugar (Derecha, Plataforma Bronce):** Plataforma bronceada, medalla de bronce, *Maximiliano del Río*, `835 pts`.
* **Barra de Tu Posición Flotante (Sticky Bottom):**
  * Si el alumno está en el puesto 14, una barra destacada le muestra: *"Tú estás en el #14 (760 pts) • ¡A solo 40 pts de entrar al Top 10!"*.
* **Tabla de Posiciones Completa:**
  * Filas redondeadas con avatares circulares, nombre, colegio/región (opcional), precisión con tag verde menta y número de ensayos completados.

---

### Pantalla 7: Perfil del Alumno (Mi Perfil)
* **Objetivo:** Espacio personal donde el estudiante configura sus metas universitarias, visualiza sus insignias y gestiona sus datos.
* **Layout en 2 Columnas:**
  * **Columna Izquierda (Tarjeta de Identidad y Logros):**
    * Avatar personal personalizable o selección de avatar Tuto (ej. Tuto Astronauta, Tuto Científico).
    * Nombre, correo y edad.
    * Vitrina de Insignias ganadas: 🏅 *"Primer Ensayo 800+"*, ⚡ *"Racha de 7 días"*, 🎯 *"Francotirador de Álgebra"*.
    * Estado de membresía: Badge amigable *"Plan Gratuito Estudiante"* con botón de mejora *"Desbloquear Plan Pro Ilimitado"*.
  * **Columna Derecha (Objetivos Académicos & Metas PAES):**
    * *Carrera de Preferencia:* Selector dinámico (ej. *"Ingeniería Civil Informática"*).
    * *Universidad Objetivo:* (ej. *"Universidad de Chile / PUC"*).
    * *Puntaje de Corte Meta:* Medidor tipo velocímetro o barra de objetivo: `Meta: 850 pts | Actual estimado: 810 pts (Faltan 40 pts)`.
    * Tuto con pulgar arriba: *"Con 2 ensayos más esta semana alcanzamos la meta de corte para la U. de Chile."*

---

## 6. Reglas de Componentes UI para Stitch

1. **Evitar bordes afilados y fondos negros:** Todos los contenedores deben usar `border-radius: 16px` o superior y paletas de color con base `#F8FAFC`.
2. **Jerarquía visual:** Los textos deben ser fáciles de escanear por un estudiante joven; usar títulos con `font-weight: 700` y etiquetas cortas tipo chip/pill.
3. **Presencia consistente de Tuto:** En cada pantalla principal debe haber un slot designado para Tuto (un mensaje contextual en la cabecera, un botón de ayuda o un feedback motivacional).
4. **Accesibilidad (WCAG AA):** Alto contraste entre el texto `#0F172A` y los fondos claros, y el color Coral `#FF5A5F` contrastando nítidamente sobre blanco.
