import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, authErrorMessage } from '@/config/firebase';
import { useToast } from '@/hooks/useToast';

/**
 * Firebase hosts the reset page itself: it emails a link, the user sets a new
 * password on Google's page, then returns to sign in. So unlike the previous
 * provider there is no in-app "enter the code, then choose a password" step to
 * implement — this screen only needs to request the email.
 */
export default function ForgotPassword() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { toast.error('Email is required'); return; }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
      toast.success('Check your email for a reset link.');
    } catch (err) {
      const code = (err as { code?: string })?.code;
      // Firebase returns auth/user-not-found here, which would confirm whether
      // an address is registered. Show the same result either way.
      if (code === 'auth/user-not-found') {
        setSent(true);
        toast.success('Check your email for a reset link.');
      } else {
        toast.error(authErrorMessage(err));
      }
    } finally { setLoading(false); }
  }

  return (
    <main className="page auth-page">
      <section className="form-panel">
        <div className="form-card">
          <div className="form-header">
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 20, textDecoration: 'none' }}>
              <img src="/assets/algoforge_favicon_themed.svg" alt="AlgoForge" style={{ width: 32, height: 32 }} />
              <span style={{ fontSize: 20, fontWeight: 800, color: '#f8fafc' }}>AlgoForge</span>
            </Link>
            <h2 className="form-title">Reset password</h2>
            <p className="form-sub">
              {sent
                ? <>If an account exists for <strong>{email}</strong>, a reset link is on its way.</>
                : "We'll send a reset link to your email."}
            </p>
          </div>

          {!sent && (
            <form onSubmit={handleSubmit} noValidate>
              <div className="field-group">
                <label className="field-label">Email</label>
                <div className="field-wrap">
                  <input type="email" className="field-input" placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                </div>
              </div>
              <button type="submit" className="submit-btn" disabled={loading} style={{ marginTop: 8 }}>
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          )}

          {sent && (
            <button
              type="button"
              className="submit-btn"
              style={{ marginTop: 8 }}
              onClick={() => { setSent(false); }}
            >
              Use a different email
            </button>
          )}

          <p className="signup-prompt">
            <Link to="/login" className="forgot-link">← Back to Login</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
