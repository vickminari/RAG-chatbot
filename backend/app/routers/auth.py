from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.auth import LoginRequest, LoginResponse, LogoutResponse
from app.schemas.user import UserCreate, UserResponse
from app.services import user_service
from app.auth.dependencies import get_current_user
from app.auth.jwt import create_access_token
from app.auth.cookies import set_auth_cookie, clear_auth_cookie
from app.models.user import User


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Registra um novo usuário.
    
    - **email**: Email válido (será normalizado para lowercase)
    - **password**: Senha com no mínimo 8 caracteres, 1 número, 1 maiúscula e 1 caractere especial
    """
    new_user = user_service.create_user(db, user_data)
    return new_user


@router.post("/login", response_model=LoginResponse)
def login(
    credentials: LoginRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Realiza login do usuário e define um cookie HttpOnly com o token JWT.
    
    - **email**: Email do usuário
    - **password**: Senha do usuário
    
    O token é armazenado em um cookie HttpOnly (não acessível via JavaScript).
    """
    # Autenticar usuário
    user = user_service.authenticate_user(db, credentials.email, credentials.password)
    
    # Criar token JWT
    access_token = create_access_token(data={"sub": str(user.id)})
    
    # Definir cookie HttpOnly
    set_auth_cookie(response, access_token)
    
    return LoginResponse(
        message="Login realizado com sucesso",
        user={"id": user.id, "email": user.email}
    )


@router.post("/logout", response_model=LogoutResponse)
def logout(response: Response):
    """
    Realiza logout do usuário removendo o cookie de autenticação.
    """
    clear_auth_cookie(response)
    
    return LogoutResponse(message="Logout realizado com sucesso")


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Retorna os dados do usuário autenticado.
    
    Requer autenticação (cookie HttpOnly com token JWT).
    """
    return current_user
