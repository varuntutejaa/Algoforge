// Firebase-token-based login/signup: verifies the token and returns/creates the user profile.
const express = require('express');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/auth');
const User = require('../models/users');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(req.ip)
});

const emailCheckLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(req.ip)
});

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

router.post('/check-email', emailCheckLimiter, async (req, res) => {
    const email = (req.body.email || '').trim();
    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email: new RegExp(`^${escapeRegex(email)}$`, 'i') });
    res.json({ success: true, exists: !!user });
});

router.post('/login', authLimiter, verifyFirebaseToken, async (req, res) => {
    const user = req.user;
    res.json({
        success: true,
        message: "Login successful",
        user: {
            id: user._id.toString(),
            firebaseUid: user.firebaseUid,
            name: user.name,
            email: user.email,
            profilePicture: user.profilePicture,
            rating: user.rating
        }
    });
});

router.post('/signup', authLimiter, verifyFirebaseToken, async (req, res) => {
    const user = req.user;
    res.json({
        success: true,
        message: "Signup successful",
        user: {
            id: user._id.toString(),
            firebaseUid: user.firebaseUid,
            name: user.name,
            email: user.email,
            profilePicture: user.profilePicture
        }
    });
});

module.exports = router;
