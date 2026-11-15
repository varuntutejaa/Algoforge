import { describe, it, expect } from 'vitest';
import { usernameError, normalizeUsername, nameError, suggestUsername, splitDisplayName } from './profileRules';

describe('profile rules (mirror of the API)', () => {
  it('accepts and rejects usernames the same way the server does', () => {
    expect(usernameError('ada_99')).toBeNull();
    expect(usernameError('ab')).toMatch(/at least 3/);
    expect(usernameError('a'.repeat(21))).toMatch(/at most 20/);
    expect(usernameError('9lives')).toMatch(/start with a letter/);
    expect(usernameError('ada.l')).toMatch(/letters, numbers and underscores/);
    expect(usernameError('admin')).toMatch(/reserved/);
    expect(normalizeUsername('  Ada_L ')).toBe('ada_l');
  });

  it('accepts real names and rejects markup', () => {
    expect(nameError("O'Brien", 'Last name', false)).toBeNull();
    expect(nameError('José', 'First name', true)).toBeNull();
    expect(nameError('', 'First name', true)).toMatch(/required/);
    expect(nameError('', 'Last name', false)).toBeNull();
    expect(nameError('<b>', 'First name', true)).toMatch(/only contain/);
  });

  it('suggests a valid username from the name, then the email', () => {
    expect(suggestUsername('Ada Lovelace', 'x@y.z')).toBe('ada_lovelace');
    expect(suggestUsername('José Núñez', 'x@y.z')).toBe('jose_nunez');
    expect(suggestUsername('', '123.varun@x.com')).toBe('varun');
    expect(suggestUsername('李', 'ab@x.com')).toBe('');
    const long = suggestUsername('Maximiliana Wolfeschlegelsteinhausen', 'x@y.z');
    expect(long.length).toBeLessThanOrEqual(20);
    expect(usernameError(long)).toBeNull();
  });

  it('prefills names from a provider display name but not from an email fallback', () => {
    expect(splitDisplayName('Ada King Lovelace', 'ada@x.com')).toEqual({ firstName: 'Ada', lastName: 'King Lovelace' });
    // The API falls back to the email's local part when there is no real name.
    expect(splitDisplayName('ada.l', 'ada.l@x.com')).toEqual({ firstName: '', lastName: '' });
  });
});
