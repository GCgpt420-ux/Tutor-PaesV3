import json
import logging
import os
import re
import shutil
import sys
from pathlib import Path
from typing import Optional, Tuple

# Fix sys.path for importing app modules
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.models import Exam, Subject, Topic, Question, QuestionChoice
from app.db.session import SessionLocal

logger = logging.getLogger("seed_paes_data")

DEFAULT_JSONL_FILE = (
    "/home/gabriel/Escritorio/Proyectos2026/Procesamiento_Datos_Psu/salida_lista_hoy/preguntas_demre_2026_auditadas_final.jsonl"
)
DEFAULT_IMAGES_DIR = (
    "/home/gabriel/Escritorio/Proyectos2026/Procesamiento_Datos_Psu/salida_lista_hoy/imagenes_2026"
)

JSONL_FILE = os.getenv("PAES_JSONL_FILE", DEFAULT_JSONL_FILE)
IMAGES_DIR = os.getenv("PAES_IMAGES_DIR", DEFAULT_IMAGES_DIR)

# 7 Asignaturas Oficiales DEMRE 2026
OFFICIAL_SUBJECTS = {
    "M1": "Matemática 1",
    "M2": "Matemática 2",
    "BIO": "Ciencias - Biología",
    "FIS": "Ciencias - Física",
    "QUI": "Ciencias - Química",
    "HIST": "Historia y Ciencias Sociales",
    "LENG": "Competencia Lectora",
}

SUBJECT_ALIASES = {
    # M1
    "matematicas": "M1",
    "matematica": "M1",
    "matematica_1": "M1",
    "matemática 1": "M1",
    "matemática m1": "M1",
    "matematicas_m1": "M1",
    "m1": "M1",
    # M2
    "matematicas_m2": "M2",
    "matematica_m2": "M2",
    "matemática 2": "M2",
    "matemática m2": "M2",
    "m2": "M2",
    # BIO
    "biologia": "BIO",
    "biología": "BIO",
    "bio": "BIO",
    "ciencias - biologia": "BIO",
    "ciencias - biología": "BIO",
    # FIS
    "fisica": "FIS",
    "física": "FIS",
    "fis": "FIS",
    "ciencias - fisica": "FIS",
    "ciencias - física": "FIS",
    # QUI
    "quimica": "QUI",
    "química": "QUI",
    "qui": "QUI",
    "ciencias - quimica": "QUI",
    "ciencias - química": "QUI",
    # HIST
    "historia": "HIST",
    "historia y geografia": "HIST",
    "historia y ciencias sociales": "HIST",
    "historia y cs. sociales": "HIST",
    "hist": "HIST",
    # LENG
    "lenguaje": "LENG",
    "competencia lectora": "LENG",
    "leng": "LENG",
    "lect": "LENG",
    "lectora": "LENG",
}


def resolve_subject_info(subject_str: str) -> Tuple[str, str]:
    """Resuelve el código oficial de asignatura y su nombre display a partir de un string arbitrario."""
    if not isinstance(subject_str, str):
        return ("M1", OFFICIAL_SUBJECTS["M1"])

    clean = subject_str.strip().lower()
    code = SUBJECT_ALIASES.get(clean)
    if not code:
        # Intento por matching de subcadenas
        if "m2" in clean:
            code = "M2"
        elif "bio" in clean:
            code = "BIO"
        elif "fis" in clean or "fís" in clean:
            code = "FIS"
        elif "qui" in clean or "quím" in clean:
            code = "QUI"
        elif "hist" in clean:
            code = "HIST"
        elif "leng" in clean or "lect" in clean:
            code = "LENG"
        elif "mat" in clean:
            code = "M1"
        else:
            code = "M1"

    name = OFFICIAL_SUBJECTS.get(code, "Matemática 1")
    return (code, name)


def build_prompt_key(prompt: str) -> str:
    """Genera una clave normalizada para deduplicar enunciados por diferencias triviales de espacios."""
    if not isinstance(prompt, str):
        return ""
    normalized = prompt.strip().lower()
    normalized = re.sub(r"\s+", " ", normalized)
    return normalized


def build_prompt(item: dict) -> str:
    """Extrae el enunciado base, inyectando código LaTeX o assets si corresponde."""
    base_q = item.get("question", "")
    if not isinstance(base_q, str):
        base_q = str(base_q or "")

    v_asset = item.get("visual_asset")
    if v_asset and isinstance(v_asset, dict) and v_asset.get("strategy") == "latex_candidate":
        latex_code = v_asset.get("payload", {}).get("tikz_source", "")
        if latex_code:
            base_q = f"{base_q}\n\n```latex\n{latex_code}\n```"
    return base_q.strip()


