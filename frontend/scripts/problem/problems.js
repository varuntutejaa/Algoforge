
function isAuthenticated() {
  return localStorage.getItem('algoforge-auth') === 'true';
}

if (!isAuthenticated()) {
  window.location.href = 'login.html';
}

initAppNav();

// --- DOM ---
const dailyCard    = document.getElementById('dailyCard');
const problemsList = document.getElementById('problemsList');
const searchInput  = document.getElementById('searchInput');
const searchClear  = document.getElementById('searchClear');
const diffFilters  = document.getElementById('difficultyFilters');
const tagFilters   = document.getElementById('tagFilters');
const resultsMeta  = document.getElementById('resultsMeta');

// --- State ---
let allProblems       = [];
let solvedSet         = new Set();
let dailyProblemId    = null;
let selectedDifficulty = 'all';
let selectedTag        = 'all';
let searchQuery        = '';

// --- Helpers ---
function escapeHtml(v) {
  return String(v)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

// Deterministic daily problem: pick index by day-of-year so it's the same for all users
function getDailyIndex(total) {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  return dayOfYear % total;
}

// --- Daily challenge card ---
function renderDailyCard() {
  if (!dailyCard || allProblems.length === 0) return;

  const idx = getDailyIndex(allProblems.length);
  const p = allProblems[idx];
  dailyProblemId = p.id;

  const isSolved = solvedSet.has(p.id);
  const diff = p.difficulty.toLowerCase();
  const tagBadges = p.tags.slice(0, 3).map(t => `<span>${escapeHtml(t)}</span>`).join('');
  const diffBadge = `<span class="${escapeHtml(diff)}">${escapeHtml(p.difficulty)}</span>`;
  const solvedBadge = isSolved ? `<span class="daily-solved-badge">✓ Solved today</span>` : '';

  dailyCard.innerHTML = `
    <div class="daily-inner">
      <div class="daily-left">
        <div class="daily-kicker">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L9.09 8.26L2 9.27L7 14.14L5.82 21.02L12 17.77L18.18 21.02L17 14.14L22 9.27L14.91 8.26L12 2Z"
              fill="#fb923c" stroke="#fb923c" stroke-width="1.5" stroke-linejoin="round"/>
          </svg>
          Daily Challenge
          <span class="daily-streak">Today</span>
        </div>
        <div class="daily-title">${escapeHtml(p.title)}</div>
        <div class="daily-tags">${diffBadge}${tagBadges}${solvedBadge}</div>
      </div>
      <a class="daily-solve-btn${isSolved ? ' solved' : ''}"
         href="editor.html?problem=${encodeURIComponent(p.id)}">
        ${isSolved
          ? `<svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M5 10l4 4 6-7" stroke="#86efac" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Revisit`
          : `Solve Today
             <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
               <path d="M5 10h10M11 6l4 4-4 4" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
             </svg>`
        }
      </a>
    </div>
  `;
}

// --- Problem table rows ---
function renderProblemsList() {
  if (!problemsList) return;

  const q = searchQuery.toLowerCase().trim();

  const filtered = allProblems.filter(p => {
    if (q && !p.title.toLowerCase().includes(q) && !p.tags.some(t => t.toLowerCase().includes(q))) return false;
    if (selectedDifficulty !== 'all' && p.difficulty.toLowerCase() !== selectedDifficulty) return false;
    if (selectedTag !== 'all' && !p.tags.some(t => t.toLowerCase() === selectedTag.toLowerCase())) return false;
    return true;
  });

  if (resultsMeta) {
    resultsMeta.textContent = `${filtered.length} of ${allProblems.length} problems`;
  }

  if (!filtered.length) {
    problemsList.innerHTML = `<div class="prob-empty">No problems match your filters.</div>`;
    return;
  }

  problemsList.innerHTML = filtered.map((p) => {
    const isDaily  = p.id === dailyProblemId;
    const isSolved = solvedSet.has(p.id);
    const diff     = p.difficulty.toLowerCase();
    const globalIdx = allProblems.indexOf(p) + 1;

    // Show up to 2 tags in the row, +N more
    const visibleTags = p.tags.slice(0, 2);
    const extraCount  = p.tags.length - visibleTags.length;
    const tagsHtml = visibleTags.map(t => `<span class="row-tag">${escapeHtml(t)}</span>`).join('')
      + (extraCount > 0 ? `<span class="row-tag-more">+${extraCount}</span>` : '');

    return `
      <a class="prob-row${isDaily ? ' is-daily' : ''}"
         href="editor.html?problem=${encodeURIComponent(p.id)}">
        <span class="col-status">
          <span class="status-icon ${isSolved ? 'solved' : 'unsolved'}">${isSolved ? '✓' : ''}</span>
        </span>
        <span class="col-num">${globalIdx}</span>
        <span class="col-title">
          ${isDaily ? '<span class="daily-dot" title="Daily challenge"></span>' : ''}
          <span class="row-title">${escapeHtml(p.title)}</span>
        </span>
        <span class="col-tags">${tagsHtml}</span>
        <span class="col-diff">
          <span class="diff-badge ${escapeHtml(diff)}">${escapeHtml(p.difficulty)}</span>
        </span>
      </a>
    `;
  }).join('');
}

// --- Tag filter strip ---
function buildTagFilters() {
  const allTags = new Set();
  allProblems.forEach(p => p.tags.forEach(t => allTags.add(t)));
  const sorted = [...allTags].sort();

  tagFilters.innerHTML = [
    `<button class="tag-btn active" data-tag="all">All Topics</button>`,
    ...sorted.map(t => `<button class="tag-btn" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</button>`)
  ].join('');

  tagFilters.querySelectorAll('.tag-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      tagFilters.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedTag = btn.dataset.tag;
      renderProblemsList();
    });
  });
}

// --- Event listeners ---
if (searchInput) {
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value;
    searchClear.classList.toggle('visible', searchQuery.length > 0);
    renderProblemsList();
  });
}

if (searchClear) {
  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    searchClear.classList.remove('visible');
    searchInput.focus();
    renderProblemsList();
  });
}

if (diffFilters) {
  diffFilters.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      diffFilters.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedDifficulty = btn.dataset.difficulty;
      renderProblemsList();
    });
  });
}

// --- Load data ---
async function loadSolvedIds() {
  try {
    const res = await fetch(`${API_BASE_URL}/profile/solved`, { headers: getAuthHeaders() });
    const data = await res.json();
    return data.success ? data.solvedIds : [];
  } catch { return []; }
}

async function loadProblems() {
  if (!problemsList) return;
  problemsList.innerHTML = `<div class="prob-empty">Loading problems…</div>`;

  try {
    const [probRes, solved] = await Promise.all([
      fetch(`${API_BASE_URL}/problems`),
      loadSolvedIds()
    ]);
    const data = await probRes.json();

    if (!probRes.ok || !data.success) throw new Error(data.message || 'Failed to load');

    allProblems = data.problems;
    solvedSet   = new Set(solved);

    buildTagFilters();
    renderDailyCard();
    renderProblemsList();
  } catch (err) {
    problemsList.innerHTML = `<div class="prob-empty">Could not load problems. Check your connection.</div>`;
    console.error(err);
  }
}

loadProblems();
