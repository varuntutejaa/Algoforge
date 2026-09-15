import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { onIdTokenChanged, signOut as fbSignOut, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/config/firebase';
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
    const raw = JSON.parse(localStorage.getItem('algoforge-user') || 'null');
    if (!raw) return null;
    // Sessions stored before the avatar was wired through have no photoURL.
    return { ...raw, photoURL: raw.photoURL ?? raw.profilePicture ?? '' };
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

  // Held so getHeaders can always mint a fresh token, even if a render hasn't
  // committed the latest one into state yet.
  const fbUserRef = useRef<FirebaseUser | null>(null);

  useEffect(() => {
    // onIdTokenChanged (rather than onAuthStateChanged) also fires on silent
    // hourly token refreshes, so a long-lived tab never ends up sending an
    // expired token to the backend.
    const unsubscribe = onIdTokenChanged(auth, async (fbUser) => {
      fbUserRef.current = fbUser;
      if (!fbUser) {
        localStorage.removeItem('algoforge-user');
        setState({ user: null, idToken: null, loading: false });
        return;
      }
      try {
        const token = await fbUser.getIdToken();
        setState((prev) => {
          // Heal a session that was stored before the avatar was carried
          // through, so an already-signed-in user doesn't keep showing a
          // letter until they log out and back in.
          const photoURL = fbUser.photoURL || '';
          const user = prev.user && photoURL && prev.user.photoURL !== photoURL
            ? { ...prev.user, photoURL }
            : prev.user;
          if (user !== prev.user) {
            try { localStorage.setItem('algoforge-user', JSON.stringify(user)); } catch { /* quota or private mode */ }
          }
          return { ...prev, user, idToken: token, loading: false };
        });
      } catch {
        setState((prev) => ({ ...prev, idToken: null, loading: false }));
      }
    });

    return () => unsubscribe();
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
    await fbSignOut(auth);
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

/**
 * The API returns the avatar as `profilePicture`; the app reads `photoURL`.
 * Mapping it here rather than at each call site is what keeps the Google
 * picture from being silently dropped on the way in.
 *
 * `fallbackPhoto` is the photo straight from the Firebase credential, used on
 * the very first Google sign-in when the backend row may predate the picture.
 */
function toAlgoforgeUser(raw: any, fallbackPhoto = ''): AlgoforgeUser {
  return {
    id: raw?.id ?? '',
    uid: raw?.authId ?? raw?.uid ?? '',
    name: raw?.name ?? '',
    email: raw?.email ?? '',
    photoURL: raw?.profilePicture || raw?.photoURL || fallbackPhoto || '',
  };
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
  const data = await res.json();
  if (data?.success && data.user) {
    data.user = toAlgoforgeUser(data.user, typeof body.photoURL === 'string' ? body.photoURL : '');
  }
  return data;
}
