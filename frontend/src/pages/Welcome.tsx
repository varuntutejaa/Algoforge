import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import { useUsernameCheck } from '@/hooks/useUsernameCheck';
import { updateProfile, ProfileError, type ProfileFields } from '@/api/users';
import {
  normalizeName, nameError, normalizeUsername, splitDisplayName, suggestUsername, USERNAME_MAX, NAME_MAX,
} from '@/lib/profileRules';
import Avatar from '@/components/ui/Avatar';
import UsernameHint from '@/components/ui/UsernameHint';

/**
 * The step after signup: a first and last name for leaderboards, and a
 * username nobody else has. Anyone signed in without a username is sent here
 * (see OnboardingGate), including accounts created before usernames existed.
 */
export default function Welcome() {
  const { user, getHeaders, setProfile, logout, profileSynced } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const redirectTo = (location.state as { from?: string } | null)?.from || '/problems';

  // Prefilled from the sign-in provider (Google gives a display name); the
  // person can change anything before continuing.
  const initial = useMemo(() => {
    const { firstName, lastName } = splitDisplayName(user?.name || '', user?.email || '');
    return {
      firstName: user?.firstName || firstName,
      lastName: user?.lastName || lastName,
      username: suggestUsername(user?.name || '', user?.email || ''),
    };
    // Only the first render's values are a suggestion; later renders are the person typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [username, setUsername] = useState(initial.username);
  const [touched, setTouched] = useState<Record<keyof ProfileFields, boolean>>({ firstName: false, lastName: false, username: Boolean(initial.username) });
  const [serverErrors, setServerErrors] = useState<Partial<Record<keyof ProfileFields, string>>>({});
  const [saving, setSaving] = useState(false);

  const usernameStatus = useUsernameCheck(username);

  // Already done (another tab, or a back-button visit): nothing to do here.
  useEffect(() => {
    if (profileSynced && user?.username && !saving) navigate(redirectTo, { replace: true });
  }, [profileSynced, user?.username, saving, navigate, redirectTo]);

  const firstErr = serverErrors.firstName || nameError(normalizeName(firstName), 'First name', true);
  const lastErr = serverErrors.lastName || nameError(normalizeName(lastName), 'Last name', false);
  const canSubmit = !firstErr && !lastErr && usernameStatus.state === 'available' && !saving;

  const previewName = [normalizeName(firstName), normalizeName(lastName)].filter(Boolean).join(' ') || 'Your name';
  const previewHandle = normalizeUsername(username) || 'username';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ firstName: true, lastName: true, username: true });
    if (!canSubmit) return;
    setSaving(true);
    setServerErrors({});
    try {
      const updated = await updateProfile({
        firstName: normalizeName(firstName),
        lastName: normalizeName(lastName),
        username: normalizeUsername(username),
      }, getHeaders());
      setProfile(updated);
      toast.success(`Welcome, ${normalizeName(firstName)}!`);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (err instanceof ProfileError) setServerErrors(err.errors);
      toast.error((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <main className="page auth-page welcome-page">
      <section className="form-panel welcome-panel">
        <div className="form-card welcome-card">
          <div className="form-header">
            <span className="welcome-step">Last step</span>
            <h1 className="form-title">Set up your profile</h1>
            <p className="form-sub">This is how you’ll appear on leaderboards and in contests.</p>
          </div>

          <div className="welcome-preview" aria-live="polite">
            <Avatar name={previewName} src={user?.photoURL} size={44} />
            <div className="welcome-preview-text">
              <strong>{previewName}</strong>
              <span>@{previewHandle}</span>
            </div>
          </div>

          <form className="signup-form" onSubmit={handleSubmit} noValidate>
            <div className="field-row">
              <div className={`field-group${touched.firstName && firstErr ? ' has-error' : ''}`}>
                <label className="field-label" htmlFor="welcome-first">First name</label>
                <div className="field-wrap">
                  <input id="welcome-first" className="field-input" value={firstName} maxLength={NAME_MAX}
                    autoComplete="given-name" autoFocus={!initial.firstName} placeholder="Ada"
                    onChange={(e) => { setFirstName(e.target.value); setServerErrors((s) => ({ ...s, firstName: undefined })); }}
                    onBlur={() => setTouched((t) => ({ ...t, firstName: true }))} />
                </div>
                {touched.firstName && firstErr && <p className="field-error">{firstErr}</p>}
              </div>

              <div className={`field-group${touched.lastName && lastErr ? ' has-error' : ''}`}>
                <label className="field-label" htmlFor="welcome-last">
                  Last name <span className="field-optional">optional</span>
                </label>
                <div className="field-wrap">
                  <input id="welcome-last" className="field-input" value={lastName} maxLength={NAME_MAX}
                    autoComplete="family-name" placeholder="Lovelace"
                    onChange={(e) => { setLastName(e.target.value); setServerErrors((s) => ({ ...s, lastName: undefined })); }}
                    onBlur={() => setTouched((t) => ({ ...t, lastName: true }))} />
                </div>
                {touched.lastName && lastErr && <p className="field-error">{lastErr}</p>}
              </div>
            </div>

            <div className={`field-group${touched.username && (serverErrors.username || usernameStatus.state === 'invalid' || usernameStatus.state === 'taken') ? ' has-error' : ''}`}>
              <label className="field-label" htmlFor="welcome-username">Username</label>
              <div className="field-wrap field-prefixed">
                <span className="field-prefix" aria-hidden="true">@</span>
                <input id="welcome-username" className="field-input" value={username} maxLength={USERNAME_MAX}
                  autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="ada_lovelace"
                  autoFocus={Boolean(initial.firstName)}
                  aria-describedby="welcome-username-hint"
                  onChange={(e) => { setUsername(e.target.value.replace(/\s/g, '').toLowerCase()); setServerErrors((s) => ({ ...s, username: undefined })); setTouched((t) => ({ ...t, username: true })); }} />
              </div>
              <UsernameHint id="welcome-username-hint" status={usernameStatus} serverError={serverErrors.username} />
            </div>

            <button type="submit" className="submit-btn" disabled={!canSubmit}>
              {saving ? 'Saving…' : 'Continue'}
            </button>
          </form>

          <p className="signup-prompt">
            Signed in as {user?.email || 'your account'}.{' '}
            <button type="button" className="signup-link link-button" onClick={async () => { await logout(); navigate('/login'); }}>
              Not you?
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
