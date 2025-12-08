from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status
from typing import List, Optional
from io import BytesIO
from pypdf import PdfReader
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.summary import Summary
from app.schemas.conversation import ConversationCreate
from app.services.langchain_service import langchain_service
from app.services.document_service import document_service
from app.services.s3_service import s3_service
from app.services.rag_service import rag_service
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class ChatService:
    """
    Service para gerenciar conversas e mensagens.
    
    Responsável por:
    - CRUD de conversas
    - CRUD de mensagens
    - Integração com LangChainService para processar mensagens
    - Controle de limite de tokens
    """
    
    def create_conversation(
        self, 
        db: Session, 
        user_id: int, 
        conversation_data: ConversationCreate
    ) -> Conversation:
        """
        Cria uma nova conversa para um usuário.
        
        Args:
            db: Sessão do banco de dados
            user_id: ID do usuário
            conversation_data: Dados da conversa (título)
            
        Returns:
            Conversa criada
        """
        try:
            new_conversation = Conversation(
                user_id=user_id,
                title=conversation_data.title,
                qtd_tokens=0
            )
            
            db.add(new_conversation)
            db.commit()
            db.refresh(new_conversation)
            
            return new_conversation
        
        except SQLAlchemyError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erro ao criar conversa: {str(e)}"
            )
    
    def get_user_conversations(
        self, 
        db: Session, 
        user_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[Conversation]:
        """
        Lista todas as conversas de um usuário.
        
        Args:
            db: Sessão do banco de dados
            user_id: ID do usuário
            skip: Quantidade de registros para pular (paginação)
            limit: Limite de registros a retornar
            
        Returns:
            Lista de conversas do usuário
        """
        return db.query(Conversation)\
            .filter(Conversation.user_id == user_id)\
            .order_by(Conversation.created_at.desc())\
            .offset(skip)\
            .limit(limit)\
            .all()
    
    def get_conversation_by_id(
        self, 
        db: Session, 
        conversation_id: int,
        user_id: int
    ) -> Conversation:
        """
        Busca uma conversa específica por ID com eager loading dos relacionamentos.
        
        Args:
            db: Sessão do banco de dados
            conversation_id: ID da conversa
            user_id: ID do usuário (para verificar ownership)
            
        Returns:
            Conversa encontrada com summaries e documents carregados
            
        Raises:
            HTTPException: Se conversa não existir ou não pertencer ao usuário
        """
        conversation = db.query(Conversation)\
            .options(
                joinedload(Conversation.summaries).joinedload(Summary.documents)
            )\
            .filter(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id
            )\
            .first()
        
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversa não encontrada ou você não tem permissão para acessá-la"
            )
        
        return conversation
    
    def delete_conversation(
        self, 
        db: Session, 
        conversation_id: int,
        user_id: int
    ) -> None:
        """
        Deleta uma conversa, todos os documentos associados (do banco e S3) e mensagens.
        
        Args:
            db: Sessão do banco de dados
            conversation_id: ID da conversa
            user_id: ID do usuário (para verificar ownership)
            
        Raises:
            HTTPException: Se conversa não existir ou não pertencer ao usuário
        """
        conversation = self.get_conversation_by_id(db, conversation_id, user_id)
        
        try:
            # 1. Deletar todos os documentos da conversa (banco + S3)
            documents = conversation.documents
            for document in documents:
                try:
                    # Remover arquivo original do S3
                    if document.s3_key:
                        s3_service.delete_file(document.s3_key)
                        logger.info(f"Arquivo S3 {document.s3_key} deletado")
                    
                    # Remover índices FAISS do S3
                    if document.faiss_index_s3_key:
                        s3_service.delete_file(document.faiss_index_s3_key)
                        logger.info(f"Índice FAISS {document.faiss_index_s3_key} deletado")
                    
                    if document.metadata_s3_key:
                        s3_service.delete_file(document.metadata_s3_key)
                        logger.info(f"Metadata {document.metadata_s3_key} deletado")
                    
                except Exception as e:
                    # Log do erro mas continua deletando os outros documentos
                    logger.error(f"Erro ao deletar arquivos do documento {document.id} do S3: {e}")
            
            # 2. Deletar a conversa (cascata vai deletar messages, documents e summaries do banco)
            db.delete(conversation)
            db.commit()
            
            logger.info(f"Conversa {conversation_id} e todos seus arquivos deletados com sucesso")
            
        except SQLAlchemyError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erro ao deletar conversa: {str(e)}"
            )
    
    def get_conversation_messages(
        self, 
        db: Session, 
        conversation_id: int
    ) -> List[Message]:
        """
        Busca todas as mensagens de uma conversa.
        
        Args:
            db: Sessão do banco de dados
            conversation_id: ID da conversa
            
        Returns:
            Lista de mensagens ordenadas por data de criação
        """
        return db.query(Message)\
            .filter(Message.conversation_id == conversation_id)\
            .order_by(Message.created_at.asc())\
            .all()
    
    def _save_message(
        self, 
        db: Session, 
        conversation_id: int, 
        role: str, 
        content: str
    ) -> Message:
        """
        Salva uma mensagem no banco de dados.
        
        Args:
            db: Sessão do banco de dados
            conversation_id: ID da conversa
            role: Papel da mensagem ("user" ou "assistant")
            content: Conteúdo da mensagem
            
        Returns:
            Mensagem salva
        """
        message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content
        )
        
        db.add(message)
        db.flush()  # Flush para obter o ID, mas não commita ainda
        
        return message
    
    def _update_conversation_tokens(
        self, 
        db: Session, 
        conversation: Conversation, 
        tokens_used: int
    ) -> None:
        """
        Atualiza a quantidade de tokens utilizados em uma conversa.
        
        Args:
            db: Sessão do banco de dados
            conversation: Conversa a ser atualizada
            tokens_used: Tokens utilizados nesta interação
        """
        conversation.qtd_tokens += tokens_used
        db.flush()
    
    async def process_chat_message(
        self, 
        db: Session,
        conversation_id: int,
        user_id: int,
        message_content: str,
        use_rag: bool = False,
        is_summary: bool = False,
        document_ids: Optional[List[int]] = None
    ) -> tuple[Message, Message]:
        """
        Processa uma mensagem de chat completa.
        
        Este método:
        1. Valida se a conversa existe e pertence ao usuário
        2. Verifica se há tokens disponíveis
        3. Busca o histórico de mensagens
        4. Envia para o LangChain processar
        5. Salva ambas as mensagens (usuário e assistente)
        6. Atualiza a contagem de tokens
        
        Args:
            db: Sessão do banco de dados
            conversation_id: ID da conversa
            user_id: ID do usuário
            message_content: Conteúdo da mensagem do usuário
            use_rag: Se True, usa RAG com índices FAISS
            is_summary: Se True, gera resumo ao invés de responder pergunta
            document_ids: Lista de IDs de documentos para contexto
            
        Returns:
            Tupla (mensagem_do_usuario, mensagem_do_assistente)
            
        Raises:
            HTTPException: Se limite de tokens for excedido ou erro no processamento
        """
        # 1. Valida conversa
        conversation = self.get_conversation_by_id(db, conversation_id, user_id)
        
        # Extração de contexto de documentos
        context = ""

        if use_rag and document_ids:
            # --- LÓGICA RAG: Usa índices FAISS ---
            logger.info(f"Modo RAG ativado para {len(document_ids)} documento(s)")
            
            for doc_id in document_ids:
                try:
                    # Busca documento
                    doc = document_service.get_document_by_id(db, doc_id, user_id)
                    
                    if not doc:
                        logger.warning(f"Documento {doc_id} não encontrado ou sem permissão")
                        continue
                    
                    # Verifica se documento está indexado
                    if doc.status != "indexed":
                        logger.warning(
                            f"Documento {doc_id} não está indexado (status: {doc.status}). "
                            "Pulando..."
                        )
                        continue
                    
                    # Verifica se tem índices FAISS
                    if not doc.faiss_index_s3_key or not doc.metadata_s3_key:
                        logger.warning(f"Documento {doc_id} sem índices FAISS. Pulando...")
                        continue
                    
                    # Recupera chunks relevantes usando RAG
                    if is_summary:
                        # Para resumo: usa query otimizada e mais chunks
                        logger.info(f"Recuperando chunks para RESUMO do documento {doc_id}")
                        chunks = await rag_service.generate_document_summary_chunks(
                            faiss_index_s3_key=doc.faiss_index_s3_key,
                            metadata_s3_key=doc.metadata_s3_key,
                            total_pages=None  # Pode ser calculado se tivermos essa info
                        )
                    else:
                        # Para pergunta: usa a query do usuário
                        logger.info(f"Recuperando chunks para PERGUNTA do documento {doc_id}")
                        chunks = await rag_service.retrieve_relevant_chunks(
                            faiss_index_s3_key=doc.faiss_index_s3_key,
                            metadata_s3_key=doc.metadata_s3_key,
                            query=message_content,
                            k=6  # Padrão: 6 chunks por documento
                        )
                    
                    # Formata contexto com os chunks
                    if chunks:
                        context += f"\n--- Documento: {doc.filename} ---\n"
                        for i, chunk in enumerate(chunks, 1):
                            page = chunk.metadata.get('page', 'N/A')
                            context += f"\n[Trecho {i} - Página {page}]\n{chunk.page_content}\n"
                        
                        logger.info(f"Recuperados {len(chunks)} chunks do documento {doc_id}")
                    else:
                        logger.warning(f"Nenhum chunk recuperado do documento {doc_id}")
                
                except Exception as e:
                    logger.error(f"Erro ao processar documento {doc_id} com RAG: {e}", exc_info=True)
                    # Continua processando os outros documentos

        elif document_ids:
            # --- FALLBACK: Lógica Direct Context (extração bruta) ---
            logger.info(f"Modo Direct Context para {len(document_ids)} documento(s)")
            logger.warning("RAG não está ativado. Usando extração direta de texto (menos eficiente)")
            
            # Baixa arquivos e extrai texto bruto (como já fazemos hoje)
            for doc_id in document_ids:
                try:
                    # Busca documento
                    doc = document_service.get_document_by_id(db, doc_id, user_id)
                    if doc is not None and getattr(doc, "s3_key", None) is not None:
                        # Baixa do S3
                        file_content = s3_service.download_file(getattr(doc, "s3_key"))
                        if file_content:
                            # Extrai texto com pypdf
                            pdf = PdfReader(BytesIO(file_content))
                            doc_text = ""
                            for page in pdf.pages:
                                doc_text += page.extract_text() + "\n"
                            
                            context += f"\n--- Documento: {doc.filename} ---\n{doc_text}\n"
                except Exception as e:
                    logger.error(f"Erro ao processar documento {doc_id}: {e}")

        # --- PONTO DE CONVERGÊNCIA ---
        # A partir daqui, o código é REAPROVEITADO para ambos os casos!

        full_message_content = message_content
        if context:
            if is_summary:
                # Prompt para geração de resumo
                full_message_content = f"""Você é um assistente especializado em resumir documentos.

Com base APENAS no contexto fornecido dos documentos abaixo, crie um resumo estruturado e completo.

Se os documentos fornecidos forem relacionados entre si:
- Identifique o tema principal comum, destacando conexões entre eles
- Liste os principais tópicos abordados em conjunto
- Destaque conceitos-chave e definições importantes
- Organize em bullet points de forma coesa

Se os documentos fornecidos NÃO forem relacionados entre si:
- Informe explicitamente que os documentos não são relacionados
- Resuma cada documento separadamente
- Mantenha a organização clara entre os diferentes documentos

IMPORTANTE: 
- Use APENAS as informações presentes no contexto
- Seja conciso mas completo
- Responda em português

CONTEXTO DOS DOCUMENTOS:
{context}

Gere o resumo agora."""
            else:
                # Prompt para responder perguntas
                full_message_content = f"""
                - Use o seguinte contexto extraído de documentos para responder à pergunta do usuário. 
                    CONTEXTO DOS DOCUMENTOS:
                    {context}

                - Se a resposta não estiver no contexto, tente responder com seu conhecimento geral, mas avise que a informação não consta nos documentos.
                - Nunca invente informações.
                - Caso não seja requisitado, não mencione de qual parte do contexto a informação foi retirada.

                    PERGUNTA DO USUÁRIO:
                    {message_content}"""

        # 2. Verifica limite de tokens (incluindo contexto)
        # `conversation.qtd_tokens` pode ser um Column[int] dependendo do ORM typing;
        # convertemos explicitamente para int para satisfazer verificadores de tipo
        # e garantir um valor numérico seguro.
        current_tokens = int(getattr(conversation, "qtd_tokens", 0) or 0)
        can_send, estimated_tokens = langchain_service.check_token_limit(
            current_tokens,
            full_message_content
        )
        
        if not can_send:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Limite de tokens atingido para esta conversa (incluindo documentos selecionados). "
                       f"Tokens usados: {current_tokens}/{langchain_service.max_tokens}. "
                       f"Crie uma nova conversa ou selecione menos documentos."
            )
        
        # Salva mensagem do usuário (apenas a pergunta original)
        user_message = self._save_message(
            db, 
            conversation_id, 
            "user", 
            message_content
        )
        
        # 3. Busca histórico
        message_history = self.get_conversation_messages(db, conversation_id)
        
        try:
            # 4. Processa com LangChain
            assistant_response, tokens_used = await langchain_service.generate_response(
                message_history,
                full_message_content
            )
            
            # 5. Salva mensagem do assistente
            assistant_message = self._save_message(
                db, 
                conversation_id, 
                "assistant", 
                assistant_response
            )
            
            # 6. Atualiza tokens
            self._update_conversation_tokens(db, conversation, tokens_used)
            
            # Se for resumo, salva na tabela de resumos também
            if is_summary:
                # Título simplificado
                summary_title = f"Resumo gerado em {datetime.now().strftime('%d/%m/%Y %H:%M')}"
                
                new_summary = Summary(
                    title=summary_title,
                    content=assistant_response,
                    conversation_id=conversation_id
                )
                
                # Associa documentos
                if document_ids:
                    for doc_id in document_ids:
                        doc = document_service.get_document_by_id(db, doc_id, user_id)
                        if doc:
                            new_summary.documents.append(doc)
                
                db.add(new_summary)

            # Commit final
            db.commit()
            db.refresh(user_message)
            db.refresh(assistant_message)
            
            return user_message, assistant_message
        
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erro ao processar mensagem: {str(e)}"
            )


# Instância única do serviço
chat_service = ChatService()
