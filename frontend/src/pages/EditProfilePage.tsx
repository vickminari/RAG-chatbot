import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api.service';
import { extractErrorMessage } from '../utils/errorHandler';

type TabType = 'personal' | 'password';

export const EditProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('personal');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Estados para dados pessoais
  const [personalData, setPersonalData] = useState({
    nome: user?.nome || '',
    username: user?.username || '',
    imagem_perfil: user?.imagem_perfil || '',
    descricao: user?.descricao || '',
  });

  // Estados para senha
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  const handlePersonalDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPersonalData(prev => ({ ...prev, [name]: value }));
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSubmitPersonalData = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Preparar dados apenas com campos modificados
      const updates: any = {};
      if (personalData.nome !== user?.nome) updates.nome = personalData.nome;
      if (personalData.username !== user?.username) updates.username = personalData.username;
      if (personalData.imagem_perfil !== user?.imagem_perfil) updates.imagem_perfil = personalData.imagem_perfil;
      if (personalData.descricao !== user?.descricao) updates.descricao = personalData.descricao;

      if (Object.keys(updates).length === 0) {
        setErrorMessage('Nenhuma alteração foi feita');
        return;
      }

      await apiService.updateUserProfile(updates);
      setSuccessMessage('Perfil atualizado com sucesso!');
      
      // Recarregar dados do usuário
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Validação de confirmação de senha
    if (passwordData.new_password !== passwordData.confirm_password) {
      setErrorMessage('As senhas não coincidem');
      setIsLoading(false);
      return;
    }

    try {
      await apiService.updateUserPassword({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      });
      
      setSuccessMessage('Senha atualizada com sucesso!');
      setPasswordData({
        old_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} p-4`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <span className="text-xl">←</span>
            </button>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Editar Perfil
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-6xl mx-auto h-full p-6">
          <div className={`flex gap-6 h-full ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {/* Sidebar */}
            <div className={`w-64 flex-shrink-0 rounded-xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('personal')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors font-medium ${
                    activeTab === 'personal'
                      ? isDark
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-500 text-white'
                      : isDark
                      ? 'hover:bg-gray-700 text-gray-300'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">👤</span>
                    <span>Dados Pessoais</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('password')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors font-medium ${
                    activeTab === 'password'
                      ? isDark
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-500 text-white'
                      : isDark
                      ? 'hover:bg-gray-700 text-gray-300'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🔒</span>
                    <span>Alterar Senha</span>
                  </div>
                </button>
              </nav>
            </div>

            {/* Form Content */}
            <div className={`flex-1 rounded-xl p-6 overflow-y-auto ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              {/* Messages */}
              {successMessage && (
                <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500 text-green-500">
                  {successMessage}
                </div>
              )}
              {errorMessage && (
                <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500 text-red-500">
                  {errorMessage}
                </div>
              )}

              {/* Dados Pessoais Form */}
              {activeTab === 'personal' && (
                <form onSubmit={handleSubmitPersonalData} className="space-y-6">
                  <div>
                    <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Informações Pessoais
                    </h2>
                    <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Atualize suas informações pessoais. O email não pode ser alterado.
                    </p>
                  </div>

                  {/* Email (read-only) */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className={`w-full px-4 py-3 rounded-lg border ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-gray-500'
                          : 'bg-gray-100 border-gray-300 text-gray-500'
                      } cursor-not-allowed`}
                    />
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      O email não pode ser alterado
                    </p>
                  </div>

                  {/* Nome */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      name="nome"
                      value={personalData.nome}
                      onChange={handlePersonalDataChange}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="Seu nome completo"
                    />
                  </div>

                  {/* Username */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Nome de Usuário
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={personalData.username}
                      onChange={handlePersonalDataChange}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="seu_username"
                    />
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      Mínimo 3 caracteres, apenas letras, números, _ ou -
                    </p>
                  </div>

                  {/* Imagem de Perfil */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      URL da Imagem de Perfil
                    </label>
                    <input
                      type="url"
                      name="imagem_perfil"
                      value={personalData.imagem_perfil}
                      onChange={handlePersonalDataChange}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="https://exemplo.com/foto.jpg"
                    />
                  </div>

                  {/* Descrição */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Descrição / Bio
                    </label>
                    <textarea
                      name="descricao"
                      value={personalData.descricao}
                      onChange={handlePersonalDataChange}
                      rows={4}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
                      placeholder="Conte um pouco sobre você..."
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => navigate('/')}
                      className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                        isDark
                          ? 'bg-gray-700 hover:bg-gray-600 text-white'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                      }`}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                        isLoading
                          ? 'bg-gray-400 cursor-not-allowed text-white'
                          : isDark
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                  </div>
                </form>
              )}

              {/* Password Form */}
              {activeTab === 'password' && (
                <form onSubmit={handleSubmitPassword} className="space-y-6">
                  <div>
                    <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Alterar Senha
                    </h2>
                    <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Digite sua senha atual e escolha uma nova senha segura.
                    </p>
                  </div>

                  {/* Senha Atual */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Senha Atual
                    </label>
                    <input
                      type="password"
                      name="old_password"
                      value={passwordData.old_password}
                      onChange={handlePasswordChange}
                      required
                      className={`w-full px-4 py-3 rounded-lg border ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="Digite sua senha atual"
                    />
                  </div>

                  {/* Nova Senha */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Nova Senha
                    </label>
                    <input
                      type="password"
                      name="new_password"
                      value={passwordData.new_password}
                      onChange={handlePasswordChange}
                      required
                      className={`w-full px-4 py-3 rounded-lg border ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="Digite sua nova senha"
                    />
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      Mínimo 8 caracteres, 1 número, 1 maiúscula, 1 caractere especial (!@#$%&*)
                    </p>
                  </div>

                  {/* Confirmar Nova Senha */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Confirmar Nova Senha
                    </label>
                    <input
                      type="password"
                      name="confirm_password"
                      value={passwordData.confirm_password}
                      onChange={handlePasswordChange}
                      required
                      className={`w-full px-4 py-3 rounded-lg border ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="Confirme sua nova senha"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => navigate('/')}
                      className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                        isDark
                          ? 'bg-gray-700 hover:bg-gray-600 text-white'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                      }`}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                        isLoading
                          ? 'bg-gray-400 cursor-not-allowed text-white'
                          : isDark
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      {isLoading ? 'Atualizando...' : 'Atualizar Senha'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
