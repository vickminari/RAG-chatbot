import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface Document {
  id: number;
  filename: string;
  file_size: number;
  status: string;
  created_at: string;
}

interface DocumentListProps {
  documents: Document[];
  selectedDocuments: number[];
  onSelectDocument: (documentId: number) => void;
  onGenerateSummary: () => void;
  onAddDocument: () => void;
  onNavigateHome: () => void;
  onViewDocument: (documentId: number, filename: string) => void;
  isLoading?: boolean;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents = [],
  selectedDocuments = [],
  onSelectDocument,
  onGenerateSummary,
  onAddDocument,
  onNavigateHome,
  onViewDocument,
  isLoading = false,
}) => {
  const { isDark } = useTheme();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'indexed':
        return isDark ? 'text-green-400' : 'text-green-600';
      case 'processing':
        return isDark ? 'text-yellow-400' : 'text-yellow-600';
      case 'pending':
        return isDark ? 'text-gray-400' : 'text-gray-600';
      case 'error':
        return isDark ? 'text-red-400' : 'text-red-600';
      default:
        return isDark ? 'text-gray-400' : 'text-gray-600';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'indexed':
        return '✓ Indexado';
      case 'processing':
        return '⏳ Processando';
      case 'pending':
        return '⏸ Pendente';
      case 'error':
        return '✗ Erro';
      default:
        return status;
    }
  };

  const isDocumentSelectable = (doc: Document): boolean => {
    return doc.status === 'indexed' || doc.status === 'pending';
  };

  const handleCheckboxChange = (documentId: number, doc: Document) => {
    if (!isDocumentSelectable(doc)) return;
    
    if (selectedDocuments.includes(documentId)) {
      onSelectDocument(documentId);
    } else if (selectedDocuments.length < 5) {
      onSelectDocument(documentId);
    }
  };

  return (
    <div className={`flex flex-col h-full ${isDark ? 'bg-gray-800' : 'bg-white'} border-r ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
      {/* Header com Logo e Botão Adicionar */}
      <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        {/* Logo / Botão Home */}
        <button
          onClick={onNavigateHome}
          className={`w-full mb-3 p-3 rounded-lg transition-colors ${
            isDark
              ? 'bg-gray-700 hover:bg-gray-650 text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
          }`}
          title="Voltar para a home"
        >
          <div className="flex items-center gap-3">
            <div className="text-2xl">💬</div>
            <div className="flex-1 text-left">
              <div className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                RAG Chatbot
              </div>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Clique para voltar
              </div>
            </div>
          </div>
        </button>

        {/* Botão Adicionar Documento */}
        <button
          onClick={onAddDocument}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
            isDark
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Adicionar Documento
        </button>
        
        {/* Info de Seleção */}
        <div className={`mt-3 text-sm text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Selecione até 5 arquivos para resumir
        </div>
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto">
        {!documents || documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="text-6xl mb-4">📄</div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Nenhum documento adicionado ainda
            </p>
            <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Clique em "Adicionar Documento"
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {(documents || []).map((doc) => {
              const isSelectable = isDocumentSelectable(doc);
              const isSelected = selectedDocuments.includes(doc.id);
              const canSelect = isSelectable && (isSelected || selectedDocuments.length < 5);

              return (
                <div
                  key={doc.id}
                  className={`p-3 rounded-lg border transition-all ${
                    isSelected
                      ? isDark
                        ? 'bg-blue-900/20 border-blue-600'
                        : 'bg-blue-50 border-blue-500'
                      : isDark
                      ? 'bg-gray-700 border-gray-600 hover:bg-gray-650'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  } ${!isSelectable ? 'opacity-60' : canSelect ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                  onClick={() => canSelect && handleCheckboxChange(doc.id, doc)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => canSelect && handleCheckboxChange(doc.id, doc)}
                      disabled={!canSelect}
                      className={`mt-1 w-4 h-4 rounded ${
                        !canSelect ? 'cursor-not-allowed' : 'cursor-pointer'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          className={`text-sm font-medium truncate ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}
                          title={doc.filename}
                        >
                          {doc.filename}
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDocument(doc.id, doc.filename);
                          }}
                          className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                            isDark
                              ? 'hover:bg-gray-600 text-gray-400 hover:text-white'
                              : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                          }`}
                          title="Visualizar documento"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs ${getStatusColor(doc.status)}`}>
                          {getStatusText(doc.status)}
                        </span>
                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          •
                        </span>
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {formatFileSize(doc.file_size)}
                        </span>
                      </div>
                      <div className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        {formatDate(doc.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer com botão Gerar Resumo */}
      <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <button
          onClick={onGenerateSummary}
          disabled={isLoading || selectedDocuments.length === 0}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            isLoading || selectedDocuments.length === 0
              ? isDark
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : isDark
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isLoading ? '⏳ Gerando...' : '✨ Gerar Resumo'}
        </button>
      </div>
    </div>
  );
};
