import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { fetchMyContests, fetchAvailableContests, createContest, joinContest, fetchLeaderboard } from '@/api/contests';
import { fetchProblems } from '@/api/problems';
import type { Contest, LeaderboardEntry } from '@/types/contest';
import type { Problem } from '@/types/problem';

function fmt(d: string) {
  return new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function fmtDur(sec: number | null) {
  if (!sec) return '--';
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
function getStatus(c: Contest) {
  const now = new Date();
  if (now >= new Date(c.startsAt) && now < new Date(c.endsAt)) return 'active';
  if (now >= new Date(c.endsAt)) return 'ended';
  return 'upcoming';
}
function getCountdown(c: Contest) {
  const now = new Date().getTime(), diff = new Date(c.endsAt).getTime() - now, sd = new Date(c.startsAt).getTime() - now;
  if (diff <= 0) return '';
  if (sd > 0) { const d = Math.floor(sd/86400000), h = Math.floor((sd%86400000)/3600000), m = Math.floor((sd%3600000)/60000); return d ? `${d}d ${h}h until start` : h ? `${h}h ${m}m until start` : `${m}m until start`; }
  const m = Math.floor(diff/60000), h = Math.floor(m/60); return h ? `${h}h ${m%60}m left` : `${m}m left`;
}

function ContestCard({ c, onCopy }: { c: Contest; onCopy: (code: string) => void }) {
  const { getHeaders } = useAuth();
  const status = getStatus(c), countdown = getCountdown(c);
  const [lbOpen, setLbOpen] = useState(false);
  const [lb, setLb] = useState<LeaderboardEntry[]>([]);
  const [lbLoading, setLbLoading] = useState(false);

  async function toggleLb() {
    if (lbOpen) { setLbOpen(false); return; }
    setLbLoading(true); setLbOpen(true);
    try { setLb(await fetchLeaderboard(c.code, getHeaders())); } catch {}
    setLbLoading(false);
  }

  return (
    <div className="contest-card">
      <div className="contest-card-header">
        <h3>{c.title}</h3>
        <span className={`contest-status ${status}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </div>
      {c.description && <p className="contest-card-desc">{c.description}</p>}
      <div className="contest-card-meta">
        <span>Code: <strong style={{ fontFamily:'monospace' }}>{c.code}</strong></span>
        <span>📝 {c.problemCount} problems</span>
        <span>👥 {c.participantCount} participants</span>
        <span>👤 {c.createdByName}</span>
        <span>📅 {fmt(c.startsAt)}</span>
        {countdown && <span className={`countdown${status === 'active' ? ' urgent' : ''}`}>⏱ {countdown}</span>}
      </div>
      <div className="contest-card-actions">
        {status === 'active' && <Link to={`/contest-editor/${c.code}`} className="btn btn-primary">Enter Contest</Link>}
        {status === 'ended' && <Link to={`/contest-results/${c.code}`} className="btn btn-secondary">View Results</Link>}
        <button onClick={() => onCopy(c.code)} className="btn btn-secondary">Copy Code</button>
        <button onClick={toggleLb} className="btn btn-secondary">{lbOpen ? 'Hide Leaderboard' : 'Leaderboard'}</button>
      </div>
      {lbOpen && (
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:12, display:'flex', flexDirection:'column', gap:8 }}>
          {lbLoading ? <p className="loading-text">Loading…</p>
           : lb.length === 0 ? <p className="empty-state">No participants yet.</p>
           : lb.map(e => (
            <div key={e.rank} style={{ display:'flex', alignItems:'center', gap:12, fontSize:14 }}>
              <span style={{ width:24, fontWeight:800, color:'#64748b' }}>{e.rank}</span>
              <span style={{ flex:1, color:'#e2e8f0', fontWeight:600 }}>{e.name}</span>
              <span style={{ fontSize:12, color:'#64748b' }}>{(e.solvedProblems||[]).length} solved · {fmtDur(e.timeTakenSeconds)}</span>
              <span style={{ fontWeight:800, color:'#f8fafc' }}>{e.score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateForm({ onCreated }: { onCreated: () => void }) {
  const { getHeaders } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [mode, setMode] = useState<'random'|'choose'>('random');
  const [search, setSearch] = useState(''), [diff, setDiff] = useState('all'), [tagF, setTagF] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState(''), [desc, setDesc] = useState('');
  const [randomCount, setRandomCount] = useState(5), [duration, setDuration] = useState(60);
  const now = new Date();
  const [startDate, setStartDate] = useState(now.toISOString().slice(0,10));
  const [startTime, setStartTime] = useState(`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()+1).padStart(2,'0')}`);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { fetchProblems().then(setProblems).catch(() => {}); }, []);

  const allTags = Array.from(new Set(problems.flatMap(p => p.tags))).sort();
  const visible = problems.filter(p => {
    const q = search.toLowerCase();
    if (q && !p.title.toLowerCase().includes(q) && !p.tags.some(t => t.toLowerCase().includes(q))) return false;
    if (diff !== 'all' && p.difficulty.toLowerCase() !== diff) return false;
    if (tagF && !p.tags.includes(tagF)) return false;
    return true;
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setMsg('Enter a contest title'); return; }
    const [yr,mo,dy] = startDate.split('-').map(Number), [hr,mn] = startTime.split(':').map(Number);
    const sa = new Date(yr,mo-1,dy,hr,mn,0,0);
    if (isNaN(sa.getTime()) || sa <= new Date()) { setMsg('Start time must be in the future'); return; }
    if (mode === 'choose' && selected.size === 0) { setMsg('Select at least one problem'); return; }
    setSubmitting(true); setMsg('');
    try {
      const c = await createContest({ title: title.trim(), description: desc.trim(), problems: mode === 'random' ? { count: randomCount } : Array.from(selected), startsAt: sa.toISOString(), durationMinutes: duration, isRandom: mode === 'random' }, getHeaders());
      setMsg(`✓ Created! Code: ${c.code}`); setTitle(''); setDesc(''); setSelected(new Set()); onCreated();
    } catch (e: any) { setMsg(e.message); }
    finally { setSubmitting(false); }
  }

  return (
    <form onSubmit={submit} className="contest-form">
      <div className="form-group">
        <label>Title *</label>
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Contest title" />
      </div>
      <div className="form-group">
        <label>Description</label>
        <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Optional" rows={2} />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Start Date</label>
          <input type="date" value={startDate} min={now.toISOString().slice(0,10)} onChange={e=>setStartDate(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Start Time</label>
          <input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Duration (min)</label>
          <input type="number" value={duration} min={5} max={480} onChange={e=>setDuration(+e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label>Problem Mode</label>
        <select value={mode} onChange={e=>setMode(e.target.value as any)}>
          <option value="random">Random</option>
          <option value="choose">Choose Problems</option>
        </select>
      </div>

      {mode === 'random'
        ? <div className="form-group">
            <label>Number of Problems</label>
            <input type="number" value={randomCount} min={1} max={20} onChange={e=>setRandomCount(+e.target.value)} />
          </div>
        : <div className="form-group">
            <div className="problem-picker-toolbar">
              <input className="problem-search-input" placeholder="Search problems…" value={search} onChange={e=>setSearch(e.target.value)} />
              <div className="problem-difficulty-filters">
                {['all','Easy','Medium','Hard'].map(d => (
                  <button key={d} type="button" onClick={() => setDiff(d)}
                    className={`pf-diff-btn${d!=='all'?' '+d.toLowerCase():''}${diff===d?' active':''}`}>
                    {d==='all'?'All':d}
                  </button>
                ))}
              </div>
              <div className="problem-tag-filters">
                {allTags.map(t => (
                  <button key={t} type="button" onClick={()=>setTagF(tagF===t?'':t)}
                    className={`pf-tag-btn${tagF===t?' active':''}`}>{t}</button>
                ))}
              </div>
            </div>
            <div className="problem-picker-meta">
              <span>{visible.length} problems</span>
              <div className="problem-picker-actions">
                <button type="button" className="pf-action-btn" onClick={()=>setSelected(new Set(visible.map(p=>p.id)))}>Select All</button>
                <button type="button" className="pf-action-btn" onClick={()=>setSelected(s=>{const n=new Set(s);visible.forEach(p=>n.delete(p.id));return n;})}>Deselect All</button>
                <span style={{ color:'#64748b', fontSize:11 }}>{selected.size} selected</span>
              </div>
            </div>
            <div className="problem-checkboxes">
              {visible.map(p => (
                <label key={p.id}>
                  <input type="checkbox" checked={selected.has(p.id)} onChange={()=>setSelected(s=>{const n=new Set(s);n.has(p.id)?n.delete(p.id):n.add(p.id);return n;})} />
                  <span style={{ flex:1, fontSize:14, color:'#e2e8f0' }}>{p.title}</span>
                  <div className="problem-tags-inline">
                    <span className={`problem-diff-badge ${p.difficulty.toLowerCase()}`}>{p.difficulty}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
      }

      {msg && <p style={{ fontSize:14, color: msg.startsWith('✓') ? '#22c55e' : '#f87171' }}>{msg}</p>}
      <button type="submit" disabled={submitting} className="btn btn-primary" style={{ width:'100%', padding:'12px', fontSize:14 }}>
        {submitting ? 'Creating…' : 'Create Contest'}
      </button>
    </form>
  );
}

type Tab = 'my' | 'create' | 'join';

export default function Contests() {
  const { getHeaders } = useAuth();
  const [tab, setTab] = useState<Tab>('my');
  const [myC, setMyC] = useState<Contest[]>([]);
  const [avail, setAvail] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState(''), [statusF, setStatusF] = useState('all');
  const [joinCode, setJoinCode] = useState(''), [joinMsg, setJoinMsg] = useState(''), [joining, setJoining] = useState(false);
  const [, setCopied] = useState('');
  const interval = useRef<ReturnType<typeof setInterval>|null>(null);

  const load = useCallback(async () => {
    try {
      const [my, av] = await Promise.all([fetchMyContests(getHeaders()), fetchAvailableContests(getHeaders())]);
      setMyC(my); setAvail(av);
    } catch {} finally { setLoading(false); }
  }, [getHeaders]);

  useEffect(() => { load(); interval.current = setInterval(load, 30000); return () => { if(interval.current) clearInterval(interval.current); }; }, [load]);

  function filter(list: Contest[]) {
    return list.filter(c => {
      const q = searchQ.toLowerCase();
      return (!q || c.title.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)) &&
             (statusF === 'all' || getStatus(c) === statusF);
    });
  }

  function copy(code: string) {
    navigator.clipboard.writeText(code).then(() => { setCopied(code); setTimeout(()=>setCopied(''), 2000); });
  }

  async function handleJoin() {
    const code = joinCode.trim().toUpperCase();
    if (!code || code.length < 4) { setJoinMsg('Enter a valid contest code'); return; }
    setJoining(true); setJoinMsg('');
    try { const c = await joinContest(code, getHeaders()); setJoinMsg(`✓ Joined "${c.title}"!`); setJoinCode(''); await load(); setTab('my'); }
    catch (e: any) { setJoinMsg(e.message); }
    finally { setJoining(false); }
  }

  const fMy = filter(myC), fAv = filter(avail);
  const showList = tab === 'my' || tab === 'join';

  return (
    <div className="contests-page">
      <header className="contests-header">
        <span className="section-kicker">Compete & Improve</span>
        <h1>Contests</h1>
        <p>Create or join timed coding contests with a live leaderboard.</p>
      </header>

      {/* Tabs */}
      <div className="contests-tabs">
        <button className={tab === 'my' ? 'active' : ''} onClick={() => setTab('my')}>My Contests</button>
        <button className={tab === 'create' ? 'active' : ''} onClick={() => setTab('create')}>+ Create</button>
        <button className={tab === 'join' ? 'active' : ''} onClick={() => setTab('join')}>Join</button>
      </div>

      {/* Search + filters */}
      {showList && (
        <div className="contests-search">
          <input className="search-input" placeholder="Search contests…" value={searchQ} onChange={e=>setSearchQ(e.target.value)} />
          <div className="filter-row">
            <div className="status-filters">
              {['all','active','upcoming','ended'].map(s => (
                <button key={s} onClick={() => setStatusF(s)}
                  className={`filter-btn ${s}-status${statusF===s?' active':''}`}>
                  {s.charAt(0).toUpperCase()+s.slice(1)}
                </button>
              ))}
            </div>
            <div className="results-count">
              {tab==='my'?fMy.length:fAv.length} of {tab==='my'?myC.length:avail.length} contests
            </div>
          </div>
        </div>
      )}

      {/* My Contests */}
      {tab==='my' && (
        <div className="contest-panel active">
          {loading && <p className="loading-text">Loading…</p>}
          {!loading && fMy.length===0 && <p className="empty-state">No contests match your filters.</p>}
          {fMy.map(c => <ContestCard key={c.code} c={c} onCopy={copy} />)}
        </div>
      )}

      {/* Create */}
      {tab==='create' && (
        <div className="contest-panel active">
          <CreateForm onCreated={()=>{load();setTab('my');}} />
        </div>
      )}

      {/* Join */}
      {tab==='join' && (
        <div className="contest-panel active">
          <div className="join-section">
            <input placeholder="Enter contest code…" value={joinCode}
              onChange={e=>setJoinCode(e.target.value.toUpperCase())} onKeyDown={e=>e.key==='Enter'&&handleJoin()} />
            <button onClick={handleJoin} disabled={joining} className="btn btn-primary">
              {joining?'Joining…':'Join'}
            </button>
          </div>
          {joinMsg && <p style={{ fontSize:14, color: joinMsg.startsWith('✓')?'#22c55e':'#f87171', marginBottom:16 }}>{joinMsg}</p>}
          <h3 style={{ fontSize:14, fontWeight:700, color:'#94a3b8', marginBottom:12 }}>Available Contests</h3>
          {loading && <p className="loading-text">Loading…</p>}
          {!loading && fAv.length===0 && <p className="empty-state">No contests found.</p>}
          {fAv.map(c => <ContestCard key={c.code} c={c} onCopy={copy} />)}
        </div>
      )}
    </div>
  );
}
