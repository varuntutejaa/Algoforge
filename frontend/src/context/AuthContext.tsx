import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  onIdTokenChanged,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import { API_BASE_URL } from '@/config/api';
import type { AlgoforgeUser } from '@/types/user';

interface AuthState {
  user: AlgoforgeUser | null;
  firebaseUser: FirebaseUser | null;
  idToken: string | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  /** Build Authorization header object for fetch() calls. */
  getHeaders: (extra?: HeadersInit) => HeadersInit;
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
    firebaseUser: null,
    idToken: localStorage.getItem('algoforge-id-token'),
    loading: true,
  });

  // Keep token fresh whenever Firebase rotates it (every ~1 h)
  useEffect(() => {
    const unsub = onIdTokenChanged(auth, async (fbUser) => {
      if (fbUser) {
        const token = await fbUser.getIdToken(false);
        localStorage.setItem('algoforge-id-token', token);
        setState((prev) => ({ ...prev, firebaseUser: fbUser, idToken: token, loading: false }));
      } else {
        setState((prev) => ({ ...prev, firebaseUser: null, loading: false }));
      }
    });
    return unsub;
  }, []);

  // Also refresh on visibility/focus so tokens don't go stale while tab is hidden
  useEffect(() => {
    const refresh = () => {
      if (localStorage.getItem('algoforge-auth') === 'true' && auth.currentUser) {
        auth.currentUser.getIdToken(false).then((t) => {
          localStorage.setItem('algoforge-id-token', t);
          setState((prev) => ({ ...prev, idToken: t }));
        });
      }
    };
    document.addEventListener('visibilitychange', () => !document.hidden && refresh());
    window.addEventListener('focus', refresh);
    // Periodic refresh every 15 min (well within Firebase's 1-hour expiry)
    const interval = setInterval(refresh, 15 * 60 * 1000);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
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

  const logout = useCallback(async () => {
    await signOut(auth);
    localStorage.removeItem('algoforge-auth');
    localStorage.removeItem('algoforge-user');
    localStorage.removeItem('algoforge-id-token');
    setState({ user: null, firebaseUser: null, idToken: null, loading: false });
  }, []);

  // Expose helper for pages that need to mark a user as authenticated after login
  useEffect(() => {
    // When localStorage has a stored user but state doesn't yet, sync it
    const stored = readStoredUser();
    if (stored && !state.user) {
      setState((prev) => ({ ...prev, user: stored }));
    }
  }, [state.user]);

  return (
    <AuthContext.Provider value={{ ...state, getHeaders, logout }}>
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

/** Shared helper: POST to backend auth endpoint with Firebase token */
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

/** Persist a successful login/signup to localStorage */
export function persistUser(user: AlgoforgeUser, idToken: string) {
  localStorage.setItem('algoforge-auth', 'true');
  localStorage.setItem('algoforge-id-token', idToken);
  localStorage.setItem('algoforge-user', JSON.stringify(user));
}
