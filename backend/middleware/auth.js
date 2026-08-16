const { createRemoteJWKSet, jwtVerify } = require("jose");
const { prisma } = require("../config/prismaClient");

// Supabase signs access tokens with a per-project ES256 key, published at a
// public JWKS endpoint — no shared secret to configure. jose's
// createRemoteJWKSet caches the key set and re-fetches on a kid it hasn't
// seen, so key rotation on Supabase's side doesn't need a redeploy here.
let jwks = null;
let issuer = null;
let initError = null;

try {
  if (!process.env.SUPABASE_URL) {
    throw new Error("SUPABASE_URL is not set");
  }
  issuer = `${process.env.SUPABASE_URL}/auth/v1`;
  jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));
} catch (error) {
  initError = error.message;
  console.error("Supabase JWKS not initialized:", initError);
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

  if (!jwks) {
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
    const { payload } = await jwtVerify(token, jwks, { issuer, audience: "authenticated" });

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
  if (!jwks) {
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
    const { payload } = await jwtVerify(token, jwks, { issuer, audience: "authenticated" });

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
