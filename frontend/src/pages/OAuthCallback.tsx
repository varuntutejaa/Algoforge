import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/config/supabase';
import { backendAuth, useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';

/** Lands here after Google OAuth or an email-confirmation/recovery link hands
 * control back. The Supabase client auto-detects the session token in the
 * URL and fires onAuthStateChange — we just wait for that, then sync the
 * profile with our backend the same way a direct password login would. */
export default function OAuthCallback() {
  const navigate = useNavigate();
  const toast = useToast();
  const { login } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search || window.location.hash.replace('#', '?'));
    const oauthError = params.get('error') || params.get('error_description');
    if (oauthError) { setError(oauthError); return; }

    let settled = false;

    async function sync(idToken: string) {
      if (settled) return;
      settled = true;
      try {
        const res = await backendAuth('login', idToken);
        if (!res.success) { setError(res.message || 'Sign-in failed'); return; }
        login(res.user, idToken);
        toast.success('Welcome!');
        navigate('/problems');
      } catch (err: any) {
        setError(err.message || 'Sign-in failed');
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) sync(session.access_token);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) sync(session.access_token);
    });

    const timeout = setTimeout(() => { if (!settled) setError('Sign-in timed out. Please try again.'); }, 10000);

    return () => { subscription.unsubscribe(); clearTimeout(timeout); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="page auth-page">
      <section className="form-panel">
        <div className="form-card" style={{ textAlign: 'center' }}>
          {error ? (
            <>
              <p className="field-error" style={{ marginBottom: 16 }}>{error}</p>
              <Link to="/login" className="submit-btn" style={{ display: 'inline-block' }}>Back to Login</Link>
            </>
          ) : (
            <p className="form-sub">Signing you in…</p>
          )}
        </div>
      </section>
    </main>
  );
}
