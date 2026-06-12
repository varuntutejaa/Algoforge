(function () {
  'use strict';

  if (!firebase.apps.length && window.algoforgeFirebaseConfig) {
    firebase.initializeApp(window.algoforgeFirebaseConfig);
  }

  const firebaseAuth = firebase.auth();

  /* ── EMAIL/PASSWORD SIGNUP ─────────────────────────────── */

  const signupForm = document.getElementById('signupForm');
  const submitBtn  = document.getElementById('submitBtn');
  const btnLabel   = submitBtn && submitBtn.querySelector('.btn-label');
  const btnLoader  = document.getElementById('btnLoader');

  signupForm && signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name            = document.getElementById('name').value.trim();
    const email           = document.getElementById('email').value.trim();
    const password        = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!name)  { showToast('Name is required', 'error'); return; }
    if (!email) { showToast('Email is required', 'error'); return; }
    if (password !== confirmPassword) { showToast('Passwords do not match', 'error'); return; }
    if (password.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }

    if (submitBtn) submitBtn.disabled = true;
    if (btnLabel)  btnLabel.style.display  = 'none';
    if (btnLoader) btnLoader.style.display = '';

    try {
      const cred        = await firebaseAuth.createUserWithEmailAndPassword(email, password);
      const firebaseUser = cred.user;
      await firebaseUser.updateProfile({ displayName: name });
      const idToken = await firebaseUser.getIdToken();

      const res  = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ name })
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('algoforge-auth', 'true');
        localStorage.setItem('algoforge-id-token', idToken);
        localStorage.setItem('algoforge-user', JSON.stringify({
          id: data.user.id, firebaseUid: data.user.firebaseUid,
          name: data.user.name, email: data.user.email
        }));
        showToast('Account created! Redirecting…', 'success');
        setTimeout(() => { window.location.href = 'problems.html'; }, 900);
      } else {
        showToast(data.message || 'Signup failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Server error. Please try again.', 'error');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (btnLabel)  btnLabel.style.display  = '';
      if (btnLoader) btnLoader.style.display = 'none';
    }
  });

  /* ── GOOGLE OAUTH ───────────────────────────────────────── */

  const googleBtn = document.getElementById('googleBtn');

  async function handleGoogleUser(user) {
    const idToken = await user.getIdToken();
    const res  = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
      body: JSON.stringify({ name: user.displayName || '' })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('algoforge-auth', 'true');
      localStorage.setItem('algoforge-id-token', idToken);
      localStorage.setItem('algoforge-user', JSON.stringify({
        id: data.user.id, firebaseUid: data.user.firebaseUid,
        name: data.user.name, email: data.user.email,
        photoURL: user.photoURL || ''
      }));
      window.location.href = 'problems.html';
    } else {
      showToast(data.message || 'Google sign-in failed', 'error');
    }
  }

  googleBtn && googleBtn.addEventListener('click', async () => {
    if (!firebase.auth.GoogleAuthProvider) {
      showToast('Firebase Auth SDK did not load. Refresh the page.', 'error');
      return;
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    const origHtml  = googleBtn.innerHTML;
    const restoreBtn = () => { googleBtn.innerHTML = origHtml; googleBtn.disabled = false; };

    googleBtn.innerHTML = '<span class="btn-loader" style="display:inline-block;flex-shrink:0"></span>Signing in…';
    googleBtn.disabled  = true;

    try {
      const result = await firebaseAuth.signInWithPopup(provider);
      if (result && result.user) {
        await handleGoogleUser(result.user);
      } else {
        showToast('Google sign-in returned no user. Try again.', 'error');
        restoreBtn();
      }
    } catch (err) {
      console.error('[Google Auth]', err.code, err.message);

      if (err.code === 'auth/popup-blocked') {
        googleBtn.innerHTML = '<span class="btn-loader" style="display:inline-block;flex-shrink:0"></span>Redirecting…';
        setTimeout(() => firebaseAuth.signInWithRedirect(provider), 1200);
        return;
      }

      if (err.code === 'auth/popup-closed-by-user') { restoreBtn(); return; }

      showToast(`[${err.code || 'error'}] ${err.message || 'Google sign-in failed'}`, 'error');
      restoreBtn();
    }
  });

  // Handle redirect result (fallback when popup was blocked)
  if (googleBtn) {
    let pending = true;
    const origHtml = googleBtn.innerHTML;

    const loadingTimer = setTimeout(() => {
      if (!pending) return;
      googleBtn.innerHTML = '<span class="btn-loader" style="display:inline-block;flex-shrink:0"></span>Completing sign-in…';
      googleBtn.disabled  = true;
    }, 150);

    firebaseAuth.getRedirectResult()
      .then(async (result) => {
        pending = false;
        clearTimeout(loadingTimer);
        googleBtn.innerHTML = origHtml;
        googleBtn.disabled  = false;
        if (result && result.user) await handleGoogleUser(result.user);
      })
      .catch((err) => {
        pending = false;
        clearTimeout(loadingTimer);
        googleBtn.innerHTML = origHtml;
        googleBtn.disabled  = false;
        if (err.code !== 'auth/popup-closed-by-user') {
          console.error('[Google Auth] getRedirectResult:', err.code, err.message);
        }
      });
  }

})();
