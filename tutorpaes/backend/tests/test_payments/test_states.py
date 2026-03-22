from types import SimpleNamespace

from app.services import transbank_service


class FakeQuery:
    def __init__(self, payment):
        self.payment = payment

    def filter(self, *_args, **_kwargs):
        return self

    def first(self):
        return self.payment


class FakeDB:
    def __init__(self, payment):
        self.payment = payment
        self.committed = False
        self.rolled_back = False

    def query(self, _model):
        return FakeQuery(self.payment)

    def commit(self):
        self.committed = True

    def rollback(self):
        self.rolled_back = True


def test_payment_state_transitions_to_authorized(monkeypatch):
    payment = SimpleNamespace(token_ws="tok-ok", status="pending", transbank_response={})
    db = FakeDB(payment)

    class Tx:
        @staticmethod
        def commit(_token):
            return SimpleNamespace(response_code=0, status="AUTHORIZED", authorization_code="AUTH123")

    monkeypatch.setattr(transbank_service, "get_webpay_client", lambda: Tx())

    result = transbank_service.confirm_payment("tok-ok", db)

    assert result["success"] is True
    assert payment.status == "authorized"
    assert db.committed is True


def test_payment_state_transitions_to_failed(monkeypatch):
    payment = SimpleNamespace(token_ws="tok-fail", status="pending", transbank_response={})
    db = FakeDB(payment)

    class Tx:
        @staticmethod
        def commit(_token):
            return SimpleNamespace(response_code=1, status="FAILED", authorization_code=None)

    monkeypatch.setattr(transbank_service, "get_webpay_client", lambda: Tx())

    result = transbank_service.confirm_payment("tok-fail", db)

    assert result["success"] is False
    assert payment.status == "failed"
    assert db.committed is True
