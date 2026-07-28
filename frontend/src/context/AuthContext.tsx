import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { CognitoUserSession } from 'amazon-cognito-identity-js';
import { userPool } from '@/config/cognito';
import { API_BASE_URL } from '@/config/api';
import type { AlgoforgeUser } from '@/types/user';

interface AuthState {
  user: AlgoforgeUser | null;
  idToken: string | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  /** Build Authorization header object for fetch() calls. */
  getHeaders: (extra?: HeadersInit) => HeadersInit;
  /** Call after a successful login/signup — persists to localStorage AND
   * updates context state immediately, so the Navbar etc. reflect it without
   * waiting for a page reload. */
  login: (user: AlgoforgeUser, idToken: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): AlgoforgeUser | null {
  try {
    return JSON.parse(localStorage.getItem('algoforge-user') || 'null');
  } catch {
    return null;
  }
}

/** Cognito's own SDK auto-refreshes an expired ID token using the stored
 * refresh token when getSession() is called — no manual refresh logic needed
 * beyond calling this periodically. */
function refreshSession(): Promise<CognitoUserSession | null> {
  return new Promise((resolve) => {
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) { resolve(null); return; }
    cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session || !session.isValid()) { resolve(null); return; }
      resolve(session);
    });
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: readStoredUser(),
    idToken: localStorage.getItem('algoforge-id-token'),
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function sync() {
      const session = await refreshSession();
      if (cancelled) return;
      if (session) {
        const token = session.getIdToken().getJwtToken();
        localStorage.setItem('algoforge-id-token', token);
        setState((prev) => ({ ...prev, idToken: token, loading: false }));
      } else {
        setState((prev) => ({ ...prev, loading: false }));
      }
    }
    sync();

    // Refresh on tab focus/visibility so a long-idle tab doesn't hold a stale token
    const onFocus = () => { if (!document.hidden) sync(); };
    document.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);
    const interval = setInterval(sync, 15 * 60 * 1000);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, []);

  const getHeaders = useCallback(
    (extra: HeadersInit = {}): HeadersInit => {
      const token = state.idToken || localStorage.getItem('algoforge-id-token');
      return token
        ? { Authorization: `Bearer ${token}`, ...extra }
        : { ...extra };
    },
    [state.idToken],
  );

  const login = useCallback((user: AlgoforgeUser, idToken: string) => {
    localStorage.setItem('algoforge-auth', 'true');
    localStorage.setItem('algoforge-id-token', idToken);
    localStorage.setItem('algoforge-user', JSON.stringify(user));
    setState({ user, idToken, loading: false });
  }, []);

  const logout = useCallback(async () => {
    userPool.getCurrentUser()?.signOut();
    localStorage.removeItem('algoforge-auth');
    localStorage.removeItem('algoforge-user');
    localStorage.removeItem('algoforge-id-token');
    setState({ user: null, idToken: null, loading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, getHeaders, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook — throws if used outside AuthProvider */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/** Shared helper: POST to backend auth endpoint with a bearer token */
export async function backendAuth(
  endpoint: 'login' | 'signup',
  idToken: string,
  body: Record<string, unknown> = {},
) {
  const res = await fetch(`${API_BASE_URL}/api/auth/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify(body),
  });
  return res.json();
}
