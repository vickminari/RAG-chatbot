from fastapi import Response
from app.core.config import settings


def set_auth_cookie(response: Response, token: str) -> None:
    """
    Define o cookie de autenticação HttpOnly na resposta.
    
    Args:
        response: Objeto Response do FastAPI
        token: Token JWT a ser armazenado
    """
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,  # JavaScript não pode acessar (proteção XSS)
        secure=False,   # False em dev, True em produção (HTTPS only)
        samesite="lax", # Proteção CSRF
        max_age=settings.access_token_expire_minutes * 60,  # Segundos
        path="/"        # Disponível em todas as rotas
    )


def clear_auth_cookie(response: Response) -> None:
    """
    Remove o cookie de autenticação (logout).
    """
    response.delete_cookie(
        key="access_token",
        path="/",
        httponly=True,
        secure=False,
        samesite="lax"
    )
