def test_metrics_endpoint_accessible(client):
    from app.core.metrics import LLM_REQUESTS_TOTAL
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "tutorpaes_llm_requests_total" in response.text
