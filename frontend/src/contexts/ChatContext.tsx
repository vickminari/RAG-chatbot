import React, { createContext, useContext, useState, type ReactNode, useCallback, useEffect } from 'react';
import { apiService } from '../services/api.service';
import type { Conversation, Message } from '../types/api';
import { useAuth } from './AuthContext';

interface LocalMessage extends Omit<Message, 'id' | 'created_at'> {
  id: number | string;
  created_at: string;
  isStreaming?: boolean;
  streamedContent?: string;
}

interface LocalConversation extends Omit<Conversation, 'id' | 'created_at'> {
  id: number | string;
  created_at: string;
  messages: LocalMessage[];
}

interface ChatContextType {
  conversations: LocalConversation[];
  currentConversationId: number | string | null;
  isLoading: boolean;
  loadConversations: () => Promise<void>;
  loadConversationMessages: (conversationId: number) => Promise<void>;
  setCurrentConversationId: (id: number | string | null) => void;
  deleteConversation: (id: number) => Promise<void>;
  sendMessage: (content: string, conversationId?: number) => Promise<number | null>;
  getCurrentConversation: () => LocalConversation | undefined;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<LocalConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number | string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  // Carregar conversas do backend
  const loadConversations = useCallback(async () => {
    if (!isAuthenticated) {
      setConversations([]);
      return;
    }

    try {
      const data = await apiService.getConversations();
      const conversationsWithMessages = data.map(conv => ({
        ...conv,
        messages: [] as LocalMessage[],
      }));
      setConversations(conversationsWithMessages);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
      // Não mostra erro se for 401 (não autenticado)
      if (error instanceof Error && !error.message.includes('401')) {
        console.error('Erro ao carregar conversas:', error);
      }
    }
  }, [isAuthenticated]);

