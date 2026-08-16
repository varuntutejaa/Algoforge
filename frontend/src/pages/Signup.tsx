import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, OAUTH_REDIRECT_URI } from '@/config/supabase';
import { backendAuth, useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';

const STRENGTH_LEVELS = [
  { text: 'Weak', className: 'level-1' },
  { text: 'Fair', className: 'level-2' },
  { text: 'Good', className: 'level-3' },
  { text: 'Strong', className: 'level-4' },
] as const;

function getPasswordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  // Level is 1-4 (not 0-4) so any non-empty password shows at least one filled bar.
  const level = score <= 1 ? 1 : Math.min(score - 1, 4);
  return { level, ...STRENGTH_LEVELS[level - 1] };
}

export default function Signup() {
  const navigate = useNavigate();
  const toast = useToast();
  const { login } = useAuth();
  const [stage, setStage] = useState<'form' | 'sent'>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  async function handleGoogleSignIn() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: OAUTH_REDIRECT_URI },
    });
    if (error) { toast.error(error.message); setLoading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error('Name is required'); return; }
    if (!email.trim()) { toast.error('Email is required'); return; }
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { name: name.trim() }, emailRedirectTo: OAUTH_REDIRECT_URI },
      });
      if (error) {
        if (error.message.includes('already registered') || error.message.includes('User already registered')) {
          toast.error('An account with this email already exists.');
        } else {
          toast.error(error.message || 'Signup failed');
        }
        return;
      }

      // Email confirmation disabled on the Supabase project → session comes back immediately.
      if (data.session) {
        const idToken = data.session.access_token;
        const res = await backendAuth('signup', idToken, { name: name.trim() });
        if (!res.success) { toast.error(res.message || 'Signup failed'); return; }
        login(res.user, idToken);
        toast.success('Account created!');
        setTimeout(() => navigate('/problems'), 900);
        return;
      }

      setStage('sent');
      toast.success('Check your email to confirm your account.');
    } catch (err: any) {
      toast.error(err.message || 'Signup failed');
    } finally { setLoading(false); }
  }

  async function handleResend() {
    const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
    if (error) { toast.error(error.message || 'Failed to resend'); return; }
    toast.success('Confirmation email resent.');
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
            <h2 className="form-title">{stage === 'form' ? 'Create account' : 'Check your email'}</h2>
            <p className="form-sub">
              {stage === 'form' ? 'Join AlgoForge and start competing.' : <>We sent a confirmation link to <strong>{email}</strong>.</>}
            </p>
          </div>

          {stage === 'form' && (
            <>
              <button type="button" className="oauth-btn" onClick={handleGoogleSignIn} disabled={loading}>
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Continue with Google
              </button>

              <div className="divider"><span>or continue with</span></div>
            </>
          )}

          {stage === 'form' ? (
            <form className="signup-form" onSubmit={handleSubmit} noValidate>
              <div className="field-group">
                <label className="field-label">Full Name</label>
                <div className="field-wrap">
                  <input type="text" className="field-input" placeholder="Your name" value={name}
                    onChange={e => setName(e.target.value)} autoComplete="name" />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Email</label>
                <div className="field-wrap">
                  <input type="email" className="field-input" placeholder="you@example.com" value={email}
                    onChange={e => setEmail(e.target.value)} autoComplete="email" />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">
                  Password
                  {password && <span className={`pw-strength-label ${strength.className}`}>{strength.text}</span>}
                </label>
                <div className="field-wrap">
                  <input type="password" className="field-input" placeholder="Minimum 8 characters" value={password}
                    onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
                </div>
                {password && (
                  <div className="pw-strength-bar">
                    {[0, 1, 2, 3].map(i => (
                      <span key={i} className={`pw-strength-seg${i < strength.level ? ` filled ${strength.className}` : ''}`} />
                    ))}
                  </div>
                )}
              </div>

              <div className="field-group">
                <label className="field-label">Confirm Password</label>
                <div className="field-wrap">
                  <input type="password" className="field-input" placeholder="Repeat password" value={confirm}
                    onChange={e => setConfirm(e.target.value)} autoComplete="new-password" />
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Creating…' : 'Create Account'}
              </button>
            </form>
          ) : (
            <div className="signup-form">
              <p className="signup-prompt">
                Didn't get it?{' '}
                <button type="button" className="signup-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={handleResend}>
                  Resend
                </button>
              </p>
            </div>
          )}

          <p className="signup-prompt">
            Already have an account? <Link to="/login" className="signup-link">Sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
