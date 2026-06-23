/* API_BASE_URL_URL is defined in config.js — loaded via <script> tag */
const AUTO_SAVE_INTERVAL_MS = 5000;

function isAuthenticated() {
  return localStorage.getItem('algoforge-auth') === 'true';
}

if (!isAuthenticated()) {
  window.location.href = 'login.html';
}

initAppNav();

const params = new URLSearchParams(window.location.search);
const problemId = params.get('problem') || 'two-sum';

const languageSelect = document.getElementById('language');
const codeEditorContainer = document.getElementById('codeEditor');
const runBtn = document.getElementById('runBtn');
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');
const resultsPanel = document.getElementById('resultsPanel');
const problemHeader = document.getElementById('problemHeader');
const problemTitle = document.getElementById('problemTitle');
const problemDescription = document.getElementById('problemDescription');
const problemExample = document.getElementById('problemExample');
const problemConstraints = document.getElementById('problemConstraints');
const resultsEmpty = document.getElementById('resultsEmpty');
const solvedBadge = document.getElementById('solvedBadge');

const monacoLanguages = {
  c: 'c',
  cpp: 'cpp',
  java: 'java',
  js: 'javascript',
  python: 'python'
};

let problem = null;
let monacoEditor = null;
let isProblemSolved = false;
let lastSavedContent = '';
let hasUnsavedChanges = false;
let autoSaveTimer = null;
let isSwitchingLanguage = false;

// Multi-solution tabs
let activeSolutionIdx = 0;
let solutionCount = 1;
const MAX_SOLUTIONS = 5;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getCurrentUser() {
  return typeof getAlgoforgeUser === 'function' ? getAlgoforgeUser() : null;
}

function canPersistCode() {
  return Boolean(getCurrentUser()?.id && problem?.id);
}

function localCodeKey(language, solIdx) {
  const idx = solIdx !== undefined ? solIdx : activeSolutionIdx;
  // idx 0 keeps original key for backward compat
  return idx === 0 ? `af-code-${problemId}-${language}` : `af-code-${problemId}-${language}-s${idx}`;
}

function solutionCountKey() { return `af-sol-count-${problemId}`; }

function saveCodeLocally(code, language) {
  try { localStorage.setItem(localCodeKey(language), code); } catch (_) {}
}

function loadCodeLocally(language, solIdx) {
  try { return localStorage.getItem(localCodeKey(language, solIdx)) || null; } catch (_) { return null; }
}

function getBoilerplate(language) {
  if (!problem) return '';
  return problem.boilerplate[language] || problem.boilerplate.cpp || '';
}

/* ── Solution tabs ── */
function renderSolutionTabs() {
  const bar = document.getElementById('solutionTabBar');
  if (!bar) return;
  bar.innerHTML = '';

  for (let i = 0; i < solutionCount; i++) {
    const tab = document.createElement('button');
    tab.className = 'solution-tab' + (i === activeSolutionIdx ? ' active' : '');
    tab.dataset.idx = i;
    tab.setAttribute('aria-label', `Solution ${i + 1}`);

    const label = document.createElement('span');
    label.textContent = `Solution ${i + 1}`;
    tab.appendChild(label);

    if (i > 0) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'solution-tab-close';
      closeBtn.textContent = '×';
      closeBtn.title = 'Remove this solution';
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeSolution(i);
      });
      tab.appendChild(closeBtn);
    }

    tab.addEventListener('click', () => switchSolution(i));
    bar.appendChild(tab);
  }

  if (solutionCount < MAX_SOLUTIONS) {
    const addBtn = document.createElement('button');
    addBtn.className = 'solution-tab-add';
    addBtn.title = 'Add new solution';
    addBtn.innerHTML = '+';
    addBtn.addEventListener('click', addSolution);
    bar.appendChild(addBtn);
  }
}

function saveSolutionCount() {
  try { localStorage.setItem(solutionCountKey(), String(solutionCount)); } catch (_) {}
}

async function switchSolution(idx) {
  if (idx === activeSolutionIdx || !monacoEditor) return;

  // save current editor content to current solution slot
  const lang = languageSelect ? languageSelect.value : 'cpp';
  saveCodeLocally(monacoEditor.getValue(), lang);

  activeSolutionIdx = idx;

  // load code for new solution slot
  const saved = loadCodeLocally(lang);
  const nextValue = saved ?? getBoilerplate(lang);
  isSwitchingLanguage = true;
  monacoEditor.setValue(nextValue);
  lastSavedContent = nextValue;
  hasUnsavedChanges = false;
  isSwitchingLanguage = false;

  renderSolutionTabs();
}

