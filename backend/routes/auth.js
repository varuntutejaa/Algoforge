// Firebase-token-based login/signup: verifies the token and returns/creates the user profile.
const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/auth');

router.post('/login', verifyFirebaseToken, async (req, res) => {
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

router.post('/signup', verifyFirebaseToken, async (req, res) => {
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
