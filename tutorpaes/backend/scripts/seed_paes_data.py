import json
import os
import re
import sys
from pathlib import Path

# Fix sys.path for importing app modules
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.db.models import Exam, Subject, Topic, Question, QuestionChoice

JSONL_FILE = os.getenv(
    "PAES_JSONL_FILE",
    "/home/gabriel/proyecto_nuevo/salida_lista_hoy/preguntas_bd_listas_con_respuestas.jsonl",
)


def build_prompt_key(prompt: str) -> str:
    """Generate a normalized key to deduplicate prompts with trivial text differences."""
    if not isinstance(prompt, str):
        return ""
    normalized = prompt.strip().lower()
    normalized = re.sub(r"\s+", " ", normalized)
    return normalized

def build_prompt(item):
    base_q = item.get("question", "")
    v_asset = item.get("visual_asset")
    
    if v_asset and v_asset.get("strategy") == "latex_candidate":
        # Inject LaTeX perfectly into the prompt
        latex_code = v_asset.get("payload", {}).get("tikz_source", "")
        if latex_code:
            base_q = f"{base_q}\n\n```latex\n{latex_code}\n```"
    return base_q

def get_image_url(item):
    v_asset = item.get("visual_asset")
    if v_asset and v_asset.get("strategy") == "image_extract_candidate":
        img_path = v_asset.get("payload", {}).get("image_path")
        if img_path:
            # Re-map local path to the new static folder URL pattern
            # Original: salida_lista_hoy/imagenes/ensayo_1_l/p035_q058.png
            # New URL: http://localhost:8000/static/imagenes/ensayo_1_l/p035_q058.png
            parts = img_path.split("salida_lista_hoy/imagenes/")
            if len(parts) > 1:
                return f"http://localhost:8000/static/imagenes/{parts[1]}"
    return None


def map_item_to_question_payload(item: dict) -> dict:
    """Map source JSONL record to the structure required by Question/QuestionChoice."""
    prompt = build_prompt(item)
    explanation = item.get("explicacion_breve") or item.get("explanation")
    reading_text = item.get("reading_passage_texto") or item.get("reading_text")
    image_url = get_image_url(item)

    correct_label = str(item.get("respuesta_correcta", "")).strip().upper()
    options_dict = item.get("options", {})
    choices = []

    if isinstance(options_dict, dict):
        for lbl, text_val in sorted(options_dict.items(), key=lambda kv: kv[0]):
            if not isinstance(text_val, str) or not text_val.strip():
                continue
            label = str(lbl).strip()[:1].upper()
            choices.append(
                {
                    "label": label,
                    "text": text_val,
                    "is_correct": label == correct_label,
                }
            )

    return {
        "prompt": prompt,
        "prompt_key": build_prompt_key(prompt),
        "explanation": explanation,
        "reading_text": reading_text,
        "image_url": image_url,
        "choices": choices,
    }

def seed_database():
    db: Session = SessionLocal()
    
    try:
        print("Leyendo archivo JSONL...")
        questions_data = []
        with open(JSONL_FILE, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    questions_data.append(json.loads(line))
                    
        print(f"Cargadas {len(questions_data)} preguntas desde el archivo.")
        
        # 1. Crear Exámenes Maestros
        exam_lenguaje = db.query(Exam).filter(Exam.code == "PAES-DEMO-LENG").first()
        if not exam_lenguaje:
            exam_lenguaje = Exam(code="PAES-DEMO-LENG", name="Ensayo PAES Lenguaje (Demo)", is_custom=False)
            db.add(exam_lenguaje)
            
        exam_matematica = db.query(Exam).filter(Exam.code == "PAES-DEMO-MAT").first()
        if not exam_matematica:
            exam_matematica = Exam(code="PAES-DEMO-MAT", name="Ensayo PAES Matemática (Demo)", is_custom=False)
            db.add(exam_matematica)
            
        db.commit()
        db.refresh(exam_lenguaje)
        db.refresh(exam_matematica)
        
        # 2. Crear Materias
        sub_leng = db.query(Subject).filter(Subject.code == "LENG-1").first()
        if not sub_leng:
            sub_leng = Subject(exam_id=exam_lenguaje.id, code="LENG-1", name="Competencia Lectora")
            db.add(sub_leng)
            
        sub_math = db.query(Subject).filter(Subject.code == "MAT-1").first()
        if not sub_math:
            sub_math = Subject(exam_id=exam_matematica.id, code="MAT-1", name="Matemática 1")
            db.add(sub_math)
            
        db.commit()
        db.refresh(sub_leng)
        db.refresh(sub_math)
        
        # 3. Crear Tópicos
        topic_leng = db.query(Topic).filter(Topic.code == "COMP-LEC").first()
        if not topic_leng:
            topic_leng = Topic(subject_id=sub_leng.id, code="COMP-LEC", name="Comprensión General")
            db.add(topic_leng)
            
        topic_math = db.query(Topic).filter(Topic.code == "ALGEBRA").first()
        if not topic_math:
            topic_math = Topic(subject_id=sub_math.id, code="ALGEBRA", name="Álgebra Central")
            db.add(topic_math)
            
        db.commit()
        db.refresh(topic_leng)
        db.refresh(topic_math)

        # 4. Insertar Preguntas
        existing_prompt_keys = {
            build_prompt_key(row.prompt)
            for row in db.query(Question.prompt).all()
            if isinstance(row.prompt, str) and row.prompt.strip()
        }
        added_questions = 0
        skipped_duplicates = 0
        for item in questions_data:
            # Determine mapping based on subject string
            is_lenguaje = "leng" in item.get("subject", "").lower() or "lectora" in item.get("subject", "").lower()
            
            target_topic = topic_leng if is_lenguaje else topic_math
            target_exam = exam_lenguaje if is_lenguaje else exam_matematica
            
            payload = map_item_to_question_payload(item)
            q_prompt = payload["prompt"]
            q_prompt_key = payload["prompt_key"]
            if not q_prompt:
                continue

            # Avoid duplicates across repeated runs and near-identical prompts.
            if q_prompt_key in existing_prompt_keys:
                skipped_duplicates += 1
                continue

            q_obj = Question(
                topic_id=target_topic.id,
                prompt=q_prompt,
                explanation=payload["explanation"],
                reading_text=payload["reading_text"],
                image_url=payload["image_url"],
                difficulty=2,
                question_type="mcq"
            )
            db.add(q_obj)
            db.flush() # Para obtener el q_obj.id antes del commit total
            
            # Attach to Exam! exam_questions is a secondary table so we just append
            q_obj.exams.append(target_exam)
            
            # Generar Question Choices
            for choice_payload in payload["choices"]:
                choice = QuestionChoice(
                    question_id=q_obj.id,
                    label=choice_payload["label"],
                    text=choice_payload["text"],
                    is_correct=choice_payload["is_correct"],
                )
                db.add(choice)
                
            existing_prompt_keys.add(q_prompt_key)
            added_questions += 1
            if added_questions % 50 == 0:
                print(f"  {added_questions} preguntas insertadas...")
                db.commit() # batch commits

        db.commit()
        print(
            f"¡Inyección limpia y exitosa! Se añadieron {added_questions} preguntas nuevas "
            f"y se omitieron {skipped_duplicates} duplicadas."
        )

    except Exception as e:
        print(f"Falla crítica: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
