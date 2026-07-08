// Debug endpoint to check whether Firebase Admin env vars are configured correctly.
const express = require('express');
const router = express.Router();
const firebaseAdmin = require('../firebase-admin');

router.get('/health', (req, res) => {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY || "";

    res.json({
        success: true,
        firebaseConfigured: firebaseAdmin.isInitialized,
        initError: firebaseAdmin.initError,
        envVars: {
            FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
            FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
            FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
            privateKeyLength: privateKey.length,
            privateKeyHasBegin: privateKey.includes("-----BEGIN PRIVATE KEY-----"),
            privateKeyHasEnd: privateKey.includes("-----END PRIVATE KEY-----"),
            privateKeyHasLiteralNewlines: privateKey.includes("\\n"),
            privateKeyHasActualNewlines: privateKey.includes("\n"),
        }
    });
});

module.exports = router;
