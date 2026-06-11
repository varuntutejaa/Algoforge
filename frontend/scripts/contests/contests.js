
function isAuthenticated() {
  return localStorage.getItem('algoforge-auth') === 'true';
}

if (!isAuthenticated()) {
  window.location.href = 'login.html';
}

initAppNav();

// DOM refs
const tabs = document.querySelectorAll('[data-tab]');
const panels = {
  my: document.getElementById('panelMy'),
  create: document.getElementById('panelCreate'),
  join: document.getElementById('panelJoin')
};
const myContestsList = document.getElementById('myContestsList');
const createForm = document.getElementById('createForm');
const createBtn = document.getElementById('createBtn');
const createStatus = document.getElementById('createStatus');
const joinCode = document.getElementById('joinCode');
const joinBtn = document.getElementById('joinBtn');
const joinStatus = document.getElementById('joinStatus');
const availableContests = document.getElementById('availableContests');
const problemMode = document.getElementById('problemMode');
const randomCountGroup = document.getElementById('randomCountGroup');
const chooseProblemsGroup = document.getElementById('chooseProblemsGroup');
const problemCheckboxes = document.getElementById('problemCheckboxes');
const startDate = document.getElementById('startDate');
const startTime = document.getElementById('startTime');
const contestsSearch = document.getElementById('contestsSearch');
const contestSearchInput = document.getElementById('contestSearchInput');
const statusFilters = document.getElementById('statusFilters');
const contestResultsCount = document.getElementById('contestResultsCount');

// State
let allContests = [];
let contestSearchQuery = '';
let contestStatusFilter = 'all';

