
function isAuthenticated() {
  return localStorage.getItem('algoforge-auth') === 'true';
}

if (!isAuthenticated()) {
  window.location.href = 'login.html';
}
// --- DOM refs ---
const arenaTitle = document.getElementById('arenaTitle');
const arenaTimer = document.getElementById('arenaTimer');
const problemList = document.getElementById('problemList');
const probTitle = document.getElementById('probTitle');
const probMeta = document.getElementById('probMeta');
const probDesc = document.getElementById('probDesc');
const probExample = document.getElementById('probExample');
const probConstraints = document.getElementById('probConstraints');
const languageSelect = document.getElementById('languageSelect');
const codeEditorContainer = document.getElementById('codeEditor');
const runBtn = document.getElementById('runBtn');
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');
const leaderboardList = document.getElementById('leaderboardList');
const resultsOverlay = document.getElementById('resultsOverlay');
const resultsContent = document.getElementById('resultsContent');
const closeResults = document.getElementById('closeResults');
// Panels & splitters
const leftPanel = document.getElementById('leftPanel');
const centerPanel = document.getElementById('centerPanel');
const rightPanel = document.getElementById('rightPanel');
const splitterLeft = document.getElementById('splitterLeft');
const splitterRight = document.getElementById('splitterRight');
const panelToggle = document.getElementById('panelToggle');
const splitterCenter = document.getElementById('splitterCenter');
const timeProgressBar = document.getElementById('timeProgressBar');
const problemSection = document.querySelector('.arena-problem');
const codeSection = document.querySelector('.code-section');

// --- State ---
const params = new URLSearchParams(window.location.search);
const contestCode = params.get('code');

let contest = null;
let problems = [];
let currentProblemIndex = 0;
let currentProblemData = null;
let monacoEditor = null;
let timerInterval = null;
let leaderboardInterval = null;
let solvedProblems = new Set();
let problemSearchQuery = '';
let problemDifficultyFilter = 'all';

const monacoLanguages = {
  c: 'c',
  cpp: 'cpp',
  java: 'java',
  js: 'javascript'
};

const languageIds = {
  c: 50,
  cpp: 54,
  java: 62,
  js: 63
};

// --- Utility ---
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}

function getCurrentUser() {
  return typeof getAlgoforgeUser === 'function' ? getAlgoforgeUser() : null;
}

