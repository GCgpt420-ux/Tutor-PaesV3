"""
Seed de 6 preguntas básicas por tópico para cada módulo PAES.
Por ahora solo es un modelo con preguntas simples de opción múltiple.
Ejecutar después de seed_paes.py
"""

from sqlalchemy import select
from app.core.config import settings
from app.db.session import SessionLocal
from app.db.models import Exam, Subject, Topic, Question, QuestionChoice

def seed_questions():
    db = SessionLocal()
    try:
        exam = db.scalar(select(Exam).where(Exam.code == settings.PAES_CODE))
        if not exam:
            print(f"Si el error es {settings.PAES_CODE} exam no encontrado. Ejecuta seed_paes.py primero.")
            return

        #  COMPETENCIA LECTORA (LECT) 
        lect = db.scalar(select(Subject).where(Subject.exam_id == exam.id, Subject.code == "LECT"))
        if lect:
            comp_topic = db.scalar(select(Topic).where(Topic.subject_id == lect.id, Topic.code == "COMP"))
            if not comp_topic:
                comp_topic = Topic(subject_id=lect.id, code="COMP", name="Comprensión Lectora")
                db.add(comp_topic)
                db.flush()
            
            _seed_competencia_lectora(db, comp_topic.id)

        #  MATEMÁTICA 1 (M1) 
        m1 = db.scalar(select(Subject).where(Subject.exam_id == exam.id, Subject.code == "M1"))
        if m1:
            alg = db.scalar(select(Topic).where(Topic.subject_id == m1.id, Topic.code == "ALG"))
            if alg:
                _seed_m1_algebra(db, alg.id)

        #  MATEMÁTICA 2 (M2) 
        m2 = db.scalar(select(Subject).where(Subject.exam_id == exam.id, Subject.code == "M2"))
        if m2:
            # Crear tópicos para M2
            m2_alg = _get_or_create_topic(db, m2.id, "ALG", "Álgebra Avanzada")
            m2_geo = _get_or_create_topic(db, m2.id, "GEO", "Geometría Avanzada")
            _seed_m2_algebra(db, m2_alg.id)
            _seed_m2_geometria(db, m2_geo.id)

        #  CIENCIAS (CIEN) 
        cien = db.scalar(select(Subject).where(Subject.exam_id == exam.id, Subject.code == "CIEN"))
        if cien:
            bio = _get_or_create_topic(db, cien.id, "BIO", "Biología")
            fis = _get_or_create_topic(db, cien.id, "FIS", "Física")
            qui = _get_or_create_topic(db, cien.id, "QUI", "Química")
            _seed_biologia(db, bio.id)
            _seed_fisica(db, fis.id)
            _seed_quimica(db, qui.id)

        #  HISTORIA Y CIENCIAS SOCIALES (HIST) 
        hist = db.scalar(select(Subject).where(Subject.exam_id == exam.id, Subject.code == "HIST"))
        if hist:
            hist_topic = _get_or_create_topic(db, hist.id, "HIST", "Historia de Chile")
            geo_topic = _get_or_create_topic(db, hist.id, "GEO", "Geografía")
            _seed_historia(db, hist_topic.id)
            _seed_geografia(db, geo_topic.id)

        db.commit()
        print(" Seed de preguntas completado: 6 preguntas básicas por tópico")
    except Exception as e:
        db.rollback()
        print(f" Error durante seed: {e}")
        raise
    finally:
        db.close()


def _get_or_create_topic(db, subject_id: int, code: str, name: str):
    topic = db.scalar(select(Topic).where(Topic.subject_id == subject_id, Topic.code == code))
    if topic:
        return topic
    topic = Topic(subject_id=subject_id, code=code, name=name)
    db.add(topic)
    db.flush()
    return topic


