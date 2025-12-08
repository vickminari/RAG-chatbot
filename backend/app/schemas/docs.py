from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional


class DocumentBase(BaseModel):
    """Schema base para documentos"""
    filename: str = Field(..., min_length=1, max_length=255, description="Nome do arquivo")


class DocumentCreate(DocumentBase):
    """Schema para criação de documento"""
    conversation_id: int = Field(..., gt=0, description="ID da conversa")
    file_size: int = Field(..., gt=0, description="Tamanho do arquivo em bytes")
    
    @field_validator('file_size')
    @classmethod
    def validate_file_size(cls, v: int) -> int:
        # 50MB em bytes
        max_size = 50 * 1024 * 1024
        if v > max_size:
            raise ValueError(f'Arquivo muito grande. Máximo: 50MB')
        return v


class DocumentStatusUpdate(BaseModel):
    """Schema para atualização de status (usado pela indexação em background)"""
    status: str = Field(..., pattern="^(pending|processing|indexed|failed)$")
    faiss_index_s3_key: Optional[str] = None
    metadata_s3_key: Optional[str] = None


class DocumentResponse(DocumentBase):
    """Schema de resposta de documento"""
    id: int
    user_id: int
    conversation_id: int
    s3_key: str
    file_size: int
    status: str
    faiss_index_s3_key: Optional[str] = None
    metadata_s3_key: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    """Schema para lista de documentos"""
    documents: list[DocumentResponse]
    total: int


class DocumentUploadResponse(BaseModel):
    """Schema de resposta após upload"""
    id: int
    conversation_id: int
    filename: str
    file_size: int
    status: str
    message: str = "Upload realizado com sucesso. Indexação iniciada em background."
    created_at: datetime

    class Config:
        from_attributes = True
    created_at: datetime

    class Config:
        from_attributes = True