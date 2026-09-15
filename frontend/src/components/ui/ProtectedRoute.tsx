import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/**
 * Gate for routes that need an identity.
 *
 * `loading` stays true until Firebase has finished restoring any persisted
 * session, and nothing is rendered until then. Redirecting while it is still
 * unknown would bounce a signed-in user to /login on every reload, which is
 * exactly what "session doesn't persist" looks like from the outside.
 *
 * The attempted path is passed along so the login page can return the user
 * where they were headed instead of dropping them on a generic landing page.
 */
export default function ProtectedRoute() {
  const { idToken, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p className="loading-text route-loading">Loading…</p>;
  }

  // A restored session has a user before the fresh token arrives; either is
  // enough to let the route render rather than redirect.
  if (!idToken && !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return <Outlet />;
}
