// The signed-in person's own profile: the names and username chosen on the
// welcome step after signup, and changed later from Settings.
const express = require('express');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const router = express.Router();

const { prisma } = require('../config/prismaClient');
const { requireAuth } = require('../middleware/auth');
const {
    normalizeUsername, usernameError, normalizeName, nameError, displayName, publicUser,
} = require('../utils/userProfile');

// The welcome form checks availability as the person types (debounced), so
// this allows a burst, but not enough to enumerate every taken username.
const availabilityLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip),
    handler: (_req, res) => res.status(429).json({ success: false, message: 'Too many checks. Wait a moment and try again.' }),
});

const updateLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip),
    handler: (_req, res) => res.status(429).json({ success: false, message: 'Too many changes. Wait a moment and try again.' }),
});

router.get('/me', requireAuth, (req, res) => {
    res.json({ success: true, user: publicUser(req.user) });
});

router.get('/username-available', requireAuth, availabilityLimiter, async (req, res) => {
    const username = normalizeUsername(req.query.username);
    const problem = usernameError(username);
    if (problem) return res.json({ success: true, username, available: false, message: problem });

    // Keeping the name you already have is always allowed.
    if (req.user.username === username) return res.json({ success: true, username, available: true });

    try {
        const taken = await prisma.user.findUnique({ where: { username }, select: { id: true } });
        res.json({
            success: true,
            username,
            available: !taken,
            ...(taken ? { message: 'That username is taken.' } : {}),
        });
    } catch (error) {
        console.error('username availability check failed:', error.message);
        res.status(500).json({ success: false, message: 'Could not check that username. Try again.' });
    }
});

/**
 * Sets any of firstName, lastName and username. Fields that are left out keep
 * their current value, but the result must always have a first name and a
 * username, since those are what the welcome step requires.
 */
router.patch('/me', requireAuth, updateLimiter, async (req, res) => {
    const body = req.body || {};
    const user = req.user;
    const data = {};
    const errors = {};

    if ('firstName' in body) {
        data.firstName = normalizeName(body.firstName);
        const e = nameError(data.firstName, 'First name', { required: true });
        if (e) errors.firstName = e;
    }
    if ('lastName' in body) {
        const lastName = normalizeName(body.lastName);
        const e = nameError(lastName, 'Last name', { required: false });
        if (e) errors.lastName = e;
        data.lastName = lastName || null;
    }
    if ('username' in body) {
        data.username = normalizeUsername(body.username);
        const e = usernameError(data.username);
        if (e) errors.username = e;
    }

    if (!Object.keys(data).length) {
        return res.status(400).json({ success: false, message: 'Nothing to update.' });
    }

    const firstName = 'firstName' in data ? data.firstName : user.firstName;
    const lastName = 'lastName' in data ? data.lastName : user.lastName;
    const username = 'username' in data ? data.username : user.username;
    if (!firstName && !errors.firstName) errors.firstName = 'First name is required.';
    if (!username && !errors.username) errors.username = 'Choose a username.';

    if (Object.keys(errors).length) {
        return res.status(400).json({ success: false, message: Object.values(errors)[0], errors });
    }

    try {
        const updated = await prisma.user.update({
            where: { id: user.id },
            data: { ...data, name: displayName(firstName, lastName) },
        });
        res.json({ success: true, user: publicUser(updated) });
    } catch (error) {
        // The unique index is the real guard: two people can pass the
        // availability check for the same name, and only one insert wins.
        if (error.code === 'P2002') {
            const message = 'That username is taken.';
            return res.status(409).json({ success: false, message, errors: { username: message } });
        }
        console.error('profile update failed:', error.message);
        res.status(500).json({ success: false, message: 'Could not save your profile. Try again.' });
    }
});

module.exports = router;