// --- Utility ---
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getCountdown(endDate) {
  const diff = new Date(endDate) - new Date();
  if (diff <= 0) return 'Ended';
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hrs}h ${remainMins}m left`;
  }
  return `${mins}m ${secs}s left`;
}

function getStartsCountdown(startDate) {
  const diff = new Date(startDate) - new Date();
  if (diff <= 0) return 'Started';
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  const remainHrs = hrs % 24;
  if (days > 0) return `${days}d ${remainHrs}h until start`;
  if (hrs > 0) return `${hrs}h ${mins % 60}m until start`;
  return `${mins}m until start`;
}

function getContestStatus(contest) {
  const now = new Date();
  const startsAt = new Date(contest.startsAt);
  const endsAt = new Date(contest.endsAt);
  if (now >= startsAt && now < endsAt) return 'active';
  if (now >= endsAt) return 'ended';
  return 'upcoming';
}

function getContestStatusLabel(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

async function fetchProblems() {
  try {
    const res = await fetch(`${API_BASE_URL}/problems`);
    const data = await res.json();
    return data.success ? data.problems : [];
  } catch {
    return [];
  }
}

// --- Tabs ---
tabs.forEach((btn) => {
  btn.addEventListener('click', () => {
    tabs.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    Object.entries(panels).forEach(([key, panel]) => {
      panel.classList.toggle('active', key === btn.dataset.tab);
    });
    // Show/hide search based on tab
    contestsSearch.style.display = (btn.dataset.tab === 'my' || btn.dataset.tab === 'join') ? 'block' : 'none';
  });
});

// --- Contest search & filter ---
function filterContests(contests) {
  return contests.filter((contest) => {
    const matchesSearch = contestSearchQuery === '' ||
      contest.title.toLowerCase().includes(contestSearchQuery) ||
      contest.code.toLowerCase().includes(contestSearchQuery);
    const status = getContestStatus(contest);
    const matchesStatus = contestStatusFilter === 'all' || status === contestStatusFilter;
    return matchesSearch && matchesStatus;
  });
}

if (contestSearchInput) {
  contestSearchInput.addEventListener('input', () => {
    contestSearchQuery = contestSearchInput.value.toLowerCase().trim();
    renderMyContests();
    renderAvailableContests();
  });
}

if (statusFilters) {
  statusFilters.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      statusFilters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      contestStatusFilter = btn.dataset.status;
      renderMyContests();
      renderAvailableContests();
    });
  });
}

// --- Problem mode toggle ---
problemMode.addEventListener('change', () => {
  const isRandom = problemMode.value === 'random';
  randomCountGroup.style.display = isRandom ? 'block' : 'none';
  chooseProblemsGroup.style.display = isRandom ? 'none' : 'block';
});

// --- Render contest card ---
function renderContestCard(contest, showActions = true) {
  const now = new Date();
  const startsAt = new Date(contest.startsAt);
  const endsAt = new Date(contest.endsAt);
  let statusLabel = getContestStatusLabel(getContestStatus(contest));
  let countdownText = '';

  if (now >= startsAt && now < endsAt) {
    countdownText = getCountdown(contest.endsAt);
  } else if (now < startsAt) {
    countdownText = getStartsCountdown(contest.startsAt);
  }

  const canEnter = getContestStatus(contest) === 'active';

  return `
    <article class="contest-card">
      <div class="contest-card-header">
        <h3>${escapeHtml(contest.title)}</h3>
        <span class="contest-status ${getContestStatus(contest)}">${statusLabel}</span>
      </div>
      ${contest.description ? `<p class="contest-card-desc">${escapeHtml(contest.description)}</p>` : ''}
      <div class="contest-card-meta">
        <span>Code: <strong>${contest.code}</strong></span>
        <span>📝 ${contest.problemCount} problems</span>
        <span>👥 ${contest.participantCount} participants</span>
        <span>👤 ${escapeHtml(contest.createdByName)}</span>
        <span>📅 ${formatDate(contest.startsAt)}</span>
        ${countdownText ? `<span class="countdown ${getContestStatus(contest) === 'active' ? 'urgent' : ''}">⏱ ${countdownText}</span>` : ''}
      </div>
      ${showActions ? `
        <div class="contest-card-actions">
          ${canEnter ? `<a href="contest-editor.html?code=${contest.code}" class="btn btn-primary">Enter Contest</a>` : ''}
          <button class="btn btn-secondary copy-code" data-code="${contest.code}">Copy Code</button>
          <button class="btn btn-secondary view-leaderboard" data-code="${contest.code}">View Leaderboard</button>
        </div>
      ` : ''}
      <div class="contest-card-leaderboard" data-code="${contest.code}" style="display:none;padding:12px 16px;border-top:1px solid rgba(255,255,255,0.04);background:rgba(255,255,255,0.01)"></div>
    </article>
  `;
}

function setupCopyButtons() {
  document.querySelectorAll('.copy-code').forEach((btn) => {
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(btn.dataset.code).then(() => {
        if (btn) btn.textContent = 'Copied!';
        setTimeout(() => { if (btn) btn.textContent = 'Copy Code'; }, 2000);
      });
    });
  });
}

// --- My Contests ---
async function loadMyContests() {
  myContestsList.innerHTML = '<p class="loading-text">Loading your contests...</p>';

  try {
    const res = await fetch(`${API_BASE_URL}/api/contests`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();

    if (!data.success) {
      myContestsList.innerHTML = '<p class="empty-state">Failed to load contests.</p>';
      return;
    }

    allContests = data.contests;
    renderMyContests();
  } catch {
    myContestsList.innerHTML = '<p class="empty-state">Could not connect to backend. Start the server on the deployed backend.</p>';
  }
}

function renderMyContests() {
  const filtered = filterContests(allContests);

  if (contestResultsCount) {
    contestResultsCount.textContent = `Showing ${filtered.length} of ${allContests.length} contests`;
  }

  if (!filtered.length) {
    myContestsList.innerHTML = '<p class="empty-state">No contests match your filters.</p>';
    return;
  }

  myContestsList.innerHTML = filtered.map((c) => renderContestCard(c)).join('');
  setupCopyButtons();
  setupLeaderboardToggles();
}

let allAvailableContests = [];

function renderAvailableContests() {
  const filtered = filterContests(allAvailableContests);

  if (contestResultsCount) {
    contestResultsCount.textContent = `Showing ${filtered.length} of ${allAvailableContests.length} contests`;
  }

  if (!filtered.length) {
    availableContests.innerHTML = '<p class="empty-state">No contests match your filters.</p>';
    return;
  }

  availableContests.innerHTML = filtered.map((c) => renderContestCard(c)).join('');
  setupCopyButtons();
  setupLeaderboardToggles();
}

// --- Leaderboard toggle per contest card ---
function formatDuration(sec) {
  if (sec == null) return '--';
  const hours = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const secs = sec % 60;
  if (hours > 0) return `${hours}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  return `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
}

function setupLeaderboardToggles() {
  document.querySelectorAll('.view-leaderboard').forEach(btn => {
    btn.removeEventListener('click', onLeaderboardClick);
    btn.addEventListener('click', onLeaderboardClick);
  });

  async function onLeaderboardClick(e) {
    const code = e.currentTarget.dataset.code;
    const container = document.querySelector(`.contest-card-leaderboard[data-code="${code}"]`);
    if (!container) return;
    if (container.style.display === 'block') {
      container.style.display = 'none';
      if (e.currentTarget) e.currentTarget.textContent = 'View Leaderboard';
      return;
    }
    if (e.currentTarget) e.currentTarget.textContent = 'Loading...';
    try {
      const res = await fetch(`${API_BASE_URL}/api/contests/${encodeURIComponent(code)}/leaderboard`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (!data.success) {
        container.innerHTML = `<p style="color:#f87171">Failed to load leaderboard</p>`;
        container.style.display = 'block';
        if (e.currentTarget) e.currentTarget.textContent = 'Hide Leaderboard';
        return;
      }

      if (!Array.isArray(data.leaderboard) || data.leaderboard.length === 0) {
        container.innerHTML = '<p style="color:#64748b">No participants yet.</p>';
        container.style.display = 'block';
        if (e.currentTarget) e.currentTarget.textContent = 'Hide Leaderboard';
        return;
      }

      container.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:8px">
          ${data.leaderboard.map((entry) => `
            <div style="display:flex;align-items:center;gap:12px">
              <div style="width:28px;text-align:center;font-weight:800">${entry.rank}</div>
              <div style="flex:1;display:flex;flex-direction:column">
                <div style="font-weight:700;color:#e2e8f0">${escapeHtml(entry.name)}</div>
                <div style="font-size:12px;color:#94a3b8">${(entry.solvedProblems||[]).length} solved · ${entry.timeTakenSeconds!=null?formatDuration(entry.timeTakenSeconds):'--'}</div>
              </div>
              <div style="font-weight:800;color:#f8fafc">${entry.score}</div>
            </div>
          `).join('')}
        </div>
      `;

      container.style.display = 'block';
      if (e.currentTarget) e.currentTarget.textContent = 'Hide Leaderboard';
    } catch (err) {
      container.innerHTML = `<p style="color:#f87171">Error: ${escapeHtml(err.message)}</p>`;
      container.style.display = 'block';
      if (e.currentTarget) e.currentTarget.textContent = 'Hide Leaderboard';
    }
  }
}

