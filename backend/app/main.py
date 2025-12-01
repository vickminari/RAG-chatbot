from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base


# Importar todos os modelos para criar as tabelas
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message
from app.routers import auth, conversations, chat

# Criar tabelas no banco de dados
Base.metadata.create_all(bind=engine)

# Inicializar aplicação FastAPI
app = FastAPI(
    title="RAG Chatbot API",
    description="API para chatbot com Google Gemini e LangChain, com RAG (Retrieval-Augmented Generation).",
    version="1.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Temporário para demo
    allow_credentials=True,  # Necessário para cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth.router)
app.include_router(conversations.router)
app.include_router(chat.router)


@app.get("/")
def root():
    """Endpoint raiz"""
    return {
        "message": "RAG Chatbot API",
        "version": "1.0.0",
        "docs": "/docs"
    }
