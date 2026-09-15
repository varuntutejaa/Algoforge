// Symmetric encryption for third-party access tokens at rest.
//
// A stored GitHub token can write to the user's repositories, so a database
// dump must not be enough to use it — the key lives in the environment, not
// in the database.
//
// AES-256-GCM is authenticated: tampering with a stored value makes decryption
// fail loudly rather than silently returning altered bytes.
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;   // 96-bit nonce, the size GCM is specified for
const KEY_BYTES = 32;  // AES-256

let cachedKey = null;

/**
 * The key is 32 bytes, supplied as base64 or hex. Generate one with:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 */
function getKey() {
    if (cachedKey) return cachedKey;

    const raw = process.env.TOKEN_ENCRYPTION_KEY;
    if (!raw) throw new Error('TOKEN_ENCRYPTION_KEY is not set');

    let key;
    if (/^[0-9a-f]{64}$/i.test(raw)) key = Buffer.from(raw, 'hex');
    else key = Buffer.from(raw, 'base64');

    if (key.length !== KEY_BYTES) {
        throw new Error(`TOKEN_ENCRYPTION_KEY must decode to ${KEY_BYTES} bytes, got ${key.length}`);
    }
    cachedKey = key;
    return cachedKey;
}

/** True when encryption is usable, so callers can degrade instead of throwing. */
function isConfigured() {
    try { getKey(); return true; } catch { return false; }
}

/**
 * Returns "v1.<iv>.<authTag>.<ciphertext>", all base64url. The version prefix
 * leaves room to rotate the scheme later without guessing at old values.
 */
function encrypt(plaintext) {
    if (typeof plaintext !== 'string' || !plaintext) throw new Error('nothing to encrypt');
    const iv = crypto.randomBytes(IV_BYTES);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return ['v1', iv.toString('base64url'), tag.toString('base64url'), ciphertext.toString('base64url')].join('.');
}

function decrypt(payload) {
    if (typeof payload !== 'string' || !payload) throw new Error('nothing to decrypt');
    const parts = payload.split('.');
    if (parts.length !== 4 || parts[0] !== 'v1') throw new Error('unrecognized ciphertext format');

    const [, ivB64, tagB64, dataB64] = parts;
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivB64, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));
    return Buffer.concat([
        decipher.update(Buffer.from(dataB64, 'base64url')),
        decipher.final()
    ]).toString('utf8');
}

module.exports = { encrypt, decrypt, isConfigured };
