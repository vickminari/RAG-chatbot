import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useChat } from '../contexts/ChatContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { 
    conversations, 
    deleteConversation, 
    currentConversationId,
    setCurrentConversationId 
  } = useChat();
  const { isDark } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleNewChat = () => {
    // Navega para /chat sem ID - conversa será criada ao enviar primeira mensagem
    navigate('/chat');
    onClose();
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir esta conversa?')) {
      await deleteConversation(id);
      if (currentConversationId === id) {
        navigate('/');
      }
    }
  };

  const handleConversationClick = (id: number) => {
    setCurrentConversationId(id);
    onClose();
  };

  return (
    <>
      {/* Sidebar */}
      <div
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 transition-transform duration-300 ease-in-out
        ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} 
        border-r ${isDark ? 'border-gray-700' : 'border-gray-200'} flex flex-col`}
      >
        {/* Header with close button (Mobile) */}
        <div className={`lg:hidden flex items-center justify-between p-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className="font-semibold text-lg">Menu</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors
              ${isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
            title="Fechar menu"
          >
            <span className="text-xl">✕</span>
          </button>
        </div>

        {/* New Chat Button */}
        <div className={`p-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={handleNewChat}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors
              ${isDark 
                ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700' 
                : 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-300'
              }`}
          >
            + Nova Conversa
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2">
          {conversations.length === 0 ? (
            <div className="text-center text-gray-500 mt-8 px-4 text-sm">
              Nenhuma conversa ainda. Crie uma nova!
            </div>
          ) : (
            conversations.map(conv => (
              <Link
                key={conv.id}
                to={`/chat/${conv.id}`}
                onClick={() => handleConversationClick(typeof conv.id === 'number' ? conv.id : parseInt(conv.id.toString()))}
                className={`group flex items-center justify-between p-3 mb-1 rounded-lg transition-colors
                  ${currentConversationId === conv.id
                    ? isDark ? 'bg-gray-800' : 'bg-gray-200'
                    : isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                  }`}
              >
                <div className="flex-1 truncate">
                  <div className="text-sm truncate">{conv.title}</div>
                </div>
                {typeof conv.id === 'number' && (
                  <button
                    onClick={(e) => handleDelete(conv.id as number, e)}
                    className={`opacity-0 group-hover:opacity-100 ml-2 p-1 rounded transition-opacity
                      ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-300'}`}
                    title="Excluir conversa"
                  >
                    🗑️
                  </button>
                )}
              </Link>
            ))
          )}
        </div>

        {/* User Profile - Bottom */}
        <div className={`p-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={logout}
            className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors
              ${isDark 
                ? 'bg-red-900/30 hover:bg-red-900/50 text-red-300' 
                : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
              }`}
          >
            Sair
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={onClose}
        />
      )}
    </>
  );
};