// --- Countdown timer ---
function updateTimer() {
  if (!contest) return;

  const now = new Date();
  const endsAt = new Date(contest.endsAt);
  const startsAt = new Date(contest.startsAt);
  const diff = endsAt - now;
  const total = endsAt - startsAt;

  // Progress bar — shows remaining time as a percentage
  if (timeProgressBar && total > 0) {
    const pct = Math.max(0, Math.min(100, (diff / total) * 100));
    timeProgressBar.style.width = `${pct}%`;
    const cls = diff < 300000 ? 'urgent' : diff < 600000 ? 'warn' : '';
    timeProgressBar.className = `time-progress-bar${cls ? ' ' + cls : ''}`;
  }

  if (diff <= 0) {
    if (arenaTimer) {
      arenaTimer.textContent = '00:00';
      if (arenaTimer.classList) arenaTimer.classList.add('urgent');
    }
    if (timeProgressBar) timeProgressBar.style.width = '0%';
    clearInterval(timerInterval);
    if (runBtn) runBtn.disabled = true;
    if (submitBtn) submitBtn.disabled = true;
    // Redirect to results after a short delay so user sees the 00:00 state
    setTimeout(() => {
      window.location.href = `contest-results.html?code=${encodeURIComponent(contestCode)}`;
    }, 2500);
    return;
  }

  const totalSecs = Math.floor(diff / 1000);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  if (arenaTimer) {
    arenaTimer.textContent = hrs > 0
      ? `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    arenaTimer.classList.toggle('urgent', diff < 300000);
  }
}

function startTimer() {
  updateTimer();
  timerInterval = setInterval(updateTimer, 1000);
}

// --- Load contest ---
async function loadContest() {
  if (!contestCode) {
    document.getElementById('arena').innerHTML = `
      <div class="arena-error">
        <p>No contest code provided.</p>
        <a href="contests.html" class="btn btn-primary">Back to Contests</a>
      </div>
    `;
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/contests/${contestCode}`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();

    if (!data.success) {
      document.getElementById('arena').innerHTML = `
        <div class="arena-error">
          <p>Contest not found. Check the code and try again.</p>
          <a href="contests.html" class="btn btn-primary">Back to Contests</a>
        </div>
      `;
      return;
    }

    contest = data.contest;
    if (arenaTitle) arenaTitle.textContent = contest.title;

    // Find current user's participant entry, auto-joining if not yet a member
    try {
      const user = getCurrentUser();

      function findSelf(participants) {
        if (!user || !Array.isArray(participants)) return null;
        return participants.find((p) => {
          // Match by Firebase UID (most reliable — uid field fixed to store Firebase UID)
          const fuid = user.firebaseUid || user.uid;
          if (fuid && p.firebaseUid && p.firebaseUid === fuid) return true;
          // Match by MongoDB userId (serialized as string in JSON)
          if (user.id && p.userId && p.userId.toString() === user.id) return true;
          // Fallback: name / email
          if (p.name && (p.name === user.name || p.name === user.email)) return true;
          return false;
        });
      }

      let participant = findSelf(contest.participants);

      // Auto-join: if the user reached the editor directly (e.g. shared link)
      // without going through the join flow, join them now so submits work.
      // Use getAuthHeadersAsync to guarantee a fresh, valid Firebase ID token.
      if (!participant && user) {
        try {
          const authHeaders = typeof getAuthHeadersAsync === 'function'
            ? await getAuthHeadersAsync({ 'Content-Type': 'application/json' })
            : getAuthHeaders({ 'Content-Type': 'application/json' });

          const joinRes = await fetch(`${API_BASE_URL}/api/contests/join`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ code: contestCode })
          });
          const joinData = await joinRes.json();
          console.log('[contest] auto-join response:', joinData.success, joinData.message || '');
          if (joinData.success) {
            // alreadyJoined path returns formatContest (no participants); re-fetch full detail
            const refreshRes = await fetch(`${API_BASE_URL}/api/contests/${contestCode}`, {
              headers: getAuthHeaders()
            });
            const refreshData = await refreshRes.json();
            if (refreshData.success) {
              contest = refreshData.contest;
              participant = findSelf(contest.participants);
            }
          }
        } catch (joinErr) {
          console.warn('[contest] auto-join failed:', joinErr);
        }
      }

      if (participant) {
        solvedProblems = new Set(participant.solvedProblems || []);

        if (participant.finishedAt) {
          if (runBtn) runBtn.disabled = true;
          if (submitBtn) submitBtn.disabled = true;
          if (arenaTimer) {
            arenaTimer.textContent = 'Finished';
            if (arenaTimer.classList) arenaTimer.classList.add('urgent');
          }
        }
      }
    } catch (e) {
      console.warn('[contest] participant restore error:', e);
    }

    // Check if contest is active
    const now = new Date();
    const startsAt = new Date(contest.startsAt);
    const endsAt = new Date(contest.endsAt);

    if (now < startsAt) {
      document.getElementById('arena').innerHTML = `
        <div class="arena-error">
          <p>This contest has not started yet.</p>
          <a href="contests.html" class="btn btn-primary">Back to Contests</a>
        </div>
      `;
      return;
    }

    if (now >= endsAt) {
      document.getElementById('arena').innerHTML = `
        <div class="arena-error">
          <p>This contest has ended.</p>
          <a href="contests.html" class="btn btn-primary">Back to Contests</a>
        </div>
      `;
      return;
    }

    problems = contest.problems;
    startTimer();
    // initialize panels (splitters, toggle, restoring sizes)
    try { initPanels(); } catch (e) { /* ignore */ }
    renderProblemList();
    await loadProblemDetails(0);
    initMonaco();
    startLeaderboardPolling();
    loadLeaderboard();
  } catch (error) {
    console.error('Contest load error:', error);
    const errDetails = error.message || String(error);
    document.getElementById('arena').innerHTML = `
      <div class="arena-error">
        <p>Could not load contest: ${escapeHtml(errDetails)}</p>
        <p style="font-size:12px;color:#64748b">API: ${escapeHtml(API_BASE_URL)} | Code: ${escapeHtml(contestCode || 'none')} | User: ${escapeHtml(JSON.stringify(getCurrentUser()))}</p>
        <a href="contests.html" class="btn btn-primary">Back to Contests</a>
      </div>
    `;
  }
}

