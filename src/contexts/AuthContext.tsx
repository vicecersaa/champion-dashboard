import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { api } from '../lib/api';
import type { Admin } from '../lib/types';

interface AuthContextValue {
  admin: Admin | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const SESSION_KEY = 'admin_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(() => {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      try { return JSON.parse(raw) as Admin; } catch { return null; }
    }
    return null;
  });

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.login(email, password);
    if (result.success && result.admin) {
      setAdmin(result.admin);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(result.admin));
      return { success: true };
    }
    return { success: false, error: result.error };
  }, []);

  const logout = useCallback(() => {
    setAdmin(null);
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ admin, isAuthenticated: !!admin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
