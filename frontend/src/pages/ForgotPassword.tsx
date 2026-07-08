import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { useToast } from '@/hooks/useToast';

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
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset email');
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
            <p className="form-sub">We'll send a reset link to your email.</p>
          </div>

          {sent ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontSize: 14, color: '#4fd1a0', textAlign: 'center', background: 'rgba(79,209,160,0.08)', borderRadius: 10, padding: '12px 16px' }}>
                ✓ Reset link sent to <strong>{email}</strong>. Check your inbox.
              </p>
              <Link to="/login" className="submit-btn" style={{ textAlign: 'center', display: 'block' }}>
                Back to Login
              </Link>
            </div>
          ) : (
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

          <p className="signup-prompt">
            <Link to="/login" className="forgot-link">← Back to Login</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
