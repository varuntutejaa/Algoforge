import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MonacoEditor from '@monaco-editor/react';
import { useAuth } from '@/context/AuthContext';
import { fetchProblem, submitCode, fetchSavedCode, saveCode, fetchAiHint, fetchCodeReview } from '@/api/problems';
import DiffBadge from '@/components/ui/DiffBadge';
import { IconArrowLeft, IconCheck, IconX, IconLock, IconBulb, IconSparkle, IconAlertCircle, IconPlay, IconSend, IconRotateCcw, IconChevronDown } from '@/components/ui/Icons';
import type { ProblemDetail, Language } from '@/types/problem';

const MONACO_LANG: Record<Language, string> = { c:'c', cpp:'cpp', java:'java', js:'javascript', python:'python' };
const MAX_SOLUTIONS = 5;
const AUTO_SAVE_MS = 5000;
const HINT_UNLOCK_SEC = [4*60, 9*60, 14*60];

function codeKey(pid: string, lang: Language, slot: number) { return slot===0 ? `af-code-${pid}-${lang}` : `af-code-${pid}-${lang}-s${slot}`; }
function slotCountKey(pid: string) { return `af-sol-count-${pid}`; }
function accumKey(pid: string) { return `aiTimer_accum_${pid}`; }
function lsGet(key: string) { try { return localStorage.getItem(key); } catch { return null; } }
function lsSet(key: string, val: string) { try { localStorage.setItem(key, val); } catch {} }
function lsRemove(key: string) { try { localStorage.removeItem(key); } catch {} }

function launchCelebration() {
  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, { position:'fixed', inset:'0', zIndex:'9999', pointerEvents:'none', width:'100%', height:'100%' });
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;
  const COLORS = ['#22c55e','#86efac','#fbbf24','#f97316','#60a5fa','#c084fc'];
  const particles = Array.from({ length: 160 }, () => ({
    x: Math.random()*canvas.width, y: -20-Math.random()*200,
    w: 6+Math.random()*12, h: 4+Math.random()*8,
    color: COLORS[Math.floor(Math.random()*COLORS.length)],
    vy: 2.5+Math.random()*3.5, vx: (Math.random()-0.5)*3,
    rot: Math.random()*Math.PI*2, rotV: (Math.random()-0.5)*0.18,
    sway: Math.random()*Math.PI*2, swayV: 0.03+Math.random()*0.04,
    swayAmp: 18+Math.random()*30, opacity: 1,
  }));
  let frame = 0, animId = 0;
  function draw(p: typeof particles[0]) {
    ctx.save(); ctx.globalAlpha = p.opacity; ctx.fillStyle = p.color;
    ctx.translate(p.x, p.y); ctx.rotate(p.rot);
    ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h); ctx.restore();
  }
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); frame++;
    let alive = 0;
    for (const p of particles) {
      p.sway += p.swayV; p.x += p.vx+Math.sin(p.sway)*0.8; p.y += p.vy; p.rot += p.rotV;
      if (frame > 120) p.opacity -= 0.008;
      if (p.y < canvas.height && p.opacity > 0) { alive++; draw(p); }
    }
    if (alive > 0 || frame < 120) animId = requestAnimationFrame(animate);
    else canvas.remove();
  }
  animate();

  const overlay = document.createElement('div');
  Object.assign(overlay.style, { position:'fixed', inset:'0', zIndex:'10000', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)' });
  const banner = document.createElement('div');
  Object.assign(banner.style, { background:'#111827', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'20px', padding:'32px 40px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:'12px', maxWidth:'360px', boxShadow:'0 20px 60px rgba(0,0,0,0.8)' });
  banner.innerHTML = `
    <div style="width:56px;height:56px;border-radius:50%;display:grid;place-items:center;background:rgba(134,239,172,0.14);color:#4ade80">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="28" height="28">
        <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" /><path d="M8 5H4.5a2 2 0 0 0 0 4H8" /><path d="M16 5h3.5a2 2 0 0 1 0 4H16" />
        <path d="M12 13v3" /><path d="M9 20h6" /><path d="M10.5 16h3l.5 4h-4l.5-4Z" />
      </svg>
    </div>
    <div style="font-size:22px;font-weight:800;color:#fff">All Tests Passed!</div>
    <div style="font-size:14px;color:#94a3b8">Your solution is correct. Nicely done!</div>
    <button style="margin-top:8px;padding:10px 28px;background:#f97316;border:none;border-radius:12px;color:#fff;font-size:14px;font-weight:600;cursor:pointer">Continue</button>
  `;
  overlay.appendChild(banner);
  document.body.appendChild(overlay);
  function dismiss() { overlay.remove(); cancelAnimationFrame(animId); canvas.remove(); }
  banner.querySelector('button')!.addEventListener('click', dismiss);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) dismiss(); });
  setTimeout(dismiss, 5000);
}

