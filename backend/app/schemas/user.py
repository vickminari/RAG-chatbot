from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime
from typing import Optional


class UserBase(BaseModel):
    """Schema base para usuário"""
    nome: str
    username: str
    email: EmailStr
    
    @field_validator("email")
    @classmethod
    def normalize_email(cls, email: str) -> str:
        """Normaliza o email para lowercase e remove espaços"""
        return email.strip().lower()
    
    @field_validator("username")
    @classmethod
    def validate_username(cls, username: str) -> str:
        """Valida e normaliza o username"""
        username = username.strip()
        if len(username) < 3:
            raise ValueError("Username deve ter no mínimo 3 caracteres.")
        if not username.replace("_", "").replace("-", "").isalnum():
            raise ValueError("Username deve conter apenas letras, números, '_' ou '-'.")
        return username


class UserCreate(UserBase):
    """Schema para criação de usuário"""
    password: str
    imagem_perfil: Optional[str] = None
    descricao: Optional[str] = None
    
    @field_validator("password")
    @classmethod
    def validate_password(cls, password: str) -> str:
        """Valida complexidade da senha"""
        if len(password) < 8:
            raise ValueError("Senha deve ter no mínimo 8 caracteres.")
        if not any(char.isdigit() for char in password):
            raise ValueError("Senha deve ter no mínimo 1 número.")
        if not any(char.isupper() for char in password):
            raise ValueError("Senha deve ter no mínimo 1 letra maiúscula.")
        if not any(char in ["!", "@", "#", "$", "%", "&", "*"] for char in password):
            raise ValueError("Senha deve ter no mínimo 1 caractere especial (!@#$%&*).")
        return password


class UserResponse(UserBase):
    """Schema de resposta de usuário"""
    id: int
    imagem_perfil: Optional[str] = None
    descricao: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
