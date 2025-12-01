import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const handleStartChat = () => {
    // Redireciona para /chat sem ID - conversa será criada ao enviar primeira mensagem
    navigate('/chat');
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-12">
          <div className="text-8xl mb-6">🤖</div>
          <h1 className={`text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            VG GenAI Bot
          </h1>
          <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Sua assistente de inteligência artificial
          </p>
        </div>

        <button
          onClick={handleStartChat}
          className={`px-12 py-5 rounded-2xl font-bold text-xl transition-all transform hover:scale-105
            ${isDark 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
            } shadow-xl hover:shadow-2xl`}
        >
          ✨ Iniciar Nova Conversa
        </button>

        <div className={`mt-16 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          💡 Dica: Use a barra lateral para acessar suas conversas anteriores
        </div>
      </div>
    </div>
  );
};
