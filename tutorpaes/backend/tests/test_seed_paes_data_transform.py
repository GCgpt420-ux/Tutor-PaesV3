import pytest

from scripts.seed_paes_data import (
    build_prompt_key,
    get_image_url,
    map_item_to_question_payload,
    resolve_subject_info,
)


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


def test_resolve_subject_info_supports_all_7_official_subjects():
    test_cases = [
        ("Matematicas", ("M1", "Matemática 1")),
        ("Matematicas_M2", ("M2", "Matemática 2")),
        ("Biologia", ("BIO", "Ciencias - Biología")),
        ("Fisica", ("FIS", "Ciencias - Física")),
        ("Quimica", ("QUI", "Ciencias - Química")),
        ("Historia", ("HIST", "Historia y Ciencias Sociales")),
        ("Lenguaje", ("LENG", "Competencia Lectora")),
        # Also direct codes
        ("M1", ("M1", "Matemática 1")),
        ("M2", ("M2", "Matemática 2")),
        ("BIO", ("BIO", "Ciencias - Biología")),
        ("FIS", ("FIS", "Ciencias - Física")),
        ("QUI", ("QUI", "Ciencias - Química")),
        ("HIST", ("HIST", "Historia y Ciencias Sociales")),
        ("LENG", ("LENG", "Competencia Lectora")),
    ]

    for raw_subject, (expected_code, expected_name) in test_cases:
        code, name = resolve_subject_info(raw_subject)
        assert code == expected_code, f"Failed for {raw_subject}: got {code} instead of {expected_code}"
        assert name == expected_name, f"Failed for {raw_subject}: got {name} instead of {expected_name}"


def test_get_image_url_with_2026_format():
    item_with_prefix = {"image_path": "imagenes_2026/matematicas_q01.png"}
    assert get_image_url(item_with_prefix) == "/static/imagenes_2026/matematicas_q01.png"

    item_without_prefix = {"image_path": "matematicas_q01.png"}
    assert get_image_url(item_without_prefix) == "/static/imagenes_2026/matematicas_q01.png"

    item_none = {"image_path": None}
    assert get_image_url(item_none) is None


def test_map_item_to_question_payload_demre_2026_spec():
    item = {
        "number": 1,
        "subject": "Matematicas",
        "question": "En un juego hay dos tipos de cartas...",
        "options": {
            "A": "$-14$",
            "B": "$-4$",
            "C": "$3$",
            "D": "$11$",
        },
        "respuesta_correcta": "B",
        "explicacion_breve": "Respuesta oficial DEMRE 2026: Alternativa B.",
        "reading_passage_texto": "Texto base lectura",
        "requires_image": True,
        "image_path": "imagenes_2026/matematicas_q01.png",
        "difficulty": 2,
    }

    payload = map_item_to_question_payload(item)

    assert payload["prompt"] == "En un juego hay dos tipos de cartas..."
    assert payload["explanation"] == "Respuesta oficial DEMRE 2026: Alternativa B."
    assert payload["reading_text"] == "Texto base lectura"
    assert payload["image_url"] == "/static/imagenes_2026/matematicas_q01.png"
    assert payload["subject_code"] == "M1"
    assert payload["subject_name"] == "Matemática 1"
    assert payload["difficulty"] == 2
    assert payload["question_type"] == "mcq"

    choices = payload["choices"]
    assert len(choices) == 4
    choice_b = next(c for c in choices if c["label"] == "B")
    assert choice_b["is_correct"] is True
    assert choice_b["text"] == "$-4$"
    assert sum(1 for c in choices if c["is_correct"]) == 1