function AiPanel({ title, text, loading: aiLoading, isHint, onClose }: { title:string; text:string; loading:boolean; isHint:boolean; onClose:()=>void }) {
  return (
    <div className="ai-response-panel">
      <div className="ai-response-header">
        <span>{title}</span>
        <button className="ai-response-close" onClick={onClose}><IconX width={14} height={14} /></button>
      </div>
      <div className="ai-response-body">
        {aiLoading ? (
          <div className="ai-loading">
            <div className="ai-loading-dot" />
            <div className="ai-loading-dot" />
            <div className="ai-loading-dot" />
          </div>
        ) : (
          <>
            <p id="aiResponseText">{text}</p>
            {isHint && (
              <div className="hint-disclaimer">
                <IconBulb width={14} height={14} />
                <span>This is a hint, not the full solution. Try to implement it yourself.</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function Editor() {
  const { problemId = 'two-sum' } = useParams<{ problemId: string }>();
  const navigate = useNavigate();
  const { user, getHeaders } = useAuth();

  const [problem, setProblem] = useState<ProblemDetail | null>(null);
  const [probLoading, setProbLoading] = useState(true);
  const [probError, setProbError] = useState('');

  const [language, setLanguage] = useState<Language>('cpp');
  const [code, setCode] = useState('');
  const [monacoReady, setMonacoReady] = useState(false);
  const monacoRef = useRef<any>(null);
  const lastSavedRef = useRef('');
  const hasUnsavedRef = useRef(false);
  const isSwitchingRef = useRef(false);

  const [slotCount, setSlotCount] = useState(1);
  const [activeSlot, setActiveSlot] = useState(0);

  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [isSolved, setIsSolved] = useState(false);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiTitle, setAiTitle] = useState('');
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [isHint, setIsHint] = useState(false);
  const [reviewUnlocked, setReviewUnlocked] = useState(false);

  const [elapsed, setElapsed] = useState(0);
  const [hintUnlocked, setHintUnlocked] = useState([false, false, false]);
  const aiRunningStart = useRef<number | null>(null);
  const aiAccumRef = useRef(0);
  const aiTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const splitterRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartW = useRef(0);
  const autoSaveTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  function getBoilerplate(lang: Language) { return problem?.boilerplate[lang] || problem?.boilerplate.cpp || ''; }
  function localLoad(lang: Language, slot = activeSlot) { return lsGet(codeKey(problemId, lang, slot)); }
  function localSave(val: string, lang: Language, slot = activeSlot) { lsSet(codeKey(problemId, lang, slot), val); }

  useEffect(() => {
    (async () => {
      try {
        const p = await fetchProblem(problemId);
        setProblem(p);
        document.title = `AlgoForge — ${p.title}`;
        const savedCount = parseInt(lsGet(slotCountKey(problemId)) || '1', 10);
        if (!isNaN(savedCount) && savedCount > 1) setSlotCount(savedCount);
      } catch (err: any) { setProbError(err.message || 'Problem not found'); }
      finally { setProbLoading(false); }
    })();
  }, [problemId]);

  useEffect(() => {
    if (!problem || !monacoReady) return;
    (async () => {
      const local = localLoad(language, 0);
      if (local) { setCode(local); return; }
      const remote = await fetchSavedCode(problemId, language, getHeaders());
      const value = remote ?? getBoilerplate(language);
      setCode(value); localSave(value, language, 0);
    })();
  }, [problem, monacoReady]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!problem) return;
    fetch(`${(window as any).API_BASE_URL || 'http://localhost:8000'}/profile/solved`, { headers: getHeaders() as HeadersInit })
      .then(r => r.json())
      .then(d => { if (d.success && d.solvedIds?.includes(problemId)) { setIsSolved(true); setReviewUnlocked(true); } })
      .catch(() => {});
  }, [problem, problemId, getHeaders]);

  useEffect(() => {
    if (!problem) return;
    aiAccumRef.current = parseInt(lsGet(accumKey(problemId)) || '0', 10) || 0;
    function getEl() { let e=aiAccumRef.current; if(aiRunningStart.current) e+=Math.floor((Date.now()-aiRunningStart.current)/1000); return e; }
    function tick() { const e=getEl(); setElapsed(e); setHintUnlocked(HINT_UNLOCK_SEC.map(s=>e>=s)); }
    function startTimer() { if(!aiRunningStart.current) aiRunningStart.current=Date.now(); if(aiTimerRef.current) clearInterval(aiTimerRef.current); aiTimerRef.current=setInterval(tick,1000); tick(); }
    function stopTimer() { if(aiRunningStart.current) { aiAccumRef.current+=Math.floor((Date.now()-aiRunningStart.current)/1000); lsSet(accumKey(problemId),String(aiAccumRef.current)); aiRunningStart.current=null; } if(aiTimerRef.current){clearInterval(aiTimerRef.current);aiTimerRef.current=null;} }
    function onVisibility() { document.visibilityState==='visible'?startTimer():stopTimer(); }
    document.addEventListener('visibilitychange', onVisibility);
    if (document.visibilityState === 'visible') startTimer();
    window.addEventListener('beforeunload', stopTimer);
    return () => { stopTimer(); document.removeEventListener('visibilitychange', onVisibility); window.removeEventListener('beforeunload', stopTimer); };
  }, [problem, problemId]);

  useEffect(() => {
    autoSaveTimer.current = setInterval(async () => {
      if (!hasUnsavedRef.current || !monacoRef.current || !problem || !user?.id) return;
      const src = monacoRef.current.getValue();
      await saveCode({ problemId, language, sourceCode: src, userId: user.id }, getHeaders());
      lastSavedRef.current = src; hasUnsavedRef.current = false;
    }, AUTO_SAVE_MS);
    return () => { if (autoSaveTimer.current) clearInterval(autoSaveTimer.current); };
  }, [problem, language, problemId, user, getHeaders]);

  useEffect(() => {
    const splitter = splitterRef.current, left = leftPanelRef.current;
    if (!splitter || !left) return;
    const saved = parseInt(lsGet('editorLeftWidth') || '', 10);
    if (!isNaN(saved) && window.innerWidth > 860) left.style.width = `${Math.max(320, saved)}px`;
    function onMove(clientX: number) {
      const rect = left!.parentElement!.getBoundingClientRect();
      const newW = Math.max(320, Math.min(dragStartW.current+(clientX-dragStartX.current), rect.width-320));
      left!.style.width = `${newW}px`; lsSet('editorLeftWidth', String(Math.round(newW))); monacoRef.current?.layout();
    }
    function onDown(e: MouseEvent | TouchEvent) {
      if (window.innerWidth <= 860) return;
      isDragging.current = true; splitter!.classList.add('active');
      dragStartX.current = (e as MouseEvent).clientX ?? (e as TouchEvent).touches[0].clientX;
      dragStartW.current = left!.getBoundingClientRect().width;
      document.body.style.cursor = 'col-resize'; e.preventDefault();
    }
    function onUp() { if (!isDragging.current) return; isDragging.current=false; splitter!.classList.remove('active'); document.body.style.cursor=''; }
    function onMoveGlobal(e: MouseEvent|TouchEvent) { if(!isDragging.current) return; onMove((e as MouseEvent).clientX ?? (e as TouchEvent).touches[0].clientX); }
    splitter.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMoveGlobal);
    window.addEventListener('mouseup', onUp);
    splitter.addEventListener('dblclick', () => { left.style.width = ''; lsRemove('editorLeftWidth'); monacoRef.current?.layout(); });
    return () => { splitter.removeEventListener('mousedown', onDown); window.removeEventListener('mousemove', onMoveGlobal); window.removeEventListener('mouseup', onUp); };
  }, []);

  async function handleLanguageChange(newLang: Language) {
    if (!monacoRef.current || !problem) return;
    isSwitchingRef.current = true;
    const prevCode = monacoRef.current.getValue();
    localSave(prevCode, language);
    if (user?.id && prevCode !== lastSavedRef.current) await saveCode({ problemId, language, sourceCode: prevCode, userId: user.id }, getHeaders());
    setLanguage(newLang);
    const local = localLoad(newLang);
    const remote = local ? null : await fetchSavedCode(problemId, newLang, getHeaders());
    const val = local ?? remote ?? getBoilerplate(newLang);
    setCode(val); lastSavedRef.current = val; hasUnsavedRef.current = false; isSwitchingRef.current = false;
  }

  async function switchSlot(idx: number) {
    if (!monacoRef.current) return;
    localSave(monacoRef.current.getValue(), language); setActiveSlot(idx);
    const val = localLoad(language, idx) ?? getBoilerplate(language);
    setCode(val); lastSavedRef.current = val; hasUnsavedRef.current = false;
  }
  function addSlot() {
    if (slotCount >= MAX_SOLUTIONS || !monacoRef.current) return;
    localSave(monacoRef.current.getValue(), language);
    const newIdx = slotCount; setSlotCount(slotCount+1); lsSet(slotCountKey(problemId), String(slotCount+1));
    setActiveSlot(newIdx); const val = getBoilerplate(language); setCode(val); lastSavedRef.current = val; hasUnsavedRef.current = false;
  }
  function removeSlot(idx: number) {
    if (idx <= 0 || slotCount <= 1) return;
    (Object.keys(MONACO_LANG) as Language[]).forEach(lang => {
      lsRemove(codeKey(problemId, lang, idx));
      for (let i=idx+1; i<slotCount; i++) { const above=lsGet(codeKey(problemId,lang,i)); if(above!==null) lsSet(codeKey(problemId,lang,i-1),above); lsRemove(codeKey(problemId,lang,i)); }
    });
    const newCount=slotCount-1; setSlotCount(newCount); lsSet(slotCountKey(problemId),String(newCount));
    const newActive=Math.min(activeSlot,newCount-1); setActiveSlot(newActive);
    const val=localLoad(language,newActive)??getBoilerplate(language); setCode(val);
  }

  async function execute(action: 'run'|'submit') {
    if (!monacoRef.current || !problem) return;
    const src = monacoRef.current.getValue();
    if (action==='submit') await saveCode({ problemId, language, sourceCode: src, userId: user?.id }, getHeaders());
    action==='run' ? setRunning(true) : setSubmitting(true); setResults(null);
    try {
      const res = await submitCode({ problemId, language, sourceCode: src, userId: user?.id, action }, getHeaders());
      setResults({ ...res, action });
      if (action==='submit' && res.passed && res.verdict==='Accepted') { setIsSolved(true); setReviewUnlocked(true); launchCelebration(); }
    } catch { setResults({ success:false, message:'Could not reach the backend server.' }); }
    finally { action==='run' ? setRunning(false) : setSubmitting(false); }
  }

  async function openHint(num: number) {
    setAiTitle(`Hint ${num} of 3`); setIsHint(true); setAiText(''); setAiLoading(true); setAiOpen(true);
    const src = monacoRef.current?.getValue() || '';
    const text = await fetchAiHint({ problemId, hintNumber: num, code: src, language, elapsedSeconds: elapsed }, getHeaders());
    setAiText(text); setAiLoading(false);
  }
  async function openReview() {
    if (!reviewUnlocked) return;
    setAiTitle('Code Review'); setIsHint(false); setAiText(''); setAiLoading(true); setAiOpen(true);
    const src = monacoRef.current?.getValue() || '';
    const text = await fetchCodeReview({ problemId, code: src, language }, getHeaders());
    setAiText(text); setAiLoading(false);
  }
  function fmtTime(secs: number) { return `${String(Math.floor(secs/60)).padStart(2,'0')}:${String(secs%60).padStart(2,'0')}`; }

  if (probLoading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'#64748b', fontSize:14 }}>Loading…</div>;
  if (probError) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'#f87171', fontSize:14 }}>{probError}</div>;
  if (!problem) return null;

  return (
    <div className="editor-shell">
      {/* Left: question panel */}
      <div ref={leftPanelRef} className="question-panel">
        {/* Breadcrumb */}
        <div className="problem-title-row">
          <button className="back-link" onClick={() => navigate('/problems')}><IconArrowLeft width={15} height={15} /> Problems</button>
          {isSolved && <span className="solved-badge"><IconCheck width={12} height={12} /> Solved</span>}
        </div>

        {/* Tags + difficulty */}
        <div className="problem-header">
          <DiffBadge difficulty={problem.difficulty} />
          {problem.tags.map(t => (
            <span key={t} className="problem-tag">{t}</span>
          ))}
        </div>

        <h1 className="problem-title">{problem.title}</h1>

        <div className="problem-desc">
          {problem.description.map((p, i) => <p key={i}>{p}</p>)}
        </div>

        {problem.example && (
          <div className="prompt-block">
            <h2>Example</h2>
            <pre>{problem.example}</pre>
          </div>
        )}

        {problem.constraints?.length > 0 && (
          <div className="prompt-block">
            <h2>Constraints</h2>
            <ul>{problem.constraints.map((c, i) => <li key={i}>{c}</li>)}</ul>
          </div>
        )}

        {/* AI Assist */}
        <div className="ai-assist-section">
          <div className="ai-assist-header">
            <IconSparkle className="ai-assist-icon" width={14} height={14} />
            <span>AI Assist</span>
            <span className="ai-timer">{fmtTime(elapsed)}</span>
          </div>

          <div className="hints-row">
            {HINT_UNLOCK_SEC.map((sec, i) => {
              const unlocked = hintUnlocked[i], remaining = sec - elapsed;
              return (
                <button key={i} disabled={!unlocked} onClick={() => openHint(i+1)}
                  className={`hint-btn${unlocked ? ' unlocked' : ''}`}>
                  <span className="hint-lock-icon">{unlocked ? <IconBulb width={14} height={14} /> : <IconLock width={14} height={14} />}</span>
                  <span className="hint-label">Hint {i+1}</span>
                  <span className="hint-unlock-timer">
                    {unlocked ? 'unlocked' : `${fmtTime(Math.max(0,remaining))}`}
                  </span>
                </button>
              );
            })}
          </div>

          <button disabled={!reviewUnlocked} onClick={openReview}
            className={`review-code-btn${reviewUnlocked ? ' unlocked' : ''}`}>
            <span className="review-lock-icon">{reviewUnlocked ? <IconSparkle width={14} height={14} /> : <IconLock width={14} height={14} />}</span>
            <div>
              <div className="review-btn-label">Review My Code</div>
              <div className="review-btn-sub">{reviewUnlocked ? 'get AI feedback' : 'solve first to unlock'}</div>
            </div>
          </button>

          {aiOpen && <AiPanel title={aiTitle} text={aiText} loading={aiLoading} isHint={isHint} onClose={() => setAiOpen(false)} />}
        </div>
      </div>

      {/* Splitter */}
      <div ref={splitterRef} className="splitter" />

      {/* Right: code panel */}
      <div className="code-panel">
        {/* Toolbar */}
        <div className="code-toolbar">
          <div className="language-select-wrap">
            <select className="language-select" value={language} onChange={e => handleLanguageChange(e.target.value as Language)}>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
              <option value="js">JavaScript</option>
              <option value="c">C</option>
            </select>
            <IconChevronDown className="language-select-caret" width={14} height={14} />
          </div>
          <div style={{ flex: 1 }} />
          <button className="reset-btn" onClick={() => { if (monacoRef.current && problem) setCode(getBoilerplate(language)); }}>
            <IconRotateCcw width={13} height={13} /> Reset
          </button>
        </div>

        {/* Solution tabs */}
        <div className="solution-tab-bar">
          {Array.from({ length: slotCount }, (_, i) => (
            <button key={i} onClick={() => switchSlot(i)}
              className={`solution-tab${i===activeSlot?' active':''}`}>
              <span>Solution {i+1}</span>
              {i > 0 && (
                <span className="solution-tab-close" onClick={e => { e.stopPropagation(); removeSlot(i); }}><IconX width={11} height={11} /></span>
              )}
            </button>
          ))}
          {slotCount < MAX_SOLUTIONS && (
            <button className="solution-tab-add" onClick={addSlot}>+</button>
          )}
        </div>

        {/* Monaco */}
        <div className="code-editor-wrap">
          <MonacoEditor
            height="100%"
            language={MONACO_LANG[language]}
            theme="vs-dark"
            value={code}
            options={{ fontFamily:"'DM Mono', monospace", fontSize:15, lineHeight:26, minimap:{enabled:false}, scrollBeyondLastLine:false, tabSize:2, insertSpaces:true, padding:{top:16,bottom:16}, automaticLayout:true }}
            onMount={editor => {
              monacoRef.current = editor;
              setMonacoReady(true);
            }}
            onChange={val => {
              if (isSwitchingRef.current) return;
              const v = val || ''; hasUnsavedRef.current = v !== lastSavedRef.current;
              setTimeout(() => localSave(v, language), 400);
            }}
          />
        </div>

        {/* Run / Submit actions */}
        <div className="editor-actions">
          <button className="run-btn" disabled={running || submitting} onClick={() => execute('run')}>
            <IconPlay width={13} height={13} /> {running ? 'Running…' : 'Run Code'}
          </button>
          <button className="editor-submit-btn" disabled={running || submitting} onClick={() => execute('submit')}>
            <IconSend width={14} height={14} /> {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>

        {/* Results */}
        <div className="results-panel">
          {!results && (
            <p className="results-empty">Run your code to evaluate it against {problem.testCases?.length ?? 0} test cases.</p>
          )}
          {results && !results.success && (
            <p className="error-text"><IconAlertCircle width={14} height={14} /> {results.message || 'Execution failed'}</p>
          )}
          {results?.success && (
            <>
              <p className={`results-summary${results.passed ? ' pass' : ' fail'}`}>
                {results.passed ? <IconCheck width={14} height={14} /> : <IconAlertCircle width={14} height={14} />}
                {results.action==='submit'
                  ? (results.passed ? `Accepted: ${results.passedTests}/${results.totalTests} passed` : `${results.verdict}: ${results.passedTests}/${results.totalTests} passed`)
                  : (results.passed ? `All tests passed: ${results.passedTests}/${results.totalTests} (not submitted)` : `${results.passedTests}/${results.totalTests} passed`)}
              </p>
              <div className="results-list">
                {results.results?.map((r: any, i: number) => (
                  <div key={i} className={`test-result${r.passed?' pass':' fail'}`}>
                    <div className="test-title">
                      <span className="test-title-left">
                        {r.passed ? <IconCheck width={13} height={13} /> : <IconX width={13} height={13} />}
                        {r.name}
                      </span>
                      <span className="test-status">{r.passed ? 'Passed' : r.status}</span>
                    </div>
                    <pre className="test-details">
                      {['Input: '+r.input, 'Expected: '+r.expected, 'Output: '+(r.output||'(no output)'),
                        r.compileOutput?'Compile: '+r.compileOutput:'', r.stderr?'Error: '+r.stderr:''].filter(Boolean).join('\n')}
                    </pre>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
