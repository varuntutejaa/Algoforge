import { describe, it, expect, beforeEach } from 'vitest';
import { sanitize, setPreferences, getPreferences, resolveTheme, DEFAULT_PREFERENCES, STORAGE_KEY } from './preferences';

describe('preferences', () => {
  beforeEach(() => {
    localStorage.clear();
    setPreferences(DEFAULT_PREFERENCES);
  });

  it('defaults to the dark theme the site has always had', () => {
    expect(DEFAULT_PREFERENCES.theme).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('repairs malformed stored values instead of trusting them', () => {
    expect(sanitize({ theme: 'neon', editorFontSize: 99, editorTabSize: 3, defaultLanguage: 'rust' })).toEqual(DEFAULT_PREFERENCES);
    expect(sanitize(null)).toEqual(DEFAULT_PREFERENCES);
    expect(sanitize({ theme: 'light', editorFontSize: 18, editorTabSize: 4, defaultLanguage: 'python' }))
      .toEqual({ theme: 'light', editorFontSize: 18, editorTabSize: 4, defaultLanguage: 'python' });
  });

  it('applies the theme to <html> and persists it', () => {
    setPreferences({ theme: 'light' });
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.documentElement.style.colorScheme).toBe('light');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).theme).toBe('light');
    expect(getPreferences().theme).toBe('light');
  });

  it('resolves "system" from the OS setting', () => {
    const original = window.matchMedia;
    window.matchMedia = ((q: string) => ({ matches: q.includes('light'), addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
    try {
      expect(resolveTheme('system')).toBe('light');
    } finally {
      window.matchMedia = original;
    }
  });
});
