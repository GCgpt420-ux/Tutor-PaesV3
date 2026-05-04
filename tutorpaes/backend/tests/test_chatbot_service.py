from types import SimpleNamespace

from app.services import chatbot_service


class DummyDb:
    def __init__(self):
        self.added = []
        self.commit_calls = 0

    def add(self, item):
        self.added.append(item)

    def commit(self):
        self.commit_calls += 1


def test_run_pedagogical_loop_stream_passes_history_and_question_context(monkeypatch):
    db = DummyDb()
    user = SimpleNamespace(id=7, target_score=850)
    history = [
        SimpleNamespace(role="assistant", content="Partamos leyendo con calma."),
        SimpleNamespace(role="user", content="No entiendo la diferencia entre meiosis y mitosis."),
    ]
    exercise_context = {
        "subject_code": "CIEN",
        "topic_code": "BIO",
        "question_prompt": "\u00bfQu\u00e9 tipo de reproducci\u00f3n produce individuos gen\u00e9ticamente id\u00e9nticos?",
        "choices": [
            {"label": "A", "text": "Reproducci\u00f3n sexual"},
            {"label": "B", "text": "Reproducci\u00f3n asexual"},
        ],
        "selected_choice_label": "A",
        "selected_choice_text": "Reproducci\u00f3n sexual",
        "is_correct": False,
        "feedback_text": "Incorrecto. Revisa qu\u00e9 proceso conserva la informaci\u00f3n gen\u00e9tica.",
    }
    captured = {}

    monkeypatch.setattr(chatbot_service, "_get_user_overall_level", lambda _user, _db: ("intermedio", None))
    monkeypatch.setattr(chatbot_service, "_get_user_weak_topics", lambda _user, _db: ["BIO"])
    monkeypatch.setattr(chatbot_service, "_load_chat_history", lambda _db, _user_id, _attempt_id: history)
    monkeypatch.setattr(chatbot_service, "_load_attempt_context", lambda _db, _attempt_id, _explicit_context=None: exercise_context)

    def fake_stream_llm_response(**kwargs):
        captured.update(kwargs)
        yield "Respuesta"

    monkeypatch.setattr(chatbot_service, "stream_llm_response", fake_stream_llm_response)

    chunks = list(
        chatbot_service.run_pedagogical_loop_stream(
            db=db,
            user=user,
            user_message="\u00bfPor qu\u00e9 la correcta no es la A?",
            attempt_id=42,
        )
    )

    assert chunks == ["data: Respuesta\n\n", "data: [DONE]\n\n"]
    assert "conversation_messages" in captured

    messages = captured["conversation_messages"]
    assert messages[0]["role"] == "system"
    assert "Nivel de desempeño: intermedio" in messages[0]["content"]
    assert any("gen\u00e9ticamente id\u00e9nticos" in message["content"] for message in messages if message["role"] == "system")
    assert any("No entiendo la diferencia" in message["content"] for message in messages)
    assert messages[-1] == {"role": "user", "content": "\u00bfPor qu\u00e9 la correcta no es la A?"}
