(function () {
  function getStoredUser() {
    try {
      return JSON.parse(localStorage.getItem('algoforge-user') || 'null');
    } catch {
      return null;
    }
  }

  function getInitials(name, email) {
    const source = (name || email || 'U').trim();
    return source.charAt(0).toUpperCase();
  }

  function renderProfileNav(container) {
    const user = getStoredUser();
    const isLoggedIn = user && (user.name || user.email);
    const displayName = user?.name || user?.email || 'User';
    const avatarContent = user?.photoURL
      ? `<img src="${user.photoURL}" alt="${displayName}">`
      : getInitials(user?.name, user?.email);

    if (!isLoggedIn) {
      // only render auth buttons in the profile area for logged-out users
      container.innerHTML = `
        <div class="nav-auth-buttons">
          <a href="login.html" class="nav-login-btn">Login</a>
          <a href="signup.html" class="nav-signup-btn">Get Started</a>
        </div>
      `;
      return;
    }

    // logged-in: render profile menu only (center links are rendered separately)
    container.innerHTML = `
      <div class="profile-menu">
        <button class="profile-trigger" id="profileTrigger" type="button" aria-haspopup="true" aria-expanded="false">
          <span class="profile-avatar">${avatarContent}</span>
          <span class="profile-name">${displayName}</span>
          <span class="profile-caret">▾</span>
        </button>
        <div class="profile-dropdown" id="profileDropdown">
          <a href="dashboard.html">Dashboard</a>
          <a href="submissions.html">My Submissions</a>
          <button type="button" id="logoutBtn">Logout</button>
        </div>
      </div>
    `;

    const trigger = container.querySelector('#profileTrigger');
    const dropdown = container.querySelector('#profileDropdown');
    const logoutBtn = container.querySelector('#logoutBtn');

    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      const isOpen = dropdown.classList.toggle('open');
      trigger.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', () => {
      dropdown.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    });

    logoutBtn.addEventListener('click', () => {
      if (window.algoforgeSignOut) {
        window.algoforgeSignOut();
      } else {
        localStorage.removeItem('algoforge-auth');
        localStorage.removeItem('algoforge-user');
        localStorage.removeItem('algoforge-id-token');
        window.location.href = 'index.html';
      }
    });
  }

  window.initAppNav = function initAppNav() {
    const mount = document.getElementById('profileNav');
    if (mount) {
      renderProfileNav(mount);
    }
    // render center links into navCenter if present
    const center = document.getElementById('navCenter');
    if (center) {
      center.innerHTML = `
        <a href="problems.html">Problems</a>
        <a href="contests.html">Contests</a>
      `;
    }
  };

  window.getAlgoforgeUser = getStoredUser;

  // Initialize Firebase if not already done (needed for token refresh)
  function initFirebaseIfNeeded() {
    if (typeof firebase !== 'undefined' && !firebase.apps.length && window.algoforgeFirebaseConfig) {
      firebase.initializeApp(window.algoforgeFirebaseConfig);
    }
  }

  // Get a fresh Firebase ID token (async)
  async function getFirebaseIdToken() {
    try {
      initFirebaseIfNeeded();
      if (typeof firebase === 'undefined' || !firebase.auth || !firebase.auth().currentUser) {
        return null;
      }
      const token = await firebase.auth().currentUser.getIdToken(true);
      // Cache the token
      localStorage.setItem('algoforge-id-token', token);
      return token;
    } catch (e) {
      console.warn('Failed to get Firebase ID token:', e);
      return null;
    }
  }

  window.getAuthHeaders = function getAuthHeaders(extraHeaders = {}) {
    const headers = { ...extraHeaders };
    // Use cached Firebase ID token if available
    const idToken = localStorage.getItem('algoforge-id-token');
    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    }
    return headers;
  };

  // Async version for cases where a fresh token is needed
  window.getAuthHeadersAsync = async function getAuthHeadersAsync(extraHeaders = {}) {
    const headers = { ...extraHeaders };
    const token = await getFirebaseIdToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  window.getAlgoforgeUserId = function getAlgoforgeUserId() {
    const user = getStoredUser();
    return user?.id || user?.uid || null;
  };

  // Refresh Firebase ID token periodically (every 50 minutes)
  setInterval(async () => {
    if (localStorage.getItem('algoforge-auth') === 'true') {
      await getFirebaseIdToken();
    }
  }, 50 * 60 * 1000);

  // Refresh token on page load if user is logged in
  if (localStorage.getItem('algoforge-auth') === 'true') {
    getFirebaseIdToken();
  }

  // Sign out helper
  window.algoforgeSignOut = async function algoforgeSignOut() {
    try {
      initFirebaseIfNeeded();
      if (typeof firebase !== 'undefined' && firebase.auth) {
        await firebase.auth().signOut();
      }
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('algoforge-auth');
    localStorage.removeItem('algoforge-user');
    localStorage.removeItem('algoforge-id-token');
    window.location.href = 'index.html';
  };
})();