def _add_question(db, topic_id: int, prompt: str, explanation: str, choices_data: list, difficulty: int = 1, reading_text: str = None):
    """
    Agrega una pregunta si no existe.
    choices_data: [("A", "texto opción", True/False), ...]
    reading_text: Texto para preguntas de comprensión lectora (opcional)
    """
    existing = db.scalar(select(Question).where(Question.topic_id == topic_id, Question.prompt == prompt))
    if existing:
        return

    q = Question(
        topic_id=topic_id,
        prompt=prompt,
        explanation=explanation,
        reading_text=reading_text,
        difficulty=difficulty,
        question_type="mcq",
        is_active=True,
    )
    db.add(q)
    db.flush()

    for label, text, is_correct in choices_data:
        db.add(QuestionChoice(question_id=q.id, label=label, text=text, is_correct=is_correct))


#  COMPETENCIA LECTORA 
def _seed_competencia_lectora(db, topic_id: int):
    """6 preguntas básicas de comprensión lectora (2 textos reales)"""
    
    # TEXTO 1: Narrativo - La Nostalgia
    texto1 = """Cada atardecer, Magdalena subía a la azotea de su casa para contemplar la ciudad. 
Desde allí podía ver las calles por donde caminaba de niña, los árboles que sus abuelos plantaron, 
el río que ahora apenas llevaba agua. Hacía tres años que se había ido a la capital para trabajar, 
pero su corazón permanecía en ese pueblo olvidado. Sus amigas de infancia ya no le escribían, 
y los pocos que quedaban se empeñaban en hablar del pasado como si el presente no existiera. 
Magdalena sentía que estaba atrapada entre dos mundos: uno que la había formado pero que ya no 
la cabía, y otro que le ofrecía oportunidades pero que nunca sentiría como hogar."""
    
    _add_question(
        db, topic_id,
        "¿Cuál es la idea principal del texto?",
        "La pregunta evalúa la capacidad de identificar el tema central del fragmento narrativo.",
        [
            ("A", "Magdalena trabajaba en la capital", False),
            ("B", "La protagonista experimenta una nostalgia conflictiva por su pueblo natal", True),
            ("C", "Los árboles de la azotea eran importantes para la familia", False),
            ("D", "Las amigas de Magdalena se mudaron a la ciudad", False),
        ],
        reading_text=texto1
    )

    _add_question(
        db, topic_id,
        "¿Cuál de las siguientes afirmaciones describe mejor el estado emocional de Magdalena?",
        "Evalúa la capacidad de interpretar emociones en contexto narrativo.",
        [
            ("A", "Está completamente feliz con su vida en la capital", False),
            ("B", "Se siente completamente rechazada por su pueblo", False),
            ("C", "Experimenta un conflicto interno entre el pasado y el presente", True),
            ("D", "Ha olvidado completamente su infancia", False),
        ],
        reading_text=texto1
    )

    # TEXTO 2: Informativo - Cambio Climático
    texto2 = """El cambio climático es uno de los desafíos más significativos del siglo XXI. 
Las temperaturas globales han aumentado aproximadamente 1,1 grados Celsius desde la era 
preindustrial, principalmente debido a la emisión de gases de efecto invernadero como el 
dióxido de carbono. Este aumento aparentemente pequeño ha generado consecuencias visibles: 
deshielo de glaciares, aumento del nivel del mar, y fenómenos climáticos más extremos. 
Los científicos advierten que sin intervención significativa, los ecosistemas enfrentarán 
cambios irreversibles en las próximas décadas. Sin embargo, existen soluciones: transición 
a energías renovables, reforestación masiva, y cambios en patrones de consumo. El 
reconocimiento global del problema ha llevado a acuerdos internacionales como el Protocolo 
de Kioto y el Acuerdo de París, aunque su implementación enfrenta desafíos políticos y económicos."""
    
    _add_question(
        db, topic_id,
        "¿Cuál es el propósito principal del texto informativo?",
        "Identifica si el texto busca informar, persuadir o entretener.",
        [
            ("A", "Entretener al lector con historias de científicos", False),
            ("B", "Informar sobre el cambio climático y sus consecuencias", True),
            ("C", "Criticar severamente la inacción gubernamental", False),
            ("D", "Vender tecnología de energías renovables", False),
        ],
        reading_text=texto2
    )

    _add_question(
        db, topic_id,
        "Según el texto, ¿cuál es la causa principal del aumento de temperaturas?",
        "Evalúa la localización de información explícita en el texto.",
        [
            ("A", "El deshielo de glaciares", False),
            ("B", "La emisión de gases de efecto invernadero", True),
            ("C", "El aumento del nivel del mar", False),
            ("D", "Los fenómenos climáticos extremos", False),
        ],
        reading_text=texto2
    )

    _add_question(
        db, topic_id,
        "¿Cuál es una conclusión que se puede extraer del texto?",
        "Evalúa el pensamiento crítico e inferencia a partir de datos",
        [
            ("A", "El cambio climático se resolverá solo con el tiempo", False),
            ("B", "Se requieren cambios significativos en energía, naturaleza y consumo para enfrentar el problema", True),
            ("C", "Los acuerdos internacionales ya han resuelto completamente el problema", False),
            ("D", "No hay soluciones posibles para el cambio climático", False),
        ],
        reading_text=texto2
    )

    _add_question(
        db, topic_id,
        "¿Cuál es el tono del autor en este fragmento?",
        "Identifica la actitud o perspectiva del autor ante el tema",
        [
            ("A", "Burlón y sarcástico", False),
            ("B", "Académico y objetivo, pero con tono de urgencia", True),
            ("C", "Emocional y desesesperado", False),
            ("D", "Hostil y confrontacional", False),
        ],
        reading_text=texto2
    )



