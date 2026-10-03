"""
Servicio de Fichas de Estudio y Trampas DEMRE para TutorPAES
============================================================
Provee notas conceptuales, fórmulas clave, trampas frecuentes del DEMRE
y estrategias de resolución por asignatura y tema para alimentar
el modal de estudio interactivo.
"""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class KeyConcept(BaseModel):
    title: str
    explanation: str
    formula_or_rule: Optional[str] = None


class DemreTrap(BaseModel):
    trap: str
    example: str
    prevention_tip: str


class StudyNoteOut(BaseModel):
    topic_id: int
    topic_code: str
    topic_name: str
    subject_id: int
    subject_code: str
    subject_name: str
    summary: str
    key_concepts: List[KeyConcept]
    demre_traps: List[DemreTrap]
    recommended_strategies: List[str]
    available_questions_count: int


# Base de conocimiento pedagógica curada para PAES
DEMRE_KNOWLEDGE_BASE: Dict[str, Dict[str, Any]] = {
    "M1_ALG": {
        "summary": "Álgebra y Funciones en M1 evalúa modelamiento lineal y cuadrático, operatoria algebraica básica, productos notables, desigualdades y proporcionalidad.",
        "key_concepts": [
            {
                "title": "Función Cuadrática y Vértice",
                "explanation": "Toda parábola f(x) = ax² + bx + c tiene vértice en (-b/(2a), f(-b/(2a))). La concavidad depende exclusivamente del signo de a.",
                "formula_or_rule": "x_v = -b / (2a); \\Delta = b^2 - 4ac",
            },
            {
                "title": "Productos Notables y Factorización",
                "explanation": "No desarrolles expresiones si puedes simplificar primero factorizando por término común o diferencia de cuadrados.",
                "formula_or_rule": "(a+b)(a-b) = a^2 - b^2; (a \\pm b)^2 = a^2 \\pm 2ab + b^2",
            },
            {
                "title": "Sistemas de Ecuaciones Lineales",
                "explanation": "Un sistema 2x2 tiene infinitas soluciones si ambas rectas coinciden (proporcionales), o no tiene solución si son paralelas.",
                "formula_or_rule": "a1/a2 = b1/b2 \\neq c1/c2 \\implies \\text{Sin solución}",
            },
        ],
        "demre_traps": [
            {
                "trap": "Inversión del signo en inecuaciones",
                "example": "Despejar -3x < 12 como x < -4 en lugar de x > -4.",
                "prevention_tip": "Al multiplicar o dividir por un número negativo, invierte de inmediato el sentido de la desigualdad.",
            },
            {
                "trap": "Simplificación inválida de fracciones algebraicas",
                "example": "Cancelar términos sumados en (x + 3) / 3 para obtener x + 1.",
                "prevention_tip": "Solo puedes simplificar factores multiplicativos comunes a todo el numerador y denominador.",
            },
            {
                "trap": "Confusión entre raíces y corte con el eje Y",
                "example": "Confundir f(0) = c (corte con eje Y) con las soluciones de f(x) = 0.",
                "prevention_tip": "Corte con eje Y siempre es (0, c). Cortes con eje X son las raíces o ceros de la función.",
            },
        ],
        "recommended_strategies": [
            "Comprueba los casos límites o valores convenientes (ej: x=0, x=1) en alternativas si el álgebra es extensa.",
            "Lee atentamente si el enunciado pide el valor de 'x' o el valor de una expresión derivada (ej: 2x - 1).",
            "Identifica el dominio real en problemas de contexto (número de personas, metros, tiempo siempre > 0).",
        ],
    },
    "M1_GEO": {
        "summary": "Geometría en M1 evalúa perímetro y área de polígonos y círculos, teorema de Pitágoras, semejanza de triángulos y transformaciones isométricas.",
        "key_concepts": [
            {
                "title": "Teorema de Pitágoras y Tríos Pitagóricos",
                "explanation": "En todo triángulo rectángulo, a² + b² = c². Reconoce tríos frecuentes para ahorrar tiempo.",
                "formula_or_rule": "(3, 4, 5), (5, 12, 13), (8, 15, 17)",
            },
            {
                "title": "Área y Perímetro de Círculo y Sectores",
                "explanation": "Diferencia claramente longitud de circunferencia (2πr) del área (πr²). En sectores circulares calcula la fracción del ángulo central.",
                "formula_or_rule": "P = 2\\pi r; A = \\pi r^2; A_{sector} = \\frac{\\alpha}{360^\\circ}\\pi r^2",
            },
            {
                "title": "Semejanza y Razón de Áreas",
                "explanation": "Si dos figuras son semejantes con razón de lados k, sus áreas están en razón k² y sus volúmenes en razón k³.",
                "formula_or_rule": "Razón de Áreas = k^2; Razón de Volúmenes = k^3",
            },
        ],
        "demre_traps": [
            {
                "trap": "Confundir radio con diámetro",
                "example": "Usar el diámetro directamente en la fórmula πr², cuadruplicando el área real.",
                "prevention_tip": "Subraya si el dato otorgado es radio o diámetro antes de reemplazar en la fórmula.",
            },
            {
                "trap": "Sumar el perímetro interior en figuras compuestas",
                "example": "Incluir bordes internos al calcular el contorno o perímetro total de una figura ensamblada.",
                "prevention_tip": "El perímetro es únicamente el contorno exterior que encierra a la figura.",
            },
        ],
        "recommended_strategies": [
            "Haz un dibujo esquemático si el problema geométrico no incluye figura.",
            "Anota las unidades de medida (metros vs centímetros) antes de operar.",
        ],
    },
    "M1_GEN": {
        "summary": "Matemática 1 General integra conjuntos numéricos (enteros, racionales, porcentajes, potencias), probabilidad elemental y estadística descriptiva.",
        "key_concepts": [
            {
                "title": "Porcentajes y Variaciones",
                "explanation": "Un aumento del p% se multiplica por (1 + p/100). Un descuento del p% se multiplica por (1 - p/100).",
                "formula_or_rule": "Valor Final = Valor Inicial \\cdot (1 \\pm p/100)",
            },
            {
                "title": "Regla de Laplace en Probabilidades",
                "explanation": "Para eventos equiprobables, P(A) = Casos Favorables / Casos Totales. Siempre 0 <= P(A) <= 1.",
                "formula_or_rule": "P(A) = \\frac{\\#(A)}{\\#(\\Omega)}",
            },
            {
                "title": "Medidas de Tendencia Central y Posición",
                "explanation": "La mediana requiere ordenar los datos primero. La media se afecta fuertemente por valores extremos.",
                "formula_or_rule": "\\bar{x} = \\frac{\\sum x_i}{n}",
            },
        ],
        "demre_traps": [
            {
                "trap": "Aumento porcentual sucesivo",
                "example": "Creer que subir 20% y luego bajar 20% vuelve al valor original.",
                "prevention_tip": "El segundo porcentaje se aplica sobre la nueva base: 1.20 * 0.80 = 0.96 (pérdida neta del 4%).",
            },
            {
                "trap": "Probabilidad sin reposición",
                "example": "No descontar un elemento del total en la segunda extracción.",
                "prevention_tip": "Identifica si el experimento es 'con reposición' o 'sin reposición'.",
            },
        ],
        "recommended_strategies": [
            "Convierte fracciones a decimales o viceversa según sea más cómodo de simplificar.",
            "Organiza datos de tablas estadísticas identificando frecuencia absoluta vs acumulada.",
        ],
    },
    "M2_ALG": {
        "summary": "Álgebra y Funciones en M2 profundiza en propiedades de logaritmos, potencias de exponente racional, raíces y funciones inyectivas/inversas.",
        "key_concepts": [
            {
                "title": "Propiedades de Logaritmos",
                "explanation": "El logaritmo de un producto es la suma de logaritmos. El logaritmo de una potencia baja el exponente como factor.",
                "formula_or_rule": "\\log_b(xy) = \\log_b(x) + \\log_b(y); \\log_b(x^k) = k \\log_b(x)",
            },
            {
                "title": "Restricciones de Dominio de Raíces y Logaritmos",
                "explanation": "En log_b(x): x > 0 y b > 0 con b != 1. En raíces de índice par: subradical >= 0.",
                "formula_or_rule": "\\sqrt[2n]{g(x)} \\implies g(x) \\ge 0",
            },
        ],
        "demre_traps": [
            {
                "trap": "Distribuir logaritmos sobre sumas",
                "example": "Escribir log(a + b) = log(a) + log(b), lo cual es matemáticamente falso.",
                "prevention_tip": "El logaritmo de una suma NO se puede separar; solo se separan productos o cocientes.",
            },
            {
                "trap": "Raíz cuadrada de una incógnita al cuadrado",
                "example": "Asumir que sqrt(x²) = x en lugar de |x| para cualquier x real.",
                "prevention_tip": "\\sqrt{x^2} = |x|. Ten presente posibles valores negativos si no se especifica x >= 0.",
            },
        ],
        "recommended_strategies": [
            "Aplica cambio de base en logaritmos cuando las bases no coincidan.",
            "Verifica que las soluciones obtenidas pertenezcan al dominio real de la ecuación.",
        ],
    },
    "M2_GEO": {
        "summary": "Geometría en M2 cubre razones trigonométricas en triángulos rectángulos, ángulos notables, vectores en el plano y transformaciones tridimensionales.",
        "key_concepts": [
            {
                "title": "Razones Trigonométricas Fundamentales",
                "explanation": "sen(α) = opuesto/hipotenusa, cos(α) = adyacente/hipotenusa, tan(α) = sen(α)/cos(α).",
                "formula_or_rule": "\\text{sen}^2(\\alpha) + \\cos^2(\\alpha) = 1",
            },
            {
                "title": "Vectores: Módulo y Producto Escalar",
                "explanation": "El módulo de u=(x, y) es sqrt(x² + y²). Dos vectores son perpendiculares si su producto punto es 0.",
                "formula_or_rule": "\\vec{u} \\cdot \\vec{v} = 0 \\iff \\vec{u} \\perp \\vec{v}",
            },
        ],
        "demre_traps": [
            {
                "trap": "Ángulo de elevación vs depresión",
                "example": "Medir el ángulo de depresión con respecto a la vertical en vez de la línea visual horizontal.",
                "prevention_tip": "Tanto el ángulo de elevación como el de depresión se miden SIEMPRE desde la horizontal.",
            },
        ],
        "recommended_strategies": [
            "Memoriza los valores exactos para 30°, 45° y 60°.",
            "Usa triángulos notables (30-60-90 y 45-45-90) para resolver trigonometría sin calculadora.",
        ],
    },
    "LENG_GEN": {
        "summary": "Competencia Lectora evalúa tres habilidades nucleares del DEMRE: Localizar, Interpretar y Relacionar, y Evaluar y Reflexionar sobre textos de diversa tipología.",
        "key_concepts": [
            {
                "title": "Habilidad 1: Localizar Información Explícita",
                "explanation": "La respuesta se encuentra textual o parafraseada directamente en el texto. No agregues juicios ni supuestos personales.",
                "formula_or_rule": "Rastreo textual \\implies Sin extrapolaciones",
            },
            {
                "title": "Habilidad 2: Inferir e Interpretar",
                "explanation": "Deducción lógica a partir de marcas textuales. Una inferencia válida no contradice el texto y se sostiene con evidencia.",
                "formula_or_rule": "Premisa explícita + Lógica \\implies Inferencia válida",
            },
            {
                "title": "Habilidad 3: Evaluar el Propósito y Tono",
                "explanation": "Determinar la postura del autor: crítico, neutro, persuasivo, irónico o divulgativo.",
                "formula_or_rule": "Vocabulario valorativo \\implies Postura del emisor",
            },
        ],
        "demre_traps": [
            {
                "trap": "Sobreinterpretación o conocimiento previo ajeno al texto",
                "example": "Marcar una alternativa que es cierta en el mundo real pero que el texto nunca menciona.",
                "prevention_tip": "La prueba evalúa lo que dice el texto, no lo que sabes externamente sobre el tema.",
            },
            {
                "trap": "Palabras absolutas en alternativas incorrectas",
                "example": "Opciones con 'siempre', 'nunca', 'todos', 'únicamente' suelen ser distractores falsos.",
                "prevention_tip": "Desconfía de afirmaciones absolutistas a menos que el texto use explícitamente esa calificación.",
            },
            {
                "trap": "Distractor por concordancia léxica",
                "example": "Alternativas que repiten las mismas palabras del párrafo pero alteran la relación causa-efecto.",
                "prevention_tip": "No marques por coincidencia de palabras; verifica el significado completo de la oración.",
            },
        ],
        "recommended_strategies": [
            "Lee primero las preguntas para enfocar la lectura en los párrafos clave.",
            "Subraya la idea principal de cada párrafo al terminar de leerlo.",
            "En preguntas de síntesis, descarta opciones que solo resuman un detalle o párrafo aislado.",
        ],
    },
    "CIEN_GEN": {
        "summary": "Ciencias Módulo Común integra fundamentos de Biología, Física y Química con fuerte foco en Pensamiento Científico (variables, hipótesis y conclusiones).",
        "key_concepts": [
            {
                "title": "Método y Pensamiento Científico",
                "explanation": "Variable independiente (manipulada), variable dependiente (medida) y variables controladas (constantes).",
                "formula_or_rule": "Causa (Independiente) \\to Efecto (Dependiente)",
            },
            {
                "title": "Conservación de Materia y Energía",
                "explanation": "En sistemas aislados, la energía y la masa no se crean ni se destruyen, solo se transforman.",
                "formula_or_rule": "E_{inicial} = E_{final}; \\sum m_{reactivos} = \\sum m_{productos}",
            },
        ],
        "demre_traps": [
            {
                "trap": "Confundir Correlación con Causalidad",
                "example": "Afirmar que una variable causa a otra solo porque ambas aumentan al mismo tiempo en el gráfico.",
                "prevention_tip": "Una conclusión experimental solo es válida si se controlaron todas las demás variables.",
            },
        ],
        "recommended_strategies": [
            "Lee los ejes de los gráficos (unidades, escalas y variables) antes de leer el enunciado.",
            "Diferencia claramente observación de hipótesis y conclusión.",
        ],
    },
    "BIO_GEN": {
        "summary": "Biología evalúa organización celular, metabolismo y fotosíntesis, genética mendeliana y molecular, ecología de poblaciones y fisiología humana.",
        "key_concepts": [
            {
                "title": "Flujo de Información Genética",
                "explanation": "El dogma central: ADN -> (transcripción) -> ARN -> (traducción) -> Proteína.",
                "formula_or_rule": "A-T / G-C en ADN; A-U / G-C en ARN",
            },
            {
                "title": "Homeostasis y Regulación Hormonal",
                "explanation": "Retroalimentación negativa mantiene el equilibrio interno (ej: insulina y glucagón regulando glicemia).",
                "formula_or_rule": "\\text{Feedback Negativo} \\implies \\text{Estabilidad sistémica}",
            },
        ],
        "demre_traps": [
            {
                "trap": "Confundir Mitosis con Meiosis",
                "example": "Creer que la mitosis genera variabilidad genética o células haploides.",
                "prevention_tip": "Mitosis: 2 células hijas genéticamente idénticas (2n). Meiosis: 4 células haploides con crossing-over (n).",
            },
        ],
        "recommended_strategies": [
            "Rastrea las flechas en redes tróficas: la flecha apunta hacia el organismo que consume la energía.",
            "En genética, plantea siempre el tablero de Punnett para evitar errores de cálculo.",
        ],
    },
    "FIS_GEN": {
        "summary": "Física evalúa cinemática (MRU, MRUA), dinámica (leyes de Newton), trabajo y energía, ondas (luz y sonido) y circuitos eléctricos básicos.",
        "key_concepts": [
            {
                "title": "Segunda Ley de Newton",
                "explanation": "La aceleración es directamente proporcional a la fuerza neta e inversamente proporcional a la masa.",
                "formula_or_rule": "\\sum \\vec{F} = m \\vec{a}; P = mg",
            },
            {
                "title": "Ecuación Fundamental de Ondas",
                "explanation": "La velocidad de propagación depende exclusivamente del medio de propagación. La frecuencia solo depende de la fuente emisor.",
                "formula_or_rule": "v = \\lambda \\cdot f; T = \\frac{1}{f}",
            },
        ],
        "demre_traps": [
            {
                "trap": "Cambio de frecuencia al cambiar de medio",
                "example": "Creer que una onda sonora o de luz cambia su frecuencia al pasar de aire a agua.",
                "prevention_tip": "La frecuencia NUNCA cambia al cambiar de medio; solo varían la velocidad y la longitud de onda.",
            },
            {
                "trap": "Confundir Masa con Peso",
                "example": "Usar kilogramos como unidad de fuerza o creer que la masa cambia en la Luna.",
                "prevention_tip": "La masa es invariante (kg). El peso es una fuerza vectorial que depende de la gravedad local (N).",
            },
        ],
        "recommended_strategies": [
            "Dibuja el Diagrama de Cuerpo Libre (DCL) en todos los problemas de fuerzas.",
            "Convierte unidades de km/h a m/s dividiendo por 3.6.",
        ],
    },
    "QUI_GEN": {
        "summary": "Química evalúa estructura atómica, tabla periódica y enlaces químicos, estequiometría y leyes ponderales, disoluciones y química orgánica básica.",
        "key_concepts": [
            {
                "title": "Estequiometría y Mol",
                "explanation": "El mol relaciona la masa con el número de partículas (6.022 x 10²³). Siempre balancea la ecuación química antes de calcular.",
                "formula_or_rule": "n = \\frac{m}{M_m}; C = \\frac{n}{V_{(L)}}",
            },
            {
                "title": "Enlaces Químicos y Polaridad",
                "explanation": "Diferencia de electronegatividad determina el tipo de enlace (covalente apolar, covalente polar o iónico).",
                "formula_or_rule": "\\Delta EN > 1.7 \\implies \\text{Iónico}",
            },
        ],
        "demre_traps": [
            {
                "trap": "Calcular moles sin balancear la reacción",
                "example": "Aplicar relaciones directas 1:1 en reacciones con coeficientes estequiométricos diferentes.",
                "prevention_tip": "Paso 1 ineludible en estequiometría: verificar que la ecuación química esté perfectamente balanceada.",
            },
        ],
        "recommended_strategies": [
            "Identifica de inmediato el reactivo limitante antes de calcular el rendimiento.",
            "Verifica si las concentraciones están en %m/m, %m/v o Molaridad.",
        ],
    },
    "HIST_GEN": {
        "summary": "Historia y Ciencias Sociales evalúa procesos de construcción republicana en Chile, transformaciones estructurales del siglo XX, Guerra Fría y Formación Ciudadana.",
        "key_concepts": [
            {
                "title": "Institucionalidad Democrática y Estado de Derecho",
                "explanation": "Separación de poderes del Estado, soberanía popular y garantía constitucional de los Derechos Humanos.",
                "formula_or_rule": "Poder Ejecutivo, Legislativo y Judicial con pesos y contrapesos",
            },
            {
                "title": "Cuestión Social e Industrialización en Chile",
                "explanation": "Migración campo-ciudad, condiciones laborales precarias y surgimiento de la legislación social a inicios del siglo XX.",
                "formula_or_rule": "Crisis salitrera + Movimiento obrero \\implies Reformas constitucionales (1925)",
            },
        ],
        "demre_traps": [
            {
                "trap": "Anacronismo histórico",
                "example": "Juzgar acontecimientos del siglo XIX con estándares valóricos o tecnológicos actuales.",
                "prevention_tip": "Analiza las decisiones de los actores históricos dentro del contexto político y social de su propia época.",
            },
        ],
        "recommended_strategies": [
            "Identifica el autor, año y tipo de fuente (primaria vs secundaria) en documentos históricos.",
            "En preguntas de economía ciudadana, relaciona oferta, demanda e inflación con el poder adquisitivo.",
        ],
    },
}


