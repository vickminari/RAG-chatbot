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
    
    # AWS S3
    aws_access_key_id: str  # OBRIGATÓRIO no .env
    aws_secret_access_key: str  # OBRIGATÓRIO no .env
    aws_region: str = "us-east-1"  # Opcional (tem padrão)
    s3_bucket_name: str  # OBRIGATÓRIO no .env
    
    # Upload Settings
    max_pdf_size_mb: int = 50  # Opcional (tem padrão)
    profile_picture_max_size_mb: int = 5  # Opcional (tem padrão)
    max_upload_size_mb: int = 100  # Opcional (tem padrão)
    
    # RAG Settings
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"  # Opcional
    chunk_size: int = 1200  # Opcional
    chunk_overlap: int = 200  # Opcional
    default_k_chunks: int = 6  # Opcional
    
    class Config:
        env_file = str(BASE_DIR / ".env")
        env_file_encoding = "utf-8"
        case_sensitive = False


settings = Settings()