// --- Panels / Splitters ---
function getPanelStorageKey() {
  return `contest:${contestCode}:panels`;
}

function savePanelSizes(leftWidth, rightWidth, collapsed) {
  try {
    const payload = { leftWidth, rightWidth, collapsed, centerTopHeight: problemSection ? Math.round(problemSection.getBoundingClientRect().height) : null };
    localStorage.setItem(getPanelStorageKey(), JSON.stringify(payload));
  } catch (e) { }
}

function restorePanelSizes() {
  try {
    const raw = localStorage.getItem(getPanelStorageKey());
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
}

function applyPanelWidths(leftW, rightW) {
  // apply px widths to left and right panels
  if (leftPanel) leftPanel.style.width = `${leftW}px`;
  if (rightPanel) rightPanel.style.width = `${rightW}px`;
  // ensure splitters visible/hidden appropriately
  if (splitterLeft) splitterLeft.style.display = leftW <= 0 ? 'none' : '';
  if (splitterRight) splitterRight.style.display = rightW <= 0 ? 'none' : '';
  // layout monaco after change
  setTimeout(() => { if (monacoEditor && typeof monacoEditor.layout === 'function') monacoEditor.layout(); }, 50);
}

function applyCenterHeights(topH) {
  if (!problemSection || !codeSection) return;
  const total = centerPanel.getBoundingClientRect().height;
  const topHeight = Math.max(80, Math.min(total - 120, topH));
  const bottomHeight = Math.max(80, total - topHeight - (splitterCenter ? splitterCenter.getBoundingClientRect().height : 8));
  problemSection.style.height = `${topHeight}px`;
  codeSection.style.height = `${bottomHeight}px`;
  // relayout monaco
  setTimeout(() => { if (monacoEditor && typeof monacoEditor.layout === 'function') monacoEditor.layout(); }, 50);
}

function toggleSidePanels(forceState) {
  const collapsed = typeof forceState === 'boolean' ? forceState : !(leftPanel.classList.contains('collapsed') && rightPanel.classList.contains('collapsed'));
  if (collapsed) {
    leftPanel.classList.add('collapsed');
    rightPanel.classList.add('collapsed');
    splitterLeft.style.opacity = '0';
    splitterRight.style.opacity = '0';
    panelToggle.setAttribute('aria-pressed', 'true');
  } else {
    leftPanel.classList.remove('collapsed');
    rightPanel.classList.remove('collapsed');
    splitterLeft.style.opacity = '1';
    splitterRight.style.opacity = '1';
    panelToggle.setAttribute('aria-pressed', 'false');
  }
  const saved = restorePanelSizes() || {};
  savePanelSizes(saved.leftWidth || leftPanel.getBoundingClientRect().width, saved.rightWidth || rightPanel.getBoundingClientRect().width, collapsed);
  // trigger editor relayout
  setTimeout(() => { if (monacoEditor && typeof monacoEditor.layout === 'function') monacoEditor.layout(); }, 100);
}

function initPanels() {
  if (!leftPanel || !rightPanel || !centerPanel) return;

  // restore sizes
  const saved = restorePanelSizes();
  const arenaWidth = document.querySelector('.arena-body')?.getBoundingClientRect().width || 0;
  const defaultLeft = arenaWidth > 100 ? Math.min(360, Math.floor(arenaWidth * 0.22)) : 280;
  const defaultRight = arenaWidth > 100 ? Math.min(360, Math.floor(arenaWidth * 0.22)) : 280;
  // discard saved sizes that are suspiciously small (collapsed by bad state)
  const savedLeft = saved && typeof saved.leftWidth === 'number' && saved.leftWidth > 40 ? saved.leftWidth : null;
  const savedRight = saved && typeof saved.rightWidth === 'number' && saved.rightWidth > 40 ? saved.rightWidth : null;
  const leftW = savedLeft !== null ? savedLeft : defaultLeft;
  const rightW = savedRight !== null ? savedRight : defaultRight;
  const defaultTop = Math.max(180, Math.floor(centerPanel.getBoundingClientRect().height * 0.45));
  const centerTop = saved && typeof saved.centerTopHeight === 'number' ? saved.centerTopHeight : defaultTop;
  if (saved && saved.collapsed) {
    leftPanel.classList.add('collapsed');
    rightPanel.classList.add('collapsed');
    panelToggle && panelToggle.setAttribute('aria-pressed', 'true');
  }
  applyPanelWidths(leftW, rightW);
  applyCenterHeights(centerTop);

  // Pointer drag logic (supports touch)
  let dragging = null;
  let startX = 0; let startLeftW = 0; let startRightW = 0;
  let startY = 0; let startTopH = 0; let startBottomH = 0;

  function onPointerDown(e, side) {
    e.preventDefault();
    dragging = side;
    startX = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX) || 0;
    startY = e.clientY || (e.touches && e.touches[0] && e.touches[0].clientY) || 0;
    startLeftW = leftPanel.getBoundingClientRect().width;
    startRightW = rightPanel.getBoundingClientRect().width;
    startTopH = problemSection ? problemSection.getBoundingClientRect().height : 0;
    startBottomH = codeSection ? codeSection.getBoundingClientRect().height : 0;
    document.documentElement.classList.add('dragging');
    if (side === 'left') splitterLeft.classList.add('dragging');
    if (side === 'right') splitterRight.classList.add('dragging');
    if (side === 'center') splitterCenter && splitterCenter.classList.add('dragging');
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);
  }

  function onPointerMove(e) {
    if (!dragging) return;
    if (dragging === 'left' || dragging === 'right') {
      const clientX = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX) || 0;
      const dx = clientX - startX;
      const minW = 120; const maxW = Math.floor((document.querySelector('.arena-body')?.getBoundingClientRect().width || window.innerWidth) * 0.6);
      if (dragging === 'left') {
        let newLeft = Math.max(0, Math.min(maxW, startLeftW + dx));
        applyPanelWidths(newLeft, rightPanel.getBoundingClientRect().width);
      } else if (dragging === 'right') {
        let newRight = Math.max(0, Math.min(maxW, startRightW - dx));
        applyPanelWidths(leftPanel.getBoundingClientRect().width, newRight);
      }
    } else if (dragging === 'center') {
      const clientY = e.clientY || (e.touches && e.touches[0] && e.touches[0].clientY) || 0;
      const dy = clientY - startY;
      const total = centerPanel.getBoundingClientRect().height;
      const newTop = Math.max(80, Math.min(total - 120, startTopH + dy));
      applyCenterHeights(newTop);
    }
  }

  function onPointerUp() {
    if (!dragging) return;
    // persist sizes
    const l = Math.round(leftPanel.getBoundingClientRect().width);
    const r = Math.round(rightPanel.getBoundingClientRect().width);
    const topH = problemSection ? Math.round(problemSection.getBoundingClientRect().height) : null;
    // save left, right and center top height
    try { localStorage.setItem(getPanelStorageKey(), JSON.stringify({ leftWidth: l, rightWidth: r, collapsed: leftPanel.classList.contains('collapsed') && rightPanel.classList.contains('collapsed'), centerTopHeight: topH })); } catch (e) { }
    splitterLeft.classList.remove('dragging');
    splitterRight.classList.remove('dragging');
    document.documentElement.classList.remove('dragging');
    splitterCenter && splitterCenter.classList.remove('dragging');
    dragging = null;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('touchmove', onPointerMove);
    window.removeEventListener('touchend', onPointerUp);
  }

  // attach pointerdown
  if (splitterLeft) splitterLeft.addEventListener('pointerdown', (e) => onPointerDown(e, 'left'));
  if (splitterRight) splitterRight.addEventListener('pointerdown', (e) => onPointerDown(e, 'right'));
  if (splitterCenter) splitterCenter.addEventListener('pointerdown', (e) => onPointerDown(e, 'center'));
  // touch fallback
  if (splitterLeft) splitterLeft.addEventListener('touchstart', (e) => onPointerDown(e, 'left'));
  if (splitterRight) splitterRight.addEventListener('touchstart', (e) => onPointerDown(e, 'right'));
  if (splitterCenter) splitterCenter.addEventListener('touchstart', (e) => onPointerDown(e, 'center'));

  // toggle button
  if (panelToggle) panelToggle.addEventListener('click', () => toggleSidePanels());

  // window resize: clamp and reapply
  window.addEventListener('resize', () => {
    const savedNow = restorePanelSizes();
    const arenaW = document.querySelector('.arena-body')?.getBoundingClientRect().width || window.innerWidth;
    const maxW = Math.floor(arenaW * 0.6);
    const l = Math.max(0, Math.min(maxW, (savedNow && savedNow.leftWidth) || defaultLeft));
    const r = Math.max(0, Math.min(maxW, (savedNow && savedNow.rightWidth) || defaultRight));
    applyPanelWidths(l, r);
  });
}