// --- Available Contests ---
async function loadAvailableContests() {
  availableContests.innerHTML = '<p class="loading-text">Loading available contests...</p>';

  try {
    const res = await fetch(`${API_BASE_URL}/api/contests/available`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();

    if (!data.success) {
      availableContests.innerHTML = '<p class="empty-state">Could not load available contests.</p>';
      return;
    }

    allAvailableContests = data.contests;
    renderAvailableContests();
  } catch {
    availableContests.innerHTML = '<p class="empty-state">Could not connect to backend.</p>';
  }
}

// --- Create Contest ---
let allProblems = [];
let problemSearchQuery = '';
let problemDiffFilter = 'all';
let problemTagFilter = '';

// DOM refs for problem picker
const problemFilterInput = document.getElementById('problemFilterInput');
const problemDiffFilters = document.getElementById('problemDiffFilters');
const problemTagFilters = document.getElementById('problemTagFilters');
const problemCountLabel = document.getElementById('problemCountLabel');
const selectAllProblems = document.getElementById('selectAllProblems');
const deselectAllProblems = document.getElementById('deselectAllProblems');

function getAllTags(problems) {
  const tagSet = new Set();
  problems.forEach(p => {
    if (p.tags) p.tags.forEach(t => tagSet.add(t));
  });
  return [...tagSet].sort();
}

function renderTagFilters() {
  const tags = getAllTags(allProblems);
  problemTagFilters.innerHTML = tags.map(tag =>
    `<button type="button" class="pf-tag-btn" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`
  ).join('');

  problemTagFilters.querySelectorAll('.pf-tag-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (problemTagFilter === btn.dataset.tag) {
        problemTagFilter = '';
        btn.classList.remove('active');
      } else {
        problemTagFilters.querySelectorAll('.pf-tag-btn').forEach(b => b.classList.remove('active'));
        problemTagFilter = btn.dataset.tag;
        btn.classList.add('active');
      }
      filterProblems();
    });
  });
}

