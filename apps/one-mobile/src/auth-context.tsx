import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import {
  deleteAccount,
  loadAccount,
  loginAccount,
  logoutAccount,
  OneUser,
  registerAccount,
} from './auth-client';

type AuthContextValue = {
  user: OneUser | null;
  loading: boolean;
  register: (input: { fullName: string; email: string; phone: string; password: string; locale?: string }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteMe: () => Promise<string>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<OneUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      setUser(await loadAccount());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    register: async (input) => {
      const next = await registerAccount(input);
      setUser(next);
    },
    login: async (email, password) => {
      const next = await loginAccount(email, password);
      setUser(next);
    },
    logout: async () => {
      await logoutAccount();
      setUser(null);
    },
    deleteMe: async () => {
      const message = await deleteAccount();
      setUser(null);
      return message;
    },
    refresh,
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
