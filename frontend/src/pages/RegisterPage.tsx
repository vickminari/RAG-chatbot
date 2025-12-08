import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useRegister } from '../hooks/useRegister';
import { extractErrorMessage } from '../utils/errorHandler';
import { ProfilePictureUpload } from '../components/ProfilePictureUpload';
import { apiService } from '../services/api.service';

export const RegisterPage: React.FC = () => {
  const [nome, setNome] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [descricao, setDescricao] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePictureError, setProfilePictureError] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { register, loading } = useRegister();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  // Validações em tempo real
  const validateNome = (value: string): string | null => {
    if (value.length === 0) return null; // Não mostra erro se campo vazio
    if (value.length < 3) return 'Nome deve ter no mínimo 3 caracteres';
    if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(value)) return 'Nome deve conter apenas letras e espaços';
    return null;
  };

  const validateUsername = (value: string): string | null => {
    if (value.length === 0) return null;
    if (value.length < 3) return 'Username deve ter no mínimo 3 caracteres';
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) return 'Username deve conter apenas letras, números, _ ou -';
    return null;
  };

  const validatePassword = (value: string): string | null => {
    if (value.length === 0) return null;
    if (value.length < 8) return 'Mínimo 8 caracteres';
    if (!/\d/.test(value)) return 'Deve conter pelo menos 1 número';
    if (!/[A-Z]/.test(value)) return 'Deve conter pelo menos 1 letra maiúscula';
    if (!/[!@#$%&*]/.test(value)) return 'Deve conter pelo menos 1 caractere especial (!@#$%&*)';
    return null;
  };

  const nomeError = validateNome(nome);
  const usernameError = validateUsername(username);
  const passwordError = validatePassword(password);
  const confirmPasswordError = confirmPassword && password !== confirmPassword ? 'As senhas não coincidem' : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setProfilePictureError('');

    // Validações antes de enviar
    if (nomeError) {
      setError(nomeError);
      return;
    }
    if (usernameError) {
      setError(usernameError);
      return;
    }
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    try {
      // Criar conta
      await register({ nome, username, email, password, descricao: descricao || undefined });
      
      // Fazer login automaticamente após criar conta
      await login(email, password);
      
      // Upload da foto de perfil se selecionada
      if (profilePicture) {
        try {
          await apiService.uploadProfilePicture(profilePicture);
        } catch (uploadErr) {
          // Não bloqueia o registro se o upload falhar
          console.error('Erro ao fazer upload da foto de perfil:', uploadErr);
        }
      }
      
      navigate('/');
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative
      ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Botão de tema no canto superior direito */}
      <button
        onClick={toggleTheme}
        className={`absolute top-4 right-4 p-3 rounded-lg transition-all
          ${isDark 
            ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' 
            : 'bg-white hover:bg-gray-100 text-gray-700'
          } shadow-lg`}
        aria-label="Alternar tema"
      >
        {isDark ? '☀️' : '🌙'}
      </button>

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
              htmlFor="nome" 
              className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Nome Completo
            </label>
            <input
              id="nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              placeholder="João Silva"
              className={`w-full px-4 py-3 rounded-lg border outline-none transition-colors
                ${isDark 
                  ? `bg-gray-700 text-white placeholder-gray-400 ${nomeError ? 'border-red-500 focus:border-red-500' : 'border-gray-600 focus:border-blue-500'}` 
                  : `bg-white text-gray-900 placeholder-gray-500 ${nomeError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`
                }`}
            />
            {nomeError && (
              <p className="mt-1.5 text-xs text-red-500">{nomeError}</p>
            )}
          </div>

          <div>
            <label 
              htmlFor="username" 
              className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="joao_silva"
              className={`w-full px-4 py-3 rounded-lg border outline-none transition-colors
                ${isDark 
                  ? `bg-gray-700 text-white placeholder-gray-400 ${usernameError ? 'border-red-500 focus:border-red-500' : 'border-gray-600 focus:border-blue-500'}` 
                  : `bg-white text-gray-900 placeholder-gray-500 ${usernameError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`
                }`}
            />
            {usernameError ? (
              <p className="mt-1.5 text-xs text-red-500">{usernameError}</p>
            ) : (
              <p className={`mt-1.5 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Mínimo 3 caracteres, apenas letras, números, _ ou -
              </p>
            )}
          </div>

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
                  ? `bg-gray-700 text-white placeholder-gray-400 ${passwordError ? 'border-red-500 focus:border-red-500' : 'border-gray-600 focus:border-blue-500'}` 
                  : `bg-white text-gray-900 placeholder-gray-500 ${passwordError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`
                }`}
            />
            {passwordError ? (
              <p className="mt-1.5 text-xs text-red-500">{passwordError}</p>
            ) : (
              <p className={`mt-1.5 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Mínimo 8 caracteres, 1 número, 1 maiúscula e 1 caractere especial (!@#$%&*)
              </p>
            )}
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
                  ? `bg-gray-700 text-white placeholder-gray-400 ${confirmPasswordError ? 'border-red-500 focus:border-red-500' : 'border-gray-600 focus:border-blue-500'}` 
                  : `bg-white text-gray-900 placeholder-gray-500 ${confirmPasswordError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`
                }`}
            />
            {confirmPasswordError && (
              <p className="mt-1.5 text-xs text-red-500">{confirmPasswordError}</p>
            )}
          </div>

          <div>
            <label 
              htmlFor="descricao" 
              className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Descrição/Bio <span className="text-gray-500">(opcional)</span>
            </label>
            <textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Conte um pouco sobre você..."
              rows={3}
              className={`w-full px-4 py-3 rounded-lg border outline-none transition-colors resize-none
                ${isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                }`}
            />
          </div>

          <div>
            <label 
              className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Foto de Perfil <span className="text-gray-500">(opcional)</span>
            </label>
            <ProfilePictureUpload
              currentImageUrl={undefined}
              onImageSelect={(file) => {
                setProfilePicture(file);
                setProfilePictureError('');
              }}
              error={profilePictureError}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !!nomeError || !!usernameError || !!passwordError || !!confirmPasswordError}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all
              ${loading || nomeError || usernameError || passwordError || confirmPasswordError
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
