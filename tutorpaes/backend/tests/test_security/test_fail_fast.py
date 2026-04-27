import os
import subprocess
import sys


def test_fail_fast_missing_db_url():
    env = os.environ.copy()
    env.pop("DATABASE_URL", None)
    env["SECRET_KEY"] = "x" * 32
    env["PAYMENT_RETURN_URL"] = "http://localhost:3000/api/payments/confirm"
    
    # Ensure app module can be found
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
    env["PYTHONPATH"] = backend_dir

    result = subprocess.run(
        [
            sys.executable,
            "-c",
            (
                "from app.core.config import Settings; "
                "s=Settings(_env_file=None); "
                "s.validate_runtime_requirements(); "
                "print('started')"
            ),
        ],
        env=env,
        capture_output=True,
        text=True,
    )

    assert result.returncode != 0
    assert "Configuración crítica incompleta" in result.stderr or "Configuración crítica incompleta" in result.stdout
