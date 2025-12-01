from pydantic import BaseModel
from datetime import datetime
from typing import List
from app.schemas.message import MessageResponse


class ConversationBase(BaseModel):
    """Schema base para conversa"""
    title: str


class ConversationCreate(ConversationBase):
    """Schema para criação de conversa"""
    pass


class ConversationResponse(ConversationBase):
    """Schema de resposta de conversa"""
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class ConversationWithMessages(ConversationResponse):
    """Schema de conversa com mensagens"""
    messages: List[MessageResponse]
    
    class Config:
        from_attributes = True
