const admin = require("firebase-admin");

console.log("VERSION_JUNE_11_FIREBASE_FIX");

let firebaseAdmin = null;

try {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  let formattedKey = privateKey.replace(/\\n/g, "\n");

  try {
    admin.app();
  } catch {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: formattedKey,
      }),
    });
  }

  firebaseAdmin = admin;
  console.log("✅ Firebase Admin SDK initialized successfully");
} catch (error) {
  console.error("❌ Firebase Admin SDK initialization failed");
  console.error(error);
}

module.exports = firebaseAdmin;