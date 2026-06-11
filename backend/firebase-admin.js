const { initializeApp, cert, getApps } = require("firebase-admin/app");

let isInitialized = false;
let initError = null;

try {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin environment variables");
  }

  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  isInitialized = true;
  console.log("✅ Firebase Admin SDK initialized successfully");
} catch (error) {
  initError = error.message;
  console.error("❌ Firebase Admin SDK initialization failed:", error.message);
}

module.exports = { isInitialized, initError };