// Token encryption guards. A stored GitHub token can write to the user's
// repositories, so these pin the properties that make storing it acceptable:
// it is unreadable without the key, and tampering is detected rather than
// silently returning altered bytes.
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

process.env.TOKEN_ENCRYPTION_KEY = crypto.randomBytes(32).toString('base64');
const { encrypt, decrypt, isConfigured } = require('../services/crypto');

const SAMPLE = 'gho_exampletokenvalue1234567890';

test('a token round-trips through encrypt/decrypt', () => {
    assert.equal(decrypt(encrypt(SAMPLE)), SAMPLE);
});

test('ciphertext does not contain the plaintext', () => {
    const enc = encrypt(SAMPLE);
    assert.ok(!enc.includes(SAMPLE), 'the token must not survive in the stored value');
    assert.ok(enc.startsWith('v1.'), 'the scheme is versioned so it can be rotated later');
});

test('the same token encrypts differently every time', () => {
    // A fresh nonce per encryption; otherwise equal tokens would be linkable
    // by comparing stored values.
    assert.notEqual(encrypt(SAMPLE), encrypt(SAMPLE));
});

test('tampering with the ciphertext is rejected, not silently accepted', () => {
    const enc = encrypt(SAMPLE);
    const parts = enc.split('.');
    const data = Buffer.from(parts[3], 'base64url');
    data[0] ^= 0xff; // flip a bit in the payload
    parts[3] = data.toString('base64url');
    assert.throws(() => decrypt(parts.join('.')), 'GCM must reject a modified payload');
});

test('a value encrypted under a different key cannot be read', () => {
    const enc = encrypt(SAMPLE);
    const original = process.env.TOKEN_ENCRYPTION_KEY;
    try {
        process.env.TOKEN_ENCRYPTION_KEY = crypto.randomBytes(32).toString('base64');
        delete require.cache[require.resolve('../services/crypto')];
        const fresh = require('../services/crypto');
        assert.throws(() => fresh.decrypt(enc), 'a database dump alone must not be enough');
    } finally {
        process.env.TOKEN_ENCRYPTION_KEY = original;
        delete require.cache[require.resolve('../services/crypto')];
    }
});

test('malformed stored values are rejected', () => {
    assert.throws(() => decrypt('not-a-ciphertext'));
    assert.throws(() => decrypt('v9.a.b.c'), 'an unknown scheme version must not be guessed at');
    assert.throws(() => decrypt(''));
});

test('isConfigured reports whether a usable key is present', () => {
    assert.equal(isConfigured(), true);
});
