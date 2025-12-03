import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';

export const HomeLayout: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <div className={`flex h-screen overflow-hidden ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onToggleSidebar={() => {}} />
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