// --- Render problem list ---
function renderProblemList() {
  const filtered = problems.filter((p) => {
    const matchesSearch = problemSearchQuery === '' ||
      p.title.toLowerCase().includes(problemSearchQuery);
    const matchesDifficulty = problemDifficultyFilter === 'all' ||
      (p.difficulty && p.difficulty.toLowerCase() === problemDifficultyFilter);
    return matchesSearch && matchesDifficulty;
  });

  problemList.innerHTML = filtered.map((p) => {
    const realIndex = problems.indexOf(p);
    const isSolved = solvedProblems.has(p.problemId);
    return `
      <div class="problem-item ${realIndex === currentProblemIndex ? 'active' : ''} ${isSolved ? 'solved' : ''}" data-index="${realIndex}">
        <span class="problem-index">${isSolved ? '✓' : (realIndex + 1)}</span>
        <span class="problem-title">${escapeHtml(p.title)}</span>
        ${isSolved ? '<span class="solved-check">✓</span>' : ''}
      </div>
    `;
  }).join('');

  // Click handler
  problemList.querySelectorAll('.problem-item').forEach((el) => {
    el.addEventListener('click', () => {
      const index = parseInt(el.dataset.index, 10);
      switchProblem(index);
    });
  });
}

// --- Problem search & filter ---
const problemSearchInput = document.getElementById('problemSearchInput');
const sidebarFilters = document.querySelectorAll('.sidebar-filter-btn');

