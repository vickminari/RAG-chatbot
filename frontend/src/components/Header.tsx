import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isHomePage = location.pathname === '/';

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
        {!isHomePage && (
          <button
            onClick={() => navigate('/')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors font-semibold
              ${isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
          >
            <span className="text-xl">🤖</span>
            <span className="hidden sm:inline">VG GenAI Bot</span>
          </button>
        )}
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

        {/* User Profile */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg
          ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold
            ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-300 text-gray-700'} uppercase`}>
            {user?.email.charAt(0) || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};
