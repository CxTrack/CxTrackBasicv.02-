import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

export const useAuth = () => {
  const { user, profile, loading, initialized, initialize } = useAuthStore();

  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  return {
    user,
    profile,
    loading,
    initialized,
    isAuthenticated: !!user,
  };
};
