// Per-device preferences: theme and editor defaults. Kept in localStorage
// because they describe this browser (a laptop in a bright room, a phone at
// night) rather than the account.
import { useSyncExternalStore } from 'react';
import type { Language } from '@/types/problem';

export type ThemeChoice = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';

export interface Preferences {
  theme: ThemeChoice;
  editorFontSize: number;
  editorTabSize: 2 | 4;
  defaultLanguage: Language;
}

export const DEFAULT_PREFERENCES: Preferences = {
  theme: 'dark',
  editorFontSize: 15,
  editorTabSize: 2,
  defaultLanguage: 'cpp',
};

export const FONT_SIZES = [12, 13, 14, 15, 16, 18, 20] as const;
const LANGUAGES: Language[] = ['c', 'cpp', 'java', 'js', 'python'];

// index.html reads this same key before React loads, to avoid a flash of the
// wrong theme. Keep the two in step.
export const STORAGE_KEY = 'algoforge-prefs';

const THEME_COLORS: Record<ResolvedTheme, string> = { dark: '#050505', light: '#f6f7f9' }; // index.html uses the same light value

/** Repairs anything malformed in stored preferences instead of trusting it. */
export function sanitize(raw: unknown): Preferences {
  const p = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    theme: p.theme === 'light' || p.theme === 'system' || p.theme === 'dark' ? p.theme : DEFAULT_PREFERENCES.theme,
    editorFontSize: (FONT_SIZES as readonly number[]).includes(p.editorFontSize as number)
      ? (p.editorFontSize as number) : DEFAULT_PREFERENCES.editorFontSize,
    editorTabSize: p.editorTabSize === 4 ? 4 : 2,
    defaultLanguage: LANGUAGES.includes(p.defaultLanguage as Language)
      ? (p.defaultLanguage as Language) : DEFAULT_PREFERENCES.defaultLanguage,
  };
}

function read(): Preferences {
  try { return sanitize(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')); }
  catch { return { ...DEFAULT_PREFERENCES }; }
}

function systemTheme(): ResolvedTheme {
  try { return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'; }
  catch { return 'dark'; }
}

export function resolveTheme(choice: ThemeChoice): ResolvedTheme {
  return choice === 'system' ? systemTheme() : choice;
}

/** Puts the theme on <html>, where every stylesheet keys off it. */
export function applyTheme(choice: ThemeChoice) {
  const theme = resolveTheme(choice);
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
  return theme;
}

let current = read();
let resolved: ResolvedTheme = typeof document !== 'undefined' ? applyTheme(current.theme) : 'dark';
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function getPreferences(): Preferences {
  return current;
}

export function setPreferences(patch: Partial<Preferences>) {
  current = sanitize({ ...current, ...patch });
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(current)); } catch { /* private mode: still applies for this visit */ }
  resolved = applyTheme(current.theme);
  emit();
}

if (typeof window !== 'undefined') {
  // Another tab changed a preference.
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return;
    current = read();
    resolved = applyTheme(current.theme);
    emit();
  });
  // "System" follows the OS as it switches between light and dark.
  try {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
      if (current.theme !== 'system') return;
      resolved = applyTheme('system');
      emit();
    });
  } catch { /* very old browsers: system theme is read once */ }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function usePreferences(): Preferences {
  return useSyncExternalStore(subscribe, getPreferences, getPreferences);
}

/** The theme actually showing, with "system" already resolved. */
export function useResolvedTheme(): ResolvedTheme {
  return useSyncExternalStore(subscribe, () => resolved, () => resolved);
}
