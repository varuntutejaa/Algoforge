
function isAuthenticated() {
  return localStorage.getItem('algoforge-auth') === 'true';
}

if (!isAuthenticated()) {
  window.location.href = 'login.html';
}

initAppNav();

const profileCard = document.getElementById('profileCard');
const statsGrid = document.getElementById('statsGrid');
const difficultyBreakdown = document.getElementById('difficultyBreakdown');
const topicBreakdown = document.getElementById('topicBreakdown');
const heatmap = document.getElementById('heatmap');
const recentActivity = document.getElementById('recentActivity');
const solvedProblems = document.getElementById('solvedProblems');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function showDashboardError(message) {
  profileCard.innerHTML = `<p class="loading-text">${escapeHtml(message)}</p>`;
  if (statsGrid) statsGrid.innerHTML = '';
}

function getProfileQuery() {
  const userId = typeof getAlgoforgeUserId === 'function' ? getAlgoforgeUserId() : null;
  return userId ? `?userId=${encodeURIComponent(userId)}` : '';
}

function renderProfileCard(profile) {
  profileCard.innerHTML = `
    <div class="profile-identity">
      <h2>${escapeHtml(profile.name)}</h2>
      <p>${escapeHtml(profile.email)}</p>
    </div>
    <div class="profile-stat">
      <span>Problems Solved</span>
      <strong>${profile.problemsSolved}</strong>
    </div>
    <div class="profile-stat">
      <span>Acceptance Rate</span>
      <strong>${profile.acceptanceRate}%</strong>
    </div>
    <div class="profile-stat">
      <span>Current Streak</span>
      <strong>${profile.currentStreak} days</strong>
    </div>
  `;
}

function renderStats(profile) {
  const cards = [
    ['Problems Solved', profile.problemsSolved],
    ['Total Submissions', profile.totalSubmissions],
    ['Accepted Submissions', profile.acceptedSubmissions],
    ['Acceptance Rate', `${profile.acceptanceRate}%`],
    ['Current Streak', `${profile.currentStreak} days`],
    ['Longest Streak', `${profile.longestStreak} days`]
  ];

  statsGrid.innerHTML = cards.map(([label, value]) => `
    <article class="stat-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </article>
  `).join('');
}

function renderBreakdown(container, counts) {
  const entries = Object.entries(counts).filter(([, count]) => count > 0);

  if (!entries.length) {
    container.innerHTML = '<p class="empty-state">No solved problems yet.</p>';
    return;
  }

  const max = Math.max(...entries.map(([, count]) => count), 1);

  container.innerHTML = entries.map(([label, count]) => `
    <div class="breakdown-item">
      <span>${escapeHtml(label)}</span>
      <div class="breakdown-bar"><div style="width:${(count / max) * 100}%"></div></div>
      <strong>${count}</strong>
    </div>
  `).join('');
}

function getHeatLevel(count) {
  if (!count) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

function renderHeatmap(activity) {
  const activityMap = new Map(activity.map((entry) => [entry.date, entry.count]));
  const days = 365;
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));

  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const CELL = 18; // 14px cell + 4px gap
  const startDow = start.getDay(); // 0=Sun, offset for first partial week

  const cells = [];
  const monthLabels = [];
  let lastMonth = -1;

  for (let i = 0; i < days; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const month = date.getMonth();
    const col = Math.floor((i + startDow) / 7);

    if (month !== lastMonth) {
      monthLabels.push({ col, label: MONTH_NAMES[month] });
      lastMonth = month;
    }

    const key = date.toISOString().slice(0, 10);
    const count = activityMap.get(key) || 0;
    cells.push(`<div class="heat-cell level-${getHeatLevel(count)}" title="${key}: ${count} accepted"></div>`);
  }

  const monthsHtml = monthLabels.map(({ col, label }) =>
    `<span style="left:${col * CELL}px">${label}</span>`
  ).join('');

  heatmap.innerHTML = `
    <div class="heatmap-months">${monthsHtml}</div>
    <div class="heatmap-grid">${cells.join('')}</div>
  `;
}

function renderRecentActivity(solved) {
  const recent = solved.slice(0, 8);

  if (!recent.length) {
    recentActivity.innerHTML = '<p class="empty-state">No accepted problems yet.</p>';
    return;
  }

  recentActivity.innerHTML = recent.map((item) => `
    <div class="activity-item">
      <div>
        <span class="check">✓</span>
        <strong>${escapeHtml(item.title)}</strong>
      </div>
      <span>${formatDate(item.solvedAt)}</span>
    </div>
  `).join('');
}

function renderSolvedList(solved) {
  if (!solved.length) {
    solvedProblems.innerHTML = '<p class="empty-state">You have not solved any problems yet.</p>';
    return;
  }

  solvedProblems.innerHTML = solved.map((item) => `
    <article class="solved-item">
      <div>
        <strong>${escapeHtml(item.title)}</strong>
        <div class="solved-meta">
          <span class="difficulty-badge ${escapeHtml(item.difficulty.toLowerCase())}">${escapeHtml(item.difficulty)}</span>
          ${item.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}
        </div>
      </div>
      <span>${formatDate(item.solvedAt)}</span>
    </article>
  `).join('');
}

function buildBreakdowns(solved) {
  const difficultyCounts = { Easy: 0, Medium: 0, Hard: 0 };
  const topicCounts = {};

  solved.forEach((item) => {
    if (difficultyCounts[item.difficulty] !== undefined) {
      difficultyCounts[item.difficulty] += 1;
    }

    item.tags.forEach((tag) => {
      topicCounts[tag] = (topicCounts[tag] || 0) + 1;
    });
  });

  renderBreakdown(difficultyBreakdown, difficultyCounts);
  renderBreakdown(topicBreakdown, topicCounts);
}

async function loadDashboard() {
  const userId = typeof getAlgoforgeUserId === 'function' ? getAlgoforgeUserId() : null;

  if (!userId) {
    showDashboardError('Your session is missing a user id. Please log out and log in again.');
    return;
  }

  try {
    const headers = getAuthHeaders();
    const query = getProfileQuery();
    const [profileRes, solvedRes, activityRes] = await Promise.all([
      fetch(`${API_BASE_URL}/profile${query}`, { headers }),
      fetch(`${API_BASE_URL}/profile/solved${query}`, { headers }),
      fetch(`${API_BASE_URL}/profile/activity${query}`, { headers })
    ]);

    const profileData = await profileRes.json();
    const solvedData = await solvedRes.json();
    const activityData = await activityRes.json();

    if (!profileRes.ok || !profileData.success) {
      if (profileRes.status === 401) {
        showDashboardError('Your session expired. Please log out and log in again.');
        return;
      }

      throw new Error(profileData.message || 'Failed to load profile');
    }

    renderProfileCard(profileData.profile);
    renderStats(profileData.profile);

    const solved = solvedData.success ? solvedData.solved : [];
    buildBreakdowns(solved);
    renderRecentActivity(solved);
    renderSolvedList(solved);
    renderHeatmap(activityData.success ? activityData.activity : []);
  } catch (error) {
    showDashboardError('Could not load dashboard. Make sure the backend is running on the deployed backend, then log in again.');
    console.log(error);
  }
}

loadDashboard();
