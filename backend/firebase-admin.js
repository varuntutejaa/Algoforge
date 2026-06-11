const admin = require("firebase-admin");

let firebaseAdmin = null;

try {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  console.log("Firebase Admin Environment Check:");
  console.log("PROJECT_ID:", !!projectId);
  console.log("CLIENT_EMAIL:", !!clientEmail);
  console.log("PRIVATE_KEY:", !!privateKey);

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing one or more Firebase Admin environment variables."
    );
  }

  let formattedKey = privateKey;

  // Convert escaped newlines to actual newlines
  formattedKey = formattedKey.replace(/\\n/g, "\n");

  if (!admin.apps.length) {
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
  console.error("Message:", error.message);
  console.error("Stack:", error.stack);
}

module.exports = firebaseAdmin;