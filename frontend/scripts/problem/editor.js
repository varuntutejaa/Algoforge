const API_BASE = 'http://localhost:8000';
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
  js: 'javascript'
};

let problem = null;
let monacoEditor = null;
let isProblemSolved = false;
let lastSavedContent = '';
let hasUnsavedChanges = false;
let autoSaveTimer = null;
let isSwitchingLanguage = false;

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

function getBoilerplate(language) {
  if (!problem) return '';
  return problem.boilerplate[language] || problem.boilerplate.cpp || '';
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
    const response = await fetch(`${API_BASE}/profile/solved`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();

    if (response.ok && data.success) {
      setSolvedBadgeVisible(data.solvedIds.includes(problem.id));
    }
  } catch (error) {
    console.log(error);
  }
}

async function fetchSavedCode(language) {
  if (!canPersistCode()) return null;

  try {
    const response = await fetch(
      `${API_BASE}/code/${encodeURIComponent(problem.id)}/${encodeURIComponent(language)}`,
      { headers: getAuthHeaders() }
    );

    if (response.status === 404) {
      return null;
    }

    const data = await response.json();
    return response.ok && data.success ? data.sourceCode : null;
  } catch (error) {
    console.log(error);
    return null;
  }
}

async function saveCode({ keepalive = false } = {}) {
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
    const response = await fetch(`${API_BASE}/code/save`, {
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
      saveCode();
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
    const response = await fetch(`${API_BASE}/submit-code`, {
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
    resultsPanel.innerHTML = '<p class="error-text">Could not connect to the backend server. Start it on port 8000 and try again.</p>';
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

  monacoEditor.onDidChangeModelContent(() => {
    if (isSwitchingLanguage) return;
    hasUnsavedChanges = monacoEditor.getValue() !== lastSavedContent;
  });

  languageSelect.addEventListener('change', async () => {
    const previousLanguage = languageSelect.dataset.previousLanguage || initialLanguage;
    const nextLanguage = languageSelect.value;

    if (previousLanguage === nextLanguage) return;

    isSwitchingLanguage = true;
    languageSelect.disabled = true;

    const currentCode = monacoEditor.getValue();
    if (canPersistCode() && currentCode !== lastSavedContent) {
      const user = getCurrentUser();
      await fetch(`${API_BASE}/code/save`, {
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
    const response = await fetch(`${API_BASE}/problems/${encodeURIComponent(problemId)}`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Problem not found');
    }

    problem = data.problem;
    renderProblem();
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
      resultsPanel.innerHTML = '<p class="error-text">Could not load this problem. Start the backend on port 8000 and run npm run seed.</p>';
    }
    console.log(error);
  }
}

if (runBtn) {
  runBtn.addEventListener('click', runCode);
}

if (submitBtn) {
  submitBtn.addEventListener('click', submitSolution);
}

window.addEventListener('beforeunload', () => {
  if (!hasUnsavedChanges || !canPersistCode() || !monacoEditor || !languageSelect) {
    return;
  }

  const user = getCurrentUser();

  fetch(`${API_BASE}/code/save`, {
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
  const panel = document.getElementById('aiResponsePanel');
  const body = document.getElementById('aiResponseText');
  const loading = document.getElementById('aiLoading');
  const close = document.getElementById('aiResponseClose');
  const hdr = document.getElementById('aiResponseTitle');
  if (!panel || !body || !loading || !hdr) return;

  hdr.textContent = title || 'AI Response';
  loading.style.display = 'none';
  body.style.display = 'block';
  body.textContent = text || '';
  panel.style.display = 'block';

  if (close) {
    close.onclick = () => {
      panel.style.display = 'none';
    };
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

          // Auto-open AI Assist only when visible
          if (document.visibilityState === 'visible') {
            const hintText = (problem.hints && problem.hints[idx]) || `Hint ${idx + 1} is now available.`;
            showAiResponse(`Hint ${idx + 1}`, hintText);
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
      const hintText = (problem.hints && problem.hints[idx]) || `Here's a suggestion for this problem (Hint ${idx + 1}).`;
      showAiResponse(`Hint ${idx + 1}`, hintText);
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
