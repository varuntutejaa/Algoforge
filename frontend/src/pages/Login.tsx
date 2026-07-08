import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { backendAuth, persistUser } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate() {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!emailRe.test(email.trim())) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Minimum 6 characters';
    setErrors(e);
    return !Object.keys(e).length;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const idToken = await cred.user.getIdToken();
      const data = await backendAuth('login', idToken);
      if (!data.success) { toast.error(data.message || 'Login failed'); return; }
      persistUser(data.user, idToken);
      toast.success('Welcome back!');
      setTimeout(() => navigate('/problems'), 800);
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally { setLoading(false); }
  }

  async function handleGoogle() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      const data = await backendAuth('login', idToken);
      if (!data.success) { toast.error(data.message || 'Google sign-in failed'); return; }
      persistUser(data.user, idToken);
      navigate('/problems');
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked') { await signInWithRedirect(auth, provider); return; }
      if (err.code !== 'auth/popup-closed-by-user') toast.error(err.message || 'Google sign-in failed');
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
            <h2 className="form-title">Sign in</h2>
            <p className="form-sub">Welcome back to AlgoForge.</p>
          </div>

          <button type="button" className="oauth-btn" onClick={handleGoogle} disabled={loading}>
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>

          <div className="divider"><span>or continue with</span></div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className={`field-group${errors.email ? ' has-error' : ''}`}>
              <label className="field-label">Email</label>
              <div className="field-wrap">
                <input type="email" className="field-input" placeholder="you@example.com"
                  value={email} onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })); }}
                  autoComplete="email" />
              </div>
              {errors.email && <p className="field-error">{errors.email}</p>}
            </div>

            <div className={`field-group${errors.password ? ' has-error' : ''}`}>
              <label className="field-label">
                Password{' '}
                <Link to="/forgot-password" className="forgot-link" style={{ float: 'right' }}>Forgot?</Link>
              </label>
              <div className="field-wrap">
                <input type={showPw ? 'text' : 'password'} className="field-input" placeholder="••••••••"
                  value={password} onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })); }}
                  autoComplete="current-password" />
                <button type="button" className="pw-toggle" onClick={() => setShowPw(v => !v)}>
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
              {errors.password && <p className="field-error">{errors.password}</p>}
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="signup-prompt">
            New to AlgoForge? <Link to="/signup" className="signup-link">Create account</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
