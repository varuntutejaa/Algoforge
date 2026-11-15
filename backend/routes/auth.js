// Supabase-token-based login/signup: verifies the access token and returns/creates the user profile.
const express = require('express');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { prisma } = require('../config/prismaClient');
const { publicUser } = require('../utils/userProfile');

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

router.post('/check-email', emailCheckLimiter, async (req, res) => {
    const email = (req.body.email || '').trim();
    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
    res.json({ success: true, exists: !!user });
});

router.post('/login', authLimiter, requireAuth, async (req, res) => {
    const user = req.user;
    // username is empty until the welcome step is done; the client uses that
    // to send the person there.
    res.json({
        success: true,
        message: "Login successful",
        user: publicUser(user)
    });
});

router.post('/signup', authLimiter, requireAuth, async (req, res) => {
    const user = req.user;
    res.json({
        success: true,
        message: "Signup successful",
        user: publicUser(user)
    });
});

module.exports = router;
