from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from app.core.config import settings
from typing import List, Tuple
from app.models.message import Message
import tiktoken


class LangChainService:
    """
    Service central para integração com Google Gemini via LangChain.
    
    Responsável por:
    - Configurar e gerenciar o modelo Gemini
    - Formatar histórico de mensagens
    - Enviar prompts e receber respostas
    - Calcular tokens utilizados
    """
    
    def __init__(self):
        """Inicializa o modelo Gemini"""
        self.model = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash-lite",
            google_api_key=settings.google_api_key,
            temperature=0.5,
            max_output_tokens=2048,  # Limita o tamanho da resposta (opcional)
        )
        self.max_tokens = settings.qtd_tokens_default
        
        # System prompt que define o comportamento do chatbot
        self.system_prompt = """Você é um assistente virtual inteligente e prestativo. 
            Suas características:
            - Responda de forma clara, concisa e educada
            - Use linguagem natural e acessível
            - Se não souber algo, admita honestamente
            - Mantenha o contexto da conversa
            - Seja proativo em ajudar o usuário
            - Responda sempre em até 500 palavras

            Sempre priorize a qualidade e utilidade das suas respostas."""
        
        # Inicializa o tokenizer tiktoken
        # Gemini usa um encoding similar ao GPT-4, usamos cl100k_base
        try:
            self.tokenizer = tiktoken.get_encoding("cl100k_base")
        except Exception:
            # Fallback caso não consiga carregar
            self.tokenizer = None
    
    def _format_message_history(self, messages: List[Message], include_system: bool = True) -> List:
        """
        Formata o histórico de mensagens do banco para o formato do LangChain.
        
        Args:
            messages: Lista de mensagens do banco de dados
            include_system: Se True, inclui o system prompt como primeira mensagem
            
        Returns:
            Lista de mensagens formatadas para o LangChain (iniciando com SystemMessage)
        """
        formatted_messages = []
        
        # Adiciona o system prompt como primeira mensagem (invisível para o usuário)
        if include_system:
            formatted_messages.append(SystemMessage(content=self.system_prompt))
        
        # Adiciona o histórico de mensagens
        for msg in messages:
            if msg.role == "user":
                formatted_messages.append(HumanMessage(content=msg.content))
            elif msg.role == "assistant":
                formatted_messages.append(AIMessage(content=msg.content))
        
        return formatted_messages
    
    def _estimate_tokens(self, text: str) -> int:
        """
        Estima a quantidade de tokens em um texto usando tiktoken.
        
        Utiliza o encoding cl100k_base (similar ao usado por GPT-4 e Gemini).
        Se tiktoken não estiver disponível, faz fallback para estimativa simples.
        
        Args:
            text: Texto para estimar tokens
            
        Returns:
            Número estimado de tokens
        """
        if self.tokenizer:
            try:
                return len(self.tokenizer.encode(text))
            except Exception:
                # Fallback em caso de erro
                pass
        
        # Fallback: aproximação simples (~4 caracteres por token)
        return len(text) // 4
    
    def _calculate_conversation_tokens(self, messages: List[Message]) -> int:
        """
        Calcula o total de tokens já utilizados em uma conversa.
        
        Args:
            messages: Lista de mensagens do histórico
            
        Returns:
            Total de tokens utilizados
        """
        total_tokens = 0
        for msg in messages:
            total_tokens += self._estimate_tokens(msg.content)
        return total_tokens
    
    def check_token_limit(self, current_tokens: int, new_message: str) -> Tuple[bool, int]:
        """
        Verifica se uma nova mensagem ultrapassaria o limite de tokens.
        
        Args:
            current_tokens: Tokens já utilizados na conversa
            new_message: Nova mensagem a ser enviada
            
        Returns:
            Tupla (pode_enviar: bool, tokens_estimados_nova_mensagem: int)
        """
        estimated_new_tokens = self._estimate_tokens(new_message)
        
        # Estima também a resposta do modelo (aproximadamente o mesmo tamanho)
        estimated_response_tokens = estimated_new_tokens
        
        total_estimated = current_tokens + estimated_new_tokens + estimated_response_tokens
        
        can_send = total_estimated <= self.max_tokens
        
        return can_send, estimated_new_tokens
    
    async def generate_response(
        self, 
        message_history: List[Message], 
        new_message: str
    ) -> Tuple[str, int]:
        """
        Gera uma resposta do Gemini baseada no histórico e nova mensagem.
        
        Args:
            message_history: Histórico de mensagens da conversa
            new_message: Nova mensagem do usuário
            
        Returns:
            Tupla (resposta_do_modelo: str, tokens_utilizados_nesta_interacao: int)
        """
        # Formata o histórico
        formatted_history = self._format_message_history(message_history)
        
        # Adiciona a nova mensagem
        formatted_history.append(HumanMessage(content=new_message))
        
        # Invoca o modelo (compatível com langchain-google-genai 3.0.2)
        response = await self.model.ainvoke(formatted_history)
        
        # Extrai o conteúdo da resposta (pode ser str ou list)
        response_content = response.content if isinstance(response.content, str) else str(response.content)
        
        # Calcula tokens desta interação (mensagem do usuário + resposta)
        tokens_used = (
            self._estimate_tokens(new_message) + 
            self._estimate_tokens(response_content)
        )
        
        return response_content, tokens_used
    
    def generate_conversation_title(self, first_message: str) -> str:
        """
        Gera um título para a conversa baseado na primeira mensagem.
        
        Args:
            first_message: Primeira mensagem do usuário
            
        Returns:
            Título gerado (limitado a 50 caracteres)
        """
        # Usa os primeiros 50 caracteres da mensagem como título
        # Você pode aprimorar isso usando o próprio LLM para gerar um título
        title = first_message[:50]
        if len(first_message) > 50:
            title += "..."
        return title


# Instância única do serviço (Singleton)
langchain_service = LangChainService()
