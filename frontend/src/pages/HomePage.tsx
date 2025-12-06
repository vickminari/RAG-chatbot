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
  const { conversations, loadConversations, deleteConversation, isLoading } = useChat();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [conversationToDelete, setConversationToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteClick = (e: React.MouseEvent, conversationId: number) => {
    e.stopPropagation();
    setConversationToDelete(conversationId);
  };

  const confirmDelete = async () => {
    if (!conversationToDelete) return;
    
    try {
      setIsDeleting(true);
      await deleteConversation(conversationToDelete);
      setConversationToDelete(null);
      await loadConversations();
    } catch (error) {
      console.error('Erro ao deletar conversa:', error);
      alert('Erro ao deletar conversa. Tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setConversationToDelete(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // Normalizar para o início do dia para cálculo correto
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diff = nowOnly.getTime() - dateOnly.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Hoje';
    if (days === 1) return 'Ontem';
    if (days > 1 && days < 7) return `${days} dias atrás`;
    if (days >= 7 && days < 30) {
      const weeks = Math.floor(days / 7);
      return weeks === 1 ? '1 semana atrás' : `${weeks} semanas atrás`;
    }
    if (days >= 30 && days < 365) {
      const months = Math.floor(days / 30);
      return months === 1 ? '1 mês atrás' : `${months} meses atrás`;
    }
    
    // Para datas antigas, mostrar data completa
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
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
                    className={`p-6 rounded-xl border transition-all text-left group hover:shadow-lg relative
                      ${isDark 
                        ? 'bg-gray-800 border-gray-700 hover:border-blue-500 hover:bg-gray-750' 
                        : 'bg-white border-gray-200 hover:border-blue-500 hover:shadow-xl'
                      }`}
                  >
                    {/* Botão de Excluir */}
                    <button
                      onClick={(e) => handleDeleteClick(e, conversation.id as number)}
                      className={`absolute top-4 right-4 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity
                        ${isDark 
                          ? 'hover:bg-red-500/20 text-red-400 hover:text-red-300' 
                          : 'hover:bg-red-500/10 text-red-500 hover:text-red-600'
                        }`}
                      title="Excluir conversa"
                    >
                      🗑️
                    </button>

                    <div className="flex items-start gap-4 mb-4">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                        isDark ? 'bg-gray-700' : 'bg-gray-100'
                      }`}>
                        📄
                      </div>
                      <div className="flex-1 min-w-0 pr-8">
                        <h3 className={`text-lg font-semibold mb-1 line-clamp-2 group-hover:text-blue-500 transition-colors
                          ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {conversation.title}
                        </h3>
                        <div className={`flex items-center gap-2 text-xs ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          <span>🕐</span>
                          <span>{formatDate(conversation.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`flex items-center justify-between pt-4 border-t ${
                      isDark ? 'border-gray-700' : 'border-gray-100'
                    }`}>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Abrir conversa
                      </span>
                      <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {conversationToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`max-w-md w-full mx-4 p-6 rounded-2xl shadow-2xl ${
            isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'
          }`}>
            <h3 className={`text-xl font-bold mb-2 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Excluir Conversa?
            </h3>
            <p className={`text-sm mb-6 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Esta ação não pode ser desfeita. Todas as mensagens e documentos desta conversa serão permanentemente excluídos.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                disabled={isDeleting}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  isDark
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2 px-4 rounded-lg font-medium bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

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