if (problemSearchInput) {
  problemSearchInput.addEventListener('input', () => {
    problemSearchQuery = problemSearchInput.value.toLowerCase().trim();
    renderProblemList();
  });
}

sidebarFilters.forEach(btn => {
  btn.addEventListener('click', () => {
    sidebarFilters.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    problemDifficultyFilter = btn.dataset.filter;
    renderProblemList();
  });
});

// --- Switch problem ---
async function switchProblem(index) {
  if (index === currentProblemIndex) return;
  currentProblemIndex = index;
  renderProblemList();
  await loadProblemDetails(index);
  if (monacoEditor && currentProblemData) {
    const lang = languageSelect.value;
    const saved = loadSavedCode(currentProblemData.id, lang);
    const code = saved !== null ? saved : (currentProblemData.boilerplate[lang] || currentProblemData.boilerplate.cpp || '');
    monacoEditor.setValue(code);
  }
}

// --- Load problem details ---
async function loadProblemDetails(index) {
  const problem = problems[index];
  if (!problem) return;

  if (probTitle) probTitle.textContent = `#${index + 1}: ${problem.title}`;

  try {
    const res = await fetch(`${API_BASE_URL}/problems/${encodeURIComponent(problem.problemId)}`);
    const data = await res.json();

    if (!data.success) {
      if (probDesc) probDesc.innerHTML = '<p style="color:#f87171">Failed to load problem details.</p>';
      return;
    }

    currentProblemData = data.problem;
    const p = data.problem;

    // Meta
    if (probMeta) probMeta.innerHTML = `
      <span>${escapeHtml(p.difficulty)}</span>
      ${p.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}
    `;

    // Description
    if (probDesc) probDesc.innerHTML = p.description.map((para) => `<p>${escapeHtml(para)}</p>`).join('');

    // Example
    if (probExample) {
      if (p.example) {
        probExample.style.display = 'block';
        probExample.textContent = p.example;
      } else {
        probExample.style.display = 'none';
      }
    }

    // Constraints
    if (probConstraints) {
      if (p.constraints && p.constraints.length) {
        probConstraints.style.display = 'block';
        probConstraints.innerHTML = p.constraints.map((c) => `<li>${escapeHtml(c)}</li>`).join('');
      } else {
        probConstraints.style.display = 'none';
      }
    }
  } catch {
    probDesc.innerHTML = '<p style="color:#f87171">Could not load problem. Check backend.</p>';
  }
}

