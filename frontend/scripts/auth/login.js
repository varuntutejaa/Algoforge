(function () {
  'use strict';
  const loginForm   = document.getElementById('loginForm');
  const emailInput  = document.getElementById('email');
  const emailError  = document.getElementById('emailError');
  const emailGroup  = document.getElementById('emailGroup');
  const pwInput     = document.getElementById('password');
  const pwError     = document.getElementById('passwordError');
  const pwGroup     = document.getElementById('passwordGroup');
  const pwToggle    = document.getElementById('pwToggle');
  const eyeOpen     = pwToggle && pwToggle.querySelector('.eye-open');
  const eyeClosed   = pwToggle && pwToggle.querySelector('.eye-closed');
  const submitBtn   = document.getElementById('submitBtn');
  const btnLabel    = submitBtn && submitBtn.querySelector('.btn-label');
  const btnLoader   = document.getElementById('btnLoader');
  const btnArrow    = submitBtn && submitBtn.querySelector('.btn-arrow');
  let firebaseAuth = null;

  function markAuthenticated(user) {
    localStorage.setItem("algoforge-auth", "true");

    if (user) {
      localStorage.setItem("algoforge-user", JSON.stringify({
        id: user.id || user.uid || "",
        uid: user.firebaseUid || user.uid || user.id || "",
        firebaseUid: user.firebaseUid || "",
        name: user.name || user.displayName || "",
        email: user.email || "",
        photoURL: user.photoURL || user.profilePicture || ""
      }));
    }
  }

  function initFirebaseAuth() {
    if (!window.firebase || !window.algoforgeFirebaseConfig) {
      return null;
    }

    const config = window.algoforgeFirebaseConfig;

    if (!config.apiKey || config.apiKey.includes("PASTE_")) {
      console.warn("Firebase config is missing. Update firebase-config.js with your Firebase project values.");
      return null;
    }

    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }

    return firebase.auth();
  }

  firebaseAuth = initFirebaseAuth();

  if (pwToggle && pwInput) {
    pwToggle.addEventListener('click', () => {
      const isPassword = pwInput.type === 'password';
      pwInput.type = isPassword ? 'text' : 'password';

      if (eyeOpen && eyeClosed) {
        eyeOpen.style.display   = isPassword ? 'none'  : '';
        eyeClosed.style.display = isPassword ? ''      : 'none';
      }
    });
  }

  /* ===========================================================
     4. FORM VALIDATION HELPERS
  =========================================================== */
  function isValidEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  }

  function showError(group, errorEl, msg) {
    if (group && group.classList) group.classList.add('has-error');
    if (errorEl) errorEl.textContent = msg;
  }

  function clearError(group, errorEl) {
    if (group && group.classList) group.classList.remove('has-error');
    if (errorEl) errorEl.textContent = '';
  }

  // Live clearing on input
  emailInput && emailInput.addEventListener('input', () => {
    if (emailGroup.classList.contains('has-error')) {
      clearError(emailGroup, emailError);
    }
  });

  pwInput && pwInput.addEventListener('input', () => {
    if (pwGroup.classList.contains('has-error')) {
      clearError(pwGroup, pwError);
    }
  });

  function validateForm() {
    let valid = true;

    const emailVal = emailInput ? emailInput.value.trim() : '';
    const pwVal    = pwInput    ? pwInput.value           : '';

    if (!emailVal) {
      showError(emailGroup, emailError, 'Email is required');
      valid = false;
    } else if (!isValidEmail(emailVal)) {
      showError(emailGroup, emailError, 'Enter a valid email address');
      valid = false;
    } else {
      clearError(emailGroup, emailError);
    }

    if (!pwVal) {
      showError(pwGroup, pwError, 'Password is required');
      valid = false;
    } else if (pwVal.length < 6) {
      showError(pwGroup, pwError, 'Minimum 6 characters required');
      valid = false;
    } else {
      clearError(pwGroup, pwError);
    }

    return valid;
  }

  /* ===========================================================
     5. FORM SUBMIT - Firebase Auth Login
  =========================================================== */
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    // loading state
    if (submitBtn) submitBtn.disabled = true;
    if (btnLabel) btnLabel.style.display = 'none';
    if (btnArrow) btnArrow.style.display = 'none';
    if (btnLoader) btnLoader.style.display = '';
    
    try {
      if (!firebaseAuth) {
        showToast('Firebase is not configured. Check firebase-config.js.', 'error');
        return;
      }

      const userCredential = await firebaseAuth.signInWithEmailAndPassword(
        emailInput.value,
        pwInput.value
      );

      const firebaseUser = userCredential.user;
      const idToken = await firebaseUser.getIdToken();

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        }
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("algoforge-id-token", idToken);
        markAuthenticated(data.user);
        showToast('Welcome back!', 'success');
        setTimeout(() => { window.location.href = "problems.html"; }, 800);
      } else {
        showToast(data.message || "Login failed", "error");
      }
    } catch (error) {
      console.error("Login error:", error);
      showToast(error.message || "Login failed. Check your credentials.", "error");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (btnLabel)  btnLabel.style.display  = '';
      if (btnArrow)  btnArrow.style.display  = '';
      if (btnLoader) btnLoader.style.display = 'none';
    }
});
  }

  /* ===========================================================
     6. GOOGLE OAUTH
  =========================================================== */
  const googleBtn = document.getElementById('googleBtn');

  function showOAuthError(msg) {
    console.error('[Google Auth]', msg);
    showToast(msg, 'error');
  }

  async function handleGoogleResult(user) {
    const idToken = await user.getIdToken();
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`
      }
    });
    const data = await response.json();
    if (data.success) {
      localStorage.setItem("algoforge-id-token", idToken);
      markAuthenticated(data.user);
      window.location.href = 'problems.html';
    } else {
      showOAuthError(`Sign-in failed (${response.status}): ${data.message || 'Unknown error'}`);
    }
  }

  googleBtn && googleBtn.addEventListener('click', async () => {
    if (!firebaseAuth) {
      showOAuthError('Firebase is not initialised. Check the browser console for details.');
      console.error('[Google Auth] firebaseAuth is null — Firebase SDK may not have loaded.');
      return;
    }

    if (!firebase.auth || !firebase.auth.GoogleAuthProvider) {
      showOAuthError('Firebase Auth SDK did not load. Try refreshing the page.');
      return;
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    const origHtml = googleBtn.innerHTML;
    const restoreBtn = () => {
      googleBtn.innerHTML = origHtml;
      googleBtn.disabled = false;
      googleBtn.removeAttribute('aria-busy');
    };

    googleBtn.innerHTML = '<span class="btn-loader" style="display:inline-block;flex-shrink:0"></span>Signing in…';
    googleBtn.disabled = true;
    googleBtn.setAttribute('aria-busy', 'true');

    try {
      const result = await firebaseAuth.signInWithPopup(provider);
      if (result && result.user) {
        await handleGoogleResult(result.user);
      } else {
        showOAuthError('Google sign-in returned no user. Try again.');
        restoreBtn();
      }
    } catch (error) {
      console.error('[Google Auth] signInWithPopup error:', error.code, error.message, error);

      if (error.code === 'auth/popup-blocked') {
        googleBtn.innerHTML = '<span class="btn-loader" style="display:inline-block;flex-shrink:0"></span>Redirecting to Google…';
        setTimeout(() => firebaseAuth.signInWithRedirect(provider), 1500);
        return;
      }

      if (error.code === 'auth/popup-closed-by-user') {
        restoreBtn();
        return;
      }

      showOAuthError(`[${error.code || 'error'}] ${error.message || 'Google sign-in failed'}`);
      restoreBtn();
    }
  });

  // Handle redirect result (fallback path when popup was blocked)
  if (firebaseAuth && googleBtn) {
    let redirectPending = true;
    const origHtml = googleBtn.innerHTML;

    // Show loading in the button after a short delay — only fires if redirect is actually pending
    const loadingTimer = setTimeout(() => {
      if (!redirectPending) return;
      googleBtn.innerHTML = '<span class="btn-loader" style="display:inline-block;flex-shrink:0"></span>Completing sign-in…';
      googleBtn.disabled = true;
    }, 150);

    firebaseAuth.getRedirectResult()
      .then(async (result) => {
        redirectPending = false;
        clearTimeout(loadingTimer);
        googleBtn.innerHTML = origHtml;
        googleBtn.disabled = false;
        if (result && result.user) {
          await handleGoogleResult(result.user);
        }
      })
      .catch((error) => {
        redirectPending = false;
        clearTimeout(loadingTimer);
        googleBtn.innerHTML = origHtml;
        googleBtn.disabled = false;
        console.error('[Google Auth] getRedirectResult error:', error.code, error.message);
        if (error.code !== 'auth/popup-closed-by-user') {
          showOAuthError(`[${error.code || 'error'}] ${error.message || 'Google sign-in failed'}`);
        }
      });
  }

})();