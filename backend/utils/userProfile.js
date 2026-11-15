// Rules for the names and username a person picks on the welcome step (and
// can change later in Settings). Shared by the API routes and their tests so
// the two can't drift apart.

const USERNAME_MIN = 3;
const USERNAME_MAX = 20;
const NAME_MAX = 40;

// Lowercase letters, digits and underscores, starting with a letter. Keeping
// it to one case is what makes the database's unique index case-insensitive
// in practice: "Varun" and "varun" are the same stored value.
const USERNAME_RE = /^[a-z][a-z0-9_]*$/;

// Letters from any script, combining marks, spaces, and the punctuation that
// appears in real names (O'Brien, Jean-Luc, St. John).
const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}' .-]*$/u;

// Names that would read as the site itself or collide with app routes.
const RESERVED_USERNAMES = new Set([
    'admin', 'administrator', 'algoforge', 'api', 'contest', 'contests',
    'dashboard', 'github', 'help', 'login', 'logout', 'me', 'moderator',
    'null', 'problems', 'root', 'settings', 'signup', 'staff', 'support',
    'system', 'undefined', 'welcome',
]);

function normalizeUsername(raw) {
    return typeof raw === 'string' ? raw.trim().toLowerCase() : '';
}

/** Returns an error message, or null when the (normalized) username is acceptable. */
function usernameError(username) {
    if (!username) return 'Choose a username.';
    if (username.length < USERNAME_MIN) return `Usernames need at least ${USERNAME_MIN} characters.`;
    if (username.length > USERNAME_MAX) return `Usernames can be at most ${USERNAME_MAX} characters.`;
    if (!/^[a-z]/.test(username)) return 'Usernames must start with a letter.';
    if (!USERNAME_RE.test(username)) return 'Use only letters, numbers and underscores.';
    if (RESERVED_USERNAMES.has(username)) return 'That username is reserved.';
    return null;
}

/** Collapses runs of whitespace so "  Ada   Lovelace " is stored as typed, minus the noise. */
function normalizeName(raw) {
    return typeof raw === 'string' ? raw.trim().replace(/\s+/g, ' ') : '';
}

/** Returns an error message, or null. `label` is "First name" or "Last name". */
function nameError(name, label, { required }) {
    if (!name) return required ? `${label} is required.` : null;
    if (name.length > NAME_MAX) return `${label} can be at most ${NAME_MAX} characters.`;
    if (!NAME_RE.test(name)) return `${label} can only contain letters, spaces, apostrophes, hyphens and periods.`;
    return null;
}

/** The display name shown on leaderboards, the navbar and elsewhere. */
function displayName(firstName, lastName) {
    return [firstName, lastName].filter(Boolean).join(' ');
}

/** The user fields the client is allowed to see about the signed-in account. */
function publicUser(user) {
    return {
        id: user.id,
        authId: user.authId,
        name: user.name,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        profilePicture: user.profilePicture,
        rating: user.rating,
    };
}

module.exports = {
    USERNAME_MIN,
    USERNAME_MAX,
    NAME_MAX,
    RESERVED_USERNAMES,
    normalizeUsername,
    usernameError,
    normalizeName,
    nameError,
    displayName,
    publicUser,
};
