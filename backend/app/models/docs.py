from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.models.summary import summary_documents


class Document(Base):
    """Modelo para documentos (PDFs) com suporte a RAG"""
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    filename = Column(String, nullable=False)
    s3_key = Column(String, nullable=False, unique=True)  # uploads/{user_id}/{doc_id}.pdf
    file_size = Column(Integer, nullable=False)  # Tamanho em bytes
    status = Column(String, nullable=False, default="pending")  # pending, processing, indexed, failed
    faiss_index_s3_key = Column(String, nullable=True)  # indices/{user_id}/{doc_id}/index.faiss
    metadata_s3_key = Column(String, nullable=True)  # metadata/{user_id}/{doc_id}/metadata.pkl (textos dos chunks)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relacionamentos
    user = relationship("User", back_populates="documents")
    conversation = relationship("Conversation", back_populates="documents")
    summaries = relationship("Summary", secondary=summary_documents, back_populates="documents")