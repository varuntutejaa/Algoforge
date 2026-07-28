const { CognitoJwtVerifier } = require("aws-jwt-verify");
const { prisma } = require("../config/prismaClient");

// Verifies Cognito ID tokens. The User Pool ID encodes its own region, so
// aws-jwt-verify derives the JWKS issuer URL from it directly — no separate
// region config needed here.
//
// CognitoJwtVerifier.create() parses userPoolId eagerly and throws if it's
// missing/malformed, so this is guarded the same way the old firebase-admin
// init was — a misconfigured/not-yet-provisioned pool degrades auth-gated
// routes to a clear 503 instead of crashing the whole process at require time.
let verifier = null;
let initError = null;

try {
  if (!process.env.COGNITO_USER_POOL_ID || !process.env.COGNITO_CLIENT_ID) {
    throw new Error("COGNITO_USER_POOL_ID / COGNITO_CLIENT_ID are not set");
  }
  verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.COGNITO_USER_POOL_ID,
    tokenUse: "id",
    clientId: process.env.COGNITO_CLIENT_ID,
  });
} catch (error) {
  initError = error.message;
  console.error("Cognito verifier not initialized:", initError);
}

async function findOrCreateUser(payload) {
  const authId = payload.sub;
  const email = payload.email || "";
  const name = payload.name || email.split("@")[0] || "User";

  return prisma.user.upsert({
    where: { authId },
    update: { email, ...(name ? { name } : {}) },
    create: { authId, email, name, profilePicture: "" },
  });
}

/**
 * Middleware: requireAuth
 */
async function requireAuth(req, res, next) {
  if (req.user) return next();

  if (!verifier) {
    console.error("requireAuth: Cognito verifier not initialized:", initError);
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
        message: "Missing or invalid Authorization header. Use: Bearer <id-token>",
      });
    }

    const idToken = authHeader.split(" ")[1];
    const payload = await verifier.verify(idToken);

    req.user = await findOrCreateUser(payload);
    next();
  } catch (error) {
    console.error("Cognito token verification failed:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token. Please sign in again.",
    });
  }
}

/**
 * Middleware: optionalAuth
 */
async function optionalAuth(req, res, next) {
  if (!verifier) {
    req.user = null;
    return next();
  }

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }

    const idToken = authHeader.split(" ")[1];
    const payload = await verifier.verify(idToken);

    req.user = await findOrCreateUser(payload);
    next();
  } catch (error) {
    req.user = null;
    next();
  }
}

module.exports = {
  requireAuth,
  optionalAuth,
};
