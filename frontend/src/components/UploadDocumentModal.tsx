import React, { useState, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => Promise<void>;
}

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  isOpen,
  onClose,
  onUpload,
}) => {
  const { isDark } = useTheme();
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  const validateFile = (file: File): string | null => {
    if (file.type !== 'application/pdf') {
      return `${file.name}: Apenas arquivos PDF são permitidos`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: Arquivo muito grande (máx. 50MB)`;
    }
    return null;
  };

  const handleFiles = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    setError('');
    const newFiles: File[] = [];
    const errors: string[] = [];

    Array.from(selectedFiles).forEach((file) => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        newFiles.push(file);
      }
    });

    if (errors.length > 0) {
      setError(errors.join('\n'));
    }

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Selecione pelo menos um arquivo PDF');
      return;
    }

    setUploading(true);
    setError('');

    try {
      await onUpload(files);
      setFiles([]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setFiles([]);
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`w-full max-w-2xl rounded-2xl shadow-2xl ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2
              className={`text-2xl font-bold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              📄 Upload de Documentos
            </h2>
            <p
              className={`text-sm mt-1 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              Adicione arquivos PDF para criar uma nova conversa
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={uploading}
            className={`p-2 rounded-lg transition-colors ${
              uploading
                ? 'opacity-50 cursor-not-allowed'
                : isDark
                ? 'hover:bg-gray-700'
                : 'hover:bg-gray-100'
            }`}
          >
            <span className="text-2xl">✕</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Drop Zone */}
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-500/10'
                : isDark
                ? 'border-gray-600 hover:border-gray-500'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,application/pdf"
              onChange={handleChange}
              className="hidden"
            />

            <div className="text-center">
              <div className="text-6xl mb-4">📎</div>
              <p
                className={`text-lg font-medium mb-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                Arraste arquivos PDF aqui
              </p>
              <p
                className={`text-sm mb-4 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                ou clique no botão abaixo
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  uploading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : isDark
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white`}
              >
                Selecionar Arquivos
              </button>
              <p
                className={`text-xs mt-3 ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`}
              >
                Máximo: 50MB por arquivo • Formato: PDF
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500 text-red-500 text-sm whitespace-pre-line">
              {error}
            </div>
          )}

          {/* Files List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <h3
                className={`text-sm font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Arquivos selecionados ({files.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      isDark ? 'bg-gray-700' : 'bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-2xl">📄</span>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium truncate ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}
                        >
                          {file.name}
                        </p>
                        <p
                          className={`text-xs ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}
                        >
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      disabled={uploading}
                      className={`ml-2 p-1 rounded transition-colors ${
                        uploading
                          ? 'opacity-50 cursor-not-allowed'
                          : isDark
                          ? 'hover:bg-gray-600 text-gray-400 hover:text-white'
                          : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <span className="text-xl">🗑️</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`flex items-center justify-end gap-3 p-6 border-t ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <button
            onClick={handleClose}
            disabled={uploading}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              uploading
                ? 'opacity-50 cursor-not-allowed'
                : isDark
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            }`}
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              uploading || files.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : isDark
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white`}
          >
            {uploading ? 'Enviando...' : `Criar Conversa (${files.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};
