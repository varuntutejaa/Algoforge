import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

// Pages a signed-in person without a username may still be on.
const ONBOARDING_EXEMPT = ['/welcome', '/login', '/signup', '/forgot-password'];

/**
 * Sends anyone signed in without a username to the welcome step, then back to
 * where they were going. Waits for the profile to be read from the API, since
 * a session stored before usernames existed has none locally.
 */
export default function OnboardingGate() {
  const { user, profileSynced } = useAuth();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const needsProfile = Boolean(user && profileSynced && !user.username);

  useEffect(() => {
    if (!needsProfile || ONBOARDING_EXEMPT.includes(pathname)) return;
    navigate('/welcome', { replace: true, state: { from: pathname + search } });
  }, [needsProfile, pathname, search, navigate]);

  return null;
}
