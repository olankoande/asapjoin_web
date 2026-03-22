import { useState, useCallback, type ReactNode } from 'react';
import type { User } from './types';
import { authApi, usersApi } from './api';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => !!localStorage.getItem('accessToken'));

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await usersApi.me();
      setUser(data);
    } catch {
      setUser(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  }, []);

  const applySession = useCallback((data: { accessToken: string; refreshToken: string; user: User }) => {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
  }, []);

  // Init: fetch user on mount if token exists
  const [initialized, setInitialized] = useState(false);
  if (!initialized) {
    setInitialized(true);
    if (localStorage.getItem('accessToken')) {
      refreshUser();
    }
  }

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    applySession(data);
  };

  const loginWithGoogle = async (credential: string) => {
    const { data } = await authApi.google(credential);
    applySession(data);
  };

  const register = async (body: { email: string; password: string; first_name: string; last_name: string; phone_number?: string }) => {
    const { data } = await authApi.register(body);
    applySession(data);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, acceptSession: applySession, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
