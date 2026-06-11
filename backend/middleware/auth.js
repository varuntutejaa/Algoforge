const firebaseAdmin = require("../firebase-admin");
const { getAuth } = require("firebase-admin/auth");
const User = require("../models/users");

/**
 * Middleware: verifyFirebaseToken
 */
async function verifyFirebaseToken(req, res, next) {
  if (req.user) return next();

  if (!firebaseAdmin.isInitialized) {
    console.error("verifyFirebaseToken: Firebase Admin not initialized:", firebaseAdmin.initError);
    return res.status(503).json({
      success: false,
      message: "Authentication service is unavailable. Server misconfiguration.",
    });
  }

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message:
          "Missing or invalid Authorization header. Use: Bearer <firebase-id-token>",
      });
    }

    const idToken = authHeader.split(" ")[1];

    const decodedToken = await getAuth().verifyIdToken(idToken);

    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email || "";
    const name =
      decodedToken.name ||
      decodedToken.email?.split("@")[0] ||
      "User";
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
        createdAt: new Date(),
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
    console.error(
      "Firebase token verification failed:",
      error.message
    );

    return res.status(401).json({
      success: false,
      message:
        "Invalid or expired authentication token. Please sign in again.",
    });
  }
}

/**
 * Middleware: optionalAuth
 */
async function optionalAuth(req, res, next) {
  if (!firebaseAdmin.isInitialized) {
    req.user = null;
    req.firebaseUid = null;
    return next();
  }

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.user = null;
      req.firebaseUid = null;
      return next();
    }

    const idToken = authHeader.split(" ")[1];

    const decodedToken = await getAuth().verifyIdToken(idToken);

    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email || "";
    const name =
      decodedToken.name ||
      decodedToken.email?.split("@")[0] ||
      "User";
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
        createdAt: new Date(),
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
    req.user = null;
    req.firebaseUid = null;
    next();
  }
}

module.exports = {
  verifyFirebaseToken,
  optionalAuth,
};