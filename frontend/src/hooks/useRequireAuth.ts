import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';

/**
 * Sign-in prompt for actions rather than pages.
 *
 * Browsing is open; the actions that record something against an account are
 * where an identity is needed. Each call site used to re-implement this check,
 * which is how they drifted into giving different messages and forgetting to
 * pass a return path.
 *
 * Returns a guard that reports whether the caller may proceed, and otherwise
 * sends the user to /login with the current location so they come back here.
 */
export function useRequireAuth() {
  const { idToken, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  // A restored session has a user before the refreshed token arrives; either
  // is enough, or a reload would briefly lock the buttons.
  const signedIn = Boolean(idToken || user);

  const require = useCallback(
    (message: string): boolean => {
      if (signedIn) return true;
      toast.error(message);
      navigate('/login', { state: { from: location.pathname + location.search } });
      return false;
    },
    [signedIn, toast, navigate, location.pathname, location.search],
  );

  return { signedIn, require };
}
