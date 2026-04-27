import sys
import os
import time
import json
from pathlib import Path

# Fix sys.path for importing app modules
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.db.models import Question, QuestionChoice

from google import genai
from dotenv import load_dotenv

load_dotenv("/home/gabriel/proyecto_nuevo/.env")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")

PROMPT_TEMPLATE = """Eres un experto Profesor resolviendo la Prueba de Acceso a la Educación Superior (PAES) de Chile.
A continuación se te presenta un lote de {count} preguntas (pueden ser de Matemáticas o Comprensión Lectora).
Cada pregunta viene con su ID interno, su enunciado (puede tener contexto matemático en LaTeX), un texto de lectura auxiliar (si es Lenguaje) y 4 alternativas posibles.

Tu misión es resolverlas minuciosamente usando lógica experta y determinar cuál es la única alternativa correcta (A, B, C o D).

Devuelve SOLAMENTE UN ARREGLO JSON en texto plano (sin markdown, sin bloques ```json, ni texto previo) con el siguiente formato exacto:
[
  {{"question_id": 123, "correct_label": "A"}},
  {{"question_id": 124, "correct_label": "C"}}
]

PREGUNTAS:
{payload}
"""

def extract_json_array(raw_text: str):
    import re
    content = raw_text.strip()
    fenced = re.search(r"```(?:json)?\s*(.*?)\s*```", content, re.DOTALL | re.IGNORECASE)
    if fenced:
        content = fenced.group(1).strip()
    
    start = content.find("[")
    end = content.rfind("]")
    if start != -1 and end != -1:
        return json.loads(content[start:end+1])
    return json.loads(content)


def resolve_batch_with_gemini(batch):
    if not GOOGLE_API_KEY:
        raise ValueError("No API Key .env configurada")
        
    client = genai.Client(api_key=GOOGLE_API_KEY)
    
    payload_str = ""
    for q in batch:
        payload_str += f"--- PREGUNTA ID: {q.id} ---\n"
        if q.reading_text:
            payload_str += f"[TEXTO DE LECTURA ASOCIADO]\n{q.reading_text}\n"
        payload_str += f"[ENUNCIADO]\n{q.prompt}\n"
        payload_str += "[ALTERNATIVAS]\n"
        for c in q.choices:
            payload_str += f"{c.label}) {c.text}\n"
        payload_str += "\n"
        
    prompt = PROMPT_TEMPLATE.format(count=len(batch), payload=payload_str)
    
    # Rotación anti-cuotas
    fallback_models = [("gemini-2.5-flash", 6), ("gemini-2.5-pro", 6)]
    for model, sleep_time in fallback_models:
        for attempt in range(2):
            try:
                response = client.models.generate_content(
                    model=model,
                    contents=prompt
                )
                return extract_json_array(response.text or "[]")
            except Exception as e:
                err = str(e)
                if "503" in err or "429" in err:
                    print(f"    [Tráfico en {model}]. Esperando {sleep_time}s...")
                    time.sleep(sleep_time)
                else:
                    print(f"    [Error Estructura {model}] {e}")
                    break 
    raise Exception("Lote fallido. Servidores de IA caídos globales.")

def solve_unanswered_questions():
    db: Session = SessionLocal()
    try:
        # Encontrar preguntas que NO tengan alternativas verdaderas
        all_q = db.query(Question).all()
        target_questions = []
        for q in all_q:
            has_correct = any(c.is_correct for c in q.choices)
            if not has_correct:
                target_questions.append(q)
                
        print(f"Detectadas {len(target_questions)} preguntas sin resolver en DB.")
        if not target_questions:
            return
            
        # Lotes de 5 para no ahogar el token output window limit
        BATCH_SIZE = 5
        batches = [target_questions[i:i + BATCH_SIZE] for i in range(0, len(target_questions), BATCH_SIZE)]
        
        solved = 0
        for i, batch in enumerate(batches, 1):
            ids = [q.id for q in batch]
            print(f"Procesando lote {i}/{len(batches)} (IDs: {ids})...")
            try:
                answers = resolve_batch_with_gemini(batch)
                
                for ans in answers:
                    q_id = int(ans.get("question_id", 0))
                    correct_label = str(ans.get("correct_label", "")).upper()
                    
                    choice = db.query(QuestionChoice).filter(
                        QuestionChoice.question_id == q_id,
                        QuestionChoice.label == correct_label
                    ).first()
                    
                    if choice:
                        choice.is_correct = True
                        solved += 1
                        print(f"  ✓ Pregunta {q_id} resuelta, Respuesta correcta: {correct_label}")
                    else:
                        print(f"  ✗ Pregunta {q_id} ID o Letra incorrecta devuelta por IA.")
                
                db.commit()
                time.sleep(1) # Pacing safe delay API
                
            except Exception as batch_err:
                print(f"Saltando lote {i} por error duro: {batch_err}")
                db.rollback()
                
        print(f"\n¡Evaluación Masiva Lista! Se inyectaron exitosamente {solved} claves correctas en DB.")
        
    finally:
        db.close()

if __name__ == "__main__":
    solve_unanswered_questions()
