from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.schemas.conversation import (
    ConversationCreate, 
    ConversationResponse,
    ConversationWithMessages
)
from app.services.chat_service import chat_service


router = APIRouter(
    prefix="/conversations",
    tags=["Conversations"]
)


@router.post(
    "", 
    response_model=ConversationResponse, 
    status_code=status.HTTP_201_CREATED
)
def create_conversation(
    conversation_data: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cria uma nova conversa para o usuário autenticado.
    
    - **title**: Título da conversa
    """
    return chat_service.create_conversation(db, current_user.id, conversation_data)


@router.get("", response_model=List[ConversationResponse])
def list_conversations(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lista todas as conversas do usuário autenticado.
    
    - **skip**: Quantidade de registros para pular (paginação)
    - **limit**: Limite de registros a retornar (máximo 100)
    """
    return chat_service.get_user_conversations(db, current_user.id, skip, limit)


@router.get("/{conversation_id}", response_model=ConversationWithMessages)
def get_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Busca uma conversa específica com todas as suas mensagens.
    
    - **conversation_id**: ID da conversa
    """
    conversation = chat_service.get_conversation_by_id(
        db, 
        conversation_id, 
        current_user.id
    )
    return conversation


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deleta uma conversa e todas as suas mensagens.
    
    - **conversation_id**: ID da conversa
    """
    chat_service.delete_conversation(db, conversation_id, current_user.id)
    return None
