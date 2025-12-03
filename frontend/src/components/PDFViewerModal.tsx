import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { apiService } from '../services/api.service';

interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: number;
  filename: string;
}

export const PDFViewerModal: React.FC<PDFViewerModalProps> = ({
  isOpen,
  onClose,
  documentId,
  filename,
}) => {
  const { isDark } = useTheme();
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && documentId) {
      loadPDF();
    }

    return () => {
      // Limpar URL ao desmontar
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [isOpen, documentId]);

  const loadPDF = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Buscar URL pré-assinada
      const response = await apiService.getDocumentDownloadUrl(documentId);
      
      // Fazer download do PDF
      const pdfResponse = await fetch(response.download_url);
      
      if (!pdfResponse.ok) {
        throw new Error('Erro ao baixar documento');
      }

      const blob = await pdfResponse.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      console.error('Erro ao carregar PDF:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar documento');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl('');
    }
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className={`w-full h-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-2xl">📄</span>
            <div className="flex-1 min-w-0">
              <h2
                className={`text-lg font-semibold truncate ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
                title={filename}
              >
                {filename}
              </h2>
            </div>
          </div>
          <button
            onClick={handleClose}
            className={`p-2 rounded-lg transition-colors ml-4 ${
              isDark
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="text-2xl">✕</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin text-6xl mb-4">⏳</div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Carregando documento...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-6">
                <div className="text-6xl mb-4">⚠️</div>
                <p className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Erro ao carregar documento
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {error}
                </p>
                <button
                  onClick={loadPDF}
                  className={`mt-4 px-6 py-2 rounded-lg font-medium transition-colors ${
                    isDark
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          )}

          {!isLoading && !error && pdfUrl && (
            <iframe
              src={pdfUrl}
              className="w-full h-full"
              title={filename}
            />
          )}
        </div>
      </div>
    </div>
  );
};
