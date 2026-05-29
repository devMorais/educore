from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request


def get_user_identifier(request: Request) -> str:
    """
    Chave de rate limiting por usuário autenticado.
    Usa o token Bearer como identificador único do usuário.
    Fallback para IP quando não há token.
    """
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return f"user:{auth.split(' ')[1]}"
    return f"ip:{get_remote_address(request)}"


# Instância global do limiter — chave padrão por IP para o limite global
limiter = Limiter(key_func=get_remote_address)
