const admin = require("firebase-admin");

let firebaseAdmin = null;

try {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
      // Handle both literal \n and actual newlines in the private key
      let formattedKey = privateKey;
      if (formattedKey.includes("\\n")) {
        formattedKey = formattedKey.replace(/\\n/g, "\n");
      }
      // Ensure the key has proper BEGIN/END markers
      if (!formattedKey.includes("-----BEGIN PRIVATE KEY-----")) {
        formattedKey = "-----BEGIN PRIVATE KEY-----\n" + formattedKey + "\n-----END PRIVATE KEY-----";
      }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: projectId,
          clientEmail: clientEmail,
          privateKey: formattedKey,
        }),
      });
    }
    firebaseAdmin = admin;
    console.log("Firebase Admin SDK initialized successfully");
  } else {
    console.warn("Firebase Admin SDK: Missing env vars. Auth middleware will reject tokens.");
    console.warn("  FIREBASE_PROJECT_ID:", !!projectId);
    console.warn("  FIREBASE_CLIENT_EMAIL:", !!clientEmail);
    console.warn("  FIREBASE_PRIVATE_KEY:", !!privateKey);
  }
} catch (error) {
  console.error("Firebase Admin SDK initialization failed:", error.message);
  console.error("Firebase Admin SDK initialization error stack:", error.stack);
}

module.exports = firebaseAdmin;