#  MATEMÁTICA 1 (M1) - ÁLGEBRA 
def _seed_m1_algebra(db, topic_id: int):
    """6 preguntas básicas de álgebra para M1"""
    
    _add_question(
        db, topic_id,
        "Resuelve: 3x + 5 = 20. ¿Cuál es el valor de x?",
        "Ecuación lineal simple con una incógnita.",
        [
            ("A", "x = 3", False),
            ("B", "x = 5", True),
            ("C", "x = 7", False),
            ("D", "x = 10", False),
        ]
    )

    _add_question(
        db, topic_id,
        "Factoriza: x² + 5x + 6",
        "Factorización de trinomio cuadrado.",
        [
            ("A", "(x + 2)(x + 3)", True),
            ("B", "(x + 1)(x + 6)", False),
            ("C", "(x - 2)(x - 3)", False),
            ("D", "(x + 2)(x - 3)", False),
        ]
    )

    _add_question(
        db, topic_id,
        "Si a = 2 y b = 3, ¿cuál es el valor de 2a + 3b?",
        "Evaluación de expresiones algebraicas.",
        [
            ("A", "11", False),
            ("B", "13", True),
            ("C", "15", False),
            ("D", "17", False),
        ]
    )

    _add_question(
        db, topic_id,
        "Simplifica: 2(x + 3) - 4(x - 1)",
        "Distribución y simplificación de expresiones.",
        [
            ("A", "-2x + 10", True),
            ("B", "-2x + 2", False),
            ("C", "2x + 10", False),
            ("D", "-2x - 2", False),
        ]
    )

    _add_question(
        db, topic_id,
        "¿Cuál es la solución de: 2x - 3 = x + 5?",
        "Ecuación lineal con variable en ambos lados.",
        [
            ("A", "x = 2", False),
            ("B", "x = 4", False),
            ("C", "x = 8", True),
            ("D", "x = 10", False),
        ]
    )

    _add_question(
        db, topic_id,
        "Expande: (x + 2)²",
        "Productos notables: cuadrado de binomio.",
        [
            ("A", "x² + 4", False),
            ("B", "x² + 4x + 4", True),
            ("C", "x² + 2x + 4", False),
            ("D", "x² + 4x + 2", False),
        ]
    )


