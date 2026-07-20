"""
D-16: valida que /audio e /html-view têm rate limit POR USUÁRIO (não só por
IP), usando o mesmo limiter (slowapi) já usado nos outros endpoints caros.

A lógica de negócio de cada endpoint (TTS, geração de slides) não é o foco
aqui — o mock de banco sempre responde de um jeito que faz o endpoint
falhar rápido e de forma previsível (404/400), só pra poder bater o
endpoint repetidamente sem depender de Postgres/Gemini reais. O que
importa é: quantas chamadas passam (não-429) e quando o 429 aparece.
"""
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.core.config import settings
from app.core.limiter import limiter
from app.routers import documents

FAKE_USER_ID = 1


class FakeCursor:
    """Cursor fake que responde de acordo com a query recebida."""

    def __init__(self):
        self._last_sql = ""

    def execute(self, sql, params=None):
        self._last_sql = sql

    def fetchone(self):
        sql = self._last_sql
        if "SELECT user_id FROM documents" in sql:
            return (FAKE_USER_ID,)  # ownership_check sempre passa
        if "SELECT status FROM documents" in sql:
            return ("processing",)  # _require_completed falha com 400
        if "type='pcd'" in sql:
            return None  # get_audio falha com 404 (sem conteúdo PCD)
        return None

    def close(self):
        pass


class FakeConn:
    def cursor(self):
        return FakeCursor()

    def commit(self):
        pass

    def close(self):
        pass

    def rollback(self):
        pass


@pytest.fixture(autouse=True)
def reset_limiter():
    """O Limiter é um singleton em memória — reseta entre testes pra não vazar contagem."""
    limiter.reset()
    yield
    limiter.reset()


AUTH_HEADER = {"Authorization": "Bearer fake-token-abc"}


def test_audio_rate_limit_blocks_after_configured_threshold(client):
    limit = settings.rate_generations_per_hour

    with patch.object(documents, "get_connection", return_value=FakeConn()):
        for i in range(limit):
            response = client.get("/documents/1/audio", headers=AUTH_HEADER)
            assert response.status_code != 429, f"chamada {i + 1}/{limit} não deveria ser limitada"

        blocked = client.get("/documents/1/audio", headers=AUTH_HEADER)

    assert blocked.status_code == 429
    assert "message" in blocked.json() or "detail" in blocked.json() or "error" in blocked.json()


def test_audio_rate_limit_is_per_user_not_per_ip(client):
    """Mesmo teste de isolamento por usuário do html-view, agora pro /audio."""
    limit = settings.rate_generations_per_hour

    with patch.object(documents, "get_connection", return_value=FakeConn()):
        for _ in range(limit):
            client.get("/documents/1/audio", headers={"Authorization": "Bearer usuario-A"})
        bloqueado_a = client.get("/documents/1/audio", headers={"Authorization": "Bearer usuario-A"})
        assert bloqueado_a.status_code == 429

        # Usuário B, mesmo IP (mesmo TestClient), token diferente — cota independente.
        resposta_b = client.get("/documents/1/audio", headers={"Authorization": "Bearer usuario-B"})
        assert resposta_b.status_code != 429


def test_html_view_rate_limit_blocks_after_configured_threshold(client):
    limit = settings.rate_export_per_hour

    with patch.object(documents, "get_connection", return_value=FakeConn()), \
         patch.object(documents, "verify_token", new=AsyncMock(return_value={"user_id": FAKE_USER_ID})):
        for i in range(limit):
            response = client.get("/documents/1/html-view", params={"token": "fake-token-abc"})
            assert response.status_code != 429, f"chamada {i + 1}/{limit} não deveria ser limitada"

        blocked = client.get("/documents/1/html-view", params={"token": "fake-token-abc"})

    assert blocked.status_code == 429


def test_html_view_rate_limit_is_per_user_not_per_ip():
    """
    Dois "usuários" diferentes (tokens diferentes) batendo do MESMO IP (o
    TestClient sempre usa o mesmo IP de origem) — se o limite fosse por IP,
    o segundo usuário já chegaria bloqueado. Como é por usuário (a chave usa
    o token da query, não o IP — get_user_identifier_from_query_token),
    cada um tem sua própria cota, mesmo vindo do mesmo endereço.
    """
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from slowapi import _rate_limit_exceeded_handler
    from slowapi.errors import RateLimitExceeded

    test_app = FastAPI()
    test_app.state.limiter = limiter
    test_app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    test_app.include_router(documents.router)

    limit = settings.rate_export_per_hour

    with patch.object(documents, "get_connection", return_value=FakeConn()), \
         patch.object(documents, "verify_token", new=AsyncMock(return_value={"user_id": FAKE_USER_ID})), \
         TestClient(test_app) as c:
        # Usuário A esgota a cota dele.
        for _ in range(limit):
            c.get("/documents/1/html-view", params={"token": "token-usuario-A"})
        bloqueado_a = c.get("/documents/1/html-view", params={"token": "token-usuario-A"})
        assert bloqueado_a.status_code == 429

        # Usuário B, MESMO IP (mesmo TestClient), token diferente — não deve estar bloqueado.
        resposta_b = c.get("/documents/1/html-view", params={"token": "token-usuario-B"})
        assert resposta_b.status_code != 429


def test_get_user_identifier_from_query_token_ignores_source_ip():
    """
    Teste direto da key_func: o mesmo token, vindo de "IPs" diferentes, tem
    que gerar a MESMA chave — é isso que garante o limite por usuário.
    """
    from app.core.limiter import get_user_identifier_from_query_token

    req_ip_1 = MagicMock()
    req_ip_1.query_params = {"token": "mesmo-token"}
    req_ip_1.client.host = "1.1.1.1"

    req_ip_2 = MagicMock()
    req_ip_2.query_params = {"token": "mesmo-token"}
    req_ip_2.client.host = "2.2.2.2"

    assert (
        get_user_identifier_from_query_token(req_ip_1)
        == get_user_identifier_from_query_token(req_ip_2)
        == "user:mesmo-token"
    )


def test_normal_usage_within_limit_is_not_affected(client):
    """Critério de aceite explícito: uso normal (dentro do limite) não é afetado."""
    with patch.object(documents, "get_connection", return_value=FakeConn()):
        response = client.get("/documents/1/audio", headers=AUTH_HEADER)

    # Falha por falta de conteúdo PCD (404), não por rate limit (429).
    assert response.status_code == 404
