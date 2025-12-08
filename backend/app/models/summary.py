from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


# Tabela associativa para a relação many-to-many entre Summary e Document
summary_documents = Table(
    'summary_documents',
    Base.metadata,
    Column('summary_id', Integer, ForeignKey('summaries.id', ondelete='CASCADE'), primary_key=True),
    Column('document_id', Integer, ForeignKey('documents.id', ondelete='CASCADE'), primary_key=True)
)


class Summary(Base):
    """Modelo para a tabela de resumos"""
    __tablename__ = "summaries"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamentos
    conversation = relationship("Conversation", back_populates="summaries")
    documents = relationship("Document", secondary=summary_documents, back_populates="summaries")