#  MATEMÁTICA 2 (M2) - ÁLGEBRA AVANZADA 
def _seed_m2_algebra(db, topic_id: int):
    """6 preguntas básicas de álgebra avanzada para M2"""
    
    _add_question(
        db, topic_id,
        "Resuelve el sistema: 2x + y = 7 y x - y = 2",
        "Sistema de ecuaciones lineales.",
        [
            ("A", "x = 3, y = 1", True),
            ("B", "x = 2, y = 3", False),
            ("C", "x = 4, y = 1", False),
            ("D", "x = 1, y = 3", False),
        ]
    )

    _add_question(
        db, topic_id,
        "¿Cuál es la solución de la ecuación cuadrática: x² - 5x + 6 = 0?",
        "Ecuación cuadrática con raíces racionales.",
        [
            ("A", "x = 1 ó x = 6", False),
            ("B", "x = 2 ó x = 3", True),
            ("C", "x = -2 ó x = -3", False),
            ("D", "x = 0 ó x = 5", False),
        ]
    )

    _add_question(
        db, topic_id,
        "Si f(x) = 2x² - 3x + 1, ¿cuál es f(2)?",
        "Evaluación de función cuadrática.",
        [
            ("A", "1", False),
            ("B", "3", True),
            ("C", "5", False),
            ("D", "7", False),
        ]
    )

    _add_question(
        db, topic_id,
        "¿Cuál es el vértice de la parábola y = x² - 4x + 3?",
        "Identificación del vértice en función cuadrática.",
        [
            ("A", "(2, -1)", True),
            ("B", "(2, 3)", False),
            ("C", "(0, 3)", False),
            ("D", "(4, 3)", False),
        ]
    )

    _add_question(
        db, topic_id,
        "Factoriza: 2x² + 7x + 3",
        "Factorización de trinomio con coeficiente principal ≠ 1.",
        [
            ("A", "(2x + 1)(x + 3)", True),
            ("B", "(2x + 3)(x + 1)", False),
            ("C", "(x + 1)(2x + 3)", False),
            ("D", "(2x - 1)(x - 3)", False),
        ]
    )

    _add_question(
        db, topic_id,
        "¿Cuál es el discriminante de x² - 4x + 4 = 0?",
        "Cálculo del discriminante para análisis de soluciones.",
        [
            ("A", "-4", False),
            ("B", "0", True),
            ("C", "4", False),
            ("D", "8", False),
        ]
    )


#  MATEMÁTICA 2 (M2) - GEOMETRÍA AVANZADA 
def _seed_m2_geometria(db, topic_id: int):
    """6 preguntas básicas de geometría avanzada para M2"""
    
    _add_question(
        db, topic_id,
        "¿Cuál es el área de un rectángulo con lados 5 y 8?",
        "Cálculo de área de rectángulo.",
        [
            ("A", "13", False),
            ("B", "26", False),
            ("C", "40", True),
            ("D", "80", False),
        ]
    )

    _add_question(
        db, topic_id,
        "¿Cuál es el perímetro de un triángulo equilátero de lado 6?",
        "Cálculo de perímetro de triángulo equilátero.",
        [
            ("A", "12", False),
            ("B", "18", True),
            ("C", "24", False),
            ("D", "36", False),
        ]
    )

    _add_question(
        db, topic_id,
        "¿Cuál es el volumen de un cubo de arista 3?",
        "Cálculo de volumen de cubo.",
        [
            ("A", "9", False),
            ("B", "18", False),
            ("C", "27", True),
            ("D", "81", False),
        ]
    )

    _add_question(
        db, topic_id,
        "En un triángulo rectángulo, si los catetos miden 3 y 4, ¿cuál es la hipotenusa?",
        "Teorema de Pitágoras.",
        [
            ("A", "5", True),
            ("B", "6", False),
            ("C", "7", False),
            ("D", "8", False),
        ]
    )

    _add_question(
        db, topic_id,
        "¿Cuál es el área de un círculo con radio 5?",
        "Cálculo de área de círculo.",
        [
            ("A", "15π", False),
            ("B", "25π", True),
            ("C", "50π", False),
            ("D", "100π", False),
        ]
    )

    _add_question(
        db, topic_id,
        "¿Cuáles son las coordenadas del punto medio entre (2, 3) y (8, 7)?",
        "Punto medio en el plano cartesiano.",
        [
            ("A", "(5, 5)", True),
            ("B", "(5, 4)", False),
            ("C", "(6, 5)", False),
            ("D", "(4, 5)", False),
        ]
    )


