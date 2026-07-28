import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MonacoEditor from '@monaco-editor/react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/api';
import { fetchContest, fetchLeaderboard } from '@/api/contests';
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

  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const lbTimerRef = useRef<ReturnType<typeof setInterval>|null>(null);

  async function loadLeaderboard(code: string) {
    try { setLeaderboard(await fetchLeaderboard(code, getHeaders())); } catch {}
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
        lbTimerRef.current = setInterval(() => loadLeaderboard(c.code), 10000);
      } catch (err: any) { setError(err.message || 'Failed to load contest'); }
      finally { setLoading(false); }
    })();
    return () => { if(timerRef.current) clearInterval(timerRef.current); if(lbTimerRef.current) clearInterval(lbTimerRef.current); };
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
    try {
      const res = await fetch(`${API_BASE_URL}/submit-code`, {
        method: 'POST',
        headers: { ...getHeaders() as Record<string,string>, 'Content-Type':'application/json' },
        body: JSON.stringify({ problemId: problemDetail.id, language, sourceCode, action }),
      });
      const data = await res.json();
      setResults({ ...data, action });
      if (isSubmit) {
        const verdict = data.verdict||(data.passed?'Accepted':'Wrong Answer');
        if (data.passed) setSolvedIds(s => new Set([...s, problemDetail.id]));
        try {
          const cRes = await fetch(`${API_BASE_URL}/api/contests/${contestCode}/submit`, {
            method: 'POST',
            headers: { ...getHeaders() as Record<string,string>, 'Content-Type':'application/json' },
            body: JSON.stringify({ problemId: problemDetail.id, language, sourceCode, verdict }),
          });
          await cRes.json();
        } catch {}
        await loadLeaderboard(contestCode);
      }
    } catch { setResults({ success:false, message:'Could not reach backend.' }); }
    finally { isSubmit ? setSubmitting(false) : setRunning(false); }
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
          <button onClick={() => navigate('/contests')} style={{ background:'none', border:'none', color:'#94a3b8', cursor:'pointer', fontSize:18 }}>←</button>
          <span className="arena-title">{contest.title}</span>
        </div>

        {/* Timer */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, minWidth:110 }}>
          <div className="time-progress-wrap" style={{ width:'100%' }}>
            <div className={`time-progress-bar${timerUrgent?' urgent':timeProgress < 30?' warn':''}`} style={{ width:`${timeProgress}%` }} />
          </div>
          <span className={`arena-timer${timerUrgent?' urgent':''}`}>{fmtTimer(timeLeft)}</span>
        </div>

        <div className="topbar-actions">
          <select value={language} onChange={e => handleLangChange(e.target.value as Language)}
            style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'#e2e8f0', borderRadius:8, padding:'6px 10px', fontSize:13, fontFamily:'inherit' }}>
            <option value="cpp">C++</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="js">JavaScript</option>
            <option value="c">C</option>
          </select>
          <button onClick={() => { if (monacoRef.current && problemDetail) setCode(problemDetail.boilerplate[language] ?? ''); }}
            className="btn btn-secondary" style={{ padding:'6px 12px', fontSize:12 }}>Reset</button>
          <button disabled={running||submitting} onClick={() => execute('run')} className="btn btn-secondary" style={{ padding:'6px 12px', fontSize:12 }}>
            {running?'Running…':'Run'}
          </button>
          <button disabled={running||submitting} onClick={() => execute('submit')} className="btn btn-primary" style={{ padding:'6px 14px', fontSize:12 }}>
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
            <div style={{ display:'flex', gap:4, padding:'0 12px 8px' }}>
              {['all','easy','medium','hard'].map(d => (
                <button key={d} onClick={() => setDiffFilter(d)}
                  className={`pf-diff-btn${d!=='all'?' '+d:''}${diffFilter===d?' active':''}`}
                  style={{ flex:1, padding:'3px 4px', fontSize:10 }}>
                  {d==='all'?'All':d[0].toUpperCase()}
                </button>
              ))}
            </div>
            <div style={{ flex:1, overflowY:'auto' }}>
              {filteredProblems.map(p => {
                const realIdx = problems.indexOf(p), isSolved = solvedIds.has(p.problemId);
                return (
                  <button key={p.problemId} onClick={() => switchProblem(realIdx)}
                    className={`problem-item${realIdx===currentIdx?' active':''}`}
                    style={{ width:'100%', display:'flex', alignItems:'flex-start', gap:8, padding:'10px 12px', textAlign:'left', background: realIdx===currentIdx?'rgba(255,255,255,0.06)':'transparent', border:'none', color:'inherit', cursor:'pointer', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ flexShrink:0, width:20, height:20, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, border:'1px solid', borderColor: isSolved?'rgba(134,239,172,0.4)':'rgba(255,255,255,0.1)', background: isSolved?'rgba(134,239,172,0.12)':'rgba(255,255,255,0.03)', color: isSolved?'#86efac':'#64748b', marginTop:2 }}>
                      {isSolved?'✓':realIdx+1}
                    </span>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:12, color:'#cbd5e1', lineHeight:1.4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.title}</div>
                      {p.difficulty && <div style={{ fontSize:10, fontWeight:700 }} className={diffCls(p.difficulty)}>{p.difficulty}</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center: problem + editor */}
        <div className="arena-center" style={{ display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {/* Problem description */}
          <div className="arena-problem" style={{ padding:20, maxHeight:220, overflowY:'auto', borderBottom:'1px solid rgba(255,255,255,0.07)', flexShrink:0 }}>
            <h2 style={{ fontSize:16, fontWeight:700, marginBottom:10, color:'#f1f5f9' }}>
              {problemDetail ? `#${currentIdx+1}: ${problemDetail.title}` : 'Select a problem'}
            </h2>
            {problemDetail && (
              <>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
                  <span style={{ fontSize:11, fontWeight:700 }} className={diffCls(problemDetail.difficulty)}>{problemDetail.difficulty}</span>
                  {problemDetail.tags.map(t => <span key={t} style={{ fontSize:10, background:'rgba(255,255,255,0.05)', color:'#64748b', padding:'2px 6px', borderRadius:4 }}>{t}</span>)}
                </div>
                <div style={{ fontSize:13, color:'#94a3b8', lineHeight:1.6 }}>
                  {problemDetail.description.map((p,i) => <p key={i} style={{ marginBottom:8 }}>{p}</p>)}
                </div>
                {problemDetail.example && (
                  <pre style={{ whiteSpace:'pre-wrap', padding:12, borderRadius:8, border:'1px solid rgba(255,255,255,0.08)', color:'#dbeafe', background:'#05070b', fontFamily:"'DM Mono', monospace", fontSize:12, marginTop:10 }}>{problemDetail.example}</pre>
                )}
              </>
            )}
          </div>

          {/* Monaco editor */}
          <div className="code-editor-wrap" style={{ flex:1 }}>
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
          <div className="arena-leaderboard" style={{ width:200, borderLeft:'1px solid rgba(255,255,255,0.08)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
            <div className="sidebar-header">Leaderboard</div>
            <div style={{ flex:1, overflowY:'auto' }}>
              {leaderboard.length === 0
                ? <p className="leaderboard-empty">No participants yet.</p>
                : leaderboard.map(entry => {
                    const isSelf = entry.name===user?.name||entry.name===user?.email;
                    const solvedSet = new Set(entry.solvedProblems||[]);
                    return (
                      <div key={entry.rank} className="leaderboard-row" style={{ padding:'10px 12px', borderBottom:'1px solid rgba(255,255,255,0.04)', background: isSelf?'rgba(37,99,235,0.1)':'transparent' }}>
                        <div className="lb-top-row">
                          <span className={`leaderboard-rank${entry.rank===1?' top-1':entry.rank===2?' top-2':entry.rank===3?' top-3':''}`}>{entry.rank}</span>
                          <span className="leaderboard-name">{entry.name}{isSelf&&<span style={{ marginLeft:4, fontSize:9, color:'#60a5fa' }}>You</span>}</span>
                          <span className="lb-score" style={{ color: entry.score>0?'#4ade80':'#64748b' }}>{entry.score>0?`+${entry.score}`:entry.score}</span>
                        </div>
                        <div className="lb-bottom-row">
                          <div className="lb-dots">
                            {problems.map((p,i) => (
                              <span key={i} className={`lb-dot${solvedSet.has(p.problemId)?' solved':''}`} title={`P${i+1}`}>●</span>
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
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <h3>Test Results</h3>
              <button onClick={() => setResultsOpen(false)} style={{ background:'none', border:'none', color:'#64748b', fontSize:18, cursor:'pointer', lineHeight:1 }}>×</button>
            </div>
            {!results && <p style={{ color:'#60a5fa', fontSize:14, textAlign:'center', padding:'16px 0' }}>Running…</p>}
            {results && !results.success && <p style={{ color:'#f87171', fontSize:14 }}>{results.message||'Execution failed'}</p>}
            {results?.success && (
              <>
                <div className={`results-summary${results.passed?' pass':' fail'}`}>
                  {results.action==='submit'
                    ? `${results.verdict}: ${results.passedTests}/${results.totalTests} passed`
                    : `Run: ${results.passedTests}/${results.totalTests} passed`}
                </div>
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
