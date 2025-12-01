import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface GuestRouteProps {
  children: React.ReactNode;
}

/**
 * Componente que protege rotas que devem ser acessadas apenas por usuários NÃO autenticados
 * (ex: Login, Register)
 * 
 * Se o usuário estiver autenticado, redireciona para a página inicial
 */
export const GuestRoute: React.FC<GuestRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🤖</div>
          <div className="text-white text-lg">Carregando...</div>
        </div>
      </div>
    );
  }

  // Se está autenticado, redireciona para home
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Se não está autenticado, permite acesso
  return <>{children}</>;
};
