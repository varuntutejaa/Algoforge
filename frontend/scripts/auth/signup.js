const signupForm = document.getElementById("signupForm");

signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
    }

    try {
        // 1. Create user in Firebase
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const firebaseUser = userCredential.user;

        // 2. Update Firebase profile with display name
        await firebaseUser.updateProfile({ displayName: name });

        // 3. Get Firebase ID token
        const idToken = await firebaseUser.getIdToken();

        // 4. Send token to backend to create MongoDB profile
        const response = await fetch(
            `${API_BASE_URL}/api/auth/signup`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`
                },
                body: JSON.stringify({ name })
            }
        );

        const data = await response.json();

        if (data.success) {
            // Store user info in localStorage
            localStorage.setItem("algoforge-auth", "true");
            localStorage.setItem("algoforge-user", JSON.stringify({
                id: data.user.id,
                firebaseUid: data.user.firebaseUid,
                name: data.user.name,
                email: data.user.email
            }));
            alert("Signup Successful");
            window.location.href = "problems.html";
        } else {
            alert(data.message || "Signup failed");
        }
    } catch (error) {
        console.log(error);
        // Firebase error messages are user-friendly
        alert(error.message || "Server Error");
    }
});