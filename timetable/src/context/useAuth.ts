import type { User } from 'firebase/auth';
import { createContext, useContext } from 'react';

export interface AuthContextValue {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
