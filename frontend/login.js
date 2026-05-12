/* ============================================================
   ALGOFORGE — LOGIN JS
   • Dark / Light theme toggle (persisted in localStorage)
   • Terminal typewriter animation
   • Form validation
   • Password visibility toggle
   • Submit loading state simulation
   ============================================================ */

(function () {
  'use strict';

  /* ---- Selectors ---- */
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

  /* ===========================================================
     2. TERMINAL TYPEWRITER
  =========================================================== */
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

  /* ===========================================================
     3. PASSWORD TOGGLE
  =========================================================== */
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
    group.classList.add('has-error');
    errorEl.textContent = msg;
  }

  function clearError(group, errorEl) {
    group.classList.remove('has-error');
    errorEl.textContent = '';
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
     5. FORM SUBMIT
  =========================================================== */
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!validateForm()) return;

      // Show loading state
      if (submitBtn)  submitBtn.disabled = true;
      if (btnLabel)   btnLabel.style.display  = 'none';
      if (btnArrow)   btnArrow.style.display  = 'none';
      if (btnLoader)  btnLoader.style.display = '';

      // Simulate async login (replace with real API call)
      setTimeout(() => {
        // Restore button
        if (submitBtn) submitBtn.disabled = false;
        if (btnLabel)  btnLabel.style.display  = '';
        if (btnArrow)  btnArrow.style.display  = '';
        if (btnLoader) btnLoader.style.display = 'none';

        // Replace this with actual auth logic / redirect
        console.log('Login submitted:', {
          email:    emailInput ? emailInput.value.trim() : '',
          remember: document.getElementById('remember')?.checked ?? false,
        });

        // Example: show a success message or redirect
        // window.location.href = '/dashboard';
      }, 1800);
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

  googleBtn && googleBtn.addEventListener('click', () => {
    console.log('Google OAuth triggered');
    // window.location.href = '/auth/google';
  });

})();