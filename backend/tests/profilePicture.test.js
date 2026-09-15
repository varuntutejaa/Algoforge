// The Google avatar has to survive the trip from token to UI.
//
// It was written only in the upsert's `create` branch, so a user who signed up
// with email/password before linking Google, or who changed their Google photo,
// kept whatever was stored at creation time -- usually nothing.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'middleware', 'auth.js'), 'utf8');
const upsert = src.slice(src.indexOf('prisma.user.upsert'), src.indexOf('prisma.user.upsert') + 500);

test('the profile picture is refreshed on login, not only at creation', () => {
    const update = upsert.slice(upsert.indexOf('update:'), upsert.indexOf('create:'));
    assert.ok(
        /profilePicture/.test(update),
        'the upsert update branch must write profilePicture, or the avatar never changes after signup'
    );
});

test('a token without a picture claim does not blank a stored avatar', () => {
    const update = upsert.slice(upsert.indexOf('update:'), upsert.indexOf('create:'));
    // The write has to be conditional on the claim being present.
    assert.ok(
        /\.\.\.\(picture\s*\?/.test(update),
        'profilePicture must only be written when the token actually carries one'
    );
});

test('the picture still comes from the verified token, not the request body', () => {
    assert.ok(
        /payload\.picture/.test(src),
        'the avatar must be read from the verified token claims'
    );
    assert.ok(
        !/req\.body\.(photoURL|picture|profilePicture)/.test(src),
        'trusting a body-supplied avatar would let anyone set another user\'s picture'
    );
});