def get_study_card_for_topic(
    topic_id: int,
    topic_code: str,
    topic_name: str,
    subject_id: int,
    subject_code: str,
    subject_name: str,
    questions_count: int = 0,
) -> StudyNoteOut:
    """
    Recupera la ficha de estudio conceptual y trampas DEMRE para un tema dado.
    Si no existe un mapeo específico exacto, utiliza el mapeo de la asignatura o genera un fallback inteligente.
    """
    key_specific = f"{subject_code.upper()}_{topic_code.upper()}"
    key_general = f"{subject_code.upper()}_GEN"

    data = DEMRE_KNOWLEDGE_BASE.get(key_specific) or DEMRE_KNOWLEDGE_BASE.get(key_general)

    if not data:
        # Fallback genérico para materias de ciencias o temas complementarios
        if "CIEN" in subject_code.upper() or subject_code.upper() in {"BIO", "FIS", "QUI"}:
            data = DEMRE_KNOWLEDGE_BASE["CIEN_GEN"]
        elif "HIST" in subject_code.upper():
            data = DEMRE_KNOWLEDGE_BASE["HIST_GEN"]
        elif "LENG" in subject_code.upper() or "LECT" in subject_code.upper():
            data = DEMRE_KNOWLEDGE_BASE["LENG_GEN"]
        else:
            data = DEMRE_KNOWLEDGE_BASE["M1_GEN"]

    return StudyNoteOut(
        topic_id=topic_id,
        topic_code=topic_code,
        topic_name=topic_name,
        subject_id=subject_id,
        subject_code=subject_code,
        subject_name=subject_name,
        summary=data["summary"],
        key_concepts=[KeyConcept(**c) for c in data["key_concepts"]],
        demre_traps=[DemreTrap(**t) for t in data["demre_traps"]],
        recommended_strategies=data["recommended_strategies"],
        available_questions_count=questions_count,
    )
