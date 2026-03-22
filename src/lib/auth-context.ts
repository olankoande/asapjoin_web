import { createContext, useContext } from 'react';
import type { User } from './types';

export interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  acceptSession: (session: { accessToken: string; refreshToken: string; user: User }) => void;
  register: (body: { email: string; password: string; first_name: string; last_name: string; phone_number?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthCtx | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
