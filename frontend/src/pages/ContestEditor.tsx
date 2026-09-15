import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MonacoEditor from '@monaco-editor/react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/api';
import { fetchContest, fetchLeaderboard, submitContestSolution } from '@/api/contests';
import { fetchProblem } from '@/api/problems';
import type { Contest, LeaderboardEntry } from '@/types/contest';
import type { ProblemDetail, Language } from '@/types/problem';

const MONACO_LANG: Record<Language, string> = { c:'c', cpp:'cpp', java:'java', js:'javascript', python:'python' };

function fmtTimer(totalSec: number) {
  const h=Math.floor(totalSec/3600), m=Math.floor((totalSec%3600)/60), s=totalSec%60;
  return h ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
function fmtDuration(sec: number|null) {
  if (sec==null) return '--';
  const h=Math.floor(sec/3600), m=Math.floor((sec%3600)/60), ss=sec%60;
  return h ? `${h}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
}
function codeKey(contestCode: string, problemId: string, lang: string) { return `contest:${contestCode}:code:${problemId}:${lang}`; }
function diffCls(d?: string) { const l=d?.toLowerCase(); return l==='easy'?'text-green-400':l==='medium'?'text-yellow-400':'text-red-400'; }

export default function ContestEditor() {
  const { code: contestCode = '' } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user, getHeaders } = useAuth();

  const [contest, setContest] = useState<Contest | null>(null);
  const [problems, setProblems] = useState<Array<{ problemId: string; title: string; difficulty?: string }>>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [problemDetail, setProblemDetail] = useState<ProblemDetail | null>(null);
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());

  const [language, setLanguage] = useState<Language>('cpp');
  const [code, setCode] = useState('');
  const monacoRef = useRef<any>(null);

  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [resultsOpen, setResultsOpen] = useState(false);

  const [timeLeft, setTimeLeft] = useState(0);
  const [timeProgress, setTimeProgress] = useState(100);
  const [timerUrgent, setTimerUrgent] = useState(false);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [probSearch, setProbSearch] = useState('');
  const [diffFilter, setDiffFilter] = useState('all');

  // Briefly highlights your own row when the score changes, so a solve is
  // visible even if your rank doesn't move.
  const [scoreFlash, setScoreFlash] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const lbTimerRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const flashRef = useRef<ReturnType<typeof setTimeout>|null>(null);

  async function loadLeaderboard(code: string) {
    try { setLeaderboard(await fetchLeaderboard(code, getHeaders())); } catch {}
  }

  function bumpScore() {
    if (flashRef.current) clearTimeout(flashRef.current);
    setScoreFlash(true);
    flashRef.current = setTimeout(() => setScoreFlash(false), 1400);
  }

  function startTimer(c: Contest) {
    if (timerRef.current) clearInterval(timerRef.current);
    const totalMs = new Date(c.endsAt).getTime()-new Date(c.startsAt).getTime();
    function tick() {
      const diff = new Date(c.endsAt).getTime()-Date.now();
      if (diff <= 0) {
        setTimeLeft(0); setTimeProgress(0); clearInterval(timerRef.current!);
        setTimeout(() => navigate(`/contest-results/${c.code}`), 2500); return;
      }
      setTimeLeft(Math.floor(diff/1000));
      setTimeProgress(Math.max(0, Math.min(100, (diff/totalMs)*100)));
      setTimerUrgent(diff < 300000);
    }
    tick(); timerRef.current = setInterval(tick, 1000);
  }

  const switchProblem = useCallback(async (idx: number, probList=problems, _c=contest, lang=language) => {
    setCurrentIdx(idx); const prob = probList[idx]; if (!prob) return;
    try {
      const detail = await fetchProblem(prob.problemId); setProblemDetail(detail);
      const saved = localStorage.getItem(codeKey(contestCode, prob.problemId, lang));
      setCode(saved ?? detail.boilerplate[lang] ?? detail.boilerplate.cpp ?? '');
    } catch {}
  }, [problems, contest, language, contestCode]);

  useEffect(() => {
    if (!contestCode) { setError('No contest code provided.'); setLoading(false); return; }
    (async () => {
      try {
        const c = await fetchContest(contestCode, getHeaders()); setContest(c);
        const probs = c.problems || []; setProblems(probs);
        if (probs.length) await switchProblem(0, probs, c, language);
        startTimer(c); await loadLeaderboard(c.code);
        // Your own score updates instantly from the submit response; this poll
        // is for everyone else's solves.
        lbTimerRef.current = setInterval(() => loadLeaderboard(c.code), 5000);
      } catch (err: any) { setError(err.message || 'Failed to load contest'); }
      finally { setLoading(false); }
    })();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (lbTimerRef.current) clearInterval(lbTimerRef.current);
      if (flashRef.current) clearTimeout(flashRef.current);
    };
  }, [contestCode]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleLangChange(newLang: Language) {
    if (!problemDetail) return;
    if (monacoRef.current) localStorage.setItem(codeKey(contestCode, problemDetail.id, language), monacoRef.current.getValue());
    setLanguage(newLang);
    const saved = localStorage.getItem(codeKey(contestCode, problemDetail.id, newLang));
    setCode(saved ?? problemDetail.boilerplate[newLang] ?? problemDetail.boilerplate.cpp ?? '');
  }

  async function execute(action: 'run'|'submit') {
    if (!monacoRef.current || !problemDetail) return;
    const sourceCode = monacoRef.current.getValue();
    const isSubmit = action==='submit';
    isSubmit ? setSubmitting(true) : setRunning(true);
    setResults(null); setResultsOpen(true);

    // A submit used to judge the code twice: once via /submit-code and again
    // inside the contest route, then fetch the leaderboard separately. The
    // contest route judges server-side anyway and now returns the board, so a
    // submit is a single request and the score moves with the verdict.
    if (isSubmit) {
      try {
        const data = await submitContestSolution(
          contestCode,
          { problemId: problemDetail.id, language, sourceCode },
          getHeaders(),
        );
        const passed = data.verdict === 'Accepted';
        setResults({
          success: true, action, passed, verdict: data.verdict, results: data.results,
          passedTests: data.results.filter((r: any) => r.passed).length,
          totalTests: data.results.length,
        });
        if (passed) setSolvedIds(s => new Set([...s, problemDetail.id]));
        if (data.leaderboard.length) { setLeaderboard(data.leaderboard); bumpScore(); }
      } catch (e: any) {
        setResults({ success:false, message: e.message || 'Could not reach backend.' });
      } finally { setSubmitting(false); }
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/submit-code`, {
        method: 'POST',
        headers: { ...getHeaders() as Record<string,string>, 'Content-Type':'application/json' },
        body: JSON.stringify({ problemId: problemDetail.id, language, sourceCode, action }),
      });
      setResults({ ...(await res.json()), action });
    } catch { setResults({ success:false, message:'Could not reach backend.' }); }
    finally { setRunning(false); }
  }

  const filteredProblems = problems.filter(p => {
    const q = probSearch.toLowerCase();
    return (!q || p.title.toLowerCase().includes(q)) && (diffFilter==='all' || p.difficulty?.toLowerCase()===diffFilter);
  });

  if (loading) return <div className="arena-error"><p>Loading contest…</p></div>;
  if (error) return (
    <div className="arena-error">
      <p>{error}</p>
      <button onClick={() => navigate('/contests')} className="btn btn-secondary">Back to Contests</button>
    </div>
  );
  if (!contest) return null;

  return (
    <div className="contest-arena" style={{ height: 'calc(100vh - 74px)' }}>
      {/* Top bar */}
      <div className="arena-topbar">
        <div className="arena-info">
          <button className="arena-back" onClick={() => navigate('/contests')} aria-label="Back to contests">←</button>
          <span className="arena-title">{contest.title}</span>
        </div>

        {/* Timer */}
        <div className="arena-timer-block">
          <span className="arena-timer-label">Time left</span>
          <span className={`arena-timer${timerUrgent?' urgent':''}`}>{fmtTimer(timeLeft)}</span>
          <div className="time-progress-wrap">
            <div className={`time-progress-bar${timerUrgent?' urgent':timeProgress < 30?' warn':''}`} style={{ width:`${timeProgress}%` }} />
          </div>
        </div>

        <div className="topbar-actions">
          <select className="arena-lang-select" value={language} onChange={e => handleLangChange(e.target.value as Language)}>
            <option value="cpp">C++</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="js">JavaScript</option>
            <option value="c">C</option>
          </select>
          <button onClick={() => { if (monacoRef.current && problemDetail) setCode(problemDetail.boilerplate[language] ?? ''); }}
            className="btn btn-secondary arena-btn">Reset</button>
          <button disabled={running||submitting} onClick={() => execute('run')} className="btn btn-secondary arena-btn">
            {running?'Running…':'Run'}
          </button>
          <button disabled={running||submitting} onClick={() => execute('submit')} className="btn btn-primary arena-btn">
            {submitting?'Submitting…':'Submit'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="arena-body">
        {/* Left: problem list sidebar */}
        <div className="arena-panel arena-left">
          <div className="arena-sidebar">
            <div className="sidebar-header">Problems</div>
            <div className="problem-search">
              <input className="sidebar-search-input" placeholder="Search…" value={probSearch} onChange={e => setProbSearch(e.target.value)} />
            </div>
            <div className="arena-diff-row">
              {['all','easy','medium','hard'].map(d => (
                <button key={d} onClick={() => setDiffFilter(d)}
                  className={`pf-diff-btn arena-diff-btn${d!=='all'?' '+d:''}${diffFilter===d?' active':''}`}>
                  {d==='all'?'All':d[0].toUpperCase()}
                </button>
              ))}
            </div>
            <div className="arena-problem-list">
              {filteredProblems.map(p => {
                const realIdx = problems.indexOf(p), isSolved = solvedIds.has(p.problemId);
                return (
                  <button key={p.problemId} onClick={() => switchProblem(realIdx)}
                    className={`problem-item${realIdx===currentIdx?' active':''}${isSolved?' solved':''}`}>
                    <span className={`problem-item-badge${isSolved?' solved':''}`}>
                      {isSolved?'✓':realIdx+1}
                    </span>
                    <span className="problem-item-body">
                      <span className="problem-item-title">{p.title}</span>
                      {p.difficulty && <span className={`problem-item-diff ${diffCls(p.difficulty)}`}>{p.difficulty}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center: problem + editor */}
        <div className="arena-center">
          {/* Problem description */}
          <div className="arena-problem">
            <h2 className="arena-problem-title">
              {problemDetail ? `#${currentIdx+1}: ${problemDetail.title}` : 'Select a problem'}
            </h2>
            {problemDetail && (
              <>
                <div className="arena-problem-meta">
                  <span className={`arena-problem-difficulty ${diffCls(problemDetail.difficulty)}`}>{problemDetail.difficulty}</span>
                  {problemDetail.tags.map(t => <span key={t} className="arena-problem-tag">{t}</span>)}
                </div>
                <div className="arena-problem-body">
                  {problemDetail.description.map((p,i) => <p key={i}>{p}</p>)}
                </div>
                {problemDetail.example && (
                  <pre className="arena-problem-example">{problemDetail.example}</pre>
                )}
              </>
            )}
          </div>

          {/* Monaco editor */}
          <div className="code-editor-wrap">
            <MonacoEditor
              height="100%"
              language={MONACO_LANG[language]}
              theme="vs-dark"
              value={code}
              options={{ fontFamily:"'DM Mono', monospace", fontSize:14, lineHeight:24, minimap:{enabled:false}, scrollBeyondLastLine:false, tabSize:2, insertSpaces:true, padding:{top:12,bottom:12}, automaticLayout:true }}
              onMount={editor => { monacoRef.current = editor; }}
              onChange={val => {
                if (!problemDetail) return;
                const v = val||''; setTimeout(() => localStorage.setItem(codeKey(contestCode, problemDetail.id, language), v), 500);
              }}
            />
          </div>
        </div>

        {/* Right: leaderboard */}
        <div className="arena-panel arena-right">
          <div className="arena-leaderboard">
            <div className="sidebar-header lb-header">
              Leaderboard
              <span className="lb-live" title="Updates as people solve">live</span>
            </div>
            <div className="arena-lb-list">
              {leaderboard.length === 0
                ? <p className="leaderboard-empty">No participants yet.</p>
                : leaderboard.map(entry => {
                    const isSelf = entry.userId ? entry.userId === user?.id
                      : entry.name===user?.name || entry.name===user?.email;
                    const solvedSet = new Set(entry.solvedProblems||[]);
                    return (
                      <div
                        key={entry.userId || entry.rank}
                        className={`leaderboard-row${isSelf?' self':''}${isSelf&&scoreFlash?' flash':''}`}
                      >
                        <div className="lb-top-row">
                          <span className={`leaderboard-rank${entry.rank===1?' top-1':entry.rank===2?' top-2':entry.rank===3?' top-3':''}`}>{entry.rank}</span>
                          <span className="leaderboard-name">
                            {entry.name}{isSelf && <span className="lb-you">You</span>}
                          </span>
                          <span className={`lb-score${entry.score>0?' positive':entry.score<0?' negative':''}`}>
                            {entry.score>0?`+${entry.score}`:entry.score}
                          </span>
                        </div>
                        <div className="lb-bottom-row">
                          <div className="lb-dots">
                            {problems.map((p,i) => (
                              <span
                                key={p.problemId||i}
                                className={`lb-dot${solvedSet.has(p.problemId)?' solved':''}`}
                                title={`P${i+1}: ${solvedSet.has(p.problemId)?'solved':'unsolved'}`}
                              >●</span>
                            ))}
                          </div>
                          {entry.timeTakenSeconds!=null && <span className="lb-time">{fmtDuration(entry.timeTakenSeconds)}</span>}
                        </div>
                      </div>
                    );
                  })
              }
            </div>
          </div>
        </div>
      </div>

      {/* Results modal */}
      {resultsOpen && (
        <div className="results-overlay open" onClick={e => { if(e.target===e.currentTarget) setResultsOpen(false); }}>
          <div className="results-modal">
            <div className="results-modal-head">
              <h3>Test Results</h3>
              <button className="results-modal-close" onClick={() => setResultsOpen(false)} aria-label="Close">×</button>
            </div>
            {!results && <p className="results-pending">{submitting ? 'Judging…' : 'Running…'}</p>}
            {results && !results.success && <p className="results-error">{results.message||'Execution failed'}</p>}
            {results?.success && (
              <>
                <div className={`results-summary${results.passed?' pass':' fail'}`}>
                  {results.action==='submit'
                    ? `${results.verdict}: ${results.passedTests}/${results.totalTests} passed`
                    : `Run: ${results.passedTests}/${results.totalTests} passed`}
                </div>
                {results.action==='submit' && results.passed && (
                  <p className="results-scored">+100 points — leaderboard updated.</p>
                )}
                {results.results?.map((r: any, i: number) => (
                  <div key={i} className={`test-result${r.passed?' pass':' fail'}`}>
                    <div className="test-title">
                      <span>{r.name}</span>
                      <span>{r.passed?'Passed':(r.status||'Failed')}</span>
                    </div>
                    <div className="test-details">
                      {['Input: '+r.input,'Expected: '+r.expected,'Output: '+(r.output||'(no output)'),
                        r.compileOutput?'Compile: '+r.compileOutput:'', r.stderr?'Error: '+r.stderr:''].filter(Boolean).join('\n')}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
