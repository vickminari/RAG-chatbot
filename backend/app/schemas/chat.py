from pydantic import BaseModel
from typing import List, Optional
from app.schemas.message import MessageResponse


class ChatRequest(BaseModel):
    """Schema para requisição de chat"""
    conversation_id: int
    message: str
    use_rag: bool = False
    is_summary: bool = False
    document_ids: Optional[List[int]] = None


class ChatResponse(BaseModel):
    """Schema de resposta de chat"""
    user_message: MessageResponse
    assistant_message: MessageResponse