function addSolution() {
  if (solutionCount >= MAX_SOLUTIONS || !monacoEditor) return;

  // save current code first
  const lang = languageSelect ? languageSelect.value : 'cpp';
  saveCodeLocally(monacoEditor.getValue(), lang);

  solutionCount++;
  saveSolutionCount();

  // switch to the new (empty) slot
  activeSolutionIdx = solutionCount - 1;

  const boilerplate = getBoilerplate(lang);
  isSwitchingLanguage = true;
  monacoEditor.setValue(boilerplate);
  lastSavedContent = boilerplate;
  hasUnsavedChanges = false;
  isSwitchingLanguage = false;

  renderSolutionTabs();
}

function removeSolution(idx) {
  if (idx <= 0 || solutionCount <= 1 || !monacoEditor) return;

  // clear localStorage slots for this solution across all languages
  Object.keys(monacoLanguages).forEach((lang) => {
    try { localStorage.removeItem(localCodeKey(lang, idx)); } catch (_) {}
  });

  // shift slots above idx down by 1
  for (let i = idx + 1; i < solutionCount; i++) {
    Object.keys(monacoLanguages).forEach((lang) => {
      const above = loadCodeLocally(lang, i);
      if (above !== null) {
        try { localStorage.setItem(localCodeKey(lang, i - 1), above); } catch (_) {}
      }
      try { localStorage.removeItem(localCodeKey(lang, i)); } catch (_) {}
    });
  }

  solutionCount--;
  saveSolutionCount();

  // choose which tab to land on
  const newActive = activeSolutionIdx >= idx ? Math.max(0, activeSolutionIdx - 1) : activeSolutionIdx;
  activeSolutionIdx = newActive;

  const lang = languageSelect ? languageSelect.value : 'cpp';
  const saved = loadCodeLocally(lang);
  const nextValue = saved ?? getBoilerplate(lang);
  isSwitchingLanguage = true;
  monacoEditor.setValue(nextValue);
  lastSavedContent = nextValue;
  hasUnsavedChanges = false;
  isSwitchingLanguage = false;

  renderSolutionTabs();
}

function initSolutionTabs() {
  const saved = parseInt(localStorage.getItem(solutionCountKey()), 10);
  solutionCount = (!Number.isNaN(saved) && saved >= 1) ? Math.min(saved, MAX_SOLUTIONS) : 1;
  activeSolutionIdx = 0;
  renderSolutionTabs();
}

function setSolvedBadgeVisible(visible) {
  isProblemSolved = visible;
  if (solvedBadge) {
    solvedBadge.classList.toggle('hidden', !visible);
  }
}

