import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin';
  organization_id: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_ADMIN_USER: User = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'admin@cxtrack.com',
  name: 'Admin User',
  role: 'admin',
  organization_id: '00000000-0000-0000-0000-000000000000',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(MOCK_ADMIN_USER);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('🔐 Auto-logged in as admin:', MOCK_ADMIN_USER.name);
    console.log('📋 Organization ID:', MOCK_ADMIN_USER.organization_id);
    setUser(MOCK_ADMIN_USER);
    setLoading(false);
  }, []);

  const login = async () => {
    setUser(MOCK_ADMIN_USER);
  };

  const logout = async () => {
    console.log('⚠️ Logout disabled in auto-login mode');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: true,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

export { MOCK_ADMIN_USER };