#  CIENCIAS - BIOLOGÍA 
def _seed_biologia(db, topic_id: int):
    """6 preguntas básicas de biología"""
    
    _add_question(
        db, topic_id,
        "¿Cuál es la unidad estructural básica de la vida?",
        "Concepto fundamental de biología celular.",
        [
            ("A", "Molécula", False),
            ("B", "Célula", True),
            ("C", "Átomo", False),
            ("D", "Tejido", False),
        ]
    )

    _add_question(
        db, topic_id,
        "¿Qué proceso permite que las plantas produzcan su propio alimento?",
        "Fotosíntesis como proceso biológico fundamental.",
        [
            ("A", "Respiración", False),
            ("B", "Fermentación", False),
            ("C", "Fotosíntesis", True),
            ("D", "Digestión", False),
        ]
    )

    _add_question(
        db, topic_id,
        "¿Cuál es el pigmento responsable del color verde en las plantas?",
        "Identificación de pigmentos fotosintéticos.",
        [
            ("A", "Carotenoides", False),
            ("B", "Xantófila", False),
            ("C", "Clorofila", True),
            ("D", "Antocianina", False),
        ]
    )

    _add_question(
        db, topic_id,
        "¿Cuántos cromosomas tiene un ser humano en una célula somática?",
        "Conocimiento de carga cromosómica humana.",
        [
            ("A", "23", False),
            ("B", "46", True),
            ("C", "92", False),
            ("D", "48", False),
        ]
    )

    _add_question(
        db, topic_id,
        "¿Cuál es la función principal de la mitocondria?",
        "Organelo responsable de la producción de energía.",
        [
            ("A", "Síntesis proteica", False),
            ("B", "Producción de energía", True),
            ("C", "Almacenamiento de agua", False),
            ("D", "Fotosíntesis", False),
        ]
    )

    _add_question(
        db, topic_id,
        "¿Qué tipo de reproducción produce individuos genéticamente idénticos?",
        "Reproducción asexual versus sexual.",
        [
            ("A", "Reproducción sexual", False),
            ("B", "Reproducción asexual", True),
            ("C", "Reproducción mixta", False),
            ("D", "Reproducción hermafrodita", False),
        ]
    )


