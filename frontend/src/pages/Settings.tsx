import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import { ErrorState } from '@/components/ui/States';
import {
  fetchGithubStatus, startGithubConnect, updateGithubSettings, disconnectGithub,
  type GithubStatus,
} from '@/api/github';

/** Messages for the ?github=... the OAuth callback redirects back with. */
const CALLBACK_MESSAGES: Record<string, { kind: 'success' | 'error'; text: string }> = {
  connected:   { kind: 'success', text: 'GitHub connected — accepted solutions will be pushed automatically.' },
  denied:      { kind: 'error',   text: 'GitHub authorization was cancelled.' },
  expired:     { kind: 'error',   text: 'That authorization link expired. Please try connecting again.' },
  invalid:     { kind: 'error',   text: 'That authorization request was not valid. Please try again.' },
  unavailable: { kind: 'error',   text: 'GitHub sync is not configured on this server.' },
  failed:      { kind: 'error',   text: 'Could not finish connecting to GitHub. Please try again.' },
};

export default function Settings() {
  const { getHeaders, idToken } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();

  const [status, setStatus] = useState<GithubStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [repoInput, setRepoInput] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const s = await fetchGithubStatus(getHeaders());
      setStatus(s);
      setRepoInput(s.repo || 'algoforge-solutions');
    } catch (e: any) {
      setError(e.message || 'Could not load your settings');
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => { if (idToken) load(); }, [idToken, load]);

  // Surface the outcome of the OAuth round-trip, then drop the query params so
  // a refresh doesn't replay the message.
  useEffect(() => {
    const result = params.get('github');
    if (!result) return;
    const msg = CALLBACK_MESSAGES[result];
    if (msg) msg.kind === 'success' ? toast.success(msg.text) : toast.error(msg.text);
    params.delete('github'); params.delete('user'); params.delete('repo');
    setParams(params, { replace: true });
  }, [params, setParams, toast]);

  async function handleConnect() {
    setBusy(true);
    try {
      window.location.href = await startGithubConnect(getHeaders());
    } catch (e: any) {
      toast.error(e.message || 'Could not start the GitHub connection');
      setBusy(false);
    }
  }

  async function handleToggle(next: boolean) {
    setBusy(true);
    try {
      const r = await updateGithubSettings({ syncEnabled: next }, getHeaders());
      setStatus((s) => (s ? { ...s, syncEnabled: r.syncEnabled } : s));
      toast.success(next ? 'Auto-push enabled.' : 'Auto-push paused.');
    } catch (e: any) {
      toast.error(e.message || 'Could not update the setting');
    } finally { setBusy(false); }
  }

  async function handleRepoSave() {
    const repo = repoInput.trim();
    if (!repo) { toast.error('Enter a repository name'); return; }
    setBusy(true);
    try {
      const r = await updateGithubSettings({ repo }, getHeaders());
      setStatus((s) => (s ? { ...s, repo: r.repo } : s));
      toast.success(`Solutions will go to ${status?.username}/${r.repo}.`);
    } catch (e: any) {
      toast.error(e.message || 'Could not update the repository');
    } finally { setBusy(false); }
  }

  async function handleDisconnect() {
    setBusy(true);
    try {
      await disconnectGithub(getHeaders());
      await load();
      toast.success('GitHub disconnected.');
    } catch (e: any) {
      toast.error(e.message || 'Could not disconnect');
    } finally { setBusy(false); }
  }

  return (
    <main className="settings-page">
      <header className="settings-header">
        <span className="section-kicker">Account</span>
        <h1>Settings</h1>
        <p>Connect external services to your AlgoForge account.</p>
      </header>

      <section className="settings-card">
        <div className="settings-card-head">
          <div className="settings-card-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.3-1.7-1.3-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.3-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.1-.12-.3-.52-1.47.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.12 3.04.74.82 1.18 1.85 1.18 3.11 0 4.43-2.69 5.4-5.26 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z" />
            </svg>
          </div>
          <div>
            <h2>GitHub</h2>
            <p>Push every accepted solution straight to a repository on your account.</p>
          </div>
        </div>

        {loading && <p className="loading-text">Loading…</p>}
        {!loading && error && <ErrorState message={error} onRetry={load} />}

        {!loading && !error && status && !status.configured && (
          <p className="settings-note">GitHub sync isn’t configured on this server yet.</p>
        )}

        {!loading && !error && status?.configured && !status.connected && (
          <>
            <ul className="settings-facts">
              <li>Only accepted submissions are pushed — never a trial run.</li>
              <li>Asks for <code>public_repo</code> access only, not your private repositories.</li>
              <li>Your access token is encrypted before it is stored.</li>
            </ul>
            <button type="button" className="submit-btn" onClick={handleConnect} disabled={busy}>
              {busy ? 'Redirecting…' : 'Connect GitHub'}
            </button>
          </>
        )}

        {!loading && !error && status?.connected && (
          <>
            <div className="settings-row">
              <span className="settings-row-label">Account</span>
              <a
                className="settings-row-value"
                href={`https://github.com/${status.username}`}
                target="_blank"
                rel="noreferrer noopener"
              >
                @{status.username}
              </a>
            </div>

            <div className="settings-row">
              <span className="settings-row-label">Repository</span>
              <div className="settings-repo-edit">
                <input
                  className="field-input"
                  value={repoInput}
                  onChange={(e) => setRepoInput(e.target.value)}
                  placeholder="algoforge-solutions"
                  aria-label="Repository name"
                />
                <button
                  type="button"
                  className="af-retry-btn"
                  onClick={handleRepoSave}
                  disabled={busy || repoInput.trim() === status.repo}
                >
                  Save
                </button>
              </div>
            </div>

            <div className="settings-row">
              <span className="settings-row-label">Auto-push</span>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={status.syncEnabled}
                  onChange={(e) => handleToggle(e.target.checked)}
                  disabled={busy}
                />
                <span>{status.syncEnabled ? 'On' : 'Paused'}</span>
              </label>
            </div>

            <button type="button" className="af-retry-btn settings-danger" onClick={handleDisconnect} disabled={busy}>
              Disconnect
            </button>
            <p className="settings-note">
              Disconnecting removes the stored token. You can also revoke access from your{' '}
              <a href="https://github.com/settings/applications" target="_blank" rel="noreferrer noopener">
                GitHub settings
              </a>.
            </p>
          </>
        )}
      </section>
    </main>
  );
}
