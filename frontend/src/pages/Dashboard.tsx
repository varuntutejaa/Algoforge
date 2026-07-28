import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchProfile, fetchSolvedList, fetchActivity } from '@/api/profile';
import type { ProfileStats, SolvedItem, ActivityEntry } from '@/types/user';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function Heatmap({ activity }: { activity: ActivityEntry[] }) {
  const map = new Map(activity.map(e => [e.date, e.count]));
  const DAYS = 365;
  const end = new Date(); end.setHours(0,0,0,0);
  const start = new Date(end); start.setDate(start.getDate() - (DAYS - 1));
  const startDow = start.getDay();

  type Week = { cells: ({ key: string; count: number } | null)[]; label: string | null; gap: boolean };
  const weeks: Week[] = [];
  let cells: ({ key: string; count: number } | null)[] = new Array(startDow).fill(null);
  let weekLabel: string | null = null, weekIsMonthStart = false, lastMonth = -1;

  for (let i = 0; i < DAYS; i++) {
    const date = new Date(start); date.setDate(start.getDate() + i);
    const month = date.getMonth(), dow = (i + startDow) % 7;
    if (dow === 0 && i > 0) { weeks.push({ cells, label: weekLabel, gap: weekIsMonthStart }); cells = []; weekLabel = null; weekIsMonthStart = false; }
    if (month !== lastMonth) { lastMonth = month; weekLabel = MONTHS[month]; weekIsMonthStart = i > 0; }
    cells.push({ key: date.toISOString().slice(0, 10), count: map.get(date.toISOString().slice(0,10)) || 0 });
  }
  while (cells.length < 7) cells.push(null);
  weeks.push({ cells, label: weekLabel, gap: weekIsMonthStart });

  const level = (c: number) => !c ? 0 : c === 1 ? 1 : c === 2 ? 2 : c <= 4 ? 3 : 4;

  return (
    <div className="heatmap-wrap">
      <div className="heatmap-flex">
        {weeks.map((w, wi) => (
          <div key={wi} className="hm-week" style={w.gap ? { marginLeft: 8 } : {}}>
            <div className="hm-month-label">{w.label || ''}</div>
            {w.cells.map((cell, ci) =>
              cell
                ? <div key={ci} className={`heat-cell${level(cell.count) > 0 ? ` level-${level(cell.count)}` : ''}`} title={`${cell.key}: ${cell.count}`} />
                : <div key={ci} className="heat-cell heat-empty" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Breakdown({ counts }: { counts: Record<string, number> }) {
  const entries = Object.entries(counts).filter(([,c]) => c > 0);
  if (!entries.length) return <p className="empty-state">No solved problems yet.</p>;
  const max = Math.max(...entries.map(([,c]) => c), 1);
  return (
    <div className="breakdown-list">
      {entries.map(([label, count]) => (
        <div key={label} className="breakdown-item">
          <span>{label}</span>
          <div className="breakdown-bar">
            <div style={{ width: `${(count / max) * 100}%` }} />
          </div>
          <strong>{count}</strong>
        </div>
      ))}
    </div>
  );
}

function fmt(v: string) { return new Date(v).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); }

export default function Dashboard() {
  const { user, getHeaders } = useAuth();
  const [profile, setProfile] = useState<ProfileStats | null>(null);
  const [solved, setSolved] = useState<SolvedItem[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.id) { setError('Session missing. Please log out and log in again.'); setLoading(false); return; }
    (async () => {
      try {
        const h = getHeaders();
        const [prof, sol, act] = await Promise.all([fetchProfile(h, user.id), fetchSolvedList(h, user.id), fetchActivity(h, user.id)]);
        setProfile(prof); setSolved(sol); setActivity(act);
      } catch (e: any) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, [user, getHeaders]);

  if (loading) return <p className="loading-text" style={{ textAlign:'center', padding:'80px 0' }}>Loading dashboard…</p>;
  if (error) return <p style={{ color:'#f87171', textAlign:'center', padding:'80px 0', fontSize:14 }}>{error}</p>;
  if (!profile) return null;

  const difficultyCounts: Record<string, number> = { Easy: 0, Medium: 0, Hard: 0 };
  const topicCounts: Record<string, number> = {};
  solved.forEach(item => {
    if (item.difficulty in difficultyCounts) difficultyCounts[item.difficulty]++;
    item.tags?.forEach(t => { topicCounts[t] = (topicCounts[t] || 0) + 1; });
  });

  const statCards = [
    ['Problems Solved', profile.problemsSolved],
    ['Total Submissions', profile.totalSubmissions],
    ['Accepted', profile.acceptedSubmissions],
    ['Acceptance Rate', `${profile.acceptanceRate}%`],
    ['Current Streak', `${profile.currentStreak} days`],
    ['Longest Streak', `${profile.longestStreak} days`],
  ] as const;

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <span className="section-kicker">Profile & Analytics</span>
        <h1>Dashboard</h1>
      </header>

      {/* Profile card */}
      <section className="profile-card">
        <div className="profile-identity">
          <div style={{ width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,#f97316,#ea580c)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:800, color:'#fff', marginBottom:12 }}>
            {(profile.name || 'U')[0].toUpperCase()}
          </div>
          <h2>{profile.name}</h2>
          <p>{profile.email}</p>
        </div>
        {statCards.slice(0, 3).map(([label, value]) => (
          <div key={label} className="profile-stat">
            <span>{label}</span>
            <strong>{String(value)}</strong>
          </div>
        ))}
      </section>

      {/* Stats grid */}
      <section className="stats-grid">
        {statCards.slice(3).map(([label, value]) => (
          <div key={label} className="stat-card">
            <span>{label}</span>
            <strong>{String(value)}</strong>
          </div>
        ))}
      </section>

      {/* Two-column grid */}
      <div className="dashboard-grid">
        <article className="panel" style={{ marginBottom: 0 }}>
          <h2>By Difficulty</h2>
          <Breakdown counts={difficultyCounts} />
        </article>
        <article className="panel" style={{ marginBottom: 0 }}>
          <h2>By Topic</h2>
          <Breakdown counts={topicCounts} />
        </article>
      </div>

      {/* Heatmap */}
      <section className="panel heatmap-panel">
        <div className="panel-heading">
          <h2>Activity</h2>
        </div>
        <Heatmap activity={activity} />
      </section>

      {/* Recent activity */}
      <section className="panel">
        <h2>Recent Activity</h2>
        {solved.slice(0, 8).length === 0
          ? <p className="empty-state">No accepted problems yet.</p>
          : <div className="activity-list">
              {solved.slice(0, 8).map((item, i) => (
                <div key={i} className="activity-item">
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span className="check">✓</span>
                    <span>{item.title}</span>
                  </div>
                  <span style={{ fontSize:13, color:'#64748b' }}>{fmt(item.solvedAt)}</span>
                </div>
              ))}
            </div>
        }
      </section>

      {/* Solved problems */}
      <section className="panel">
        <h2>Solved Problems ({solved.length})</h2>
        {!solved.length
          ? <p className="empty-state">No solved problems yet.</p>
          : <div className="solved-list">
              {solved.map((item, i) => (
                <div key={i} className="solved-item">
                  <div>
                    <div style={{ fontWeight:600, marginBottom:8 }}>{item.title}</div>
                    <div className="solved-meta">
                      <span className={`difficulty-badge ${item.difficulty.toLowerCase()}`}>{item.difficulty}</span>
                      {item.tags?.slice(0, 3).map(t => <span key={t}>{t}</span>)}
                    </div>
                  </div>
                  <span style={{ fontSize:13, color:'#64748b', flexShrink:0 }}>{fmt(item.solvedAt)}</span>
                </div>
              ))}
            </div>
        }
      </section>
    </main>
  );
}
