// Admin-only debug endpoint to check whether Firebase Admin env vars are configured correctly.
const express = require('express');
const router = express.Router();
const firebaseAdmin = require('../firebase-admin');
const { requireAdminKey } = require('../middleware/adminAuth');

router.get('/health', requireAdminKey, (req, res) => {
    res.json({
        success: true,
        firebaseConfigured: firebaseAdmin.isInitialized,
        initError: firebaseAdmin.initError,
        envVars: {
            FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
            FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
            FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY
        }
    });
});

module.exports = router;
