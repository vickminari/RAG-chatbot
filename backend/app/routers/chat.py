from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat_service import chat_service


router = APIRouter(
    prefix="/chat",
    tags=["Chat"]
)


@router.post("", response_model=ChatResponse)
async def send_message(
    chat_request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Envia uma mensagem em uma conversa e recebe a resposta do assistente.
    
    - **conversation_id**: ID da conversa
    - **message**: Mensagem do usuário
    
    O sistema:
    1. Verifica se a conversa pertence ao usuário autenticado
    2. Valida se há tokens disponíveis (limite definido em QTD_TOKENS_DEFAULT)
    3. Processa a mensagem com Google Gemini via LangChain
    4. Salva ambas as mensagens (usuário e assistente)
    5. Atualiza a contagem de tokens da conversa
    
    Retorna erro 429 se o limite de tokens for atingido.
    """
    user_message, assistant_message = await chat_service.process_chat_message(
        db=db,
        conversation_id=chat_request.conversation_id,
        user_id=current_user.id,
        message_content=chat_request.message
    )
    
    return ChatResponse(
        user_message=user_message,
        assistant_message=assistant_message
    )
