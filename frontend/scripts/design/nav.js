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

  function refreshPhotoURLFromFirebase() {
    try {
      if (typeof firebase === 'undefined' || !firebase.auth) return;
      const fbUser = firebase.auth().currentUser;
      if (!fbUser || !fbUser.photoURL) return;
      const stored = getStoredUser();
      if (!stored || stored.photoURL === fbUser.photoURL) return;
      stored.photoURL = fbUser.photoURL;
      localStorage.setItem('algoforge-user', JSON.stringify(stored));
    } catch {}
  }

  function renderProfileNav(container) {
    refreshPhotoURLFromFirebase();
    const user = getStoredUser();
    const isLoggedIn = user && (user.name || user.email);
    const displayName = user?.name || user?.email || 'User';
    const avatarContent = user?.photoURL
      ? `<img src="${user.photoURL}" alt="${displayName}" referrerpolicy="no-referrer">`
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

  function getDailyProblemId(problems) {
    if (!problems.length) return null;
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return problems[dayOfYear % problems.length].id;
  }

  async function fetchAndRenderStreak(el) {
    const user = getStoredUser();
    if (!user) return;
    const idToken = localStorage.getItem('algoforge-id-token');
    if (!idToken) return;
    try {
      const apiBase = (typeof API_BASE_URL !== 'undefined') ? API_BASE_URL : 'http://localhost:8000';
      const [streakRes, problemsRes] = await Promise.all([
        fetch(`${apiBase}/profile/streak`, { headers: { 'Authorization': `Bearer ${idToken}` } }),
        fetch(`${apiBase}/problems`)
      ]);
      if (streakRes.ok) {
        const data = await streakRes.json();
        const streak = data.currentStreak || 0;
        const solvedToday = !!data.solvedToday;
        el.querySelector('.nav-streak-count').textContent = streak;
        if (streak === 0) {
          el.classList.add('streak-zero');
          el.title = 'No active streak — solve today\'s daily challenge!';
        } else if (solvedToday) {
          el.title = `${streak}-day streak — you've solved today's challenge!`;
        } else {
          el.classList.add('streak-at-risk');
          el.title = `${streak}-day streak — solve today's challenge to keep it going!`;
        }
      }
      if (problemsRes.ok) {
        const pdata = await problemsRes.json();
        const problems = pdata.problems || pdata || [];
        const dailyId = getDailyProblemId(problems);
        if (dailyId) el.href = `editor.html?problem=${encodeURIComponent(dailyId)}`;
      }
    } catch {}
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
        <a href="calendar.html">Calendar</a>
      `;
    }
    // render streak badge for logged-in users — inside profileNav, left of profile menu
    const user = getStoredUser();
    if (user && mount) {
      mount.style.display = 'flex';
      mount.style.alignItems = 'center';
      mount.style.gap = '10px';
      const streakEl = document.createElement('a');
      streakEl.href = 'problems.html';
      streakEl.className = 'nav-streak';
      streakEl.title = 'Daily streak';
      streakEl.innerHTML = `
        <svg class="nav-streak-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C12 2 9 7 9 11C9 12.5 9.5 14 10 15C9 14.5 8 13 8 11C8 11 5 14 5 17C5 20.3 8.1 23 12 23C15.9 23 19 20.3 19 17C19 12 12 2 12 2Z" fill="currentColor"/>
        </svg>
        <span class="nav-streak-count">0</span>
      `;
      mount.prepend(streakEl);
      fetchAndRenderStreak(streakEl);
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

  // Hook into Firebase auth state — whenever Firebase silently refreshes a token
  // (which it does automatically before expiry), we capture it immediately.
  function startAuthStateListener() {
    try {
      initFirebaseIfNeeded();
      if (typeof firebase === 'undefined' || !firebase.auth) return;
      firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          // Firebase just confirmed the user is signed in; grab its current token
          // (false = use cache if still valid, Firebase refreshes automatically)
          user.getIdToken(false).then((token) => {
            localStorage.setItem('algoforge-id-token', token);
          }).catch(() => {});
        }
      });
      // Also listen for token refresh events (fires whenever Firebase issues a new token)
      firebase.auth().onIdTokenChanged((user) => {
        if (user) {
          user.getIdToken(false).then((token) => {
            localStorage.setItem('algoforge-id-token', token);
          }).catch(() => {});
        }
      });
    } catch (e) {}
  }

  // Refresh when the user returns to the tab after being away
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && localStorage.getItem('algoforge-auth') === 'true') {
      getFirebaseIdToken();
    }
  });

  // Also refresh on window focus (covers switching back from another app)
  window.addEventListener('focus', () => {
    if (localStorage.getItem('algoforge-auth') === 'true') {
      getFirebaseIdToken();
    }
  });

  // Periodic safety net — every 15 minutes (well within Firebase's 1-hour expiry)
  setInterval(async () => {
    if (localStorage.getItem('algoforge-auth') === 'true') {
      await getFirebaseIdToken();
    }
  }, 15 * 60 * 1000);

  // Refresh token on page load if user is logged in
  if (localStorage.getItem('algoforge-auth') === 'true') {
    getFirebaseIdToken();
    startAuthStateListener();
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
