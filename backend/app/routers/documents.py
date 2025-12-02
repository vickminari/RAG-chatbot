from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.auth.dependencies import get_current_user_from_cookie
from app.models.user import User
from app.schemas.docs import (
    DocumentResponse,
    DocumentListResponse,
    DocumentUploadResponse
)
from app.services.document_service import document_service
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentUploadResponse, status_code=201)
async def upload_document(
    conversation_id: int = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user_from_cookie),
    db: Session = Depends(get_db)
):
    """
    Faz upload de um documento PDF para uma conversa
    
    - **conversation_id**: ID da conversa (obrigatório)
    - **file**: Arquivo PDF (máximo 50MB)
    
    Retorna o documento criado com status 'pending'.
    A indexação será feita em background automaticamente.
    """
    # Validar tipo de arquivo
    if not file.content_type or not file.content_type.startswith("application/pdf"):
        raise HTTPException(
            status_code=400,
            detail="Apenas arquivos PDF são permitidos"
        )
    
    # Validar tamanho do arquivo
    file.file.seek(0, 2)  # Ir para o final
    file_size = file.file.tell()
    file.file.seek(0)  # Voltar ao início
    
    max_size = settings.max_pdf_size_mb * 1024 * 1024
    if file_size > max_size:
        raise HTTPException(
            status_code=400,
            detail=f"Arquivo muito grande. Máximo: {settings.max_pdf_size_mb}MB"
        )
    
    if file_size == 0:
        raise HTTPException(
            status_code=400,
            detail="Arquivo vazio"
        )
    
    # Criar documento
    try:
        document = document_service.create_document(
            db=db,
            user_id=current_user.id,
            conversation_id=conversation_id,
            file=file
        )
        
        return DocumentUploadResponse(
            id=document.id,
            conversation_id=document.conversation_id,
            filename=document.filename,
            file_size=document.file_size,
            status=document.status,
            created_at=document.created_at,
            message="Upload realizado com sucesso. Indexação iniciada em background."
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao fazer upload de documento: {e}")
        raise HTTPException(
            status_code=500,
            detail="Erro ao processar upload do documento"
        )


@router.get("/conversation/{conversation_id}", response_model=DocumentListResponse)
async def list_documents_by_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user_from_cookie),
    db: Session = Depends(get_db)
):
    """
    Lista todos os documentos de uma conversa específica
    
    Retorna apenas documentos que pertencem ao usuário autenticado.
    """
    documents = document_service.get_documents_by_conversation(
        db=db,
        conversation_id=conversation_id,
        user_id=current_user.id
    )
    
    return DocumentListResponse(
        documents=documents,
        total=len(documents)
    )


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user_from_cookie),
    db: Session = Depends(get_db)
):
    """
    Busca um documento específico por ID
    
    Retorna apenas se o documento pertencer ao usuário autenticado.
    """
    document = document_service.get_document_by_id(
        db=db,
        document_id=document_id,
        user_id=current_user.id
    )
    
    if not document:
        raise HTTPException(
            status_code=404,
            detail="Documento não encontrado ou você não tem permissão"
        )
    
    return document


@router.get("/{document_id}/download")
async def get_document_download_url(
    document_id: int,
    current_user: User = Depends(get_current_user_from_cookie),
    db: Session = Depends(get_db)
):
    """
    Gera URL pré-assinada para download do documento
    
    A URL é válida por 1 hora e permite download direto do S3.
    """
    url = document_service.get_presigned_url(
        db=db,
        document_id=document_id,
        user_id=current_user.id,
        expiration=3600  # 1 hora
    )
    
    return {
        "download_url": url,
        "expires_in": 3600,
        "message": "URL válida por 1 hora"
    }


@router.delete("/{document_id}", status_code=204)
async def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user_from_cookie),
    db: Session = Depends(get_db)
):
    """
    Remove um documento
    
    Remove o documento do banco de dados e todos os arquivos relacionados do S3
    (PDF, índice FAISS, metadados).
    """
    document_service.delete_document(
        db=db,
        document_id=document_id,
        user_id=current_user.id
    )
    
    return None
