import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, browserLocalPersistence, setPersistence } from 'firebase/auth';

// These values are public by design — Firebase web config is shipped to every
// browser, and access is controlled by Firebase security rules and the
// authorized-domains list, not by keeping this secret.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Survive a reload/tab close; without this Firebase defaults can drop the
// session on some browsers when storage is partitioned.
setPersistence(auth, browserLocalPersistence).catch(() => {
  // Non-fatal: falls back to in-memory persistence for this tab.
});

export const googleProvider = new GoogleAuthProvider();
// Always show the account chooser rather than silently reusing one Google
// account — users signing in on a shared machine expect the picker.
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Firebase surfaces failures as `auth/...` codes. Map the ones users actually
 * hit to plain language; anything unmapped falls back to Firebase's own
 * message so nothing is silently swallowed.
 */
export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  const map: Record<string, string> = {
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/wrong-password': 'Incorrect email or password.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password must be at least 8 characters.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled.',
    'auth/cancelled-popup-request': 'Sign-in was cancelled.',
    'auth/popup-blocked': 'Your browser blocked the sign-in popup — allow popups and try again.',
    'auth/network-request-failed': "Can't reach the authentication service. Check your connection.",
    'auth/unauthorized-domain': 'This domain is not authorized for sign-in. Add it in Firebase console.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled for this project.',
  };
  if (map[code]) return map[code];
  const message = (err as { message?: string })?.message || 'Something went wrong. Please try again.';
  // Firebase prefixes messages with the code, e.g. "Firebase: Error (auth/...)."
  return message.replace(/^Firebase:\s*/, '');
}
