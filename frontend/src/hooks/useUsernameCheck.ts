import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { checkUsername } from '@/api/users';
import { normalizeUsername, usernameError } from '@/lib/profileRules';

export type UsernameStatus =
  | { state: 'idle' }
  | { state: 'invalid'; message: string }
  | { state: 'checking' }
  | { state: 'available' }
  | { state: 'unchanged' }
  | { state: 'taken'; message: string }
  | { state: 'error'; message: string };

/**
 * Live availability for a username field. Format problems are reported
 * immediately; the server is asked only once typing pauses, and a stale
 * answer for an earlier value is discarded.
 */
export function useUsernameCheck(raw: string, current = ''): UsernameStatus {
  const { getHeaders } = useAuth();
  const username = normalizeUsername(raw);
  const formatError = raw ? usernameError(username) : null;
  const [remote, setRemote] = useState<{ for: string; status: UsernameStatus } | null>(null);

  useEffect(() => {
    if (!username || formatError || username === current) return;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const r = await checkUsername(username, getHeaders(), ctrl.signal);
        setRemote({
          for: username,
          status: r.available ? { state: 'available' } : { state: 'taken', message: r.message || 'That username is taken.' },
        });
      } catch (e) {
        if (ctrl.signal.aborted) return;
        setRemote({ for: username, status: { state: 'error', message: (e as Error).message || 'Could not check that username.' } });
      }
    }, 350);
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [username, formatError, current, getHeaders]);

  if (!raw) return { state: 'idle' };
  if (formatError) return { state: 'invalid', message: formatError };
  if (username === current) return { state: 'unchanged' };
  if (remote?.for === username) return remote.status;
  return { state: 'checking' };
}
