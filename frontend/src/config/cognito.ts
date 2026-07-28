import { CognitoUserPool } from 'amazon-cognito-identity-js';
import { generateCodeVerifier, generateCodeChallenge } from '@/lib/pkce';

export const userPool = new CognitoUserPool({
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
});

export const COGNITO_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN;
export const OAUTH_REDIRECT_URI = `${window.location.origin}/auth/callback`;

const PKCE_VERIFIER_KEY = 'algoforge-pkce-verifier';

/** Redirects to Cognito's Hosted UI, which hands off to Google, using the
 * OAuth authorization-code + PKCE flow (no client secret in the browser). */
export async function redirectToGoogleSignIn() {
  const verifier = generateCodeVerifier();
  sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
  const challenge = await generateCodeChallenge(verifier);

  const params = new URLSearchParams({
    client_id: import.meta.env.VITE_COGNITO_CLIENT_ID,
    response_type: 'code',
    scope: 'openid email profile',
    redirect_uri: OAUTH_REDIRECT_URI,
    identity_provider: 'Google',
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });

  window.location.href = `https://${COGNITO_DOMAIN}/oauth2/authorize?${params.toString()}`;
}

/** Exchanges the authorization code from the callback URL for real tokens. */
export async function exchangeCodeForTokens(code: string): Promise<{
  id_token: string;
  access_token: string;
  refresh_token: string;
}> {
  const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);
  sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  if (!verifier) throw new Error('Sign-in session expired — please try again.');

  const res = await fetch(`https://${COGNITO_DOMAIN}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: import.meta.env.VITE_COGNITO_CLIENT_ID,
      code,
      redirect_uri: OAUTH_REDIRECT_URI,
      code_verifier: verifier,
    }),
  });

  const tokens = await res.json();
  if (!res.ok) throw new Error(tokens.error_description || tokens.error || 'Token exchange failed');
  return tokens;
}
