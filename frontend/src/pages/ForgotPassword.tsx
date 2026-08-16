import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/config/supabase';
import { useToast } from '@/hooks/useToast';
import { API_BASE_URL } from '@/config/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const toast = useToast();
  const [stage, setStage] = useState<'email' | 'sent' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Supabase fires this once the recovery link's token lands in the URL and
  // establishes a temporary session scoped to the password-update call below.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setStage('reset');
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { toast.error('Email is required'); return; }
    setLoading(true);
    try {
      const checkRes = await fetch(`${API_BASE_URL}/api/auth/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const checkData = await checkRes.json();
      if (!checkData.exists) {
        toast.error('No account found with this email');
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/forgot-password`,
      });
      if (error) { toast.error(error.message || 'Failed to send reset link'); return; }

      setStage('sent');
      toast.success('Check your email for a reset link.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset link');
    } finally { setLoading(false); }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) { toast.error(error.message || 'Failed to reset password'); return; }

      await supabase.auth.signOut();
      toast.success('Password reset — sign in with your new password.');
      setTimeout(() => navigate('/login'), 900);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password');
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
              {stage === 'email' && "We'll send a reset link to your email."}
              {stage === 'sent' && <>Check <strong>{email}</strong> for the reset link.</>}
              {stage === 'reset' && 'Choose a new password.'}
            </p>
          </div>

          {stage === 'email' && (
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

          {stage === 'reset' && (
            <form onSubmit={handleReset} noValidate>
              <div className="field-group">
                <label className="field-label">New Password</label>
                <div className="field-wrap">
                  <input type="password" className="field-input" placeholder="Minimum 8 characters"
                    value={newPassword} onChange={e => setNewPassword(e.target.value)} autoComplete="new-password" />
                </div>
              </div>
              <div className="field-group">
                <label className="field-label">Confirm New Password</label>
                <div className="field-wrap">
                  <input type="password" className="field-input" placeholder="Repeat password"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" />
                </div>
              </div>
              <button type="submit" className="submit-btn" disabled={loading} style={{ marginTop: 8 }}>
                {loading ? 'Resetting…' : 'Reset Password'}
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
