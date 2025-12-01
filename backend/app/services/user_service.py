from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.user import UserCreate
from app.auth.jwt import get_password_hash, verify_password


def get_user_by_email(db: Session, email: str) -> User | None:
    """Busca usuário por email"""
    return db.query(User).filter(User.email == email.strip().lower()).first()


def get_user_by_id(db: Session, user_id: int) -> User | None:
    """Busca usuário por ID"""
    return db.query(User).filter(User.id == user_id).first()


def create_user(db: Session, user_data: UserCreate) -> User:
    """
    Cria um novo usuário no banco de dados.
    
    Raises:
        HTTPException: Se o email já estiver cadastrado
    """
    # Normalizar email
    normalized_email = user_data.email.strip().lower()
    
    # Verificar se já existe usuário com este email
    existing_user = get_user_by_email(db, normalized_email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já cadastrado"
        )
    
    # Criar hash da senha
    hashed_password = get_password_hash(user_data.password)
    
    # Criar novo usuário
    new_user = User(
        email=normalized_email,
        hashed_password=hashed_password
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


def authenticate_user(db: Session, email: str, password: str) -> User:
    """
    Autentica um usuário verificando email e senha.
    
    Raises:
        HTTPException: Se as credenciais forem inválidas
    """
    # Buscar usuário
    user = get_user_by_email(db, email)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos"
        )
    
    # Verificar senha
    if not verify_password(password, getattr(user, "hashed_password")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos"
        )
    
    return user