async function loadSolvedStatus() {
  const user = getCurrentUser();
  if (!user?.id) {
    setSolvedBadgeVisible(false);
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/profile/solved`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();

    if (response.ok && data.success) {
      const alreadySolved = data.solvedIds.includes(problem.id);
      setSolvedBadgeVisible(alreadySolved);
      if (alreadySolved) unlockReviewBtn();
    }
  } catch (error) {
    console.log(error);
  }
}

async function fetchSavedCode(language) {
  const local = loadCodeLocally(language);

  if (canPersistCode()) {
    // Fetch from server in background; update editor if user hasn't started typing
    fetch(
      `${API_BASE_URL}/code/${encodeURIComponent(problem.id)}/${encodeURIComponent(language)}`,
      { headers: getAuthHeaders() }
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.success && data.sourceCode && monacoEditor && !hasUnsavedChanges) {
          const current = monacoEditor.getValue();
          if (data.sourceCode !== current) {
            monacoEditor.setValue(data.sourceCode);
            lastSavedContent = data.sourceCode;
            hasUnsavedChanges = false;
            saveCodeLocally(data.sourceCode, language);
          }
        }
      })
      .catch(() => {});
  }

  return local;
}

async function saveCode({ keepalive = false, silent = false } = {}) {
  if (!canPersistCode() || !monacoEditor || !languageSelect) {
    return false;
  }

  const sourceCode = monacoEditor.getValue();

  if (sourceCode === lastSavedContent) {
    hasUnsavedChanges = false;
    return true;
  }

  const user = getCurrentUser();
  const payload = {
    problemId: problem.id,
    language: languageSelect.value,
    sourceCode,
    userId: user?.id
  };

  try {
    const response = await fetch(`${API_BASE_URL}/code/save`, {
      method: 'POST',
      headers: getAuthHeaders({
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify(payload),
      keepalive
    });

    if (!response.ok) {
      return false;
    }

    lastSavedContent = sourceCode;
    hasUnsavedChanges = false;
    saveCodeLocally(sourceCode, languageSelect.value);
    if (!keepalive && !silent) showToast('Code saved', 'success', 2000);
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

function applyEditorLanguage(language) {
  if (!monacoEditor) return;

  const model = monacoEditor.getModel();
  const monacoLanguage = monacoLanguages[language] || 'cpp';

  if (model) {
    monaco.editor.setModelLanguage(model, monacoLanguage);
  }
}

async function loadLanguageCode(language) {
  if (!monacoEditor || !problem) return;

  const savedCode = await fetchSavedCode(language);
  const nextValue = savedCode ?? getBoilerplate(language);

  applyEditorLanguage(language);
  monacoEditor.setValue(nextValue);
  lastSavedContent = nextValue;
  hasUnsavedChanges = false;
}

function startAutoSave() {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
  }

  autoSaveTimer = setInterval(() => {
    if (hasUnsavedChanges) {
      saveCode({ silent: true });
    }
  }, AUTO_SAVE_INTERVAL_MS);
}

function renderProblem() {
  if (!problem) {
    if (resultsPanel) {
      resultsPanel.innerHTML = '<p class="error-text">Problem not found.</p>';
    }
    return;
  }

  document.title = `AlgoForge - ${problem.title}`;

  if (problemHeader) {
    const tags = [
      `<span class="difficulty">${escapeHtml(problem.difficulty)}</span>`,
      ...problem.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`)
    ].join('');

    problemHeader.innerHTML = tags;
  }

  if (problemTitle) problemTitle.textContent = problem.title;

  if (problemDescription) {
    problemDescription.innerHTML = problem.description
      .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
      .join('');
  }

  if (problemExample) problemExample.textContent = problem.example;

  if (problemConstraints) {
    problemConstraints.innerHTML = problem.constraints
      .map((constraint) => `<li>${escapeHtml(constraint)}</li>`)
      .join('');
  }

  if (resultsEmpty) {
    resultsEmpty.textContent = `Run your code to evaluate it against ${problem.testCases.length} test cases.`;
  }
}

function setLoading(isLoading, action = 'run') {
  if (runBtn) runBtn.disabled = isLoading;
  if (submitBtn) submitBtn.disabled = isLoading;
  if (runBtn) runBtn.textContent = isLoading && action === 'run' ? 'Running...' : 'Run Code';
  if (submitBtn) submitBtn.textContent = isLoading && action === 'submit' ? 'Submitting...' : 'Submit';
}

function renderResults(data, { isSubmit = false } = {}) {
  if (!resultsPanel) return;

  if (!data.success) {
    resultsPanel.innerHTML = `<p class="error-text">${escapeHtml(data.message || 'Submission failed')}</p>`;
    return;
  }

  if (isSubmit && data.passed && data.verdict === 'Accepted') {
    setSolvedBadgeVisible(true);
    unlockReviewBtn();
    launchCelebration();
  }

  let summary;

  if (isSubmit) {
    summary = data.passed
      ? `Accepted: ${data.passedTests}/${data.totalTests} test cases passed`
      : `${data.verdict}: ${data.passedTests}/${data.totalTests} test cases passed`;
  } else {
    summary = data.passed
      ? `All test cases passed: ${data.passedTests}/${data.totalTests} (not submitted)`
      : `Run finished: ${data.passedTests}/${data.totalTests} test cases passed`;
  }

  const tests = data.results.map((result) => {
    const details = [
      `Input: ${result.input}`,
      `Expected: ${result.expected}`,
      `Output: ${result.output || '(no output)'}`
    ];

    if (result.compileOutput) details.push(`Compile: ${result.compileOutput}`);
    if (result.stderr) details.push(`Error: ${result.stderr}`);

    return `
      <article class="test-result ${result.passed ? 'pass' : 'fail'}">
        <div class="test-title">
          <span>${escapeHtml(result.name)}</span>
          <span class="test-status">${escapeHtml(result.passed ? 'Passed' : result.status)}</span>
        </div>
        <div class="test-details">${escapeHtml(details.join('\n'))}</div>
      </article>
    `;
  }).join('');

  resultsPanel.innerHTML = `
    <p class="results-summary">${escapeHtml(summary)}</p>
    <div class="results-list">${tests}</div>
  `;
}

