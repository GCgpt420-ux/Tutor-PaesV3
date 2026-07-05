import sys
import os
from datetime import datetime, timezone, timedelta

# Asegurar path de importación del backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select, text
from app.core.config import settings
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.core.auth import get_password_hash
import app.db.models as models

def reset_database():
    print("[-] Limpiando base de datos por completo (DROP SCHEMA public CASCADE)...")
    with engine.connect() as conn:
        conn.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
        conn.execute(text("GRANT ALL ON SCHEMA public TO public"))
        conn.execute(text("GRANT ALL ON SCHEMA public TO mvp"))
        conn.commit()
    Base.metadata.create_all(bind=engine)
    print("[+] Base de datos limpia y recreada.")

def seed_demo_data():
    db = SessionLocal()
    try:
        # 1. Crear Examen
        print("[+] Sembrando examen PAES...")
        exam = models.Exam(code="PAES", name="Prueba de Acceso a la Educación Superior", is_custom=False)
        db.add(exam)
        db.flush()

        # 2. Crear Asignaturas (Matemática 1, Competencia Lectora, Ciencias)
        print("[+] Sembrando asignaturas...")
        m1 = models.Subject(exam_id=exam.id, code="M1", name="Matemática 1")
        lect = models.Subject(exam_id=exam.id, code="LECT", name="Competencia Lectora")
        cien = models.Subject(exam_id=exam.id, code="CIEN", name="Ciencias")
        db.add_all([m1, lect, cien])
        db.flush()

        # 3. Crear Tópicos
        print("[+] Sembrando tópicos...")
        t_alg = models.Topic(subject_id=m1.id, code="ALG", name="Álgebra y Funciones")
        t_geo = models.Topic(subject_id=m1.id, code="GEO", name="Geometría")
        t_comp = models.Topic(subject_id=lect.id, code="COMP", name="Comprensión de Textos")
        t_bio = models.Topic(subject_id=cien.id, code="BIO", name="Biología Celular")
        db.add_all([t_alg, t_geo, t_comp, t_bio])
        db.flush()

        # 4. Crear Usuario Demo
        print("[+] Sembrando usuario demo...")
        demo_email = settings.DEMO_EMAIL
        demo_password = settings.DEMO_PASSWORD
        user = models.User(
            name="Estudiante Demo",
            email=demo_email,
            phone="987654321",
            hashed_password=get_password_hash(demo_password),
            is_active=True,
            is_premium=True,
            is_admin=True,
            academic_level="4to Medio",
            target_university="Universidad de Chile",
            target_degree="Ingeniería Civil",
            target_score=850
        )
        db.add(user)
        db.flush()

        # 5. Crear preguntas desafiantes con LaTeX
        print("[+] Sembrando preguntas con fórmulas LaTeX...")
        
        # Guardaremos las preguntas creadas para usarlas en AttemptFeedback
        created_questions = []

        # Álgebra y Funciones (ALG)
        q_alg_data = [
            (
                "Resuelve para $x$ la siguiente ecuación cuadrática: $x^2 - 5x + 6 = 0$. ¿Cuáles son sus raíces?",
                "La ecuación se puede factorizar como $(x-2)(x-3) = 0$, de donde las soluciones son $x_1 = 2$ y $x_2 = 3$.",
                [("A", "$x = 1$ y $x = 6$", False), ("B", "$x = 2$ y $x = 3$", True), ("C", "$x = -2$ y $x = -3$", False), ("D", "$x = 0$ y $x = 5$", False)]
            ),
            (
                "Determina el vértice de la parábola descrita por la función cuadrática: $f(x) = x^2 - 4x + 3$.",
                "El vértice de una parábola $y = ax^2 + bx + c$ tiene abscisa $x_v = -b/(2a) = 4/2 = 2$. Evaluando, $f(2) = 2^2 - 4(2) + 3 = -1$. El vértice es $(2, -1)$.",
                [("A", "$(2, 3)$", False), ("B", "$(0, 3)$", False), ("C", "$(2, -1)$", True), ("D", "$(-2, 1)$", False)]
            ),
            (
                "Si el discriminante $\\Delta = b^2 - 4ac$ de una ecuación cuadrática es estrictamente menor a cero ($\\Delta < 0$), ¿qué tipo de soluciones tiene?",
                "Cuando el discriminante es negativo, la ecuación cuadrática no posee soluciones reales, sino dos soluciones complejas conjugadas.",
                [("A", "Dos soluciones reales e iguales.", False), ("B", "Dos soluciones reales y distintas.", False), ("C", "No tiene soluciones reales.", True), ("D", "Una única solución racional.", False)]
            ),
            (
                "Resuelve el sistema de ecuaciones lineales: $\\begin{cases} 2x + y = 7 \\\\ x - y = 2 \\end{cases}$. ¿Cuál es el valor de $x$ e $y$?",
                "Sumando ambas ecuaciones se obtiene $3x = 9 \\implies x = 3$. Sustituyendo en la segunda, $3 - y = 2 \\implies y = 1$.",
                [("A", "$x = 3, y = 1$", True), ("B", "$x = 2, y = 3$", False), ("C", "$x = 4, y = -1$", False), ("D", "$x = 1, y = 5$", False)]
            ),
            (
                "¿Cuál es el dominio de la función real $f(x) = \\sqrt{x - 5}$?",
                "Para que la función esté definida en los números reales, el subradical debe ser mayor o igual a cero: $x - 5 \\ge 0 \\implies x \\ge 5$, es decir, $[5, +\\infty[$.",
                [("A", "$\\mathbb{R}$", False), ("B", "$[5, +\\infty[$", True), ("C", "$]-\\infty, 5]$", False), ("D", "$\\mathbb{R} \\setminus \\{5\\}$", False)]
            ),
            (
                "Dada la función exponencial $f(x) = 3 \\cdot 2^x$, ¿cuál es el valor de la intersección con el eje $y$?",
                "La intersección con el eje $y$ ocurre cuando $x = 0$. Evaluando $f(0) = 3 \\cdot 2^0 = 3 \\cdot 1 = 3$. Por lo tanto, el punto es $(0, 3)$.",
                [("A", "$(0, 3)$", True), ("B", "$(0, 2)$", False), ("C", "$(0, 6)$", False), ("D", "$(3, 0)$", False)]
            ),
            (
                "Simplifica la expresión algebraica: $\\frac{x^2 - 9}{x - 3}$ para $x \\neq 3$.",
                "El numerador es una diferencia de cuadrados: $x^2 - 9 = (x-3)(x+3)$. Dividiendo por $(x-3)$ se obtiene $x+3$.",
                [("A", "$x - 3$", False), ("B", "$x + 3$", True), ("C", "$x^2 + 3$", False), ("D", "$x + 9$", False)]
            ),
            (
                "Encuentra la pendiente de la recta descrita por la ecuación general $3x + 2y - 6 = 0$.",
                "Despejando $y$ en la ecuación general: $2y = -3x + 6 \\implies y = -\\frac{3}{2}x + 3$. La pendiente es $-\\frac{3}{2}$.",
                [("A", "$3$", False), ("B", "$2$", False), ("C", "$-\\frac{3}{2}$", True), ("D", "$\\frac{3}{2}$", False)]
            ),
            (
                "¿Qué expresión representa 'el triple del cuadrado de un número disminuido en dos'?",
                "El enunciado se traduce literalmente como $3x^2 - 2$.",
                [("A", "$(3x)^2 - 2$", False), ("B", "$3(x - 2)^2$", False), ("C", "$3x^2 - 2$", True), ("D", "$3(x^2 - 2)$", False)]
            ),
            (
                "Si $f(x) = x^2$ y $g(x) = 2x + 1$, encuentra la función compuesta $(f \\circ g)(x)$.",
                "La composición $(f \\circ g)(x) = f(g(x)) = (2x + 1)^2 = 4x^2 + 4x + 1$.",
                [("A", "$2x^2 + 1$", False), ("B", "$(2x + 1)^2$", True), ("C", "$4x^2 + 1$", False), ("D", "$2x^2 + 2$", False)]
            ),
        ]

        for prompt, explanation, choices in q_alg_data:
            q = models.Question(topic_id=t_alg.id, prompt=prompt, explanation=explanation, difficulty=2, question_type="mcq", is_active=True)
            db.add(q)
            db.flush()
            created_questions.append(q)
            for label, text, is_correct in choices:
                db.add(models.QuestionChoice(question_id=q.id, label=label, text=text, is_correct=is_correct))

        # Geometría (GEO)
        q_geo_data = [
            (
                "En un triángulo rectángulo, si los catetos miden $3\\text{ cm}$ y $4\\text{ cm}$, ¿cuánto mide la hipotenusa $c$?",
                "Aplicando el teorema de Pitágoras: $c^2 = a^2 + b^2 \\implies c^2 = 3^2 + 4^2 = 9 + 16 = 25 \\implies c = 5\\text{ cm}$.",
                [("A", "$5\\text{ cm}$", True), ("B", "$6\\text{ cm}$", False), ("C", "$7\\text{ cm}$", False), ("D", "$\\sqrt{7}\\text{ cm}$", False)]
            ),
            (
                "Calcula el volumen $V$ de una esfera de radio $r = 3\\text{ cm}$. Expresa el resultado en función de $\\pi$.",
                "El volumen de la esfera está dado por $V = \\frac{4}{3}\\pi r^3$. Reemplazando $r = 3$: $V = \\frac{4}{3}\\pi (27) = 36\\pi\\text{ cm}^3$.",
                [("A", "$\\frac{4}{3}\\pi (27) = 12\\pi\\text{ cm}^3$", False), ("B", "$36\\pi\\text{ cm}^3$", True), ("C", "$108\\pi\\text{ cm}^3$", False), ("D", "$9\\pi\\text{ cm}^3$", False)]
            ),
            (
                "Determina el punto medio entre los puntos $A(2, 3)$ y $B(8, 7)$ en el plano cartesiano.",
                "El punto medio es $M = (\\frac{x_1+x_2}{2}, \\frac{y_1+y_2}{2}) = (\\frac{2+8}{2}, \\frac{3+7}{2}) = (5, 5)$.",
                [("A", "$(5, 5)$", True), ("B", "$(4, 5)$", False), ("C", "$(6, 5)$", False), ("D", "$(5, 4)$", False)]
            ),
            (
                "¿Cuál es el área de un círculo cuyo diámetro es $10\\text{ cm}$?",
                "El radio es la mitad del diámetro: $r = 5\\text{ cm}$. El área es $A = \\pi r^2 = \\pi (5^2) = 25\\pi\\text{ cm}^2$.",
                [("A", "$100\\pi\\text{ cm}^2$", False), ("B", "$25\\pi\\text{ cm}^2$", True), ("C", "$50\\pi\\text{ cm}^2$", False), ("D", "$5\\pi\\text{ cm}^2$", False)]
            ),
            (
                "En un triángulo equilátero de lado $6\\text{ cm}$, ¿cuál es su altura $h$?",
                "La altura de un triángulo equilátero de lado $a$ se calcula como $h = \\frac{a\\sqrt{3}}{2}$. Para $a = 6$, $h = \\frac{6\\sqrt{3}}{2} = 3\\sqrt{3}\\text{ cm}$.",
                [("A", "$3\\sqrt{3}\\text{ cm}$", True), ("B", "$6\\sqrt{3}\\text{ cm}$", False), ("C", "$3\\text{ cm}$", False), ("D", "$3\\sqrt{2}\\text{ cm}$", False)]
            ),
            (
                "¿Cuál es la suma de los ángulos interiores de un hexágono convexo?",
                "La fórmula para la suma de ángulos interiores es $180^\\circ \\times (n - 2)$ donde $n$ es el número de lados. Para un hexágono $n = 6$: $180^\\circ \\times 4 = 720^\\circ$.",
                [("A", "$540^\\circ$", False), ("B", "$720^\\circ$", True), ("C", "$900^\\circ$", False), ("D", "$360^\\circ$", False)]
            ),
            (
                "En una homotecia con centro en el origen y razón $k = -2$, si el punto original es $P(3, -4)$, ¿cuál es la imagen $P'$?",
                "El nuevo punto se obtiene multiplicando las coordenadas originales por $k$: $P' = (-2 \\cdot 3, -2 \\cdot -4) = (-6, 8)$.",
                [("A", "$(-6, 8)$", True), ("B", "$(6, -8)$", False), ("C", "$(-6, -8)$", False), ("D", "$(1.5, -2)$", False)]
            ),
            (
                "¿Cuál es el área de un trapecio con bases de $8\\text{ cm}$ y $12\\text{ cm}$, y altura de $5\\text{ cm}$?",
                "El área es $A = \\frac{B + b}{2} \\cdot h = \\frac{12 + 8}{2} \\cdot 5 = 10 \\cdot 5 = 50\\text{ cm}^2$.",
                [("A", "$100\\text{ cm}^2$", False), ("B", "$50\\text{ cm}^2$", True), ("C", "$48\\text{ cm}^2$", False), ("D", "$25\\text{ cm}^2$", False)]
            ),
            (
                "Si la distancia entre dos puntos $(1, y)$ y $(4, 2)$ es $5$, determina un valor posible de $y$.",
                "Aplicando distancia: $d = \\sqrt{(4-1)^2 + (2-y)^2} = 5 \\implies 9 + (2-y)^2 = 25 \\implies (2-y)^2 = 16 \\implies 2-y = \\pm 4$. Si $2-y = 4 \\implies y = -2$. Si $2-y = -4 \\implies y = 6$.",
                [("A", "$y = 6$", True), ("B", "$y = 2$", False), ("C", "$y = 0$", False), ("D", "$y = 4$", False)]
            ),
            (
                "¿Cuál es la ecuación de la recta que pasa por $(0,0)$ y es perpendicular a la recta $y = 2x + 1$?",
                "La pendiente de la recta original es $m_1 = 2$. Las rectas perpendiculares tienen pendientes tales que $m_1 \\cdot m_2 = -1 \\implies m_2 = -\\frac{1}{2}$. Como pasa por el origen, la ecuación es $y = -\\frac{1}{2}x$.",
                [("A", "$y = 2x$", False), ("B", "$y = -2x$", False), ("C", "$y = -\\frac{1}{2}x$", True), ("D", "$y = \\frac{1}{2}x$", False)]
            ),
        ]

        for prompt, explanation, choices in q_geo_data:
            q = models.Question(topic_id=t_geo.id, prompt=prompt, explanation=explanation, difficulty=2, question_type="mcq", is_active=True)
            db.add(q)
            db.flush()
            for label, text, is_correct in choices:
                db.add(models.QuestionChoice(question_id=q.id, label=label, text=text, is_correct=is_correct))

        # LECT - Comprensión de Textos
        texto_demo = (
            "El cerebro humano consume aproximadamente el 20% de la energía corporal, a pesar de representar "
            "solo el 2% del peso total. Esta alta tasa metabólica se debe principalmente a la transmisión de señales sinápticas "
            "y a la mantención de los potenciales de membrana en reposo. Para sostener este gasto energético, el cerebro depende "
            "casi exclusivamente de la glucosa como sustrato energético principal, la cual se metaboliza de forma aeróbica. "
            "Cualquier interrupción en el flujo de oxígeno o glucosa compromete la viabilidad neuronal en cuestión de minutos."
        )
        
        q_comp_data = [
            (
                "Según el texto, ¿a qué se debe principalmente el elevado gasto energético del cerebro?",
                "El texto indica explícitamente que la alta tasa metabólica se debe a la transmisión de señales sinápticas y potenciales de membrana.",
                [("A", "Al gran tamaño relativo del órgano en comparación con el cuerpo.", False), ("B", "A la transmisión sináptica y mantención de potenciales de membrana.", True), ("C", "Al metabolismo anaeróbico de la glucosa.", False), ("D", "Al almacenamiento pasivo de reservas metabólicas.", False)]
            ),
            (
                "¿Cuál es una inferencia válida a partir de la fragilidad del cerebro mencionada al final?",
                "Como el cerebro depende casi exclusivamente de glucosa y oxígeno aeróbicos, la falta de estos destruye las neuronas rápidamente, lo cual subraya su alta susceptibilidad al daño isquémico.",
                [("A", "Las neuronas pueden sobrevivir horas sin glucosa.", False), ("B", "El metabolismo anaeróbico es altamente eficiente en el cerebro.", False), ("C", "El cerebro posee mecanismos de reserva de energía muy limitados.", True), ("D", "El peso corporal determina directamente la inteligencia.", False)]
            ),
        ]
        for prompt, explanation, choices in q_comp_data:
            q = models.Question(topic_id=t_comp.id, prompt=prompt, explanation=explanation, reading_text=texto_demo, difficulty=1, question_type="mcq", is_active=True)
            db.add(q)
            db.flush()
            for label, text, is_correct in choices:
                db.add(models.QuestionChoice(question_id=q.id, label=label, text=text, is_correct=is_correct))

        # BIO - Biología Celular
        q_bio_data = [
            (
                "¿Qué organelo celular se encarga principalmente de la respiración celular y la producción de ATP?",
                "La mitocondria es conocida como la central de energía celular debido a su rol principal en el ciclo de Krebs y la cadena de transporte de electrones.",
                [("A", "Cloroplasto", False), ("B", "Ribosoma", False), ("C", "Mitocondria", True), ("D", "Aparato de Golgi", False)]
            ),
            (
                "¿Cuál es la función principal de la membrana plasmática?",
                "La membrana celular actúa como una barrera selectiva que controla el intercambio de sustancias entre el interior y exterior de la célula.",
                [("A", "Síntesis de proteínas", False), ("B", "Permeabilidad selectiva y protección estructural", True), ("C", "Duplicación del ADN celular", False), ("D", "Degradación enzimática de desechos", False)]
            ),
        ]
        for prompt, explanation, choices in q_bio_data:
            q = models.Question(topic_id=t_bio.id, prompt=prompt, explanation=explanation, difficulty=1, question_type="mcq", is_active=True)
            db.add(q)
            db.flush()
            for label, text, is_correct in choices:
                db.add(models.QuestionChoice(question_id=q.id, label=label, text=text, is_correct=is_correct))


        # 6. Precargar estadísticas para que el Dashboard no empiece vacío
        print("[+] Precargando simulaciones previas para estadísticas del Dashboard...")
        
        # Crear 3 Intentos Previos (Completados) en M1-ALG
        attempts_to_create = [
            {"days_ago": 3, "correct": 7, "incorrect": 3, "score": 620},
            {"days_ago": 2, "correct": 8, "incorrect": 2, "score": 710},
            {"days_ago": 1, "correct": 9, "incorrect": 1, "score": 780},
        ]

        for idx, att in enumerate(attempts_to_create):
            started = datetime.now(timezone.utc) - timedelta(days=att["days_ago"], hours=2)
            completed = datetime.now(timezone.utc) - timedelta(days=att["days_ago"], hours=1)
            
              # Intentos previos de prueba
            attempt = models.Attempt(
                user_id=user.id,
                exam_id=exam.id,
                subject_id=m1.id,
                topic_id=t_alg.id,
                status="completed",
                started_at=started,
                completed_at=completed,
                total_questions=10,
                correct_count=att["correct"],
                incorrect_count=att["incorrect"],
                omitted_count=0,
                score=att["score"]
            )
            db.add(attempt)
            db.flush()

            # Crear una muestra de feedback e historial de chat en el último intento
            if att["days_ago"] == 1:
                # Vincular AttemptFeedback dinámicamente con q.id de las preguntas creadas
                feedbacks = [
                    models.AttemptFeedback(
                        attempt_id=attempt.id,
                        question_id=created_questions[0].id,
                        is_correct=True,
                        feedback_text="Excelente resolución usando factorización rápida."
                    ),
                    models.AttemptFeedback(
                        attempt_id=attempt.id,
                        question_id=created_questions[1].id,
                        is_correct=False,
                        feedback_text="Ojo con el signo al calcular el valor $f(2)$ en la parábola."
                    )
                  ]
                db.add_all(feedbacks)
                  
                # Sembrar mensajes del chat para simular interacción premium en la demo
                messages = [
                    models.ChatMessage(
                        user_id=user.id,
                        attempt_id=attempt.id,
                        role="user",
                        content="¿Me puedes explicar por qué la parábola abre hacia arriba?"
                    ),
                    models.ChatMessage(
                        user_id=user.id,
                        attempt_id=attempt.id,
                        role="assistant",
                        content="¡Claro! En una función cuadrática $f(x) = ax^2 + bx + c$, el sentido de apertura de la parábola depende del coeficiente principal $a$. Como en este caso $f(x) = x^2 - 4x + 3$, el valor de $a = 1$, que es positivo ($a > 0$). Cuando el coeficiente es positivo, las ramas de la parábola van hacia arriba y el vértice representa un punto mínimo absoluto."
                    )
                ]
                db.add_all(messages)

        # 7. Crear el progreso acumulado (UserProgress)
        print("[+] Sembrando progreso acumulado...")
        progress_alg = models.UserProgress(
            user_id=user.id,
            topic_id=t_alg.id,
            accuracy=80,
            streak=3,
            total_answered=30,
            total_correct=24,
            last_activity_at=datetime.now(timezone.utc) - timedelta(days=1)
        )
        progress_geo = models.UserProgress(
            user_id=user.id,
            topic_id=t_geo.id,
            accuracy=0,
            streak=0,
            total_answered=0,
            total_correct=0,
            last_activity_at=None
        )
        progress_comp = models.UserProgress(
            user_id=user.id,
            topic_id=t_comp.id,
            accuracy=100,
            streak=1,
            total_answered=2,
            total_correct=2,
            last_activity_at=datetime.now(timezone.utc) - timedelta(hours=5)
        )
        db.add_all([progress_alg, progress_geo, progress_comp])

        db.commit()
        print("[+] Script de Inicialización de Demo finalizado con éxito.")
    except Exception as e:
        db.rollback()
        print(f"[!] Error durante el seed de demo: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    reset_database()
    seed_demo_data()
