from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.auth.jwt import verify_token
from app.models.user import User


def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency para obter o usuário autenticado a partir do HttpOnly Cookie.
    
    O token JWT é enviado automaticamente pelo browser no cookie 'access_token'.
    """
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )
    
    # Buscar token no cookie
    token = request.cookies.get("access_token")
    
    if not token:
        raise credentials_exception
    
    # Verificar e decodificar o token
    user_id = verify_token(token)
    
    if user_id is None:
        raise credentials_exception
    
    # Buscar o usuário no banco de dados
    user = db.query(User).filter(User.id == user_id).first()
    
    if user is None:
        raise credentials_exception
    
    return user
