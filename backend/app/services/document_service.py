from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile
from app.models.docs import Document
from app.models.conversation import Conversation
from app.schemas.docs import DocumentCreate, DocumentResponse, DocumentStatusUpdate
from app.services.s3_service import s3_service
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)


class DocumentService:
    """Serviço para gerenciamento de documentos"""
    async def create_document(
        self,
        db: Session,
        user_id: int,
        conversation_id: int,
        file: UploadFile
    ) -> Document:
        """
        Cria documento e faz upload para S3
        
        Args:
            db: Sessão do banco de dados
            user_id: ID do usuário dono
            conversation_id: ID da conversa
            file: Arquivo enviado
            
        Returns:
            Documento criado
            
        Raises:
            HTTPException: Se conversa não existir ou não pertencer ao usuário
        """
        # Verificar se conversa existe e pertence ao usuário
        conversation = db.query(Conversation).filter(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id
        ).first()
        
        if not conversation:
            raise HTTPException(
                status_code=404,
                detail="Conversa não encontrada ou você não tem permissão"
            )
        
        # Criar registro no banco
        doc = Document(
            user_id=user_id,
            conversation_id=conversation_id,
            filename=file.filename,
            s3_key="",  # Será atualizado após upload
            file_size=0,  # Será atualizado
            status="pending"
        )
        db.add(doc)
        db.flush()  # Gera o ID sem commitar
        
        # Ler conteúdo do arquivo antes de qualquer operação
        file_content = await file.read()
        file_size = len(file_content)
        
        # Validar tamanho
        from app.core.config import settings
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
        
        # Gerar chave S3
        s3_key = f"uploads/{user_id}/{conversation_id}/{doc.id}.pdf"
        
        # Upload para S3 usando BytesIO
        from io import BytesIO
        file_obj = BytesIO(file_content)
        
        success = s3_service.upload_file(
            file_obj=file_obj,
            s3_key=s3_key,
            content_type=file.content_type or "application/pdf"
        )
        
        if not success:
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail="Erro ao fazer upload do arquivo para S3"
            )
        
        # Atualizar documento com s3_key e file_size
        doc.s3_key = s3_key
        doc.file_size = file_size
        
        db.commit()
        db.refresh(doc)
        
        logger.info(f"Documento {doc.id} criado para conversa {conversation_id}")
        return doc
    
    def get_document_by_id(
        self,
        db: Session,
        document_id: int,
        user_id: int
    ) -> Optional[Document]:
        """
        Busca documento por ID com verificação de ownership
        
        Args:
            db: Sessão do banco de dados
            document_id: ID do documento
            user_id: ID do usuário
            
        Returns:
            Documento ou None se não encontrado/sem permissão
        """
        return db.query(Document).filter(
            Document.id == document_id,
            Document.user_id == user_id
        ).first()
    
    def get_documents_by_conversation(
        self,
        db: Session,
        conversation_id: int,
        user_id: int
    ) -> List[Document]:
        """
        Lista documentos de uma conversa específica
        
        Args:
            db: Sessão do banco de dados
            conversation_id: ID da conversa
            user_id: ID do usuário (para verificação de ownership)
            
        Returns:
            Lista de documentos
            
        Raises:
            HTTPException: Se conversa não pertencer ao usuário
        """
        # Verificar ownership da conversa
        conversation = db.query(Conversation).filter(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id
        ).first()
        
        if not conversation:
            raise HTTPException(
                status_code=404,
                detail="Conversa não encontrada ou você não tem permissão"
            )
        
        # Buscar documentos
        documents = db.query(Document).filter(
            Document.conversation_id == conversation_id,
            Document.user_id == user_id
        ).order_by(Document.created_at.desc()).all()
        
        return documents
    
    def get_presigned_url(
        self,
        db: Session,
        document_id: int,
        user_id: int,
        expiration: int = 3600
    ) -> str:
        """
        Gera URL pré-assinada para download do documento
        
        Args:
            db: Sessão do banco de dados
            document_id: ID do documento
            user_id: ID do usuário
            expiration: Tempo de validade em segundos (padrão: 1 hora)
            
        Returns:
            URL pré-assinada
            
        Raises:
            HTTPException: Se documento não existir ou não pertencer ao usuário
        """
        document = self.get_document_by_id(db, document_id, user_id)
        
        if not document:
            raise HTTPException(
                status_code=404,
                detail="Documento não encontrado ou você não tem permissão"
            )
        
        url = s3_service.generate_presigned_url(
            s3_key=document.s3_key,
            expiration=expiration
        )
        
        if not url:
            raise HTTPException(
                status_code=500,
                detail="Erro ao gerar URL de download"
            )
        
        return url
    
    def delete_document(
        self,
        db: Session,
        document_id: int,
        user_id: int
    ) -> bool:
        """
        Remove documento do banco e S3
        
        Args:
            db: Sessão do banco de dados
            document_id: ID do documento
            user_id: ID do usuário
            
        Returns:
            True se removido com sucesso
            
        Raises:
            HTTPException: Se documento não existir ou não pertencer ao usuário
        """
        document = self.get_document_by_id(db, document_id, user_id)
        
        if not document:
            raise HTTPException(
                status_code=404,
                detail="Documento não encontrado ou você não tem permissão"
            )
        
        # Remover do S3
        s3_service.delete_file(document.s3_key)
        
        # Remover índices FAISS se existirem
        if document.faiss_index_s3_key:
            s3_service.delete_file(document.faiss_index_s3_key)
        if document.metadata_s3_key:
            s3_service.delete_file(document.metadata_s3_key)
        
        # Remover do banco
        db.delete(document)
        db.commit()
        
        logger.info(f"Documento {document_id} removido")
        return True
    
    def update_document_status(
        self,
        db: Session,
        document_id: int,
        status_update: DocumentStatusUpdate
    ) -> Document:
        """
        Atualiza status do documento (usado pela indexação em background)
        
        Args:
            db: Sessão do banco de dados
            document_id: ID do documento
            status_update: Dados de atualização
            
        Returns:
            Documento atualizado
            
        Raises:
            HTTPException: Se documento não existir
        """
        document = db.query(Document).filter(Document.id == document_id).first()
        
        if not document:
            raise HTTPException(
                status_code=404,
                detail="Documento não encontrado"
            )
        
        # Atualizar campos
        document.status = status_update.status
        if status_update.faiss_index_s3_key:
            document.faiss_index_s3_key = status_update.faiss_index_s3_key
        if status_update.metadata_s3_key:
            document.metadata_s3_key = status_update.metadata_s3_key
        
        db.commit()
        db.refresh(document)
        
        logger.info(f"Status do documento {document_id} atualizado para {status_update.status}")
        return document


# Instância singleton
document_service = DocumentService()
