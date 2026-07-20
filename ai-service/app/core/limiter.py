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


def get_user_identifier_from_query_token(request: Request) -> str:
    """
    D-16: variante de get_user_identifier() pra endpoints que autenticam via
    query param `?token=` em vez do header Authorization (caso do html-view,
    que precisa funcionar com window.open() sem headers customizados).
    Sem isso, get_user_identifier() nunca acharia o Bearer no header e o
    limite cairia pra por-IP, não por-usuário.
    """
    token = request.query_params.get("token", "")
    if token:
        return f"user:{token}"
    return f"ip:{get_remote_address(request)}"


# Instância global do limiter — chave padrão por IP para o limite global
limiter = Limiter(key_func=get_remote_address)