// --- Code persistence helpers ---
function getCodeStorageKey(problemId, lang) {
  return `contest:${contestCode}:code:${problemId}:${lang}`;
}

function saveCode(problemId, lang, code) {
  try {
    localStorage.setItem(getCodeStorageKey(problemId, lang), code);
  } catch (e) {}
}

function loadSavedCode(problemId, lang) {
  try {
    return localStorage.getItem(getCodeStorageKey(problemId, lang));
  } catch (e) { return null; }
}

let codeSaveTimer = null;
function scheduleCodeSave() {
  if (!monacoEditor || !currentProblemData) return;
  clearTimeout(codeSaveTimer);
  codeSaveTimer = setTimeout(() => {
    saveCode(currentProblemData.id, languageSelect.value, monacoEditor.getValue());
  }, 500);
}

// --- Monaco editor ---
function initMonaco() {
  if (!codeEditorContainer) return;

  const initialLanguage = languageSelect.value;
  const monacoLang = monacoLanguages[initialLanguage] || 'cpp';
  const savedCode = currentProblemData ? loadSavedCode(currentProblemData.id, initialLanguage) : null;
  const initialValue = savedCode !== null ? savedCode : (currentProblemData?.boilerplate?.[initialLanguage] || currentProblemData?.boilerplate?.cpp || '');

  require.config({
    paths: {
      vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs'
    }
  });

  require(['vs/editor/editor.main'], () => {
    monacoEditor = monaco.editor.create(codeEditorContainer, {
      value: initialValue,
      language: monacoLang,
      theme: 'vs-dark',
      automaticLayout: true,
      fontFamily: "'DM Mono', monospace",
      fontSize: 14,
      lineHeight: 24,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      tabSize: 2,
      insertSpaces: true,
      padding: { top: 12, bottom: 12 }
    });

    monacoEditor.onDidChangeModelContent(() => scheduleCodeSave());
  });

  // Language switch
  languageSelect.addEventListener('change', () => {
    if (!monacoEditor || !currentProblemData) return;
    const lang = languageSelect.value;
    const model = monacoEditor.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, monacoLanguages[lang] || 'cpp');
    }
    const saved = loadSavedCode(currentProblemData.id, lang);
    const code = saved !== null ? saved : (currentProblemData.boilerplate[lang] || currentProblemData.boilerplate.cpp || '');
    monacoEditor.setValue(code);
  });
}

