import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface Summary {
  id: number;
  title: string;
  content: string;
  created_at: string;
  document_count: number;
}

interface SummaryListProps {
  summaries: Summary[];
  isLoading?: boolean;
}

export const SummaryList: React.FC<SummaryListProps> = ({
  summaries = [],
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

  // Fallback data para demonstração
  const displaySummaries = summaries.length > 0 ? summaries : [
    {
      id: 1,
      title: 'Resumo de Exemplo 1',
      content: 'Este é um resumo de exemplo. A funcionalidade de geração de resumos ainda não está implementada na API. Em breve você poderá gerar resumos automáticos dos seus documentos usando IA. Este texto é apenas para demonstrar como os resumos aparecerão na interface.',
      created_at: new Date().toISOString(),
      document_count: 2,
    },
    {
      id: 2,
      title: 'Resumo de Exemplo 2',
      content: 'Outro exemplo de resumo. Quando a funcionalidade estiver pronta, você poderá selecionar até 5 documentos e gerar um resumo consolidado de todos eles. O resumo será gerado por IA e apresentará os principais pontos de cada documento.',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      document_count: 3,
    },
  ];

  return (
    <div className={`flex flex-col h-full ${isDark ? 'bg-gray-800' : 'bg-white'} border-l ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
      {/* Header */}
      <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Resumos
        </h2>
        {summaries.length === 0 && (
          <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            (Funcionalidade em desenvolvimento)
          </p>
        )}
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
        ) : displaySummaries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="text-6xl mb-4">📝</div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Nenhum resumo gerado ainda
            </p>
            <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Selecione documentos e clique em "Gerar Resumo"
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {displaySummaries.map((summary) => {
              const isExpanded = expandedSummary === summary.id;

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
                              {summary.document_count} documento{summary.document_count !== 1 ? 's' : ''}
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

                      <div className={`text-sm mb-4 leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {summary.content}
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
                            {summary.document_count} doc{summary.document_count !== 1 ? 's' : ''}
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
                          Ver mais →
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
