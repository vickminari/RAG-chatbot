from sqlalchemy.orm import Session
from fastapi import HTTPException, status, UploadFile
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserPasswordUpdate
from app.auth.jwt import get_password_hash, verify_password
from app.services.s3_service import s3_service
from io import BytesIO
import logging

logger = logging.getLogger(__name__)


def get_user_by_email(db: Session, email: str) -> User | None:
    """Busca usuário por email"""
    return db.query(User).filter(User.email == email.strip().lower()).first()


def get_user_by_id(db: Session, user_id: int) -> User | None:
    """Busca usuário por ID"""
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_username(db: Session, username: str) -> User | None:
    """Busca usuário por nome de usuário"""
    return db.query(User).filter(User.username == username.strip().lower()).first()

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
    
    # Verificar se já existe usuário com este username
    existing_username = get_user_by_username(db, user_data.username)
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nome de usuário já cadastrado"
        )
    
    # Criar hash da senha
    hashed_password = get_password_hash(user_data.password)
    
    # Criar novo usuário
    new_user = User(
        nome=user_data.nome,
        username=user_data.username.strip().lower(),
        email=normalized_email,
        hashed_password=hashed_password,
        imagem_perfil=user_data.imagem_perfil,
        descricao=user_data.descricao
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


def update_user(db: Session, user_id: int, user_data: UserUpdate) -> User:
    """
    Atualiza informações do usuário (exceto senha).
    
    Raises:
        HTTPException: Se o usuário não existir ou username já estiver em uso
    """
    # Buscar usuário
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    # Verificar se username está sendo alterado e se já existe
    if user_data.username is not None:
        normalized_username = user_data.username.strip().lower()
        if normalized_username != user.username:
            existing_user = get_user_by_username(db, normalized_username)
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Nome de usuário já está em uso"
                )
            user.username = normalized_username
    
    # Atualizar campos fornecidos
    if user_data.nome is not None:
        user.nome = user_data.nome
    
    if user_data.imagem_perfil is not None:
        user.imagem_perfil = user_data.imagem_perfil
    
    if user_data.descricao is not None:
        user.descricao = user_data.descricao
    
    db.commit()
    db.refresh(user)
    
    return user


def update_password(db: Session, user_id: int, password_data: UserPasswordUpdate) -> User:
    """
    Atualiza a senha do usuário.
    
    Raises:
        HTTPException: Se o usuário não existir ou senha antiga estiver incorreta
    """
    # Buscar usuário
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    # Verificar senha antiga
    if not verify_password(password_data.old_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Senha antiga incorreta"
        )
    
    # Atualizar senha
    user.hashed_password = get_password_hash(password_data.new_password)
    
    db.commit()
    db.refresh(user)
    
    return user


async def upload_profile_picture(
    db: Session,
    user_id: int,
    file: UploadFile
) -> str:
    """
    Faz upload da foto de perfil para o S3 e retorna a URL
    
    Args:
        db: Sessão do banco de dados
        user_id: ID do usuário
        file: Arquivo enviado
        
    Returns:
        URL da imagem no S3
        
    Raises:
        HTTPException: Se o usuário não existir ou o arquivo for inválido
    """
    # Buscar usuário
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    # Validar tipo de arquivo
    allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Apenas arquivos JPG, PNG ou WebP são permitidos"
        )
    
    # Ler conteúdo do arquivo
    file_content = await file.read()
    file_size = len(file_content)
    
    # Validar tamanho (5MB)
    max_size = 5 * 1024 * 1024
    if file_size > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Arquivo muito grande. Máximo: 5MB"
        )
    
    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Arquivo vazio"
        )
    
    # Gerar chave S3 (mantém a extensão original)
    extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    s3_key = f"profile_pictures/{user_id}/profile.{extension}"
    
    # Upload para S3 usando BytesIO
    file_obj = BytesIO(file_content)
    success = s3_service.upload_file(
        file_obj=file_obj,
        s3_key=s3_key,
        content_type=file.content_type
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao fazer upload da imagem"
        )
    
    # Gerar URL pública ou pré-assinada
    image_url = s3_service.generate_presigned_url(s3_key, expiration=31536000)  # 1 ano
    
    if not image_url:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao gerar URL da imagem"
        )
    
    # Atualizar usuário com a URL da imagem
    user.imagem_perfil = image_url
    db.commit()
    db.refresh(user)
    
    logger.info(f"Foto de perfil do usuário {user_id} atualizada")
    return image_url
