import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useRegister } from '../hooks/useRegister';
import { extractErrorMessage } from '../utils/errorHandler';

export const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { register, loading } = useRegister();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    try {
      // Criar conta
      await register({ email, password });
      // Fazer login automaticamente após criar conta
      await login(email, password);
      navigate('/');
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 
      ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`w-full max-w-md p-8 rounded-2xl shadow-2xl
        ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🤖</div>
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            VG GenAI Bot
          </h1>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Crie sua conta
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500 text-red-500 text-sm whitespace-pre-line">
              {error}
            </div>
          )}

          <div>
            <label 
              htmlFor="email" 
              className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              className={`w-full px-4 py-3 rounded-lg border outline-none transition-colors
                ${isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                }`}
            />
          </div>

          <div>
            <label 
              htmlFor="password" 
              className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className={`w-full px-4 py-3 rounded-lg border outline-none transition-colors
                ${isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                }`}
            />
            <p className={`mt-1.5 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Mínimo 8 caracteres, 1 número, 1 maiúscula e 1 caractere especial (!@#$%&*)
            </p>
          </div>

          <div>
            <label 
              htmlFor="confirmPassword" 
              className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Confirmar Senha
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
              className={`w-full px-4 py-3 rounded-lg border outline-none transition-colors
                ${isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                }`}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all
              ${loading
                ? 'bg-gray-400 cursor-not-allowed'
                : isDark
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-blue-500 hover:bg-blue-600'
              } text-white shadow-lg hover:shadow-xl`}
          >
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>

        <div className={`mt-6 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Já tem uma conta?{' '}
          <Link
            to="/login"
            className={`font-semibold ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
          >
            Fazer login
          </Link>
        </div>
      </div>
    </div>
  );
};
