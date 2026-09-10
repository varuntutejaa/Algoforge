const { prisma } = require("../config/prismaClient");

// Supabase signs access tokens with a per-project ES256 key, published at a
// public JWKS endpoint — no shared secret to configure. jose's
// createRemoteJWKSet caches the key set and re-fetches on a kid it hasn't
// seen, so key rotation on Supabase's side doesn't need a redeploy here.
//
// jose v6 is ESM-only. Node 22.12+ can require() ESM, but serverless
// bundlers (Vercel's included) still cannot — so it is imported dynamically
// and memoized rather than required at module load.
let josePromise = null;
function loadJose() {
  if (!josePromise) josePromise = import("jose");
  return josePromise;
}

let jwksPromise = null;
let issuer = null;
let initError = null;

if (process.env.SUPABASE_URL) {
  issuer = `${process.env.SUPABASE_URL}/auth/v1`;
} else {
  initError = "SUPABASE_URL is not set";
  console.error("Supabase JWKS not initialized:", initError);
}

// Built once and reused, so the key set stays cached across requests (and,
// on a warm serverless instance, across invocations).
function getJwks() {
  if (!jwksPromise) {
    jwksPromise = loadJose().then(({ createRemoteJWKSet }) =>
      createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`))
    );
  }
  return jwksPromise;
}

async function verifyToken(token) {
  const [{ jwtVerify }, jwks] = await Promise.all([loadJose(), getJwks()]);
  return jwtVerify(token, jwks, { issuer, audience: "authenticated" });
}

function extractName(payload) {
  const meta = payload.user_metadata || {};
  return meta.name || meta.full_name || (payload.email || "").split("@")[0] || "User";
}

async function findOrCreateUser(payload) {
  const authId = payload.sub;
  const email = payload.email || "";
  const name = extractName(payload);

  return prisma.user.upsert({
    where: { authId },
    update: { email, ...(name ? { name } : {}) },
    create: { authId, email, name, profilePicture: payload.user_metadata?.avatar_url || "" },
  });
}

/**
 * Middleware: requireAuth
 */
async function requireAuth(req, res, next) {
  if (req.user) return next();

  if (!issuer) {
    console.error("requireAuth: Supabase JWKS not initialized:", initError);
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
        message: "Missing or invalid Authorization header. Use: Bearer <access-token>",
      });
    }

    const token = authHeader.split(" ")[1];
    const { payload } = await verifyToken(token);

    req.user = await findOrCreateUser(payload);
    next();
  } catch (error) {
    console.error("Supabase token verification failed:", error.message);

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
