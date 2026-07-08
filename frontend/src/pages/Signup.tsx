import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, signInWithRedirect, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { backendAuth, persistUser } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';

export default function Signup() {
  const navigate = useNavigate();
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error('Name is required'); return; }
    if (!email.trim()) { toast.error('Email is required'); return; }
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: name.trim() });
      const idToken = await cred.user.getIdToken();
      const data = await backendAuth('signup', idToken, { name: name.trim() });
      if (!data.success) { toast.error(data.message || 'Signup failed'); return; }
      persistUser(data.user, idToken);
      toast.success('Account created!');
      setTimeout(() => navigate('/problems'), 900);
    } catch (err: any) {
      toast.error(err.message || 'Server error');
    } finally { setLoading(false); }
  }

  async function handleGoogle() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      const data = await backendAuth('signup', idToken, { name: result.user.displayName || '' });
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
            <h2 className="form-title">Create account</h2>
            <p className="form-sub">Join AlgoForge and start competing.</p>
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
              <label className="field-label">Password</label>
              <div className="field-wrap">
                <input type="password" className="field-input" placeholder="Minimum 6 characters" value={password}
                  onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
              </div>
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

          <p className="signup-prompt">
            Already have an account? <Link to="/login" className="signup-link">Sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
