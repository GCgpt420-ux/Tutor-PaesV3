import pytest

from scripts.seed_paes_data import build_prompt_key, map_item_to_question_payload


def test_build_prompt_key_normalizes_case_and_spaces():
    a = "  ¿Cuál   es  el resultado de 2+2?  "
    b = "¿cuál es el resultado de 2+2?"

    assert build_prompt_key(a) == build_prompt_key(b)


def test_map_item_to_question_payload_marks_correct_choice_and_explanation():
    item = {
        "question": "¿Cuánto es 2 + 2?",
        "subject": "Matematicas",
        "options": {
            "A": "3",
            "B": "4",
            "C": "5",
            "D": "6",
        },
        "respuesta_correcta": "B",
        "explicacion_breve": "2 + 2 = 4 por suma básica.",
        "reading_passage_texto": "Texto de apoyo",
    }

    payload = map_item_to_question_payload(item)

    assert payload["prompt"] == "¿Cuánto es 2 + 2?"
    assert payload["explanation"] == "2 + 2 = 4 por suma básica."
    assert payload["reading_text"] == "Texto de apoyo"

    choices = payload["choices"]
    assert len(choices) == 4
    assert sum(1 for c in choices if c["is_correct"]) == 1
    assert next(c for c in choices if c["label"] == "B")["is_correct"] is True


def test_map_item_to_question_payload_maps_image_url_when_asset_is_image_extract():
    item = {
        "question": "Pregunta con imagen",
        "subject": "Lenguaje",
        "options": {
            "A": "Alt 1",
            "B": "Alt 2",
            "C": "Alt 3",
            "D": "Alt 4",
        },
        "respuesta_correcta": "A",
        "explicacion_breve": "Explicación válida",
        "visual_asset": {
            "strategy": "image_extract_candidate",
            "payload": {
                "image_path": "/home/gabriel/proyecto_nuevo/salida_lista_hoy/imagenes/ensayo_1_l/p035_q058.png"
            },
        },
    }

    payload = map_item_to_question_payload(item)

    assert payload["image_url"] == "http://localhost:8000/static/imagenes/ensayo_1_l/p035_q058.png"