#  CIENCIAS - FÍSICA 
def _seed_fisica(db, topic_id: int):
    """6 preguntas básicas de física"""
    
    _add_question(
        db, topic_id,
        "¿Cuál es la velocidad de la luz en el vacío?",
        "Constante fundamental en física.",
        [
            ("A", "3 × 10⁶ m/s", False),
            ("B", "3 × 10⁸ m/s", True),
            ("C", "3 × 10⁴ m/s", False),
            ("D", "3 × 10¹⁰ m/s", False),
        ]
    )

    _add_question(
        db, topic_id,
        "¿Cuál es la aceleración gravitacional aproximada en la Tierra?",
        "Gravedad terrestre estándar.",
        [
            ("A", "9.8 m/s²", True),
            ("B", "10 m/s", False),
            ("C", "9.8 N", False),
            ("D", "6.4 m/s²", False),
        ]
    )

    _add_question(
        db, topic_id,
        "¿Qué es la frecuencia en una onda?",
        "Concepto de onda y su movimiento.",
        [
            ("A", "El tiempo que tarda la onda en recorrer una distancia", False),
            ("B", "El número de oscilaciones por unidad de tiempo", True),
            ("C", "La distancia entre dos crestas", False),
            ("D", "La velocidad de propagación", False),
        ]
    )

    _add_question(
        db, topic_id,
        "¿Cuál es la fórmula de la energía cinética?",
        "Energía del movimiento.",
        [
            ("A", "E = mgh", False),
            ("B", "E = ½mv²", True),
            ("C", "E = mc²", False),
            ("D", "E = Fxd", False),
        ]
    )

    _add_question(
        db, topic_id,
        "¿Qué establece la primera ley de Newton?",
        "Ley de inercia.",
        [
            ("A", "La fuerza es igual a la masa por la aceleración", False),
            ("B", "Todo objeto en reposo o movimiento uniforme sigue así sin fuerzas", True),
            ("C", "La acción y reacción son iguales", False),
            ("D", "La energía se conserva siempre", False),
        ]
    )

    _add_question(
        db, topic_id,
        "¿Cuál es la unidad de potencia en el Sistema Internacional?",
        "Unidad de potencia.",
        [
            ("A", "Joule", False),
            ("B", "Newton", False),
            ("C", "Watt", True),
            ("D", "Voltio", False),
        ]
    )


#  CIENCIAS - QUÍMICA 
def _seed_quimica(db, topic_id: int):
    """6 preguntas básicas de química"""
    
    _add_question(
        db, topic_id,
        "¿Cuál es el símbolo químico del oxígeno?",
        "Identificación de elementos químicos.",
        [
            ("A", "O", True),
            ("B", "Os", False),
            ("C", "OX", False),
            ("D", "Ox", False),
        ]
    )

    _add_question(
        db, topic_id,
        "¿Qué es el pH?",
        "Concepto de acidez y basicidad.",
        [
            ("A", "Medida de potencia de hidrógeno", True),
            ("B", "Medida de salinidad", False),
            ("C", "Medida de densidad", False),
            ("D", "Medida de temperatura", False),
        ]
    )

    _add_question(
        db, topic_id,
        "¿Cuántos electrones tiene un átomo de carbono?",
        "Estructura atómica del carbono.",
        [
            ("A", "4", False),
            ("B", "6", True),
            ("C", "8", False),
            ("D", "12", False),
        ]
    )

    _add_question(
        db, topic_id,
        "¿Qué es una reacción endotérmica?",
        "Clasificación de reacciones químicas.",
        [
            ("A", "Reacción que libera calor", False),
            ("B", "Reacción que absorbe calor", True),
            ("C", "Reacción de combustión", False),
            ("D", "Reacción de síntesis", False),
        ]
    )

    _add_question(
        db, topic_id,
        "¿Cuál es la fórmula química del agua?",
        "Identidad química del agua.",
        [
            ("A", "H₂O", True),
            ("B", "H₂O₂", False),
            ("C", "HO", False),
            ("D", "H₃O", False),
        ]
    )

    _add_question(
        db, topic_id,
        "¿Qué es la tabla periódica?",
        "Concepto de organización de elementos.",
        [
            ("A", "Un calendario químico", False),
            ("B", "Una lista de reacciones químicas", False),
            ("C", "Organización de elementos químicos por propiedades", True),
            ("D", "Un método de cálculo", False),
        ]
    )


