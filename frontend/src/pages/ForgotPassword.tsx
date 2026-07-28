import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CognitoUser } from 'amazon-cognito-identity-js';
import { userPool } from '@/config/cognito';
import { useToast } from '@/hooks/useToast';
import { API_BASE_URL } from '@/config/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const toast = useToast();
  const [stage, setStage] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

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

      const cognitoUser = new CognitoUser({ Username: email.trim(), Pool: userPool });
      await new Promise<void>((resolve, reject) => {
        cognitoUser.forgotPassword({
          onSuccess: () => resolve(),
          onFailure: (err) => reject(err),
        });
      });

      setStage('reset');
      toast.success('Check your email for a reset code.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset code');
    } finally { setLoading(false); }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) { toast.error('Enter the code sent to your email'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const cognitoUser = new CognitoUser({ Username: email.trim(), Pool: userPool });
      await new Promise<void>((resolve, reject) => {
        cognitoUser.confirmPassword(code.trim(), newPassword, {
          onSuccess: () => resolve(),
          onFailure: (err) => reject(err),
        });
      });

      toast.success('Password reset — sign in with your new password.');
      setTimeout(() => navigate('/login'), 900);
    } catch (err: any) {
      toast.error(err.message || 'Invalid or expired code');
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
              {stage === 'email' ? "We'll send a reset code to your email." : <>Enter the code sent to <strong>{email}</strong>.</>}
            </p>
          </div>

          {stage === 'email' ? (
            <form onSubmit={handleSubmit} noValidate>
              <div className="field-group">
                <label className="field-label">Email</label>
                <div className="field-wrap">
                  <input type="email" className="field-input" placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                </div>
              </div>
              <button type="submit" className="submit-btn" disabled={loading} style={{ marginTop: 8 }}>
                {loading ? 'Sending…' : 'Send Reset Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} noValidate>
              <div className="field-group">
                <label className="field-label">Reset Code</label>
                <div className="field-wrap">
                  <input type="text" inputMode="numeric" className="field-input" placeholder="123456"
                    value={code} onChange={e => setCode(e.target.value)} autoComplete="one-time-code" />
                </div>
              </div>
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