async function executeCode(action) {
  if (!languageSelect || !monacoEditor || !resultsPanel || !problem) return;

  const isSubmit = action === 'submit';

  if (isSubmit) {
    await saveCode();
  }

  setLoading(true, action);
  resultsPanel.innerHTML = `<p class="results-empty">${isSubmit ? 'Submitting to Judge0...' : 'Running code against test cases...'}</p>`;

  try {
    const user = getCurrentUser();
    const response = await fetch(`${API_BASE_URL}/submit-code`, {
      method: 'POST',
      headers: getAuthHeaders({
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify({
        problemId: problem.id,
        language: languageSelect.value,
        sourceCode: monacoEditor.getValue(),
        userId: user?.id,
        action
      })
    });

    const data = await response.json();
    renderResults(data, { isSubmit });
  } catch (error) {
    resultsPanel.innerHTML = '<p class="error-text">Could not connect to the backend server. Start it on the deployed backend and try again.</p>';
    console.log(error);
  } finally {
    setLoading(false, action);
  }
}

async function runCode() {
  await executeCode('run');
}

async function submitSolution() {
  await executeCode('submit');
}

async function initMonaco() {
  if (!codeEditorContainer || !languageSelect || !problem) return;

  const initialLanguage = languageSelect.value;
  const monacoLanguage = monacoLanguages[initialLanguage] || 'cpp';
  const savedCode = await fetchSavedCode(initialLanguage);
  const initialValue = savedCode ?? getBoilerplate(initialLanguage);

  monacoEditor = monaco.editor.create(codeEditorContainer, {
    value: initialValue,
    language: monacoLanguage,
    theme: 'vs-dark',
    automaticLayout: true,
    fontFamily: "'DM Mono', monospace",
    fontSize: 15,
    lineHeight: 26,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    tabSize: 2,
    insertSpaces: true,
    padding: { top: 16, bottom: 16 }
  });

  lastSavedContent = initialValue;
  hasUnsavedChanges = false;

  let localSaveTimer = null;
  monacoEditor.onDidChangeModelContent(() => {
    if (isSwitchingLanguage) return;
    const code = monacoEditor.getValue();
    hasUnsavedChanges = code !== lastSavedContent;
    // Persist to localStorage on every edit (debounced 400ms)
    clearTimeout(localSaveTimer);
    localSaveTimer = setTimeout(() => saveCodeLocally(code, languageSelect.value), 400); // saves to active solution slot
  });

  languageSelect.addEventListener('change', async () => {
    const previousLanguage = languageSelect.dataset.previousLanguage || initialLanguage;
    const nextLanguage = languageSelect.value;

    if (previousLanguage === nextLanguage) return;

    isSwitchingLanguage = true;
    languageSelect.disabled = true;

    const currentCode = monacoEditor.getValue();
    saveCodeLocally(currentCode, previousLanguage); // saves to current solution slot
    if (canPersistCode() && currentCode !== lastSavedContent) {
      const user = getCurrentUser();
      await fetch(`${API_BASE_URL}/code/save`, {
        method: 'POST',
        headers: getAuthHeaders({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
          problemId: problem.id,
          language: previousLanguage,
          sourceCode: currentCode,
          userId: user?.id
        })
      });
    }

    languageSelect.dataset.previousLanguage = nextLanguage;
    await loadLanguageCode(nextLanguage);

    isSwitchingLanguage = false;
    languageSelect.disabled = false;
  });

  languageSelect.dataset.previousLanguage = initialLanguage;
  startAutoSave();
}

async function loadProblem() {
  if (resultsPanel) {
    resultsPanel.innerHTML = '<p class="results-empty">Loading problem...</p>';
  }

  try {
    const response = await fetch(`${API_BASE_URL}/problems/${encodeURIComponent(problemId)}`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Problem not found');
    }

    problem = data.problem;
    renderProblem();
    initSolutionTabs();
    await loadSolvedStatus();

    if (resultsPanel && resultsEmpty) {
      resultsPanel.innerHTML = '';
      resultsPanel.appendChild(resultsEmpty);
    }

    require.config({
      paths: {
        vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs'
      }
    });

    require(['vs/editor/editor.main'], initMonaco);
  } catch (error) {
    if (resultsPanel) {
      resultsPanel.innerHTML = '<p class="error-text">Could not load this problem. Start the backend on the deployed backend and run npm run seed.</p>';
    }
    console.log(error);
  }
}

function unlockReviewBtn() {
  const btn = document.getElementById('reviewCodeBtn');
  if (!btn) return;
  btn.disabled = false;
  btn.classList.remove('locked');
  btn.classList.add('unlocked');
  const lockIcon = btn.querySelector('.review-lock-icon');
  const sub      = btn.querySelector('.review-btn-sub');
  if (lockIcon) lockIcon.textContent = '✦';
  if (sub) sub.textContent = 'get AI feedback';
}

async function fetchCodeReview() {
  const btn = document.getElementById('reviewCodeBtn');
  const code = monacoEditor ? monacoEditor.getValue() : '';
  const lang = languageSelect ? languageSelect.value : 'cpp';
  if (!code.trim() || !problem) return;

  if (btn) { btn.disabled = true; btn.querySelector('.review-btn-label').textContent = 'Reviewing…'; }

  showAiLoading('Code Review');

  try {
    const res = await fetch(`${API_BASE_URL}/api/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(window.getAuthHeaders ? window.getAuthHeaders() : {}) },
      body: JSON.stringify({ problemId, code, language: lang })
    });
    const data = await res.json();
    if (data.review) {
      showAiResponse('Code Review', data.review);
    } else if (data.error === 'AI service not configured') {
      showAiResponse('Code Review', 'AI service is not configured on the server. Add GROQ_API_KEY to your Render environment variables.');
    } else {
      showAiResponse('Code Review', data.error || 'Could not generate review. Please try again.');
    }
  } catch {
    showAiResponse('Code Review', 'Network error. Check your connection and try again.');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.querySelector('.review-btn-label').textContent = 'Review My Code';
    }
  }
}

const reviewCodeBtn = document.getElementById('reviewCodeBtn');
if (reviewCodeBtn) {
  reviewCodeBtn.addEventListener('click', () => {
    if (reviewCodeBtn.classList.contains('locked')) return;
    fetchCodeReview();
  });
}

if (runBtn) {
  runBtn.addEventListener('click', runCode);
}

if (submitBtn) {
  submitBtn.addEventListener('click', submitSolution);
}

if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    if (!monacoEditor || !problem) return;
    monacoEditor.setValue(getBoilerplate(languageSelect.value));
    showToast('Editor reset to boilerplate', 'info', 1500);
  });
}

window.addEventListener('beforeunload', () => {
  if (!monacoEditor || !languageSelect) return;
  // Always save to localStorage on page leave — no network needed
  saveCodeLocally(monacoEditor.getValue(), languageSelect.value);

  if (!hasUnsavedChanges || !canPersistCode()) return;

  const user = getCurrentUser();

  fetch(`${API_BASE_URL}/code/save`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      problemId: problem.id,
      language: languageSelect.value,
      sourceCode: monacoEditor.getValue(),
      userId: user?.id
    }),
    keepalive: true
  });
});

loadProblem();

/* AI Assist stopwatch and hint unlocks (only counts while the page is visible)
   - Accumulates elapsed seconds in localStorage per-problem
   - Pauses when the document is hidden or user leaves the page
   - Unlocks hints after configured intervals and auto-opens AI panel when unlocked (only while visible)
*/
const HINT_UNLOCK_SECONDS = [4 * 60, 9 * 60, 14 * 60]; // configurable unlock times
let aiTimerInterval = null;
let aiRunningStart = null; // timestamp while running (ms)
let aiAccumulated = 0; // seconds

function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const secs = (totalSeconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function showAiResponse(title, text) {
  const panel      = document.getElementById('aiResponsePanel');
  const body       = document.getElementById('aiResponseText');
  const loading    = document.getElementById('aiLoading');
  const disclaimer = document.getElementById('hintDisclaimer');
  const hdr        = document.getElementById('aiResponseTitle');
  if (!panel || !body || !loading || !hdr) return;

  hdr.textContent = title || 'AI Response';
  loading.style.display = 'none';
  body.style.display = 'block';
  body.textContent = text || '';
  if (disclaimer) disclaimer.style.display = 'none';
  panel.style.display = 'block';

  document.getElementById('aiResponseClose').onclick = () => { panel.style.display = 'none'; };
}

function showAiLoading(title) {
  const panel      = document.getElementById('aiResponsePanel');
  const body       = document.getElementById('aiResponseText');
  const loading    = document.getElementById('aiLoading');
  const disclaimer = document.getElementById('hintDisclaimer');
  const hdr        = document.getElementById('aiResponseTitle');
  if (!panel) return;

  hdr.textContent = title || 'Generating hint…';
  loading.style.display = 'flex';
  body.style.display = 'none';
  if (disclaimer) disclaimer.style.display = 'none';
  panel.style.display = 'block';

  document.getElementById('aiResponseClose').onclick = () => { panel.style.display = 'none'; };
}

function showHintResponse(title, text) {
  const panel      = document.getElementById('aiResponsePanel');
  const body       = document.getElementById('aiResponseText');
  const loading    = document.getElementById('aiLoading');
  const disclaimer = document.getElementById('hintDisclaimer');
  const hdr        = document.getElementById('aiResponseTitle');
  if (!panel || !body || !loading || !hdr) return;

  hdr.textContent = title || 'Hint';
  loading.style.display = 'none';
  body.style.display = 'block';
  body.textContent = text || '';
  if (disclaimer) disclaimer.style.display = 'flex';
  panel.style.display = 'block';

  document.getElementById('aiResponseClose').onclick = () => { panel.style.display = 'none'; };
}

async function fetchAiHint(hintNumber) {
  const code        = monacoEditor ? monacoEditor.getValue() : '';
  const language    = languageSelect ? languageSelect.value : 'cpp';
  let elapsedSec    = aiAccumulated;
  if (aiRunningStart) elapsedSec += Math.floor((Date.now() - aiRunningStart) / 1000);

  const label = `Hint ${hintNumber} of 3`;
  showAiLoading(label);

  try {
    const res = await fetch(`${API_BASE_URL}/api/hint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(window.getAuthHeaders ? window.getAuthHeaders() : {}) },
      body: JSON.stringify({ problemId, hintNumber, code, language, elapsedSeconds: elapsedSec })
    });
    const data = await res.json();
    if (data.hint) {
      showHintResponse(label, data.hint);
    } else if (data.error === 'AI service not configured') {
      showHintResponse(label, 'AI service is not configured on the server. Add GROQ_API_KEY to your Render environment variables.');
    } else {
      showHintResponse(label, data.error || 'Could not generate hint. Please try again.');
    }
  } catch {
    showHintResponse(label, 'Network error. Check your connection and try again.');
  }
}

