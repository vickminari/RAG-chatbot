from pydantic import BaseModel
from app.schemas.message import MessageResponse


class ChatRequest(BaseModel):
    """Schema para requisição de chat"""
    conversation_id: int
    message: str


class ChatResponse(BaseModel):
    """Schema de resposta de chat"""
    user_message: MessageResponse
    assistant_message: MessageResponse
