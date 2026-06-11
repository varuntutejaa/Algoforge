const forgotForm = document.getElementById("forgotForm");

forgotForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();

    if (!window.firebase || !window.algoforgeFirebaseConfig) {
        showToast("Firebase is not configured. Check firebase-config.js.", "error");
        return;
    }

    if (!firebase.apps.length) {
        firebase.initializeApp(window.algoforgeFirebaseConfig);
    }

    try {
        await firebase.auth().sendPasswordResetEmail(email);
        showToast("Password reset email sent. Check your inbox.", "success", 6000);
    } catch (error) {
        console.error(error);
        showToast(error.message || "Failed to send password reset email.", "error");
    }
});