function initAiTimer() {
  const aiTimerEl = document.getElementById('aiTimer');
  const hintButtons = [
    document.getElementById('hint1Btn'),
    document.getElementById('hint2Btn'),
    document.getElementById('hint3Btn')
  ];

  if (!aiTimerEl || !problem) return;

  const accumKey = `aiTimer_accum_${problem.id}`;
  const runningKey = `aiTimer_running_${problem.id}`;

  aiAccumulated = parseInt(localStorage.getItem(accumKey), 10) || 0;
  const savedRunning = parseInt(localStorage.getItem(runningKey), 10);
  if (savedRunning && !Number.isNaN(savedRunning)) {
    // only resume running if the document is visible now
    if (document.visibilityState === 'visible') aiRunningStart = savedRunning;
  }

  function getElapsedSec() {
    let elapsed = aiAccumulated;
    if (aiRunningStart) elapsed += Math.floor((Date.now() - aiRunningStart) / 1000);
    return elapsed;
  }

  function tick() {
    const elapsedSec = getElapsedSec();
    aiTimerEl.textContent = formatTime(elapsedSec);

    HINT_UNLOCK_SECONDS.forEach((unlockSec, idx) => {
      const btn = hintButtons[idx];
      if (!btn) return;
      const timerSpan = btn.querySelector('.hint-unlock-timer');

      const remaining = unlockSec - elapsedSec;
      if (remaining <= 0) {
        if (btn.classList.contains('locked')) {
          btn.classList.remove('locked');
          btn.classList.add('unlocked');
          btn.disabled = false;
          if (timerSpan) timerSpan.textContent = 'unlocked';

          // Notify user hint is available (don't auto-fetch, let them click)
          if (document.visibilityState === 'visible') {
            btn.classList.add('pulse-unlock');
            setTimeout(() => btn.classList.remove('pulse-unlock'), 3000);
          }
        }
      } else {
        if (timerSpan) timerSpan.textContent = `unlocks in ${formatTime(remaining)}`;
      }
    });
  }

  function startRunning() {
    if (!aiRunningStart) {
      aiRunningStart = Date.now();
      localStorage.setItem(runningKey, String(aiRunningStart));
    }
    if (aiTimerInterval) clearInterval(aiTimerInterval);
    aiTimerInterval = setInterval(tick, 1000);
    tick();
  }

  function stopRunning() {
    if (aiRunningStart) {
      const delta = Math.floor((Date.now() - aiRunningStart) / 1000);
      aiAccumulated += delta;
      localStorage.setItem(accumKey, String(aiAccumulated));
      aiRunningStart = null;
      localStorage.removeItem(runningKey);
    }
    if (aiTimerInterval) {
      clearInterval(aiTimerInterval);
      aiTimerInterval = null;
    }
    tick();
  }

  // visibility handling: run only while visible
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') startRunning();
    else stopRunning();
  });

  // start now if visible
  if (document.visibilityState === 'visible') startRunning();

  // ensure we persist accumulated time on unload
  window.addEventListener('beforeunload', stopRunning);

  // hint click handlers
  hintButtons.forEach((btn, idx) => {
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (btn.classList.contains('locked')) return;
      fetchAiHint(idx + 1);
      btn.classList.remove('unlocked');
      btn.classList.add('used');
    });
  });

  
}

