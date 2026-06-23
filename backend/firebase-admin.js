const { initializeApp, cert, getApps } = require("firebase-admin/app");
const path = require("path");
const fs = require("fs");

let isInitialized = false;
let initError = null;

try {
  if (!getApps().length) {
    const projectId   = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (projectId && clientEmail && privateKey) {
      initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
    } else {
      // Fallback: look for service account JSON file in the project root
      const jsonPath = path.resolve(__dirname, "../algoforge-d0e7e-firebase-adminsdk-fbsvc-e80f171fc5.json");
      if (!fs.existsSync(jsonPath)) throw new Error("Missing Firebase Admin environment variables");
      const serviceAccount = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
      initializeApp({ credential: cert(serviceAccount) });
    }
  }

  isInitialized = true;
  console.log("✅ Firebase Admin SDK initialized successfully");
} catch (error) {
  initError = error.message;
  console.error("❌ Firebase Admin SDK initialization failed:", error.message);
}

module.exports = { isInitialized, initError };