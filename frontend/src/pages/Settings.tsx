import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import { useUsernameCheck } from '@/hooks/useUsernameCheck';
import { updateProfile, ProfileError, type ProfileFields } from '@/api/users';
import { normalizeName, nameError, normalizeUsername, NAME_MAX, USERNAME_MAX } from '@/lib/profileRules';
import { usePreferences, setPreferences, FONT_SIZES, type ThemeChoice } from '@/lib/preferences';
import Avatar from '@/components/ui/Avatar';
import UsernameHint from '@/components/ui/UsernameHint';
import type { Language } from '@/types/problem';

const THEMES: Array<{ value: ThemeChoice; label: string; hint: string }> = [
  { value: 'dark', label: 'Dark', hint: 'Easy on the eyes at night' },
  { value: 'light', label: 'Light', hint: 'Crisp in bright rooms' },
  { value: 'system', label: 'System', hint: 'Follows your device' },
];

const LANGUAGES: Array<{ value: Language; label: string }> = [
  { value: 'cpp', label: 'C++' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'js', label: 'JavaScript' },
  { value: 'c', label: 'C' },
];

function ProfileSection() {
  const { user, getHeaders, setProfile } = useAuth();
  const toast = useToast();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [serverErrors, setServerErrors] = useState<Partial<Record<keyof ProfileFields, string>>>({});
  const [saving, setSaving] = useState(false);

  const current = user?.username || '';
  const usernameStatus = useUsernameCheck(username, current);
  const firstErr = serverErrors.firstName || nameError(normalizeName(firstName), 'First name', true);
  const lastErr = serverErrors.lastName || nameError(normalizeName(lastName), 'Last name', false);
  const usernameOk = usernameStatus.state === 'available' || usernameStatus.state === 'unchanged';

  const dirty = normalizeName(firstName) !== (user?.firstName || '')
    || normalizeName(lastName) !== (user?.lastName || '')
    || normalizeUsername(username) !== current;
  const canSave = dirty && !firstErr && !lastErr && usernameOk && !saving;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setServerErrors({});
    try {
      const updated = await updateProfile({
        firstName: normalizeName(firstName),
        lastName: normalizeName(lastName),
        username: normalizeUsername(username),
      }, getHeaders());
      setProfile(updated);
      setFirstName(String(updated.firstName || ''));
      setLastName(String(updated.lastName || ''));
      setUsername(String(updated.username || ''));
      toast.success('Profile saved.');
    } catch (err) {
      if (err instanceof ProfileError) setServerErrors(err.errors);
      toast.error((err as Error).message);
    } finally { setSaving(false); }
  }

  const previewName = [normalizeName(firstName), normalizeName(lastName)].filter(Boolean).join(' ') || user?.name || '';

  return (
    <section className="settings-card" aria-labelledby="settings-profile">
      <div className="settings-card-head">
        <Avatar name={previewName} src={user?.photoURL} size={44} />
        <div>
          <h2 id="settings-profile">Profile</h2>
          <p>Your name appears on leaderboards and contest results. Your username is unique to you.</p>
        </div>
      </div>

      <form className="settings-form" onSubmit={handleSave} noValidate>
        <div className="field-row">
          <div className={`field-group${firstErr && firstName !== (user?.firstName || '') ? ' has-error' : ''}`}>
            <label className="field-label" htmlFor="settings-first">First name</label>
            <input id="settings-first" className="field-input" value={firstName} maxLength={NAME_MAX} autoComplete="given-name"
              onChange={(e) => { setFirstName(e.target.value); setServerErrors((s) => ({ ...s, firstName: undefined })); }} />
            {firstErr && firstName !== (user?.firstName || '') && <p className="field-error">{firstErr}</p>}
          </div>
          <div className={`field-group${lastErr ? ' has-error' : ''}`}>
            <label className="field-label" htmlFor="settings-last">Last name <span className="field-optional">optional</span></label>
            <input id="settings-last" className="field-input" value={lastName} maxLength={NAME_MAX} autoComplete="family-name"
              onChange={(e) => { setLastName(e.target.value); setServerErrors((s) => ({ ...s, lastName: undefined })); }} />
            {lastErr && <p className="field-error">{lastErr}</p>}
          </div>
        </div>

        <div className={`field-group${serverErrors.username || usernameStatus.state === 'invalid' || usernameStatus.state === 'taken' ? ' has-error' : ''}`}>
          <label className="field-label" htmlFor="settings-username">Username</label>
          <div className="field-wrap field-prefixed">
            <span className="field-prefix" aria-hidden="true">@</span>
            <input id="settings-username" className="field-input" value={username} maxLength={USERNAME_MAX}
              autoComplete="username" autoCapitalize="none" spellCheck={false} aria-describedby="settings-username-hint"
              onChange={(e) => { setUsername(e.target.value.replace(/\s/g, '').toLowerCase()); setServerErrors((s) => ({ ...s, username: undefined })); }} />
          </div>
          <UsernameHint id="settings-username-hint" status={usernameStatus} serverError={serverErrors.username} />
        </div>

        <div className="field-group">
          <span className="field-label">Email</span>
          <p className="settings-static">{user?.email}</p>
        </div>

        <div className="settings-actions">
          <button type="submit" className="submit-btn settings-save" disabled={!canSave}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </section>
  );
}