  // Carregar conversas ao montar o componente
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Carregar mensagens de uma conversa específica
  const loadConversationMessages = useCallback(async (conversationId: number) => {
    try {
      const conversationData = await apiService.getConversation(conversationId);
      
      setConversations(prev => prev.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            messages: conversationData.messages || [],
          };
        }
        return conv;
      }));
    } catch (error) {
      console.error('Erro ao carregar mensagens da conversa:', error);
      throw error;
    }
  }, []);

  // Criar nova conversa internamente
  const createConversationInternal = async (title: string): Promise<number | null> => {
    try {
      const newConversation = await apiService.createConversation(title);
      
      const localConversation: LocalConversation = {
        ...newConversation,
        messages: [],
      };
      
      setConversations(prev => [localConversation, ...prev]);
      setCurrentConversationId(newConversation.id);
      
      return newConversation.id;
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
      alert('Erro ao criar conversa. Tente novamente.');
      return null;
    }
  };

  // Deletar conversa
  const deleteConversation = useCallback(async (id: number) => {
    try {
      await apiService.deleteConversation(id);
      setConversations(prev => prev.filter(conv => conv.id !== id));
      
      if (currentConversationId === id) {
        setCurrentConversationId(null);
      }
    } catch (error) {
      console.error('Erro ao deletar conversa:', error);
      alert('Erro ao deletar conversa. Tente novamente.');
    }
  }, [currentConversationId]);

  // Simular digitação gradual da IA
  const streamText = useCallback((text: string, messageId: number | string, conversationId: number) => {
    const words = text.split(' ');
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < words.length) {
        const streamedContent = words.slice(0, currentIndex + 1).join(' ');
        
        setConversations(prev => prev.map(conv => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              messages: conv.messages.map(msg => {
                if (msg.id === messageId) {
                  return {
                    ...msg,
                    streamedContent,
                    isStreaming: true,
                  };
                }
                return msg;
              }),
            };
          }
          return conv;
        }));
        
        currentIndex++;
      } else {
        clearInterval(interval);
        
        // Finalizar streaming
        setConversations(prev => prev.map(conv => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              messages: conv.messages.map(msg => {
                if (msg.id === messageId) {
                  return {
                    ...msg,
                    isStreaming: false,
                    streamedContent: undefined,
                  };
                }
                return msg;
              }),
            };
          }
          return conv;
        }));
      }
    }, 50); // 50ms entre cada palavra
  }, []);

  // Enviar mensagem (cria conversa automaticamente se não existir)
  const sendMessage = useCallback(async (
    content: string,
    conversationId?: number
  ): Promise<number | null> => {
    let activeConversationId = conversationId;
    let isNewConversation = false;
    
    try {
      setIsLoading(true);
      
      // Se não há conversationId, criar nova conversa
      if (!activeConversationId) {
        const title = content.slice(0, 15);
        const newConvId = await createConversationInternal(title);
        if (!newConvId) {
          return null;
        }
        activeConversationId = newConvId;
        isNewConversation = true;
      }

      // Adicionar mensagem do usuário imediatamente
      const tempUserMessage: LocalMessage = {
        id: `temp-${Date.now()}`,
        conversation_id: activeConversationId,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
      };

      setConversations(prev => prev.map(conv => {
        if (conv.id === activeConversationId) {
          return {
            ...conv,
            messages: [...conv.messages, tempUserMessage],
          };
        }
        return conv;
      }));

      // Adicionar indicador de loading para resposta da IA
      const tempAiMessage: LocalMessage = {
        id: `temp-ai-${Date.now()}`,
        conversation_id: activeConversationId,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString(),
        isStreaming: false,
      };

      setConversations(prev => prev.map(conv => {
        if (conv.id === activeConversationId) {
          return {
            ...conv,
            messages: [...conv.messages, tempAiMessage],
          };
        }
        return conv;
      }));

      // Se for nova conversa, retornar ID imediatamente e enviar mensagem em background
      if (isNewConversation) {
        // Enviar mensagem em background
        (async () => {
          try {
            const response = await apiService.sendMessage(activeConversationId!, content);

            // Remover mensagens temporárias e adicionar as reais
            setConversations(prev => prev.map(conv => {
              if (conv.id === activeConversationId) {
                const filteredMessages = conv.messages.filter(
                  msg => !msg.id.toString().startsWith('temp')
                );
                
                return {
                  ...conv,
                  messages: [
                    ...filteredMessages,
                    {
                      ...response.user_message,
                      created_at: response.user_message.created_at,
                    },
                    {
                      ...response.assistant_message,
                      created_at: response.assistant_message.created_at,
                      isStreaming: true,
                      streamedContent: '',
                    },
                  ],
                };
              }
              return conv;
            }));

            // Iniciar animação de streaming
            streamText(response.assistant_message.content, response.assistant_message.id, activeConversationId!);
          } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            alert('Erro ao enviar mensagem. Tente novamente.');
            
            // Remover mensagens temporárias em caso de erro
            setConversations(prev => prev.map(conv => {
              if (conv.id === activeConversationId) {
                return {
                  ...conv,
                  messages: conv.messages.filter(msg => !msg.id.toString().startsWith('temp')),
                };
              }
              return conv;
            }));
          } finally {
            setIsLoading(false);
          }
        })();
        
        return activeConversationId;
      }

      // Se não for nova conversa, aguardar resposta normalmente
      const response = await apiService.sendMessage(activeConversationId, content);

      // Remover mensagens temporárias e adicionar as reais
      setConversations(prev => prev.map(conv => {
        if (conv.id === activeConversationId) {
          const filteredMessages = conv.messages.filter(
            msg => !msg.id.toString().startsWith('temp')
          );
          
          return {
            ...conv,
            messages: [
              ...filteredMessages,
              {
                ...response.user_message,
                created_at: response.user_message.created_at,
              },
              {
                ...response.assistant_message,
                created_at: response.assistant_message.created_at,
                isStreaming: true,
                streamedContent: '',
              },
            ],
          };
        }
        return conv;
      }));

      // Iniciar animação de streaming
      streamText(response.assistant_message.content, response.assistant_message.id, activeConversationId);
      
      return activeConversationId;

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem. Tente novamente.');
      
      // Remover mensagens temporárias em caso de erro
      if (activeConversationId) {
        setConversations(prev => prev.map(conv => {
          if (conv.id === activeConversationId) {
            return {
              ...conv,
              messages: conv.messages.filter(msg => !msg.id.toString().startsWith('temp')),
            };
          }
          return conv;
        }));
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [streamText]);

  // Obter conversa atual
  const getCurrentConversation = useCallback(() => {
    return conversations.find(conv => conv.id === currentConversationId);
  }, [conversations, currentConversationId]);

  return (
    <ChatContext.Provider value={{
      conversations,
      currentConversationId,
      isLoading,
      loadConversations,
      loadConversationMessages,
      setCurrentConversationId,
      deleteConversation,
      sendMessage,
      getCurrentConversation,
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
};
