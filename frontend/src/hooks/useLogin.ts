import { useState } from 'react';
import { apiService } from '../services/api.service';
import type { LoginCredentials } from '../types/api';

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.login(credentials);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer login';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
};
