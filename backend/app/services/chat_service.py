from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status
from typing import List, Optional
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.conversation import ConversationCreate
from app.services.langchain_service import langchain_service


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
        Busca uma conversa específica por ID.
        
        Args:
            db: Sessão do banco de dados
            conversation_id: ID da conversa
            user_id: ID do usuário (para verificar ownership)
            
        Returns:
            Conversa encontrada
            
        Raises:
            HTTPException: Se conversa não existir ou não pertencer ao usuário
        """
        conversation = db.query(Conversation)\
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
        Deleta uma conversa (e todas suas mensagens em cascata).
        
        Args:
            db: Sessão do banco de dados
            conversation_id: ID da conversa
            user_id: ID do usuário (para verificar ownership)
            
        Raises:
            HTTPException: Se conversa não existir ou não pertencer ao usuário
        """
        conversation = self.get_conversation_by_id(db, conversation_id, user_id)
        
        try:
            db.delete(conversation)
            db.commit()
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
        message_content: str
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
            
        Returns:
            Tupla (mensagem_do_usuario, mensagem_do_assistente)
            
        Raises:
            HTTPException: Se limite de tokens for excedido ou erro no processamento
        """
        # 1. Valida conversa
        conversation = self.get_conversation_by_id(db, conversation_id, user_id)
        
        # 2. Verifica limite de tokens
        can_send, estimated_tokens = langchain_service.check_token_limit(
            conversation.qtd_tokens, 
            message_content
        )
        
        if not can_send:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Limite de tokens atingido para esta conversa. "
                       f"Tokens usados: {conversation.qtd_tokens}/{langchain_service.max_tokens}. "
                       f"Crie uma nova conversa para continuar."
            )
        
        # 3. Busca histórico
        message_history = self.get_conversation_messages(db, conversation_id)
        
        try:
            # 4. Processa com LangChain
            assistant_response, tokens_used = await langchain_service.generate_response(
                message_history,
                message_content
            )
            
            # 5. Salva mensagens
            user_message = self._save_message(
                db, 
                conversation_id, 
                "user", 
                message_content
            )
            
            assistant_message = self._save_message(
                db, 
                conversation_id, 
                "assistant", 
                assistant_response
            )
            
            # 6. Atualiza tokens
            self._update_conversation_tokens(db, conversation, tokens_used)
            
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
