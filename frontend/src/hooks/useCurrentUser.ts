import { useState, useEffect } from 'react';
import { apiService } from '../services/api.service';
import type { User } from '../types/api';

export const useCurrentUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    setLoading(true);
    setError(null);

    try {
      const userData = await apiService.getCurrentUser();
      setUser(userData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar usuário';
      setError(errorMessage);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return { user, loading, error, refetch: fetchUser };
};