function AppearanceSection() {
  const { theme } = usePreferences();
  return (
    <section className="settings-card" aria-labelledby="settings-appearance">
      <div className="settings-card-head">
        <div>
          <h2 id="settings-appearance">Appearance</h2>
          <p>Choose how AlgoForge looks on this device.</p>
        </div>
      </div>
      <div className="theme-options" role="radiogroup" aria-labelledby="settings-appearance">
        {THEMES.map((t) => (
          <label key={t.value} className={`theme-option${theme === t.value ? ' selected' : ''}`}>
            <input type="radio" name="theme" value={t.value} checked={theme === t.value}
              onChange={() => setPreferences({ theme: t.value })} />
            <span className={`theme-swatch theme-swatch-${t.value}`} aria-hidden="true">
              <span className="sw-bar" />
              <span className="sw-line sw-line-1" />
              <span className="sw-line sw-line-2" />
              <span className="sw-chip" />
            </span>
            <span className="theme-option-text">
              <strong>{t.label}</strong>
              <span>{t.hint}</span>
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}

function EditorSection() {
  const prefs = usePreferences();
  return (
    <section className="settings-card" aria-labelledby="settings-editor">
      <div className="settings-card-head">
        <div>
          <h2 id="settings-editor">Code editor</h2>
          <p>Defaults for the problem editor and contest arena on this device.</p>
        </div>
      </div>

      <div className="settings-row">
        <label className="settings-row-label" htmlFor="pref-language">Default language</label>
        <select id="pref-language" className="settings-select" value={prefs.defaultLanguage}
          onChange={(e) => setPreferences({ defaultLanguage: e.target.value as Language })}>
          {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
      </div>

      <div className="settings-row">
        <label className="settings-row-label" htmlFor="pref-font">Font size</label>
        <select id="pref-font" className="settings-select" value={prefs.editorFontSize}
          onChange={(e) => setPreferences({ editorFontSize: Number(e.target.value) })}>
          {FONT_SIZES.map((n) => <option key={n} value={n}>{n}px</option>)}
        </select>
      </div>

      <div className="settings-row">
        <span className="settings-row-label" id="pref-tab-label">Tab width</span>
        <div className="segmented" role="radiogroup" aria-labelledby="pref-tab-label">
          {([2, 4] as const).map((n) => (
            <button key={n} type="button" role="radio" aria-checked={prefs.editorTabSize === n}
              className={prefs.editorTabSize === n ? 'active' : ''}
              onClick={() => setPreferences({ editorTabSize: n })}>
              {n} spaces
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Settings() {
  const { profileSynced } = useAuth();
  return (
    <main className="settings-page">
      <header className="settings-header">
        <span className="section-kicker">Account</span>
        <h1>Settings</h1>
        <p>Your profile, how AlgoForge looks, and how the editor behaves.</p>
      </header>

      <div className="settings-stack">
        {/* Remount once the API copy of the profile arrives, so the form starts from it. */}
        <ProfileSection key={profileSynced ? 'synced' : 'stored'} />
        <AppearanceSection />
        <EditorSection />

        <Link to="/github" className="settings-card settings-link-card">
          <span className="settings-card-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.3-1.7-1.3-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.3-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.1-.12-.3-.52-1.47.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.12 3.04.74.82 1.18 1.85 1.18 3.11 0 4.43-2.69 5.4-5.26 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z" />
            </svg>
          </span>
          <span className="settings-link-text">
            <strong>GitHub sync</strong>
            <span>Connect a repository for your accepted solutions</span>
          </span>
          <span className="settings-link-arrow" aria-hidden="true">→</span>
        </Link>
      </div>
    </main>
  );
}
