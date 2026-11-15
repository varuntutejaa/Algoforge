// Names and usernames chosen on the welcome step after signup.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const {
    normalizeUsername, usernameError, normalizeName, nameError, displayName, publicUser,
} = require('../utils/userProfile');

const read = (...p) => fs.readFileSync(path.join(__dirname, '..', ...p), 'utf8');

test('usernames are stored lowercase, so uniqueness ignores case', () => {
    assert.equal(normalizeUsername('  Varun_T '), 'varun_t');
    assert.equal(normalizeUsername(undefined), '');
    assert.equal(normalizeUsername(42), '');
});

test('username rules', () => {
    assert.equal(usernameError('ada_99'), null);
    assert.equal(usernameError('abc'), null);
    assert.match(usernameError(''), /Choose/);
    assert.match(usernameError('ab'), /at least 3/);
    assert.match(usernameError('a'.repeat(21)), /at most 20/);
    assert.match(usernameError('9lives'), /start with a letter/);
    assert.match(usernameError('_ada'), /start with a letter/);
    assert.match(usernameError('ada lovelace'), /letters, numbers and underscores/);
    assert.match(usernameError('ada.l'), /letters, numbers and underscores/);
    assert.match(usernameError('admin'), /reserved/);
    assert.match(usernameError('settings'), /reserved/);
});

test('name rules accept real names in any script', () => {
    for (const name of ["O'Brien", 'Jean-Luc', 'St. John', 'José', 'Ngozi', 'वरुण', '李']) {
        assert.equal(nameError(normalizeName(name), 'First name', { required: true }), null, name);
    }
    assert.equal(normalizeName('  Ada   Lovelace '), 'Ada Lovelace');
    assert.match(nameError('', 'First name', { required: true }), /required/);
    assert.equal(nameError('', 'Last name', { required: false }), null);
    assert.match(nameError('a'.repeat(41), 'Last name', { required: false }), /at most 40/);
    assert.match(nameError('<script>', 'First name', { required: true }), /only contain/);
    assert.match(nameError('-dash', 'First name', { required: true }), /only contain/);
});

test('the display name joins first and last, skipping a missing last name', () => {
    assert.equal(displayName('Ada', 'Lovelace'), 'Ada Lovelace');
    assert.equal(displayName('Ada', null), 'Ada');
});

test('publicUser exposes the profile fields and never the GitHub token', () => {
    const out = publicUser({ id: '1', authId: 'a', name: 'Ada', email: 'a@x', firstName: 'Ada', lastName: null, username: 'ada', profilePicture: '', rating: 1200, githubToken: 'secret' });
    assert.equal(out.username, 'ada');
    assert.equal(out.lastName, '');
    assert.ok(!('githubToken' in out));
});

test('every users route requires sign-in', () => {
    const src = read('routes', 'users.js');
    for (const route of ["router.get('/me'", "router.get('/username-available'", "router.patch('/me'"]) {
        const line = src.split('\n').find((l) => l.includes(route));
        assert.ok(line, `${route} should exist`);
        assert.ok(line.includes('requireAuth'), `${route} must be authenticated`);
    }
    assert.match(read('server.js'), /app\.use\('\/api\/users', usersRoutes\)/);
});

test('a taken username is reported as a conflict, not a server error', () => {
    // The availability check can race; the unique index is the real guard.
    assert.match(read('routes', 'users.js'), /P2002[\s\S]{0,200}status\(409\)/);
    assert.match(read('prisma', 'schema.prisma'), /username\s+String\?\s+@unique/);
});

test('sign-in no longer overwrites a name the person chose', () => {
    const src = read('middleware', 'auth.js');
    const upsert = src.slice(src.indexOf('prisma.user.upsert'));
    const update = upsert.slice(upsert.indexOf('update:'), upsert.indexOf('create:'));
    assert.ok(!/\bname\b/.test(update), 'the upsert update branch must not write name');
    assert.match(upsert, /if \(!user\.username && name/, 'the provider name may only be followed before the welcome step');
});

test('the GitHub OAuth callback returns to the GitHub page', () => {
    assert.match(read('routes', 'github.js'), /res\.redirect\(`\$\{site\}\/github\?/);
});