#  HISTORIA Y CIENCIAS SOCIALES 
def _seed_historia(db, topic_id: int):
    """6 preguntas básicas de historia de Chile"""
    
    _add_question(
        db, topic_id,
        "¿En qué año se declaró la independencia de Chile?",
        "Hito fundamental de la historia chilena.",
        [
            ("A", "1808", False),
            ("B", "1810", True),
            ("C", "1818", False),
            ("D", "1825", False),
        ]
    )

    _add_question(
        db, topic_id,
        "¿Quién fue el primer presidente de la República de Chile?",
        "Figura histórica importante.",
        [
            ("A", "Bernardo O'Higgins", False),
            ("B", "Arturo Prat", False),
            ("C", "Ambrosio O'Higgins", True),
            ("D", "Manuel Rodríguez", False),
        ]
    )

    _add_question(
        db, topic_id,
        "¿Cuál fue la causa principal de la Guerra del Pacífico?",
        "Conflicto territorial sudamericano.",
        [
            ("A", "Disputa por recursos de plata", False),
            ("B", "Conflicto por depósitos de salitre y guano", True),
            ("C", "Desacuerdos sobre fronteras", False),
            ("D", "Rivalidad política regional", False),
        ]
    )

    _add_question(
        db, topic_id,
        "¿En qué período ocurrió la colonización española de Chile?",
        "Contexto histórico del colonialismo.",
        [
            ("A", "Siglo XV", False),
            ("B", "Siglo XVI", True),
            ("C", "Siglo XVII", False),
            ("D", "Siglo XVIII", False),
        ]
    )

    _add_question(
        db, topic_id,
        "¿Qué constituye un hito en el desarrollo institucional de Chile?",
        "Análisis de cambios políticos.",
        [
            ("A", "La Constitución de 1980", True),
            ("B", "La fundación de la Universidad", False),
            ("C", "La abolición de la esclavitud", False),
            ("D", "La creación del Banco Central", False),
        ]
    )

    _add_question(
        db, topic_id,
        "¿Cuál fue la civilización precolombina más importante en territorio chileno?",
        "Conocimiento de culturas ancestrales.",
        [
            ("A", "Los mapuches", True),
            ("B", "Los aimaraes", False),
            ("C", "Los atacameños", False),
            ("D", "Los rapa nui", False),
        ]
    )


#  GEOGRAFÍA 
def _seed_geografia(db, topic_id: int):
    """6 preguntas básicas de geografía"""
    
    _add_question(
        db, topic_id,
        "¿Cuál es la capital de Chile?",
        "Geografía política fundamental.",
        [
            ("A", "Valparaíso", False),
            ("B", "Santiago", True),
            ("C", "Concepción", False),
            ("D", "Valdivia", False),
        ]
    )

    _add_question(
        db, topic_id,
        "¿Cuántas regiones tiene Chile?",
        "División administrativa de Chile.",
        [
            ("A", "13", False),
            ("B", "15", False),
            ("C", "16", True),
            ("D", "18", False),
        ]
    )

    _add_question(
        db, topic_id,
        "¿Qué océano baña la costa de Chile?",
        "Geografía física de Chile.",
        [
            ("A", "Océano Atlántico", False),
            ("B", "Océano Pacífico", True),
            ("C", "Océano Índico", False),
            ("D", "Océano Ártico", False),
        ]
    )

    _add_question(
        db, topic_id,
        "¿Cuál es la cordillera más importante de Chile?",
        "Accidentes geográficos principales.",
        [
            ("A", "Cordillera de la Costa", False),
            ("B", "Cordillera de los Andes", True),
            ("C", "Cordillera de Nahuelbuta", False),
            ("D", "Cordillera Patagónica", False),
        ]
    )

    _add_question(
        db, topic_id,
        "¿Cuál es el desierto más árido del mundo que se encuentra en Chile?",
        "Geografía desértica.",
        [
            ("A", "Desierto del Atacama", True),
            ("B", "Desierto de Sahara", False),
            ("C", "Desierto de Mojave", False),
            ("D", "Desierto de Kalahari", False),
        ]
    )

    _add_question(
        db, topic_id,
        "¿Qué río es el más importante de Chile?",
        "Hidrografía de Chile.",
        [
            ("A", "Río Biobío", False),
            ("B", "Río Loa", False),
            ("C", "Río Maipo", True),
            ("D", "Río Itata", False),
        ]
    )


if __name__ == "__main__":
    seed_questions()
