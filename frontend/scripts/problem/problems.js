const API_BASE = 'http://localhost:8000';

function isAuthenticated() {
  return localStorage.getItem('algoforge-auth') === 'true';
}

if (!isAuthenticated()) {
  window.location.href = 'login.html';
}

initAppNav();

const problemsList = document.getElementById('problemsList');
const searchInput = document.getElementById('searchInput');
const difficultyFilters = document.getElementById('difficultyFilters');
const tagFilters = document.getElementById('tagFilters');
const resultsCount = document.getElementById('resultsCount');

let allProblems = [];
let solvedIds = [];
let selectedDifficulty = 'all';
let selectedTag = 'all';
let searchQuery = '';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}

function getDifficultyClass(difficulty) {
  return difficulty.toLowerCase();
}

function renderProblemsList() {
  if (!problemsList) return;

  const filtered = allProblems.filter((problem) => {
    const matchesSearch = searchQuery === '' ||
      problem.title.toLowerCase().includes(searchQuery) ||
      problem.tags.some(t => t.toLowerCase().includes(searchQuery));
    const matchesDifficulty = selectedDifficulty === 'all' ||
      problem.difficulty.toLowerCase() === selectedDifficulty;
    const matchesTag = selectedTag === 'all' ||
      problem.tags.some(t => t.toLowerCase() === selectedTag.toLowerCase());
    return matchesSearch && matchesDifficulty && matchesTag;
  });

  if (resultsCount) {
    resultsCount.textContent = `Showing ${filtered.length} of ${allProblems.length} problems`;
  }

  if (!filtered.length) {
    problemsList.innerHTML = '<p class="problems-empty">No problems match your filters.</p>';
    return;
  }

  const solvedSet = new Set(solvedIds);

  problemsList.innerHTML = filtered.map((problem) => {
    const isSolved = solvedSet.has(problem.id);
    const tags = [
      isSolved ? '<span class="solved-badge">✓ Solved</span>' : '',
      `<span class="difficulty ${escapeHtml(getDifficultyClass(problem.difficulty))}">${escapeHtml(problem.difficulty)}</span>`,
      ...problem.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`),
      `<span>${problem.testCaseCount} tests</span>`
    ].filter(Boolean).join('');

    return `
      <article class="problem-row">
        <div class="problem-status ${isSolved ? 'solved' : 'unsolved'}">
          ${isSolved ? '✓' : '○'}
        </div>
        <div class="problem-content">
          <div class="problem-meta">${tags}</div>
          <h2>${escapeHtml(problem.title)}</h2>
          <p>${escapeHtml(problem.summary)}</p>
        </div>

        <a class="solve-link" href="editor.html?problem=${encodeURIComponent(problem.id)}">Solve</a>
      </article>
    `;
  }).join('');
}

function initTagFilters() {
  const allTags = new Set();
  allProblems.forEach(p => p.tags.forEach(t => allTags.add(t)));
  const sortedTags = [...allTags].sort();

  if (tagFilters && sortedTags.length > 0) {
    tagFilters.innerHTML = [
      `<button class="tag-btn active" data-tag="all">All Tags</button>`,
      ...sortedTags.map(tag => `<button class="tag-btn" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`)
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
}

// Search
if (searchInput) {
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.toLowerCase().trim();
    renderProblemsList();
  });
}

// Difficulty filters
if (difficultyFilters) {
  difficultyFilters.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      difficultyFilters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedDifficulty = btn.dataset.difficulty;
      renderProblemsList();
    });
  });
}

async function loadSolvedIds() {
  try {
    const response = await fetch(`${API_BASE}/profile/solved`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    return data.success ? data.solvedIds : [];
  } catch (error) {
    console.log(error);
    return [];
  }
}

async function loadProblems() {
  if (!problemsList) return;

  problemsList.innerHTML = '<p class="problems-empty">Loading problems...</p>';

  try {
    const [problemsResponse, solved] = await Promise.all([
      fetch(`${API_BASE}/problems`),
      loadSolvedIds()
    ]);
    const data = await problemsResponse.json();

    if (!problemsResponse.ok || !data.success) {
      throw new Error(data.message || 'Failed to load problems');
    }

    allProblems = data.problems;
    solvedIds = solved;
    initTagFilters();
    renderProblemsList();
  } catch (error) {
    problemsList.innerHTML = '<p class="problems-empty">Could not load problems. Start the backend on port 8000.</p>';
    console.log(error);
  }
}

loadProblems();