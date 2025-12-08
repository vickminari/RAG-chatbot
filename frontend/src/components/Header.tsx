import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const isHomePage = location.pathname === '/';

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      setIsProfileDropdownOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleEditProfile = () => {
    setIsProfileDropdownOpen(false);
    navigate('/profile/edit');
  };

  return (
    <header className={`h-14 border-b ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'} 
      flex items-center justify-between px-4 sticky top-0 z-20`}>
      {/* Left section: Menu button + Logo/Home */}
      <div className="flex items-center gap-2 flex-1">
        {/* Menu Toggle Button (Mobile) */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className={`lg:hidden p-2 rounded-lg transition-colors
              ${isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
            title="Abrir menu"
          >
            <span className="text-xl">☰</span>
          </button>
        )}
        
        {/* Logo/Home Button */}
        <button
          onClick={() => navigate('/')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors font-semibold
            ${isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
        >
          <span className="text-xl">🤖</span>
          <span className="hidden sm:inline">VG GenAI Bot</span>
        </button>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-lg transition-colors
            ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
          title={isDark ? 'Modo Claro' : 'Modo Escuro'}
        >
          {isDark ? '☀️' : '🌙'}
        </button>

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors
              ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold overflow-hidden
              ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-300 text-gray-700'}`}>
              {user?.imagem_perfil ? (
                <img 
                  src={user.imagem_perfil} 
                  alt={user.nome}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback caso a imagem não carregue
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextElementSibling) {
                      (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                    }
                  }}
                />
              ) : (
                <span className="uppercase">{user?.nome?.charAt(0) || user?.email?.charAt(0) || 'U'}</span>
              )}
            </div>
          </button>

          {/* Dropdown Menu */}
          {isProfileDropdownOpen && (
            <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-lg border overflow-hidden
              ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              {/* User Info */}
              <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <p className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {user?.nome}
                </p>
                <p className={`text-sm truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {user?.email}
                </p>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <button
                  onClick={handleEditProfile}
                  className={`w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors
                    ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                >
                  <span className="text-lg">✏️</span>
                  <span className="font-medium">Editar Perfil</span>
                </button>
                
                <button
                  onClick={handleLogout}
                  className={`w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors
                    ${isDark ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-gray-100 text-red-600'}`}
                >
                  <span className="text-lg">🚪</span>
                  <span className="font-medium">Sair</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
