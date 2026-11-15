import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { onIdTokenChanged, signOut as fbSignOut, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { API_BASE_URL } from '@/config/api';
import type { AlgoforgeUser } from '@/types/user';

interface AuthState {
  user: AlgoforgeUser | null;
  idToken: string | null;
  loading: boolean;
  /**
   * True once this session's profile has been read from the API (or came
   * back from a sign-in). Until then a stored user may predate the username
   * field, so "no username" can't yet be taken to mean "not chosen".
   */
  profileSynced: boolean;
}

interface AuthContextValue extends AuthState {
  /** Build Authorization header object for fetch() calls. */
  getHeaders: (extra?: HeadersInit) => HeadersInit;
  /** Call after a successful login/signup — persists to localStorage AND
   * updates context state immediately, so the Navbar etc. reflect it without
   * waiting for a page reload. */
  login: (user: AlgoforgeUser, idToken: string) => void;
  /** Replace the signed-in user's profile with a record from the API. */
  setProfile: (raw: Record<string, unknown>) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): AlgoforgeUser | null {
  try {
    const raw = JSON.parse(localStorage.getItem('algoforge-user') || 'null');
    if (!raw) return null;
    // Sessions stored before the avatar or the profile names were wired
    // through lack those fields.
    return {
      ...raw,
      photoURL: raw.photoURL ?? raw.profilePicture ?? '',
      firstName: raw.firstName ?? '',
      lastName: raw.lastName ?? '',
      username: raw.username ?? '',
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: readStoredUser(),
    idToken: null,
    loading: true,
    profileSynced: false,
  });

  // Held so getHeaders can always reach the latest token, even if a render
  // hasn't committed it into state yet — which is the case on the first paint
  // after a reload, while Firebase is still restoring the session.
  const fbUserRef = useRef<FirebaseUser | null>(null);
  const tokenRef = useRef<string | null>(null);
  // The uid whose profile has been (or is being) fetched, so the hourly token
  // refresh doesn't refetch it.
  const syncedUidRef = useRef<string | null>(null);

  useEffect(() => {
    // onIdTokenChanged (rather than onAuthStateChanged) also fires on silent
    // hourly token refreshes, so a long-lived tab never ends up sending an
    // expired token to the backend.
    const unsubscribe = onIdTokenChanged(auth, async (fbUser) => {
      fbUserRef.current = fbUser;
      if (!fbUser) {
        tokenRef.current = null;
        syncedUidRef.current = null;
        localStorage.removeItem('algoforge-user');
        setState({ user: null, idToken: null, loading: false, profileSynced: false });
        return;
      }
      try {
        const token = await fbUser.getIdToken();
        tokenRef.current = token;
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
        if (syncedUidRef.current !== fbUser.uid) {
          syncedUidRef.current = fbUser.uid;
          syncProfile(token, fbUser);
        }
      } catch {
        tokenRef.current = null;
        setState((prev) => ({ ...prev, idToken: null, loading: false }));
      }
    });

    // Reads the account's current profile, so a session restored from storage
    // learns about a username chosen on another device, and an account that
    // hasn't chosen one yet is sent to the welcome step.
    async function syncProfile(token: string, fbUser: FirebaseUser) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!res.ok || !data?.success || !data.user) throw new Error('profile unavailable');
        if (fbUserRef.current?.uid !== fbUser.uid) return; // signed out meanwhile
        const user = toAlgoforgeUser(data.user, fbUser.photoURL || '');
        try { localStorage.setItem('algoforge-user', JSON.stringify(user)); } catch { /* quota or private mode */ }
        setState((prev) => ({ ...prev, user, profileSynced: true }));
      } catch {
        // Retry on the next token event rather than locking anyone out.
        if (syncedUidRef.current === fbUser.uid) syncedUidRef.current = null;
      }
    }

    return () => unsubscribe();
  }, []);

  const getHeaders = useCallback(
    (extra: HeadersInit = {}): HeadersInit => {
      // Prefer state, but fall back to the token Firebase has already restored
      // into the SDK. On the first render after a reload the listener may not
      // have committed it yet, and without this fallback those early requests
      // go out unauthenticated and 401.
      const token = state.idToken || tokenRef.current;
      return token ? { Authorization: `Bearer ${token}`, ...extra } : { ...extra };
    },
    [state.idToken],
  );

  const login = useCallback((user: AlgoforgeUser, idToken: string) => {
    tokenRef.current = idToken;
    // The sign-in response is a fresh read of the profile.
    syncedUidRef.current = user.uid || syncedUidRef.current;
    localStorage.setItem('algoforge-user', JSON.stringify(user));
    setState({ user, idToken, loading: false, profileSynced: true });
  }, []);

  const setProfile = useCallback((raw: Record<string, unknown>) => {
    setState((prev) => {
      if (!prev.user) return prev;
      const user = toAlgoforgeUser(raw, prev.user.photoURL);
      try { localStorage.setItem('algoforge-user', JSON.stringify(user)); } catch { /* quota or private mode */ }
      return { ...prev, user, profileSynced: true };
    });
  }, []);

  const logout = useCallback(async () => {
    tokenRef.current = null;
    syncedUidRef.current = null;
    await fbSignOut(auth);
    localStorage.removeItem('algoforge-user');
    setState({ user: null, idToken: null, loading: false, profileSynced: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, getHeaders, login, setProfile, logout }}>
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
    firstName: raw?.firstName ?? '',
    lastName: raw?.lastName ?? '',
    username: raw?.username ?? '',
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