// start AI timer when problem is loaded/rendered
const originalRenderProblem = renderProblem;
renderProblem = function() {
  originalRenderProblem();
  try { initAiTimer(); } catch (e) { console.log(e); }
};

/* Splitter / resizable panels logic */
function initSplitter() {
  const splitter = document.getElementById('dragger');
  const left = document.querySelector('.question-panel');
  const shell = document.querySelector('.editor-shell');
  if (!splitter || !left || !shell) return;

  const MIN_LEFT = 320;
  const MIN_RIGHT = 320;

  let isDragging = false;
  let startX = 0;
  let startLeftWidth = 0;

  // restore persisted width
  const saved = parseInt(localStorage.getItem('editorLeftWidth'), 10);
  if (!Number.isNaN(saved)) {
    const maxAllowed = shell.clientWidth - MIN_RIGHT;
    const w = Math.max(MIN_LEFT, Math.min(saved, maxAllowed));
    left.style.width = w + 'px';
  }

  function onMove(clientX) {
    const shellRect = shell.getBoundingClientRect();
    const maxLeft = shellRect.width - MIN_RIGHT;
    let newLeft = startLeftWidth + (clientX - startX);
    newLeft = Math.max(MIN_LEFT, Math.min(newLeft, maxLeft));
    left.style.width = newLeft + 'px';
    localStorage.setItem('editorLeftWidth', Math.round(newLeft));
    // notify monaco to relayout
    if (window.monaco && monacoEditor && typeof monacoEditor.layout === 'function') {
      monacoEditor.layout();
    }
  }

  function pointerDown(e) {
    // disable on small screens
    if (window.innerWidth <= 860) return;
    isDragging = true;
    splitter.classList.add('active');
    startX = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX) || 0;
    startLeftWidth = left.getBoundingClientRect().width;
    document.body.style.cursor = 'col-resize';
    e.preventDefault();
  }

  function pointerMove(e) {
    if (!isDragging) return;
    const clientX = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX) || 0;
    onMove(clientX);
    e.preventDefault();
  }

  function pointerUp() {
    if (!isDragging) return;
    isDragging = false;
    splitter.classList.remove('active');
    document.body.style.cursor = '';
  }

  splitter.addEventListener('mousedown', pointerDown);
  window.addEventListener('mousemove', pointerMove);
  window.addEventListener('mouseup', pointerUp);

  // touch support
  splitter.addEventListener('touchstart', pointerDown, { passive: false });
  window.addEventListener('touchmove', pointerMove, { passive: false });
  window.addEventListener('touchend', pointerUp);

  // double-click resets width
  splitter.addEventListener('dblclick', () => {
    left.style.width = '';
    localStorage.removeItem('editorLeftWidth');
    if (window.monaco && monacoEditor && typeof monacoEditor.layout === 'function') {
      monacoEditor.layout();
    }
  });

  // reapply bounds on window resize
  window.addEventListener('resize', () => {
    const saved = parseInt(localStorage.getItem('editorLeftWidth'), 10);
    if (!Number.isNaN(saved)) {
      const maxAllowed = shell.clientWidth - MIN_RIGHT;
      const w = Math.max(MIN_LEFT, Math.min(saved, maxAllowed));
      left.style.width = w + 'px';
    }
  });
}

