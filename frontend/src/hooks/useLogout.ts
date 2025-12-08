import { useState } from 'react';
import { apiService } from '../services/api.service';

export const useLogout = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logout = async () => {
    setLoading(true);
    setError(null);

    try {
      await apiService.logout();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer logout';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { logout, loading, error };
};
