// Client-side copy of backend/utils/userProfile.js, so the welcome form can
// explain a problem as the person types. The server re-checks everything.

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
export const NAME_MAX = 40;

const USERNAME_RE = /^[a-z][a-z0-9_]*$/;
const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}' .-]*$/u;
const RESERVED = new Set([
  'admin', 'administrator', 'algoforge', 'api', 'contest', 'contests',
  'dashboard', 'github', 'help', 'login', 'logout', 'me', 'moderator',
  'null', 'problems', 'root', 'settings', 'signup', 'staff', 'support',
  'system', 'undefined', 'welcome',
]);

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function usernameError(username: string): string | null {
  if (!username) return 'Choose a username.';
  if (username.length < USERNAME_MIN) return `Usernames need at least ${USERNAME_MIN} characters.`;
  if (username.length > USERNAME_MAX) return `Usernames can be at most ${USERNAME_MAX} characters.`;
  if (!/^[a-z]/.test(username)) return 'Usernames must start with a letter.';
  if (!USERNAME_RE.test(username)) return 'Use only letters, numbers and underscores.';
  if (RESERVED.has(username)) return 'That username is reserved.';
  return null;
}

export function normalizeName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

export function nameError(name: string, label: string, required: boolean): string | null {
  if (!name) return required ? `${label} is required.` : null;
  if (name.length > NAME_MAX) return `${label} can be at most ${NAME_MAX} characters.`;
  if (!NAME_RE.test(name)) return `${label} can only contain letters, spaces, apostrophes, hyphens and periods.`;
  return null;
}

/**
 * A starting suggestion built from the person's name or email, e.g.
 * "Ada Lovelace" -> "ada_lovelace". Returns '' when nothing usable is left.
 */
export function suggestUsername(name: string, email: string): string {
  // Decompose accents (é -> e + ´) and drop the marks, so "José" suggests "jose".
  const fromName = name.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const fromEmail = (email.split('@')[0] || '').toLowerCase().replace(/[^a-z0-9]+/g, '_');
  for (const source of [fromName, fromEmail]) {
    const s = source.replace(/^[^a-z]+/, '').replace(/_+$/, '').slice(0, USERNAME_MAX).replace(/_+$/, '');
    if (!usernameError(s)) return s;
  }
  return '';
}

/**
 * Splits a provider display name ("Ada King Lovelace") into a first name and
 * the rest. An email-derived fallback name is not a real name, so it is skipped.
 */
export function splitDisplayName(name: string, email: string): { firstName: string; lastName: string } {
  const clean = normalizeName(name);
  if (!clean || clean === (email.split('@')[0] || '')) return { firstName: '', lastName: '' };
  const [first, ...rest] = clean.split(' ');
  return { firstName: first, lastName: rest.join(' ') };
}
