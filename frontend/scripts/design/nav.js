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
      localStorage.removeItem('algoforge-auth');
      localStorage.removeItem('algoforge-user');
      window.location.href = 'index.html';
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

  window.getAuthHeaders = function getAuthHeaders(extraHeaders = {}) {
    const user = getStoredUser();
    const headers = { ...extraHeaders };
    const userId = user?.id || user?.uid;

    if (userId) {
      headers['x-user-id'] = userId;
    }

    return headers;
  };

  window.getAlgoforgeUserId = function getAlgoforgeUserId() {
    const user = getStoredUser();
    return user?.id || user?.uid || null;
  };
})();
