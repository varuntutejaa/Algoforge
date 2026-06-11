// Initialize Firebase
if (!firebase.apps.length && window.algoforgeFirebaseConfig) {
    firebase.initializeApp(window.algoforgeFirebaseConfig);
}

const signupForm = document.getElementById("signupForm");

signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name            = document.getElementById("name").value;
    const email           = document.getElementById("email").value;
    const password        = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const submitBtn       = document.getElementById("submitBtn");
    const btnLabel        = document.getElementById("submitBtn")?.querySelector(".btn-label");
    const btnLoader       = document.getElementById("btnLoader");

    if (password !== confirmPassword) {
        showToast("Passwords do not match", "error");
        return;
    }

    if (submitBtn) submitBtn.disabled = true;
    if (btnLabel)  btnLabel.style.display  = "none";
    if (btnLoader) btnLoader.style.display = "";

    try {
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const firebaseUser   = userCredential.user;

        await firebaseUser.updateProfile({ displayName: name });

        const idToken = await firebaseUser.getIdToken();

        const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`
            },
            body: JSON.stringify({ name })
        });

        const data = await response.json();

        if (data.success) {
            localStorage.setItem("algoforge-auth", "true");
            localStorage.setItem("algoforge-id-token", idToken);
            localStorage.setItem("algoforge-user", JSON.stringify({
                id: data.user.id,
                firebaseUid: data.user.firebaseUid,
                name: data.user.name,
                email: data.user.email
            }));
            showToast("Account created! Redirecting…", "success");
            setTimeout(() => { window.location.href = "problems.html"; }, 1000);
        } else {
            showToast(data.message || "Signup failed", "error");
        }
    } catch (error) {
        console.error(error);
        showToast(error.message || "Server error. Please try again.", "error");
    } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (btnLabel)  btnLabel.style.display  = "";
        if (btnLoader) btnLoader.style.display = "none";
    }
});
