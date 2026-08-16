import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/config/supabase';
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: readStoredUser(),
    idToken: null,
    loading: true,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState((prev) => ({ ...prev, idToken: session?.access_token ?? null, loading: false }));
    });

    // Supabase's client refreshes the access token on its own schedule and
    // fires this on every change (sign-in, sign-out, token refresh) — no
    // manual polling/focus-listener needed like the old Cognito setup.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((prev) => ({ ...prev, idToken: session?.access_token ?? null, loading: false }));
      if (!session) {
        localStorage.removeItem('algoforge-user');
        setState((prev) => ({ ...prev, user: null }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const getHeaders = useCallback(
    (extra: HeadersInit = {}): HeadersInit => {
      return state.idToken
        ? { Authorization: `Bearer ${state.idToken}`, ...extra }
        : { ...extra };
    },
    [state.idToken],
  );

  const login = useCallback((user: AlgoforgeUser, idToken: string) => {
    localStorage.setItem('algoforge-user', JSON.stringify(user));
    setState({ user, idToken, loading: false });
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('algoforge-user');
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