def get_image_url(item: dict) -> Optional[str]:
    """Resuelve la URL estática de la imagen según contrato DEMRE 2026 o compatibilidad visual_asset."""
    # 1. Formato DEMRE 2026 (campo image_path)
    img_path = item.get("image_path")
    if img_path and isinstance(img_path, str) and img_path.strip():
        clean_path = img_path.strip().lstrip("/")
        if clean_path.startswith("imagenes_2026/"):
            return f"/static/{clean_path}"
        return f"/static/imagenes_2026/{clean_path}"

    # 2. Formato legacy visual_asset
    v_asset = item.get("visual_asset")
    if v_asset and isinstance(v_asset, dict) and v_asset.get("strategy") == "image_extract_candidate":
        path = v_asset.get("payload", {}).get("image_path")
        if path and isinstance(path, str):
            parts = path.split("salida_lista_hoy/imagenes/")
            if len(parts) > 1:
                return f"http://localhost:8000/static/imagenes/{parts[1]}"
            return path

    return None


def map_item_to_question_payload(item: dict) -> dict:
    """Mapea un registro JSONL al formato esperado por el modelo Question y QuestionChoice."""
    prompt = build_prompt(item)
    explanation = item.get("explicacion_breve") or item.get("explanation")
    reading_text = item.get("reading_passage_texto") or item.get("reading_text")
    image_url = get_image_url(item)

    raw_subject = item.get("subject", "")
    subject_code, subject_name = resolve_subject_info(raw_subject)

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
                    "text": text_val.strip(),
                    "is_correct": (label == correct_label),
                }
            )

    difficulty = item.get("difficulty", 2)
    question_type = item.get("question_type", "mcq")

    return {
        "prompt": prompt,
        "prompt_key": build_prompt_key(prompt),
        "explanation": explanation,
        "reading_text": reading_text,
        "image_url": image_url,
        "subject_code": subject_code,
        "subject_name": subject_name,
        "difficulty": difficulty,
        "question_type": question_type,
        "choices": choices,
        "uid": item.get("uid"),
    }


def sync_images_if_needed(source_dir: Path, target_dir: Path) -> int:
    """Sincroniza imágenes recortadas desde el directorio de procesamiento al estático del backend."""
    if not source_dir.exists():
        print(f"[Aviso] Directorio de imágenes origen no encontrado en {source_dir}. Se omite copia.")
        return 0

    target_dir.mkdir(parents=True, exist_ok=True)
    synced = 0
    for src_file in source_dir.glob("*.png"):
        dest_file = target_dir / src_file.name
        if not dest_file.exists():
            shutil.copy2(src_file, dest_file)
            synced += 1

    total_target = len(list(target_dir.glob("*.png")))
    print(f"[Imágenes] Directorio {target_dir} verificado. Total disponibles: {total_target} ({synced} nuevas sincronizadas).")
    return synced


def get_or_create_exam(db: Session, code: Optional[str] = None, name: Optional[str] = None) -> Exam:
    exam_code = code or getattr(settings, "PAES_CODE", "PAES")
    exam_name = name or "Prueba de Acceso a la Educación Superior"

    exam = db.scalar(select(Exam).where(Exam.code == exam_code))
    if not exam:
        exam = Exam(code=exam_code, name=exam_name, is_custom=False)
        db.add(exam)
        db.flush()
        print(f"[Exam] Examen maestro '{exam_code}' creado.")
    return exam


def get_or_create_subject(db: Session, exam_id: int, code: str, name: str) -> Subject:
    subj = db.scalar(select(Subject).where(Subject.exam_id == exam_id, Subject.code == code))
    if not subj:
        subj = Subject(exam_id=exam_id, code=code, name=name)
        db.add(subj)
        db.flush()
        print(f"[Subject] Asignatura creada: {code} - {name}")
    return subj


def get_or_create_topic(db: Session, subject_id: int, code: str = "GEN", name: str = "General") -> Topic:
    topic = db.scalar(select(Topic).where(Topic.subject_id == subject_id, Topic.code == code))
    if not topic:
        topic = Topic(subject_id=subject_id, code=code, name=name)
        db.add(topic)
        db.flush()
        print(f"[Topic] Tópico creado: {code} - {name} (subject_id={subject_id})")
    return topic


