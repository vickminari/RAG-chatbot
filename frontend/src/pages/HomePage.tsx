import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useChat } from '../contexts/ChatContext';
import { UploadDocumentModal } from '../components/UploadDocumentModal';
import { apiService } from '../services/api.service';
import { extractErrorMessage } from '../utils/errorHandler';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { conversations, loadConversations, isLoading } = useChat();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleUploadDocuments = async (files: File[]) => {
    try {
      setUploadError('');
      
      // Criar conversa com o nome do primeiro arquivo
      const firstFileName = files[0].name.replace('.pdf', '');
      const conversation = await apiService.createConversation(firstFileName);

      // Upload de cada arquivo
      for (const file of files) {
        await apiService.uploadDocument(conversation.id, file);
      }

      // Recarregar conversas e navegar para a nova conversa
      await loadConversations();
      navigate(`/chat/${conversation.id}`);
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      setUploadError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const handleConversationClick = (conversationId: number) => {
    navigate(`/chat/${conversationId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Hoje';
    if (days === 1) return 'Ontem';
    if (days < 7) return `${days} dias atrás`;
    if (days < 30) return `${Math.floor(days / 7)} semanas atrás`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex-shrink-0 px-8 py-6 border-b border-gray-700">
        <div className="max-w-7xl mx-auto">
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Suas Conversas
          </h1>
          <p className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Crie novas conversas com documentos ou continue conversas existentes
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-7xl mx-auto">
          {/* New Conversation Card */}
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className={`w-full p-8 rounded-2xl border-2 border-dashed transition-all mb-6 group
              ${isDark 
                ? 'border-gray-700 hover:border-blue-500 bg-gray-800/50 hover:bg-gray-800' 
                : 'border-gray-300 hover:border-blue-500 bg-white hover:bg-gray-50'
              }`}
          >
            <div className="flex flex-col items-center justify-center">
              <div className={`text-6xl mb-4 transition-transform group-hover:scale-110`}>
                ➕
              </div>
              <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Nova Conversa com Documentos
              </h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Faça upload de PDFs para criar uma conversa com IA
              </p>
            </div>
          </button>

          {/* Error Message */}
          {uploadError && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500 text-red-500 text-sm">
              {uploadError}
            </div>
          )}

          {/* Conversations List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="text-6xl mb-4 animate-pulse">⏳</div>
                <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Carregando conversas...
                </p>
              </div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">💬</div>
              <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Nenhuma conversa ainda
              </h3>
              <p className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Crie sua primeira conversa com documentos para começar
              </p>
            </div>
          ) : (
            <div>
              <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Conversas Recentes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => handleConversationClick(conversation.id as number)}
                    className={`p-6 rounded-xl border transition-all text-left group hover:shadow-lg
                      ${isDark 
                        ? 'bg-gray-800 border-gray-700 hover:border-blue-500 hover:bg-gray-750' 
                        : 'bg-white border-gray-200 hover:border-blue-500 hover:shadow-xl'
                      }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-3xl">📄</div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {formatDate(conversation.created_at)}
                      </span>
                    </div>
                    <h3 className={`text-lg font-semibold mb-2 line-clamp-2 group-hover:text-blue-500 transition-colors
                      ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {conversation.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                        💬 Clique para abrir
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setUploadError('');
        }}
        onUpload={handleUploadDocuments}
      />
    </div>
  );
};
