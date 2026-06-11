const forgotForm = document.getElementById("forgotForm");

forgotForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email =
    document.getElementById("email").value;

    try {
        // Use Firebase to send password reset email
        if (!window.firebase || !window.algoforgeFirebaseConfig) {
            alert("Firebase is not configured. Please check your firebase-config.js.");
            return;
        }

        if (!firebase.apps.length) {
            firebase.initializeApp(window.algoforgeFirebaseConfig);
        }

        await firebase.auth().sendPasswordResetEmail(email);
        
        alert("Password reset email sent. Please check your inbox.");

    } catch (error) {

        console.log(error);
        alert(error.message || "Failed to send password reset email.");

    }

});