// --- Submissions ---
async function executeCode(action) {
  if (!monacoEditor || !currentProblemData || !problems[currentProblemIndex]) return;

  const isSubmit = action === 'submit';
  const problemId = currentProblemData.id;
  const language = languageSelect.value;
  const sourceCode = monacoEditor.getValue();

  runBtn.disabled = true;
  submitBtn.disabled = true;

  // Show loading in results
  resultsContent.innerHTML = `
    <p class="results-summary" style="background:rgba(96,165,250,0.1);color:#60a5fa">
      ${isSubmit ? 'Submitting...' : 'Running...'}
    </p>
  `;
  resultsOverlay.classList.add('open');

  try {
    const res = await fetch(`${API_BASE_URL}/submit-code`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        problemId,
        language,
        sourceCode,
        action
      })
    });

    const data = await res.json();

    // Render results
    const passed = data.passed;
    const verdict = data.verdict || 'Unknown';
    const summaryClass = passed ? 'pass' : 'fail';
    const summaryText = isSubmit
      ? `${verdict}: ${data.passedTests}/${data.totalTests} passed`
      : `Run: ${data.passedTests}/${data.totalTests} passed`;

    resultsContent.innerHTML = `
      <p class="results-summary ${summaryClass}">${escapeHtml(summaryText)}</p>
      <div>
        ${data.results.map((result) => {
          const details = [
            `Input: ${result.input}`,
            `Expected: ${result.expected}`,
            `Output: ${result.output || '(no output)'}`
          ];
          if (result.compileOutput) details.push(`Compile: ${result.compileOutput}`);
          if (result.stderr) details.push(`Error: ${result.stderr}`);
          return `
            <div class="test-result ${result.passed ? 'pass' : 'fail'}">
              <div class="test-title">
                <span>${escapeHtml(result.name)}</span>
                <span>${result.passed ? 'Passed' : (result.status || 'Failed')}</span>
              </div>
              <div class="test-details">${escapeHtml(details.join('\n'))}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Notify backend for all submissions (accepted = +100, wrong = -10)
    if (isSubmit) {
      if (passed && verdict === 'Accepted') solvedProblems.add(problemId);

      await fetch(`${API_BASE_URL}/api/contests/${contestCode}/submit`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ problemId, language, sourceCode, verdict })
      });

      renderProblemList();
      loadLeaderboard();
    }
  } catch {
    resultsContent.innerHTML = `
      <p class="results-summary fail" style="background:rgba(248,113,113,0.1);color:#f87171">
        Server error. Make sure the backend is running on the deployed backend.
      </p>
    `;
  } finally {
    runBtn.disabled = false;
    submitBtn.disabled = false;
  }
}

runBtn.addEventListener('click', () => executeCode('run'));
submitBtn.addEventListener('click', () => executeCode('submit'));
if (resetBtn) resetBtn.addEventListener('click', () => {
  if (!monacoEditor || !currentProblemData) return;
  const lang = languageSelect.value;
  const boilerplate = currentProblemData.boilerplate[lang] || currentProblemData.boilerplate.cpp || '';
  monacoEditor.setValue(boilerplate);
  showToast('Editor reset to boilerplate', 'info', 1500);
});

closeResults.addEventListener('click', () => {
  resultsOverlay.classList.remove('open');
});

// Close overlay on backdrop click
resultsOverlay.addEventListener('click', (e) => {
  if (e.target === resultsOverlay) {
    resultsOverlay.classList.remove('open');
  }
});

