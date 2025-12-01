from pydantic_settings import BaseSettings
from typing import Optional
from pathlib import Path

# Caminho para o diretório raiz do backend (onde está o .env)
BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    """Configurações da aplicação carregadas do arquivo .env"""
    
    # Database
    database_url: str = "sqlite:///./data/chat.db"
    
    # JWT - SECRET_KEY deve vir obrigatoriamente do .env
    secret_key: str  # OBRIGATÓRIO no .env
    algorithm: str = "HS256"  # Opcional (tem padrão)
    access_token_expire_minutes: int = 10080  # Opcional (tem padrão - 7 dias)
    
    # Google Gemini - API_KEY deve vir obrigatoriamente do .env
    google_api_key: str  # OBRIGATÓRIO no .env
    qtd_tokens_default: int = 8192  # Opcional (tem padrão)
    
    class Config:
        env_file = str(BASE_DIR / ".env")
        env_file_encoding = "utf-8"
        case_sensitive = False


settings = Settings()
