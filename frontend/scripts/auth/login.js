(function () {
  'use strict';
  const html        = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
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
  const termText    = document.getElementById('terminalText');
  let firebaseAuth = null;

  function markAuthenticated(user) {
    localStorage.setItem("algoforge-auth", "true");

    if (user) {
      localStorage.setItem("algoforge-user", JSON.stringify({
        id: user.id || user.uid || "",
        uid: user.uid || user.id || "",
        name: user.name || user.displayName || "",
        email: user.email || "",
        photoURL: user.photoURL || ""
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

  /* ===========================================================
     1. THEME TOGGLE
  =========================================================== */
  const STORAGE_KEY = 'algoforge-theme';

  function getStoredTheme() {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  }

  function setStoredTheme(theme) {
    try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
  }

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    setStoredTheme(theme);
  }

  // Apply saved or system-preferred theme on load
  (function initTheme() {
    const saved = getStoredTheme();
    if (saved === 'light' || saved === 'dark') {
      applyTheme(saved);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: light)').matches;
      applyTheme(prefersDark ? 'dark' : 'light');
    }
  })();

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = html.getAttribute('data-theme');
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  const lines = [
    'run build --target=prod',
    'analyse O(n log n) sort',
    'forge --algo=dijkstra',
    'connect workspace team-1',
    'git commit -m "fix merge"',
  ];

  let lineIdx  = 0;
  let charIdx  = 0;
  let deleting = false;
  let paused   = false;

  function typeWriter() {
    if (!termText) return;

    const currentLine = lines[lineIdx];

    if (paused) {
      paused = false;
      setTimeout(typeWriter, 1200);
      return;
    }

    if (!deleting) {
      // Typing forward
      charIdx++;
      termText.textContent = currentLine.slice(0, charIdx);

      if (charIdx === currentLine.length) {
        paused   = true;
        deleting = true;
        setTimeout(typeWriter, 80);
      } else {
        setTimeout(typeWriter, 60);
      }
    } else {
      // Deleting
      charIdx--;
      termText.textContent = currentLine.slice(0, charIdx);

      if (charIdx === 0) {
        deleting = false;
        lineIdx  = (lineIdx + 1) % lines.length;
        setTimeout(typeWriter, 400);
      } else {
        setTimeout(typeWriter, 35);
      }
    }
  }

  typeWriter();


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
     6. OAUTH BUTTONS (placeholder handlers)
  =========================================================== */
  const githubBtn = document.getElementById('githubBtn');
  const googleBtn = document.getElementById('googleBtn');

  githubBtn && githubBtn.addEventListener('click', () => {
    console.log('GitHub OAuth triggered');
    // window.location.href = '/auth/github';
  });

  function showOAuthError(msg) {
    console.error('[Google Auth]', msg);
    showToast(msg, 'error');
  }

  function clearOAuthError() {
    // errors now auto-dismiss via toast
  }

  async function handleGoogleResult(user) {
    console.log('[Google Auth] got Firebase user, fetching id token...');
    const idToken = await user.getIdToken();
    console.log('[Google Auth] calling /api/auth/login...');
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`
      }
    });
    const data = await response.json();
    console.log('[Google Auth] backend response:', response.status, data);
    if (data.success) {
      localStorage.setItem("algoforge-id-token", idToken);
      markAuthenticated(data.user);
      window.location.href = 'problems.html';
    } else {
      showOAuthError(`Sign-in failed (${response.status}): ${data.message || 'Unknown error'}`);
    }
  }

  googleBtn && googleBtn.addEventListener('click', async () => {
    clearOAuthError();

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

    googleBtn.disabled = true;
    googleBtn.setAttribute('aria-busy', 'true');
    console.log('[Google Auth] calling signInWithPopup...');

    try {
      const result = await firebaseAuth.signInWithPopup(provider);
      console.log('[Google Auth] signInWithPopup result:', result);
      if (result && result.user) {
        await handleGoogleResult(result.user);
      } else {
        showOAuthError('Google sign-in returned no user. Try again.');
        googleBtn.disabled = false;
        googleBtn.removeAttribute('aria-busy');
      }
    } catch (error) {
      console.error('[Google Auth] signInWithPopup error:', error.code, error.message, error);

      if (error.code === 'auth/popup-blocked') {
        showOAuthError('Popup was blocked by your browser. Redirecting to Google instead…');
        setTimeout(() => firebaseAuth.signInWithRedirect(provider), 1500);
        return;
      }

      if (error.code === 'auth/popup-closed-by-user') {
        clearOAuthError();
        googleBtn.disabled = false;
        googleBtn.removeAttribute('aria-busy');
        return;
      }

      showOAuthError(`[${error.code || 'error'}] ${error.message || 'Google sign-in failed'}`);
      googleBtn.disabled = false;
      googleBtn.removeAttribute('aria-busy');
    }
  });

  // Handle redirect result (fallback path when popup was blocked)
  if (firebaseAuth) {
    firebaseAuth.getRedirectResult()
      .then(async (result) => {
        console.log('[Google Auth] getRedirectResult:', result);
        if (result && result.user) {
          await handleGoogleResult(result.user);
        }
      })
      .catch((error) => {
        console.error('[Google Auth] getRedirectResult error:', error.code, error.message);
        if (error.code !== 'auth/popup-closed-by-user') {
          showOAuthError(`[${error.code || 'error'}] ${error.message || 'Google sign-in failed'}`);
        }
      });
  }

})();