// --- Leaderboard ---
async function loadLeaderboard() {
  if (!contestCode || !leaderboardList) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/contests/${contestCode}/leaderboard`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();

    if (!data.success) {
      console.warn('[leaderboard] API error:', data.message);
      return;
    }

    const entries = data.leaderboard || [];

    if (entries.length === 0) {
      leaderboardList.innerHTML = `<div style="padding:16px 12px;color:#475569;font-size:12px">No participants yet.</div>`;
      return;
    }

    const user = getCurrentUser();
    const contestProblems = contest?.problems || [];

    leaderboardList.innerHTML = entries.map((entry) => {
      const fuid = user?.firebaseUid || user?.uid;
      const isSelf = (fuid && entry.firebaseUid && entry.firebaseUid === fuid)
        || entry.name === user?.name
        || entry.name === user?.email;
      const rankClass = entry.rank <= 3 ? `top-${entry.rank}` : '';
      const solvedSet = new Set(entry.solvedProblems || []);
      const scoreStr = entry.score > 0 ? `+${entry.score}` : String(entry.score);

      const dots = contestProblems.map((p, i) => {
        const solved = solvedSet.has(p.problemId);
        const t = (entry.perProblemTimes || {})[p.problemId];
        const label = `P${i + 1}${t != null ? ' ' + formatDuration(t) : ''}`;
        return `<span class="lb-dot ${solved ? 'solved' : ''}" title="${escapeHtml(label)}">●</span>`;
      }).join('');

      const penaltyStr = entry.penalty < 0
        ? `<span class="lb-penalty">${entry.penalty}</span>` : '';
      const timeStr = entry.timeTakenSeconds != null
        ? `<span class="lb-time">${formatDuration(entry.timeTakenSeconds)}</span>` : '';

      return `
        <div class="leaderboard-item${isSelf ? ' self' : ''}">
          <div class="lb-top-row">
            <span class="leaderboard-rank ${rankClass}">${entry.rank}</span>
            <span class="leaderboard-name">${escapeHtml(entry.name)}</span>
            <span class="lb-score">${escapeHtml(scoreStr)}</span>
          </div>
          <div class="lb-bottom-row">
            <span class="lb-dots">${dots}</span>
            ${penaltyStr}
            ${timeStr}
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('[leaderboard] render error:', err);
  }
}

function formatDuration(sec) {
  if (sec == null) return '--';
  const hours = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const secs = sec % 60;
  if (hours > 0) return `${hours}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  return `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
}

function startLeaderboardPolling() {
  loadLeaderboard();
  leaderboardInterval = setInterval(loadLeaderboard, 10000);
}

// --- Cleanup ---
window.addEventListener('beforeunload', () => {
  if (timerInterval) clearInterval(timerInterval);
  if (leaderboardInterval) clearInterval(leaderboardInterval);
});

// --- Start ---
loadContest();

// If Firebase auth state wasn't ready when loadContest ran, retry auto-join once
// it confirms a logged-in user. This covers the direct-URL / cold-load case.
(function retryJoinOnAuth() {
  try {
    if (typeof firebase === 'undefined' || !firebase.auth) return;
    const unsub = firebase.auth().onAuthStateChanged(async (firebaseUser) => {
      unsub(); // one-shot
      if (!firebaseUser || !contest) return;

      // Update localStorage user with fresh Firebase UID
      const stored = typeof getAlgoforgeUser === 'function' ? getAlgoforgeUser() : null;
      if (stored && !stored.firebaseUid) {
        stored.firebaseUid = firebaseUser.uid;
        stored.uid = firebaseUser.uid;
        try { localStorage.setItem('algoforge-user', JSON.stringify(stored)); } catch (e) {}
      }

      // Check if user is already in participants; if not, join
      const participants = contest.participants || [];
      const alreadyIn = participants.some((p) =>
        (p.firebaseUid && p.firebaseUid === firebaseUser.uid) ||
        (stored?.id && p.userId && p.userId.toString() === stored.id) ||
        (p.name && stored && (p.name === stored.name || p.name === stored.email))
      );
      if (alreadyIn) return;

      try {
        const token = await firebaseUser.getIdToken(true);
        localStorage.setItem('algoforge-id-token', token);
        const joinRes = await fetch(`${API_BASE_URL}/api/contests/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ code: contestCode })
        });
        const joinData = await joinRes.json();
        console.log('[contest] auth-ready join:', joinData.success, joinData.message || '');
        if (joinData.success) {
          // Refresh contest so participant state is accurate
          const r = await fetch(`${API_BASE_URL}/api/contests/${contestCode}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const rd = await r.json();
          if (rd.success) contest = rd.contest;
        }
      } catch (e) {
        console.warn('[contest] auth-ready join failed:', e);
      }
    });
  } catch (e) { /* firebase not available */ }
}());