def seed_database(
    jsonl_path: Optional[str] = None,
    images_path: Optional[str] = None,
    db: Optional[Session] = None,
) -> dict:
    target_jsonl = jsonl_path or JSONL_FILE
    target_images = images_path or IMAGES_DIR
    static_images_target = ROOT_DIR / "static" / "imagenes_2026"

    print("=" * 70)
    print("INICIANDO SEEDER DEMRE 2026 - TUTOR PAES V3")
    print(f"Archivo JSONL: {target_jsonl}")
    print(f"Directorio de Imágenes: {target_images}")
    print("=" * 70)

    # 1. Sincronizar directorio de imágenes
    sync_images_if_needed(Path(target_images), static_images_target)

    # 2. Leer archivo JSONL
    if not os.path.exists(target_jsonl):
        raise FileNotFoundError(f"Archivo JSONL no encontrado: {target_jsonl}")

    questions_data = []
    with open(target_jsonl, "r", encoding="utf-8") as f:
        for line in f:
            line_str = line.strip()
            if line_str:
                questions_data.append(json.loads(line_str))

    print(f"Leídas {len(questions_data)} preguntas desde el archivo JSONL.")

    should_close_db = False
    if db is None:
        db = SessionLocal()
        should_close_db = True

    try:
        # 3. Crear/obtener Examen Maestro PAES
        exam = get_or_create_exam(db)

        # 4. Asegurar existencia de las 7 Asignaturas Oficiales y sus tópicos
        subject_map = {}
        topic_map = {}
        for code, name in OFFICIAL_SUBJECTS.items():
            subj = get_or_create_subject(db, exam.id, code, name)
            topic = get_or_create_topic(db, subj.id, "GEN", "General")
            subject_map[code] = subj
            topic_map[code] = topic

        db.commit()

        # 5. Obtener claves de preguntas existentes por tópico para deduplicación idempotente
        existing_topic_prompts = {
            (row.topic_id, build_prompt_key(row.prompt))
            for row in db.query(Question.topic_id, Question.prompt).all()
            if isinstance(row.prompt, str) and row.prompt.strip()
        }

        added_questions = 0
        skipped_duplicates = 0
        by_subject_count = {code: 0 for code in OFFICIAL_SUBJECTS}

        for item in questions_data:
            payload = map_item_to_question_payload(item)
            q_prompt = payload["prompt"]
            q_prompt_key = payload["prompt_key"]
            if not q_prompt:
                continue

            subj_code = payload["subject_code"]
            target_topic = topic_map.get(subj_code)
            if not target_topic:
                target_topic = topic_map["M1"]

            # Deduplicación por (topic_id, prompt normalizado)
            dedup_key = (target_topic.id, q_prompt_key)
            if dedup_key in existing_topic_prompts:
                skipped_duplicates += 1
                continue

            q_obj = Question(
                topic_id=target_topic.id,
                prompt=q_prompt,
                explanation=payload["explanation"],
                reading_text=payload["reading_text"],
                image_url=payload["image_url"],
                difficulty=payload["difficulty"],
                question_type=payload["question_type"],
                is_active=True,
            )
            db.add(q_obj)
            db.flush()

            # Vincular pregunta al examen oficial
            if exam not in q_obj.exams:
                q_obj.exams.append(exam)

            # Insertar Question Choices
            for choice_payload in payload["choices"]:
                choice = QuestionChoice(
                    question_id=q_obj.id,
                    label=choice_payload["label"],
                    text=choice_payload["text"],
                    is_correct=choice_payload["is_correct"],
                )
                db.add(choice)

            existing_topic_prompts.add(dedup_key)
            added_questions += 1
            by_subject_count[subj_code] = by_subject_count.get(subj_code, 0) + 1

            if added_questions % 50 == 0:
                print(f"  ... {added_questions} preguntas insertadas ...")
                db.commit()

        db.commit()

        print("=" * 70)
        print("SEEDER FINALIZADO CON ÉXITO")
        print(f"Preguntas Nuevas Insertadas: {added_questions}")
        print(f"Duplicados Omitidos: {skipped_duplicates}")
        print("Desglose por Asignatura:")
        for s_code, s_count in by_subject_count.items():
            print(f"  - {s_code} ({OFFICIAL_SUBJECTS[s_code]}): {s_count} preguntas")
        print("=" * 70)

        return {
            "added_questions": added_questions,
            "skipped_duplicates": skipped_duplicates,
            "by_subject": by_subject_count,
        }

    except Exception as e:
        print(f"[Error Crítico] Falló el proceso de seed: {e}")
        db.rollback()
        raise
    finally:
        if should_close_db:
            db.close()


if __name__ == "__main__":
    seed_database()
