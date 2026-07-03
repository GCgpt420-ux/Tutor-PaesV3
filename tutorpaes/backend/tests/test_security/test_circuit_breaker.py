import time
import pytest
from app.core.circuit_breaker import CircuitBreaker, CircuitBreakerOpenException

def test_circuit_breaker_transitions():
    breaker = CircuitBreaker("TestBreaker", failure_threshold=2, recovery_timeout=0.5)
    
    call_count = 0
    
    @breaker
    def dummy_call(should_fail: bool):
        nonlocal call_count
        call_count += 1
        if should_fail:
            raise RuntimeError("Outage")
        return "success"

    # 1. CLOSED state, calls work
    assert dummy_call(should_fail=False) == "success"
    assert breaker.state == "CLOSED"

    # 2. First failure
    with pytest.raises(RuntimeError):
        dummy_call(should_fail=True)
    assert breaker.state == "CLOSED"

    # 3. Second failure triggers OPEN
    with pytest.raises(RuntimeError):
        dummy_call(should_fail=True)
    assert breaker.state == "OPEN"

    # 4. Calls block instantly while OPEN
    with pytest.raises(CircuitBreakerOpenException):
        dummy_call(should_fail=False)
    assert call_count == 3  # Did not invoke dummy_call inside wrapper

    # 5. Wait recovery timeout, transitions to HALF-OPEN, succeeds -> CLOSED
    time.sleep(0.6)
    assert dummy_call(should_fail=False) == "success"
    assert breaker.state == "CLOSED"
    assert breaker.failure_count == 0