// initialize splitter after DOM load
document.addEventListener('DOMContentLoaded', initSplitter);
// also attempt init immediately (script is loaded after DOM but be safe)
initSplitter();

/* ── Confetti celebration ── */
function launchCelebration() {
  // Canvas-based confetti
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti-canvas';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const COLORS = ['#22c55e','#86efac','#fbbf24','#f97316','#60a5fa','#c084fc','#f472b6','#34d399','#facc15','#fb923c'];
  const SHAPES = ['rect', 'circle', 'ribbon'];

  const particles = Array.from({ length: 160 }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * 200,
    w: 6 + Math.random() * 12,
    h: 4 + Math.random() * 8,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    vy: 2.5 + Math.random() * 3.5,
    vx: (Math.random() - 0.5) * 3,
    rot: Math.random() * Math.PI * 2,
    rotV: (Math.random() - 0.5) * 0.18,
    sway: Math.random() * Math.PI * 2,
    swayV: 0.03 + Math.random() * 0.04,
    swayAmp: 18 + Math.random() * 30,
    opacity: 1,
  }));

  let frame = 0;
  let animId;

  function drawParticle(p) {
    ctx.save();
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = p.color;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    if (p.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.shape === 'ribbon') {
      ctx.fillRect(-p.w / 2, -p.h / 4, p.w, p.h / 2);
    } else {
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    }
    ctx.restore();
  }

  function animateConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frame++;

    let alive = 0;
    for (const p of particles) {
      p.sway += p.swayV;
      p.x += p.vx + Math.sin(p.sway) * 0.8;
      p.y += p.vy;
      p.rot += p.rotV;
      if (frame > 120) p.opacity -= 0.008;
      if (p.y < canvas.height && p.opacity > 0) {
        alive++;
        drawParticle(p);
      }
    }

    if (alive > 0 || frame < 120) {
      animId = requestAnimationFrame(animateConfetti);
    } else {
      canvas.remove();
    }
  }
  animateConfetti();

  // Party popper emojis from corners
  const poppers = ['🎉','🎊','🥳','🎉','🎊','✨'];
  const positions = [
    { left: '5%',  top: '15%' },
    { right: '5%', top: '15%' },
    { left: '5%',  bottom: '25%' },
    { right: '5%', bottom: '25%' },
    { left: '48%', top: '8%' },
    { right: '48%', bottom: '8%' },
  ];
  positions.forEach((pos, i) => {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'popper-emoji';
      Object.assign(el.style, pos);
      el.textContent = poppers[i % poppers.length];
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2200);
    }, i * 80);
  });

  // Floating stars
  const starEmojis = ['⭐','✨','🌟','💫','⭐','✨'];
  starEmojis.forEach((s, i) => {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'star-burst';
      el.style.left = (15 + Math.random() * 70) + '%';
      el.style.top  = (20 + Math.random() * 50) + '%';
      el.textContent = s;
      el.style.animationDelay = '0s';
      el.style.animationDuration = (0.6 + Math.random() * 0.5) + 's';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1200);
    }, 80 + i * 120);
  });

  // Success banner overlay
  const overlay = document.createElement('div');
  overlay.className = 'success-overlay';
  const banner = document.createElement('div');
  banner.className = 'success-banner';
  banner.innerHTML = `
    <span class="success-banner-icon">🎉</span>
    <div class="success-banner-title">All Tests Passed!</div>
    <div class="success-banner-sub">Your solution is correct. Nicely done!</div>
    <button class="success-banner-dismiss">Continue</button>
  `;
  overlay.appendChild(banner);
  document.body.appendChild(overlay);

  function dismiss() {
    banner.classList.add('hide');
    setTimeout(() => {
      overlay.remove();
      cancelAnimationFrame(animId);
      canvas.remove();
    }, 420);
  }

  banner.querySelector('.success-banner-dismiss').addEventListener('click', dismiss);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) dismiss(); });

  // Auto-dismiss after 5 seconds
  setTimeout(dismiss, 5000);
}