function filterProblems() {
  const labels = problemCheckboxes.querySelectorAll('label');
  let visibleCount = 0;

  labels.forEach(label => {
    const id = label.querySelector('input')?.value;
    const problem = allProblems.find(p => p.id === id);
    if (!problem) return;

    const matchesSearch = problemSearchQuery === '' ||
      problem.title.toLowerCase().includes(problemSearchQuery) ||
      (problem.tags && problem.tags.some(t => t.toLowerCase().includes(problemSearchQuery)));

    const matchesDiff = problemDiffFilter === 'all' ||
      problem.difficulty === problemDiffFilter;

    const matchesTag = problemTagFilter === '' ||
      (problem.tags && problem.tags.includes(problemTagFilter));

    const visible = matchesSearch && matchesDiff && matchesTag;
    label.classList.toggle('hidden', !visible);
    if (visible) visibleCount++;
  });

  // Show/hide no results message
  const existingMsg = problemCheckboxes.querySelector('.no-results-msg');
  if (existingMsg) existingMsg.remove();

  if (visibleCount === 0) {
    const msg = document.createElement('div');
    msg.className = 'no-results-msg';
    msg.textContent = 'No problems match your filters.';
    problemCheckboxes.appendChild(msg);
  }

  if (problemCountLabel) {
    problemCountLabel.textContent = `${visibleCount} of ${allProblems.length} problems`;
  }
}

async function initCreateForm() {
  const now = new Date();
  startDate.min = now.toISOString().slice(0, 10);
  startDate.value = now.toISOString().slice(0, 10);
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes() + 1).padStart(2, '0');
  startTime.value = `${hours}:${mins}`;

  allProblems = await fetchProblems();

  if (!allProblems.length) {
    problemCheckboxes.innerHTML = '<p class="empty-state" style="font-size:13px">No problems available.</p>';
    return;
  }

  // Reset filters
  problemSearchQuery = '';
  problemDiffFilter = 'all';
  problemTagFilter = '';
  if (problemFilterInput) problemFilterInput.value = '';
  if (problemDiffFilters) {
    problemDiffFilters.querySelectorAll('.pf-diff-btn').forEach(b => b.classList.remove('active'));
    problemDiffFilters.querySelector('[data-diff="all"]')?.classList.add('active');
  }

  renderTagFilters();

  problemCheckboxes.innerHTML = allProblems.map((p) => `
    <label>
      <input type="checkbox" name="problem" value="${escapeHtml(p.id)}">
      <span>${escapeHtml(p.title)}</span>
      <span class="problem-diff-badge ${p.difficulty.toLowerCase()}">${escapeHtml(p.difficulty)}</span>
      <span class="problem-tags-inline">
        ${(p.tags || []).map(t => `<span class="problem-tag-chip">${escapeHtml(t)}</span>`).join('')}
      </span>
    </label>
  `).join('');

  filterProblems();
}

// --- Problem picker event listeners ---
if (problemFilterInput) {
  problemFilterInput.addEventListener('input', () => {
    problemSearchQuery = problemFilterInput.value.toLowerCase().trim();
    filterProblems();
  });
}

if (problemDiffFilters) {
  problemDiffFilters.querySelectorAll('.pf-diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      problemDiffFilters.querySelectorAll('.pf-diff-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      problemDiffFilter = btn.dataset.diff;
      filterProblems();
    });
  });
}

