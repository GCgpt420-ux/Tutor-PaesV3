// Fichas de estudio por tema (Tarea 3A). Clave: `${subject_code}:${topic_code}`,
// porque el mismo topic_code (ej. "GEO") significa cosas distintas en distintas
// materias (Geometría en M2 vs. Geografía en Historia). Códigos reales según
// tutorpaes/backend/scripts/seed_questions.py (LECT, M1, M2, CIEN, HIST).

export interface TopicStudyTrap {
  title: string;
  detail: string;
}

export interface TopicStudyData {
  // Markdown con KaTeX, se renderiza con MarkdownMathRenderer.
  keyConcepts: string;
  demreTraps: TopicStudyTrap[];
}

const DEFAULT_STUDY_DATA: TopicStudyData = {
  keyConcepts:
    'Aún no tenemos una ficha de conceptos específica para este tema. Repasa el material de clase y usa el Tutor IA durante la práctica para reforzar cualquier duda puntual.',
  demreTraps: [
    {
      title: 'Lee el enunciado dos veces',
      detail:
        'Muchos errores en la PAES no son de contenido, sino de no leer completo lo que se pide (por ejemplo, "¿cuál alternativa NO es correcta?").',
    },
  ],
};

const TOPIC_STUDY_DATA: Record<string, TopicStudyData> = {
  'M1:ALG': {
    keyConcepts: `### Función afín y lineal
Una función afín tiene la forma $f(x) = mx + n$, donde $m$ es la **pendiente** (cuánto cambia $y$ por cada unidad de $x$) y $n$ es el **intercepto** (dónde la recta corta el eje $y$, cuando $x = 0$).

### Ecuaciones de primer grado
Se resuelven despejando la incógnita: suma o resta el mismo término en ambos lados, luego multiplica o divide por el coeficiente que la acompaña.

### Factorización básica
Casos comunes: factor común $ax + ay = a(x + y)$, diferencia de cuadrados $a^2 - b^2 = (a+b)(a-b)$, y trinomio cuadrado perfecto $a^2 + 2ab + b^2 = (a+b)^2$.`,
    demreTraps: [
      {
        title: 'Confundir pendiente con intercepto',
        detail:
          'En f(x) = mx + n, el DEMRE suele preguntar "el valor cuando x = 0" (el intercepto n) y se responde por error la pendiente m, o viceversa.',
      },
      {
        title: 'Signo al despejar',
        detail:
          'Al pasar un término al otro lado de la ecuación, el signo cambia. Error clásico: olvidar invertir el signo al "pasar restando".',
      },
      {
        title: 'Dividir por una expresión que puede ser 0',
        detail:
          'Si divides ambos lados por una expresión que podría valer cero, puedes perder soluciones válidas de la ecuación.',
      },
    ],
  },
  'M2:ALG': {
    keyConcepts: `### Función cuadrática
$f(x) = ax^2 + bx + c$. El vértice está en $x = -\\dfrac{b}{2a}$. Si $a > 0$ la parábola abre hacia arriba (mínimo); si $a < 0$, hacia abajo (máximo).

### Discriminante
$\\Delta = b^2 - 4ac$ determina el número de raíces reales: $\\Delta > 0$ dos raíces, $\\Delta = 0$ una raíz (el vértice toca el eje x), $\\Delta < 0$ ninguna raíz real.

### Sistemas de ecuaciones
Resuelve por sustitución o reducción, y verifica siempre tu solución reemplazándola en ambas ecuaciones originales.`,
    demreTraps: [
      {
        title: 'Signo del discriminante',
        detail:
          'Olvidar que Δ < 0 significa que la parábola no corta el eje x. Un error común es intentar calcular raíces reales que no existen.',
      },
      {
        title: 'Vértice con signo invertido',
        detail:
          'La fórmula del vértice es x = -b/(2a); es común olvidar el signo negativo y calcular b/(2a).',
      },
    ],
  },
  'M2:GEO': {
    keyConcepts: `### Teorema de Pitágoras
En un triángulo rectángulo, $a^2 + b^2 = c^2$, donde $c$ es la hipotenusa (el lado opuesto al ángulo recto, siempre el más largo).

### Razones trigonométricas
$\\sin(\\theta) = \\dfrac{\\text{opuesto}}{\\text{hipotenusa}}$, $\\cos(\\theta) = \\dfrac{\\text{adyacente}}{\\text{hipotenusa}}$, $\\tan(\\theta) = \\dfrac{\\text{opuesto}}{\\text{adyacente}}$.

### Áreas y perímetros
Repasa antes del ensayo las fórmulas de círculo ($A = \\pi r^2$), triángulo ($A = \\dfrac{base \\times altura}{2}$) y trapecio — el DEMRE las da por sabidas, no las entrega en el enunciado.`,
    demreTraps: [
      {
        title: 'Confundir cateto opuesto con adyacente',
        detail:
          'Depende de cuál ángulo estás mirando: el mismo cateto es "opuesto" para un ángulo y "adyacente" para el otro.',
      },
      {
        title: 'Usar Pitágoras en un triángulo que no es rectángulo',
        detail:
          'El teorema solo aplica cuando hay un ángulo de 90°. Confirma que el enunciado o la figura lo indique antes de aplicarlo.',
      },
    ],
  },
  'LECT:COMP': {
    keyConcepts: `### Tipos de pregunta DEMRE
- **Localización de información:** la respuesta está explícita en el texto.
- **Interpretación global:** pide el sentido general o la idea principal de un párrafo o del texto completo.
- **Inferencia:** la respuesta no está escrita literalmente, se deduce combinando pistas del texto.
- **Vocabulario contextual:** qué significa una palabra *según cómo se usa en ese texto*, no su significado de diccionario.

### Estrategia
Lee primero la pregunta y luego vuelve al párrafo indicado — no es necesario leer todo el texto en detalle en la primera pasada.`,
    demreTraps: [
      {
        title: 'Elegir la alternativa "verdadera" pero no pedida',
        detail:
          'Puede haber dos alternativas correctas según el texto, pero solo una responde exactamente lo que la pregunta pide (idea principal vs. un detalle secundario).',
      },
      {
        title: 'Vocabulario contextual con significado de diccionario',
        detail:
          'El DEMRE pregunta el sentido de la palabra en ese párrafo, no su significado general. Reemplaza la palabra por cada alternativa y relee la oración.',
      },
      {
        title: 'Inferir de más',
        detail:
          'Una inferencia válida se apoya en el texto. Si tu respuesta necesita información externa que el texto no entrega, probablemente es un distractor.',
      },
    ],
  },
};

export function getTopicStudyData(subjectCode: string, topicCode: string): TopicStudyData {
  return TOPIC_STUDY_DATA[`${subjectCode}:${topicCode}`] ?? DEFAULT_STUDY_DATA;
}
