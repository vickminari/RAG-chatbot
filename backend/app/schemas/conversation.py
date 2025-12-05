from pydantic import BaseModel
from datetime import datetime
from typing import List, TYPE_CHECKING, Any

if TYPE_CHECKING:
    from app.schemas.message import MessageResponse
    from app.schemas.summary import SummaryResponse


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
    messages: List[Any]  # MessageResponse
    
    class Config:
        from_attributes = True


class ConversationWithSummaries(ConversationResponse):
    """Schema de conversa com resumos"""
    summaries: List[Any]  # SummaryResponse
    
    class Config:
        from_attributes = True


class ConversationDetailed(ConversationResponse):
    """Schema detalhado de conversa com mensagens e resumos"""
    messages: List[Any]  # MessageResponse
    summaries: List[Any]  # SummaryResponse
    
    class Config:
        from_attributes = True
