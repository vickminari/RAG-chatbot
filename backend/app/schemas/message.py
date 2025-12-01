from pydantic import BaseModel
from datetime import datetime
from typing import List


class MessageBase(BaseModel):
    """Schema base para mensagem"""
    role: str
    content: str


class MessageCreate(BaseModel):
    """Schema para criação de mensagem"""
    content: str


class MessageResponse(MessageBase):
    """Schema de resposta de mensagem"""
    id: int
    conversation_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
