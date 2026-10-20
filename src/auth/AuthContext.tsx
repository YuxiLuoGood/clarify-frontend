import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { clearToken, decodeToken, getToken, isTokenUsable, saveToken } from './token';

interface AuthContextValue {
  token: string | null;
  email: string | null;
  signIn: (token: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Holds the session in React state (mirrored to localStorage), so signing in
 * or out re-renders everything that depends on it — e.g. the alert socket
 * connects right after login instead of after the next page refresh.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    const stored = getToken();
    if (isTokenUsable(stored)) return stored;
    clearToken();
    return null;
  });

  const signIn = useCallback((next: string) => {
    saveToken(next);
    setToken(next);
  }, []);

  const signOut = useCallback(() => {
    clearToken();
    setToken(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ token, email: token ? decodeToken(token)?.sub ?? null : null, signIn, signOut }),
    [token, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
