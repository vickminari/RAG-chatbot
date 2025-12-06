import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../contexts/ChatContext';
import { useTheme } from '../contexts/ThemeContext';
import { Header } from '../components/Header';
import { MessageList } from '../components/MessageList';
import { MessageInput } from '../components/MessageInput';
import { DocumentList } from '../components/DocumentList';
import { SummaryList } from '../components/SummaryList';
import { UploadDocumentModal } from '../components/UploadDocumentModal';
import { PDFViewerModal } from '../components/PDFViewerModal';
import { apiService } from '../services/api.service';

interface Document {
  id: number;
  filename: string;
  file_size: number;
  status: string;
  created_at: string;
}

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
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPDFViewerOpen, setIsPDFViewerOpen] = useState(false);
  const [selectedPDFId, setSelectedPDFId] = useState<number | null>(null);
  const [selectedPDFFilename, setSelectedPDFFilename] = useState<string>('');
  const [hasLoadedMessages, setHasLoadedMessages] = useState(false);
  const [useRag, setUseRag] = useState(true);
  const [leftWidth, setLeftWidth] = useState(320);
  const [rightWidth, setRightWidth] = useState(384);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  const conversationId = id ? parseInt(id) : null;
  const conversation = conversations.find(conv => conv.id === conversationId);

  useEffect(() => {
    if (!id) {
      // Sem ID = nova conversa, aguardando primeira mensagem
      setCurrentConversationId(null);
      setDocuments([]);
      setSelectedDocuments([]);
      setHasLoadedMessages(false);
      return;
    }

    const convId = parseInt(id);
    setCurrentConversationId(convId);

    // Carregar mensagens apenas uma vez
    const loadMessages = async () => {
      if (hasLoadedMessages) return;
      
      try {
        setIsLoadingMessages(true);
        setHasLoadedMessages(true);
        await loadConversationMessages(convId);
      } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    // Carregar documentos da conversa
    const loadDocuments = async () => {
      try {
        setIsLoadingDocuments(true);
        const docs = await apiService.getDocumentsByConversation(convId);
        // Garantir que docs é um array
        setDocuments(Array.isArray(docs) ? docs : []);
      } catch (error) {
        console.error('Erro ao carregar documentos:', error);
        setDocuments([]);
      } finally {
        setIsLoadingDocuments(false);
      }
    };

    loadMessages();
    loadDocuments();
  }, [id]);

  // Handlers para redimensionamento das colunas
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingLeft) {
        const newWidth = Math.max(200, Math.min(600, e.clientX));
        setLeftWidth(newWidth);
      }
      if (isDraggingRight) {
        const newWidth = Math.max(300, Math.min(800, window.innerWidth - e.clientX));
        setRightWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingLeft(false);
      setIsDraggingRight(false);
    };

    if (isDraggingLeft || isDraggingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDraggingLeft, isDraggingRight]);

  const handleSendMessage = async (content: string) => {
    // sendMessage agora cria a conversa automaticamente se não existir
    const newConvId = await sendMessage(
      content, 
      conversationId || undefined,
      useRag,
      selectedDocuments,
      false // isSummary
    );
    
    // Se foi criada uma nova conversa, navegar para ela
    if (!conversationId && newConvId) {
      navigate(`/chat/${newConvId}`, { replace: true });
    }
  };

  const handleSelectDocument = (documentId: number) => {
    setSelectedDocuments(prev => {
      if (prev.includes(documentId)) {
        return prev.filter(id => id !== documentId);
      }
      if (prev.length < 5) {
        return [...prev, documentId];
      }
      return prev;
    });
  };

  const handleGenerateSummary = async () => {
    if (selectedDocuments.length === 0) {
      alert('Selecione pelo menos um documento para gerar o resumo.');
      return;
    }

    setIsGeneratingSummary(true);
    try {
      await sendMessage(
        "Faça um resumo para mim destacando as coisas mais importantes desses documentos",
        conversationId || undefined,
        true, // useRag
        selectedDocuments,
        true // isSummary
      );
      // Recarregar a conversa para obter o novo resumo
      if (conversationId) {
        await loadConversationMessages(conversationId);
      }
    } catch (error) {
      console.error('Erro ao gerar resumo:', error);
    } finally {
      setIsGeneratingSummary(false);
    }
  };
  const handleUploadDocuments = async (files: File[]) => {
    if (!conversationId) return;
    
    try {
      // Upload de cada arquivo
      for (const file of files) {
        await apiService.uploadDocument(conversationId, file);
      }
      
      // Recarregar lista de documentos após upload bem-sucedido
      const docs = await apiService.getDocumentsByConversation(conversationId);
      setDocuments(Array.isArray(docs) ? docs : []);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      throw error;
    }
  };

  const handleViewDocument = (documentId: number, filename: string) => {
    setSelectedPDFId(documentId);
    setSelectedPDFFilename(filename);
    setIsPDFViewerOpen(true);
  };

  // Verificar se a conversa não foi encontrada (apenas se tiver ID e não estiver carregando)
  if (conversationId && !conversation && !isLoading && hasLoadedMessages) {
    return (
      <div className={`flex h-screen items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
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

  // Layout de 3 colunas inspirado no NotebookLM
  return (
    <div className={`flex flex-col h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <Header />
      
      {/* Conteúdo Principal */}
      <div className="flex flex-1 overflow-hidden">
        {/* Coluna Esquerda - Lista de Documentos */}
        <div className="flex-shrink-0" style={{ width: `${leftWidth}px` }}>
          <DocumentList
            documents={documents}
            selectedDocuments={selectedDocuments}
            onSelectDocument={handleSelectDocument}
            onGenerateSummary={handleGenerateSummary}
            onAddDocument={() => setIsUploadModalOpen(true)}
            onViewDocument={handleViewDocument}
            isLoading={isGeneratingSummary}
          />
        </div>

        {/* Divisor Esquerdo */}
        <div
          className={`w-1 cursor-col-resize hover:bg-blue-500 transition-colors ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}
          onMouseDown={() => setIsDraggingLeft(true)}
        />

        {/* Coluna Central - Chat */}
        <div className="flex-1 flex flex-col min-w-0">
          <MessageList messages={conversation?.messages || []} />
          
          {/* Toggle RAG */}
          <div className={`px-4 py-2 flex items-center justify-end gap-3 border-t ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
            <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {useRag ? 'Usar RAG (Vector DB)' : 'Contexto Direto (PDF)'}
            </span>
            <button
              onClick={() => setUseRag(!useRag)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                useRag ? 'bg-blue-600' : 'bg-gray-400'
              }`}
              title={useRag ? "Modo RAG (Ainda não implementado)" : "Modo Contexto Direto (Extrai texto dos PDFs selecionados)"}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  useRag ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <MessageInput 
            onSend={handleSendMessage} 
            disabled={isLoading}
          />
        </div>

        {/* Divisor Direito */}
        <div
          className={`w-1 cursor-col-resize hover:bg-blue-500 transition-colors ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}
          onMouseDown={() => setIsDraggingRight(true)}
        />

        {/* Coluna Direita - Resumos */}
        <div className="flex-shrink-0" style={{ width: `${rightWidth}px` }}>
          <SummaryList
            summaries={conversation?.summaries || []}
            isLoading={isGeneratingSummary}
          />
        </div>
      </div>

      {/* Modal de Upload */}
      {conversationId && (
        <UploadDocumentModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          conversationId={conversationId}
          onUpload={handleUploadDocuments}
        />
      )}

      {/* Modal de Visualização de PDF */}
      {selectedPDFId && (
        <PDFViewerModal
          isOpen={isPDFViewerOpen}
          onClose={() => {
            setIsPDFViewerOpen(false);
            setSelectedPDFId(null);
            setSelectedPDFFilename('');
          }}
          documentId={selectedPDFId}
          filename={selectedPDFFilename}
        />
      )}
    </div>
  );
};
