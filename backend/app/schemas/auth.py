from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional


class LoginRequest(BaseModel):
    """Schema para requisição de login"""
    email: EmailStr
    password: str
    
    @field_validator("email")
    @classmethod
    def normalize_email(cls, email: str) -> str:
        """Normaliza o email para lowercase e remove espaços"""
        return email.strip().lower()


class LoginResponse(BaseModel):
    """Schema para resposta de login (cookie HttpOnly é definido automaticamente)"""
    message: str
    user: dict  # {id: int, email: str}


class LogoutResponse(BaseModel):
    """Schema para resposta de logout"""
    message: str


class TokenData(BaseModel):
    """Schema para dados decodificados do token (uso interno)"""
    user_id: Optional[int] = None
