const admin = require("firebase-admin");

let firebaseAdmin = null;

try {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    const serviceAccount = {
      type: "service_account",
      project_id: projectId,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || "",
      private_key: privateKey.replace(/\\n/g, "\n"),
      client_email: clientEmail,
      client_id: process.env.FIREBASE_CLIENT_ID || "",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL || "",
    };

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
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
