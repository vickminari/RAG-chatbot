import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../contexts/ChatContext';
import { useTheme } from '../contexts/ThemeContext';
import { MessageList } from '../components/MessageList';
import { MessageInput } from '../components/MessageInput';

export const ChatPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { 
    conversations, 
    sendMessage, 
    setCurrentConversationId,
    loadConversationMessages,
    isLoading 
  } = useChat();
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const conversationId = id ? parseInt(id) : null;
  const conversation = conversations.find(conv => conv.id === conversationId);

  useEffect(() => {
    if (!id) {
      // Sem ID = nova conversa, aguardando primeira mensagem
      setCurrentConversationId(null);
      return;
    }

    const convId = parseInt(id);
    setCurrentConversationId(convId);

    // Carregar mensagens se a conversa existir mas não tiver mensagens carregadas
    const loadMessages = async () => {
      const existingConv = conversations.find(c => c.id === convId);
      if (existingConv && (!existingConv.messages || existingConv.messages.length === 0)) {
        try {
          setIsLoadingMessages(true);
          await loadConversationMessages(convId);
        } catch (error) {
          console.error('Erro ao carregar mensagens:', error);
        } finally {
          setIsLoadingMessages(false);
        }
      }
    };

    loadMessages();
  }, [id, navigate, setCurrentConversationId, loadConversationMessages, conversations]);

  const handleSendMessage = async (content: string) => {
    // sendMessage agora cria a conversa automaticamente se não existir
    const newConvId = await sendMessage(content, conversationId || undefined);
    
    // Se foi criada uma nova conversa, navegar para ela
    if (!conversationId && newConvId) {
      navigate(`/chat/${newConvId}`, { replace: true });
    }
  };

  if (isLoadingMessages) {
    return (
      <div className={`flex-1 flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className={`text-2xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Carregando mensagens...</h2>
        </div>
      </div>
    );
  }

  if (conversationId && !conversation && !isLoading) {
    return (
      <div className={`flex-1 flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className={`text-2xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Conversa não encontrada</h2>
          <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Esta conversa pode ter sido excluída</p>
          <button
            onClick={() => navigate('/')}
            className={`px-6 py-2 rounded-lg text-white ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`}
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col h-full ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <MessageList messages={conversation?.messages || []} />
      <MessageInput 
        onSend={handleSendMessage} 
        disabled={isLoading}
      />
    </div>
  );
};
