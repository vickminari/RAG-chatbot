import React, { useState, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface ProfilePictureUploadProps {
  currentImageUrl?: string;
  onImageSelect: (file: File | null) => void;
  error?: string;
}

export const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  currentImageUrl,
  onImageSelect,
  error,
}) => {
  const { isDark } = useTheme();
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [uploadError, setUploadError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Apenas arquivos JPG, PNG ou WebP são permitidos';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Arquivo muito grande (máximo 5MB)';
    }
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError('');

    if (!file) {
      setPreview(currentImageUrl || null);
      onImageSelect(null);
      return;
    }

    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      onImageSelect(null);
      return;
    }

    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    onImageSelect(file);
  };

  const handleRemove = () => {
    setPreview(null);
    setUploadError('');
    onImageSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        {/* Preview */}
        <div className={`w-24 h-24 rounded-full overflow-hidden flex items-center justify-center border-2 ${
          isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'
        }`}>
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={() => {
                setPreview(null);
                setUploadError('Erro ao carregar imagem');
              }}
            />
          ) : (
            <span className={`text-4xl ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              👤
            </span>
          )}
        </div>

        {/* Buttons */}
        <div className="flex-1 space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isDark
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {preview ? 'Alterar Foto' : 'Escolher Foto'}
            </button>
            
            {preview && (
              <button
                type="button"
                onClick={handleRemove}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDark
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
              >
                Remover
              </button>
            )}
          </div>

          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            JPG, PNG ou WebP • Máximo 5MB
          </p>
        </div>
      </div>

      {/* Errors */}
      {(uploadError || error) && (
        <p className="text-xs text-red-500 mt-1">
          {uploadError || error}
        </p>
      )}
    </div>
  );
};
