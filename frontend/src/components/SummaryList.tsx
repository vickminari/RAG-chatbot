import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useTheme } from '../contexts/ThemeContext';
import type { Summary } from '../types/api';

interface SummaryListProps {
  summaries: Summary[];
  documents: Array<{ id: number; filename: string }>;
  isLoading?: boolean;
}

export const SummaryList: React.FC<SummaryListProps> = ({
  summaries = [],
  documents = [],
  isLoading = false,
}) => {
  const { isDark } = useTheme();
  const [expandedSummary, setExpandedSummary] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCopy = async (content: string, id: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const truncateText = (text: string, maxLength: number = 150): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const getDocumentNames = (documentIds: number[]): string[] => {
    return documentIds
      .map(id => documents.find(doc => doc.id === id)?.filename)
      .filter((name): name is string => name !== undefined);
  };

  return (
    <div className={`flex flex-col h-full ${isDark ? 'bg-gray-800' : 'bg-white'} border-l ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
      {/* Header */}
      <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Resumos
        </h2>
      </div>

      {/* Summary List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-4xl mb-2">⏳</div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Gerando resumo...
              </p>
            </div>
          </div>
        ) : summaries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="text-6xl mb-4">📝</div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Nenhum resumo foi gerado ainda!
            </p>
            <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Selecione um ou mais arquivos e gere um resumo
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {summaries.map((summary) => {
              const isExpanded = expandedSummary === summary.id;
              const documentCount = summary.document_ids?.length || 0;
              const documentNames = getDocumentNames(summary.document_ids || []);

              return (
                <div
                  key={summary.id}
                  className={`rounded-lg border transition-all ${
                    isExpanded
                      ? isDark
                        ? 'bg-gray-700 border-gray-600'
                        : 'bg-gray-50 border-gray-300'
                      : isDark
                      ? 'bg-gray-750 border-gray-600'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  {isExpanded ? (
                    /* Expanded Card */
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {summary.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {documentCount} documento{documentCount !== 1 ? 's' : ''}
                            </span>
                            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              •
                            </span>
                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {formatDate(summary.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Lista de Documentos Utilizados */}
                      {documentNames.length > 0 && (
                        <div className={`mb-4 p-3 rounded-lg ${isDark ? 'bg-gray-600/50' : 'bg-gray-100'}`}>
                          <h4 className={`text-xs font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            📄 Documentos utilizados:
                          </h4>
                          <div className="space-y-1">
                            {documentNames.map((name, idx) => (
                              <div key={idx} className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                • {name}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className={`text-sm mb-4 leading-relaxed prose prose-sm max-w-none ${isDark ? 'prose-invert text-gray-300' : 'text-gray-700'}`}>
                        <ReactMarkdown>{summary.content}</ReactMarkdown>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCopy(summary.content, summary.id)}
                          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                            copiedId === summary.id
                              ? isDark
                                ? 'bg-green-600 text-white'
                                : 'bg-green-500 text-white'
                              : isDark
                              ? 'bg-gray-600 hover:bg-gray-500 text-white'
                              : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                          }`}
                        >
                          {copiedId === summary.id ? '✓ Copiado!' : '📋 Copiar'}
                        </button>
                        <button
                          onClick={() => setExpandedSummary(null)}
                          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                            isDark
                              ? 'bg-gray-600 hover:bg-gray-500 text-white'
                              : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                          }`}
                        >
                          ✕ Fechar
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Collapsed Card */
                    <div className="p-3">
                      <h3 className={`text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {summary.title}
                      </h3>
                      <p className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {truncateText(summary.content)}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            {documentCount} doc{documentCount !== 1 ? 's' : ''}
                          </span>
                          <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            •
                          </span>
                          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            {formatDate(summary.created_at)}
                          </span>
                        </div>
                        <button
                          onClick={() => setExpandedSummary(summary.id)}
                          className={`text-xs font-medium ${
                            isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                          }`}
                        >
                          Ver mais
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
