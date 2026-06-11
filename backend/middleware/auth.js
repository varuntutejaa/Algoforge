const firebaseAdmin = require("../firebase-admin");
const User = require("../models/users");

/**
 * Middleware: verifyFirebaseToken
 * 
 * Reads Bearer token from Authorization header,
 * verifies it using Firebase Admin SDK,
 * loads or creates the MongoDB user profile,
 * attaches user to req.user.
 * 
 * If authentication fails, responds with 401.
 */
async function verifyFirebaseToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Missing or invalid Authorization header. Use: Bearer <firebase-id-token>"
      });
    }

    if (!firebaseAdmin) {
      return res.status(501).json({
        success: false,
        message: "Authentication service not configured. Server admin needs to set Firebase env vars."
      });
    }

    const idToken = authHeader.split(" ")[1];
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email || "";
    const name = decodedToken.name || decodedToken.email?.split("@")[0] || "User";
    const picture = decodedToken.picture || "";

    // Find or create MongoDB user profile
    let user = await User.findOne({ firebaseUid });

    if (!user) {
      user = new User({
        firebaseUid,
        email,
        name,
        profilePicture: picture,
        rating: 1200,
        problemsSolved: 0,
        contestsParticipated: 0,
        createdAt: new Date()
      });
      await user.save();
    } else {
      // Update profile fields on each login
      user.email = email;
      if (name) user.name = name;
      if (picture) user.profilePicture = picture;
      await user.save();
    }

    // Attach user info to request
    req.user = user;
    req.firebaseUid = firebaseUid;

    next();
  } catch (error) {
    console.error("Firebase token verification failed:", error.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token. Please sign in again."
    });
  }
}

/**
 * Middleware: optionalAuth
 * 
 * Same as verifyFirebaseToken but does not reject if no token is present.
 * Useful for routes that work for both guests and authenticated users.
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.user = null;
      req.firebaseUid = null;
      return next();
    }

    if (!firebaseAdmin) {
      req.user = null;
      req.firebaseUid = null;
      return next();
    }

    const idToken = authHeader.split(" ")[1];
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email || "";
    const name = decodedToken.name || decodedToken.email?.split("@")[0] || "User";
    const picture = decodedToken.picture || "";

    let user = await User.findOne({ firebaseUid });

    if (!user) {
      user = new User({
        firebaseUid,
        email,
        name,
        profilePicture: picture,
        rating: 1200,
        problemsSolved: 0,
        contestsParticipated: 0,
        createdAt: new Date()
      });
      await user.save();
    } else {
      user.email = email;
      if (name) user.name = name;
      if (picture) user.profilePicture = picture;
      await user.save();
    }

    req.user = user;
    req.firebaseUid = firebaseUid;

    next();
  } catch (error) {
    // Silently continue as guest
    req.user = null;
    req.firebaseUid = null;
    next();
  }
}

module.exports = { verifyFirebaseToken, optionalAuth };