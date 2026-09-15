const { prisma } = require("../config/prismaClient");

// Firebase ID tokens are ordinary RS256 JWTs signed by Google, so they can be
// verified against Google's published public keys. That avoids pulling in
// firebase-admin (a large dependency that also wants a service-account secret)
// for what is ultimately one signature check.
//
// Contract for a Firebase ID token:
//   issuer   https://securetoken.google.com/<projectId>
//   audience <projectId>
//   sub      the Firebase uid  -> stored as User.authId
//
// jose v6 is ESM-only. Node 22.12+ can require() ESM, but serverless bundlers
// still cannot, so it is imported dynamically and memoized.
let josePromise = null;
function loadJose() {
  if (!josePromise) josePromise = import("jose");
  return josePromise;
}

const GOOGLE_JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

let jwksPromise = null;
let projectId = null;
let issuer = null;
let initError = null;

if (process.env.FIREBASE_PROJECT_ID) {
  projectId = process.env.FIREBASE_PROJECT_ID;
  issuer = `https://securetoken.google.com/${projectId}`;
} else {
  initError = "FIREBASE_PROJECT_ID is not set";
  console.error("Firebase token verification not initialized:", initError);
}

// Built once and reused so the key set stays cached across requests — and,
// on a warm serverless instance, across invocations. Google rotates these
// keys, and createRemoteJWKSet re-fetches when it sees an unknown kid.
function getJwks() {
  if (!jwksPromise) {
    jwksPromise = loadJose().then(({ createRemoteJWKSet }) =>
      createRemoteJWKSet(new URL(GOOGLE_JWKS_URL))
    );
  }
  return jwksPromise;
}

async function verifyToken(token) {
  const [{ jwtVerify }, jwks] = await Promise.all([loadJose(), getJwks()]);
  const { payload } = await jwtVerify(token, jwks, { issuer, audience: projectId });

  // Google signs tokens for every Firebase project with the same keys, so the
  // issuer/audience check above is what binds a token to *this* project.
  // `sub` must also be present and non-empty, since it becomes the user key.
  if (!payload.sub) throw new Error("token has no subject claim");
  return { payload };
}

/**
 * Firebase puts the display name and picture in top-level claims (populated
 * from the provider on Google sign-in, or from updateProfile for email/password
 * signups). Fall back to the email local-part so a user always has a name.
 */
function extractName(payload) {
  return payload.name || payload.displayName || (payload.email || "").split("@")[0] || "User";
}

async function findOrCreateUser(payload) {
  const authId = payload.sub;
  const email = payload.email || "";
  const name = extractName(payload);

  return prisma.user.upsert({
    where: { authId },
    update: { email, ...(name ? { name } : {}) },
    create: { authId, email, name, profilePicture: payload.picture || "" },
  });
}

/**
 * Middleware: requireAuth
 */
async function requireAuth(req, res, next) {
  if (req.user) return next();

  if (!issuer) {
    console.error("requireAuth: Firebase verification not initialized:", initError);
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

    const token = authHeader.split(" ")[1];
    const { payload } = await verifyToken(token);

    req.user = await findOrCreateUser(payload);
    next();
  } catch (error) {
    console.error("Firebase token verification failed:", error.message);

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
  if (!issuer) {
    req.user = null;
    return next();
  }

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(" ")[1];
    const { payload } = await verifyToken(token);

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
