from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional


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
    document_ids: List[int] = []  # IDs dos documentos associados

    model_config = ConfigDict(from_attributes=True)


# Schema para resposta detalhada de Summary (com informações dos documentos)
class SummaryDetailResponse(SummaryResponse):
    documents: List[dict] = []  # Lista de documentos associados (opcional)

    model_config = ConfigDict(from_attributes=True)
