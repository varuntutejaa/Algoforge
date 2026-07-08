import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { fetchContest, fetchLeaderboard } from '@/api/contests';
import type { Contest, LeaderboardEntry } from '@/types/contest';

function fmtTime(sec: number | null) {
  if (sec == null) return '--';
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
function ordinal(n: number) { const s=['th','st','nd','rd'],v=n%100; return n+(s[(v-20)%10]||s[v]||s[0]); }

export default function ContestResults() {
  const { code = '' } = useParams<{ code: string }>();
  const { user, getHeaders } = useAuth();
  const [contest, setContest] = useState<Contest | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!code) { setError('No contest code.'); setLoading(false); return; }
    (async () => {
      try {
        const [c, lb] = await Promise.all([fetchContest(code, getHeaders()), fetchLeaderboard(code, getHeaders())]);
        setContest(c); setLeaderboard(lb);
      } catch (err: any) { setError(err.message || 'Failed to load results'); }
      finally { setLoading(false); }
    })();
  }, [code, getHeaders]);

  if (loading) return <div className="results-loading">Loading results…</div>;
  if (error) return <div className="results-error">{error}</div>;
  if (!contest) return null;

  const problems = contest.problems || [];
  const duration = Math.round((new Date(contest.endsAt).getTime() - new Date(contest.startsAt).getTime()) / 60000);
  const myEntry = leaderboard.find(e =>
    (user?.id && e.userId && e.userId === user.id) || e.name === user?.name || e.name === user?.email
  );

  const podiumOrder = [leaderboard[1], leaderboard[0], leaderboard[2]];
  const medals = ['🥈','🥇','🥉'];
  const podiumSlotClass = ['rank-2','rank-1','rank-3'];

  return (
    <div className="results-page">
      {/* Hero */}
      <div className="results-hero">
        <Link to="/contests" className="results-back">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
            <path d="M13 4l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Contests
        </Link>
        <h1>{contest.title}</h1>
        <div className="results-meta-row">
          <span className="results-meta-item">⏱ {duration} min</span>
          <span className="results-meta-item">👥 {leaderboard.length} participants</span>
          <span className="results-meta-item">{new Date(contest.startsAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          <span className="results-meta-item">📝 {problems.length} problems</span>
        </div>
      </div>

      {/* My result banner */}
      {myEntry && (
        <div className="my-result-banner">
          <div className="my-result-rank">{ordinal(myEntry.rank)}</div>
          <div className="my-result-info">
            <div className="my-result-name">{myEntry.name}</div>
            <div className="my-result-sub">Your Result</div>
          </div>
          <div className="my-result-stats">
            <div className="my-stat">
              <span className="my-stat-val good">{(myEntry.solvedProblems||[]).length}/{problems.length}</span>
              <span className="my-stat-label">Solved</span>
            </div>
            <div className="my-stat">
              <span className="my-stat-val blue">{myEntry.score > 0 ? `+${myEntry.score}` : myEntry.score}</span>
              <span className="my-stat-label">Score</span>
            </div>
            {myEntry.timeTakenSeconds != null && (
              <div className="my-stat">
                <span className="my-stat-val blue">{fmtTime(myEntry.timeTakenSeconds)}</span>
                <span className="my-stat-label">Finish</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Podium */}
      {leaderboard.length > 0 && (
        <div className="podium-section">
          <div className="section-label">Top Finishers</div>
          <div className="podium">
            {podiumOrder.map((entry, i) => (
              <div key={i} className={`podium-slot ${podiumSlotClass[i]}`}>
                {entry ? (
                  <div className="podium-card">
                    <div className="podium-medal">{medals[i]}</div>
                    <div className="podium-name">{entry.name}</div>
                    <div className="podium-score">{entry.score > 0 ? `+${entry.score}` : entry.score}</div>
                    <div className="podium-solved">{(entry.solvedProblems||[]).length}/{problems.length} solved</div>
                  </div>
                ) : null}
                <div className="podium-bar" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full standings */}
      <div className="lb-section">
        {leaderboard.length === 0
          ? <div className="lb-empty">No participants yet.</div>
          : <table className="lb-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  {problems.map((p, i) => (
                    <th key={i} className="center">
                      P{i+1}
                      <div style={{ fontSize:10, fontWeight:400, color:'#475569', marginTop:2 }}>
                        {p.title && p.title.length > 12 ? p.title.slice(0,12)+'…' : p.title}
                      </div>
                    </th>
                  ))}
                  <th style={{ textAlign:'right' }}>Score</th>
                  <th style={{ textAlign:'right' }}>Penalty</th>
                  <th style={{ textAlign:'right' }}>Wrong</th>
                  <th style={{ textAlign:'right' }}>Finish</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map(entry => {
                  const isMe = entry === myEntry;
                  const solvedSet = new Set(entry.solvedProblems || []);
                  return (
                    <tr key={entry.rank} className={isMe ? 'is-me' : ''}>
                      <td className={`td-rank${entry.rank===1?' r1':entry.rank===2?' r2':entry.rank===3?' r3':''}`}>{entry.rank}</td>
                      <td className="td-name">
                        {entry.name}
                        {isMe && <span className="me-badge">You</span>}
                      </td>
                      {problems.map((p, i) => (
                        <td key={i} className="td-prob center">
                          {solvedSet.has(p.problemId) ? (
                            <div className="prob-cell-solved">
                              <span className="prob-check">✓</span>
                              {entry.perProblemTimes?.[p.problemId] != null && (
                                <span className="prob-time">{fmtTime(entry.perProblemTimes![p.problemId])}</span>
                              )}
                            </div>
                          ) : <span className="prob-unsolved">—</span>}
                        </td>
                      ))}
                      <td className={`td-score${entry.score > 0 ?' score-pos':entry.score < 0?' score-neg':' score-zero'}`}>
                        {entry.score > 0 ? `+${entry.score}` : entry.score || '—'}
                      </td>
                      <td className={`td-penalty${entry.penalty >= 0 ? ' none' : ''}`}>
                        {entry.penalty < 0 ? entry.penalty : '—'}
                      </td>
                      <td className={`td-wrong${entry.wrongAttempts > 0 ? ' has-wrong' : ''}`}>
                        {entry.wrongAttempts > 0 ? entry.wrongAttempts : '—'}
                      </td>
                      <td className="td-time">{fmtTime(entry.timeTakenSeconds)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
        }
      </div>
    </div>
  );
}
