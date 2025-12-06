from pydantic import BaseModel, ConfigDict, model_validator
from datetime import datetime
from typing import List, Optional, Any


# Schema base para Summary
class SummaryBase(BaseModel):
    title: str
    content: str


# Schema para criar um Summary
class SummaryCreate(SummaryBase):
    conversation_id: int
    document_ids: List[int] = []  # IDs dos documentos usados para gerar o resumo


# Schema para atualizar um Summary
class SummaryUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    document_ids: Optional[List[int]] = None


# Schema para resposta de Summary (inclui ID e timestamps)
class SummaryResponse(SummaryBase):
    id: int
    conversation_id: int
    created_at: datetime
    document_ids: List[int] = []

    model_config = ConfigDict(from_attributes=True)
    
    @model_validator(mode='before')
    @classmethod
    def extract_document_ids(cls, data: Any) -> Any:
        """Extrai document_ids do relacionamento documents do ORM"""
        if hasattr(data, 'documents'):
            # É um objeto ORM, extrair IDs dos documentos
            document_ids = [doc.id for doc in data.documents] if data.documents else []
            # Converter para dict e adicionar document_ids
            return {
                'id': data.id,
                'title': data.title,
                'content': data.content,
                'conversation_id': data.conversation_id,
                'created_at': data.created_at,
                'document_ids': document_ids
            }
        return data


# Schema para resposta detalhada de Summary (com informações dos documentos)
class SummaryDetailResponse(SummaryResponse):
    documents: List[dict] = []  # Lista de documentos associados (opcional)

    model_config = ConfigDict(from_attributes=True)
