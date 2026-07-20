"""
D-15: fixtures compartilhadas dos testes do ai-service.

Monta um FastAPI app "de teste" só com o router de documentos, em vez de
importar `main.app` direto — evita o lifespan (`init_db()`), que exige um
Postgres real de verdade só pra subir a aplicação.
"""
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.auth import verify_token
from app.core.limiter import limiter
from app.routers import documents

FAKE_USER = {"user_id": 1, "email": "test@example.com", "role": "student"}


@pytest.fixture
def client():
    test_app = FastAPI()
    test_app.state.limiter = limiter
    test_app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    test_app.include_router(documents.router)

    # get_current_user (em documents.py) é Depends(verify_token) — o override
    # tem que mirar o callable de dentro do Depends, não o Depends em si.
    test_app.dependency_overrides[verify_token] = lambda: FAKE_USER

    with TestClient(test_app) as test_client:
        yield test_client

    test_app.dependency_overrides.clear()
