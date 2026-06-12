(function () {
  'use strict';

  if (!window.firebase || !window.algoforgeFirebaseConfig) return;
  if (!firebase.apps.length) firebase.initializeApp(window.algoforgeFirebaseConfig);
  const auth = firebase.auth();

  const forgotForm  = document.getElementById('forgotForm');
  const emailInput  = document.getElementById('email');
  const emailGroup  = document.getElementById('emailGroup');
  const emailError  = document.getElementById('emailError');
  const submitBtn   = document.getElementById('submitBtn');
  const btnLabel    = submitBtn.querySelector('.btn-label');
  const btnLoader   = document.getElementById('btnLoader');
  const resetView   = document.getElementById('resetView');
  const successView = document.getElementById('successView');
  const sentEmail   = document.getElementById('sentEmail');
  const retryBtn    = document.getElementById('retryBtn');

  function setError(msg) {
    emailGroup.classList.add('has-error');
    emailError.textContent = msg;
  }

  function clearError() {
    emailGroup.classList.remove('has-error');
    emailError.textContent = '';
  }

  emailInput.addEventListener('input', clearError);

  function setLoading(on) {
    submitBtn.disabled = on;
    btnLabel.style.display  = on ? 'none' : '';
    btnLoader.style.display = on ? ''     : 'none';
  }

  forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();

    const email = emailInput.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      await auth.sendPasswordResetEmail(email);
      sentEmail.textContent = email;
      resetView.style.display   = 'none';
      successView.style.display = '';
    } catch (err) {
      const msg =
        err.code === 'auth/user-not-found'    ? 'No account found with that email.' :
        err.code === 'auth/invalid-email'     ? 'That doesn\'t look like a valid email.' :
        err.code === 'auth/too-many-requests' ? 'Too many attempts. Wait a moment and try again.' :
        err.message || 'Failed to send reset email.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  });

  retryBtn.addEventListener('click', () => {
    successView.style.display = 'none';
    resetView.style.display   = '';
    emailInput.value = '';
    emailInput.focus();
  });

})();
