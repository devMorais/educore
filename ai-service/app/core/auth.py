import time
import logging
import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

logger = logging.getLogger(__name__)

# Esquema de segurança Bearer para extração automática do token no header
_security = HTTPBearer()

# Cache em memória: token -> (dados_usuario, timestamp)
_cache: dict[str, tuple[dict, float]] = {}
_CACHE_TTL = 60  # segundos


def _obter_cache(token: str) -> dict | None:
    """Retorna dados do cache se ainda dentro do TTL de 60s."""
    entrada = _cache.get(token)
    if entrada:
        dados, timestamp = entrada
        if time.time() - timestamp < _CACHE_TTL:
            return dados
        del _cache[token]
    return None


def _salvar_cache(token: str, dados: dict) -> None:
    """Armazena resultado da verificação no cache."""
    _cache[token] = (dados, time.time())


async def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(_security),
) -> dict:
    """
    Verifica o Bearer token do Sanctum consultando GET /api/auth/verify no Laravel.

    - Cache de 60s para evitar chamadas repetidas ao Laravel.
    - 200: extrai e retorna user_id, email, role.
    - 401/403: lança HTTPException 401.
    """
    token = credentials.credentials

    # Consulta cache antes de bater no Laravel
    dados_cache = _obter_cache(token)
    if dados_cache:
        logger.debug(f"Cache hit para token ...{token[-6:]}")
        return dados_cache

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resposta = await client.get(
                f"{settings.laravel_api_url}/api/auth/verify",
                headers={"Authorization": f"Bearer {token}"},
            )
    except httpx.RequestError as exc:
        logger.error(f"Erro ao contatar Laravel na verificação de token: {exc}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Serviço de autenticação indisponível.",
        )

    if resposta.status_code in (401, 403):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado.",
        )

    if resposta.status_code != 200:
        logger.warning(f"Resposta inesperada do Laravel: {resposta.status_code}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Falha na verificação do token.",
        )

    payload = resposta.json()
    usuario = {
        "user_id": payload["user_id"],
        "email":   payload["email"],
        "role":    payload.get("role", "user"),
    }

    _salvar_cache(token, usuario)
    logger.info(f"Token verificado para usuário {usuario['email']}")
    return usuario


# Atalho reutilizável como default value nos endpoints
get_current_user = Depends(verify_token)