if (selectAllProblems) {
  selectAllProblems.addEventListener('click', () => {
    problemCheckboxes.querySelectorAll('input[name="problem"]').forEach(cb => {
      const label = cb.closest('label');
      if (label && !label.classList.contains('hidden')) {
        cb.checked = true;
      }
    });
  });
}

if (deselectAllProblems) {
  deselectAllProblems.addEventListener('click', () => {
    problemCheckboxes.querySelectorAll('input[name="problem"]').forEach(cb => {
      const label = cb.closest('label');
      if (label && !label.classList.contains('hidden')) {
        cb.checked = false;
      }
    });
  });
}

createForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  createBtn.disabled = true;
  if (createStatus) createStatus.textContent = '';

  const title = document.getElementById('contestTitle').value.trim();
  const description = document.getElementById('contestDesc').value.trim();
  const dateVal = startDate.value;
  const timeVal = startTime.value;
  const durationMinutes = parseInt(document.getElementById('duration').value, 10);
  const isRandom = problemMode.value === 'random';

  if (!title) {
    showToast('Please enter a contest title.', 'warning');
    createBtn.disabled = false;
    return;
  }

  const startsAt = new Date(`${dateVal}T${timeVal}`);

  if (startsAt <= new Date()) {
    showToast('Start time must be in the future.', 'warning');
    createBtn.disabled = false;
    return;
  }

  let problems;

  if (isRandom) {
    const count = parseInt(document.getElementById('randomCount').value, 10);
    problems = { count };
  } else {
    const checked = [...document.querySelectorAll('input[name="problem"]:checked')].map((cb) => cb.value);
    if (!checked.length) {
      showToast('Select at least one problem.', 'warning');
      createBtn.disabled = false;
      return;
    }
    problems = checked;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/contests/create`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        title,
        description,
        problems,
        startsAt: startsAt.toISOString(),
        durationMinutes,
        isRandom
      })
    });

    const data = await res.json();

    if (data.success) {
      showToast(`Contest created! Share this code: <strong>${data.contest.code}</strong>`, 'success', 8000);
      createForm.reset();
      await initCreateForm();
      await loadMyContests();
      tabs.forEach((b) => b.classList.remove('active'));
      document.querySelector('[data-tab="my"]').classList.add('active');
      Object.entries(panels).forEach(([key, panel]) => {
        panel.classList.toggle('active', key === 'my');
      });
    } else {
      showToast(data.message || 'Failed to create contest.', 'error');
    }
  } catch {
    showToast('Could not reach the server. Check your connection.', 'error');
  } finally {
    createBtn.disabled = false;
  }
});

// --- Join Contest ---
joinBtn.addEventListener('click', async () => {
  const code = joinCode.value.trim().toUpperCase();
  if (!code || code.length < 4) {
    showToast('Enter a valid contest code (4–6 characters).', 'warning');
    return;
  }

  joinBtn.disabled = true;
  if (joinStatus) joinStatus.textContent = '';

  try {
    const res = await fetch(`${API_BASE_URL}/api/contests/join`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ code })
    });

    const data = await res.json();

    if (data.success) {
      showToast(`Joined "${data.contest.title}"!`, 'success');
      joinCode.value = '';
      await loadMyContests();
      await loadAvailableContests();
      tabs.forEach((b) => b.classList.remove('active'));
      document.querySelector('[data-tab="my"]').classList.add('active');
      Object.entries(panels).forEach(([key, panel]) => {
        panel.classList.toggle('active', key === 'my');
      });
    } else {
      showToast(data.message || 'Failed to join contest.', 'error');
    }
  } catch {
    showToast('Could not reach the server. Check your connection.', 'error');
  } finally {
    joinBtn.disabled = false;
  }
});

joinCode.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') joinBtn.click();
});

// --- Init ---
(async function init() {
  await initCreateForm();
  await loadMyContests();
  await loadAvailableContests();
  contestsSearch.style.display = 'block';
})();

setInterval(() => {
  loadMyContests();
  loadAvailableContests();
}, 30000);