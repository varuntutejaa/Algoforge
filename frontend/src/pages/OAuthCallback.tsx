import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CognitoUser, CognitoIdToken, CognitoAccessToken, CognitoRefreshToken, CognitoUserSession } from 'amazon-cognito-identity-js';
import { userPool, exchangeCodeForTokens } from '@/config/cognito';
import { backendAuth, useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';

/** Lands here after Cognito's Hosted UI hands control back post-Google-login.
 * Exchanges the auth code for tokens, wires up a CognitoUserSession the same
 * way a direct SRP login would (so the existing refresh-on-focus logic in
 * AuthContext works identically regardless of how the user signed in). */
export default function OAuthCallback() {
  const navigate = useNavigate();
  const toast = useToast();
  const { login } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const oauthError = params.get('error');

      if (oauthError) { setError('Google sign-in was cancelled or failed.'); return; }
      if (!code) { setError('Missing authorization code.'); return; }

      try {
        const tokens = await exchangeCodeForTokens(code);

        const idToken = new CognitoIdToken({ IdToken: tokens.id_token });
        const accessToken = new CognitoAccessToken({ AccessToken: tokens.access_token });
        const refreshToken = new CognitoRefreshToken({ RefreshToken: tokens.refresh_token });
        const session = new CognitoUserSession({ IdToken: idToken, AccessToken: accessToken, RefreshToken: refreshToken });

        const username = idToken.payload['cognito:username'] || idToken.payload['sub'];
        const cognitoUser = new CognitoUser({ Username: username, Pool: userPool });
        cognitoUser.setSignInUserSession(session);

        const jwt = idToken.getJwtToken();
        const data = await backendAuth('login', jwt, { name: idToken.payload.name || '' });
        if (!data.success) { setError(data.message || 'Sign-in failed'); return; }

        login(data.user, jwt);
        toast.success('Welcome!');
        navigate('/problems');
      } catch (err: any) {
        setError(err.message || 'Sign-in failed');
      }
    })();
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
