import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchSubmissions } from '@/api/profile';

type Sub = { problemTitle: string; language: string; verdict: string; runtime: number | null; memory: number | null; submittedAt: string };

function verdictCls(v: string) {
  if (v === 'Accepted') return 'verdict accepted';
  if (v === 'Wrong Answer') return 'verdict wrong-answer';
  if (v.includes('Time')) return 'verdict tle';
  return 'verdict';
}

function fmt(v: string) {
  return new Date(v).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const VERDICTS = ['All','Accepted','Wrong Answer','Time Limit Exceeded','Runtime Error','Compile Error'];

export default function Submissions() {
  const { getHeaders } = useAuth();
  const [subs, setSubs] = useState<Sub[]>([]);
  const [verdict, setVerdict] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (v: string) => {
    setLoading(true); setError('');
    try { setSubs(await fetchSubmissions(getHeaders(), v)); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [getHeaders]);

  useEffect(() => { load(verdict); }, [verdict, load]);

  return (
    <main className="submissions-page">
      <header className="submissions-header">
        <span className="section-kicker">Submission History</span>
        <h1>My Submissions</h1>
      </header>

      <section className="filters-bar">
        <label>Filter:</label>
        <select value={verdict} onChange={e => setVerdict(e.target.value)}>
          {VERDICTS.map(v => <option key={v} value={v}>{v === 'All' ? 'All Verdicts' : v}</option>)}
        </select>
      </section>

      <section className="submissions-table-wrap">
        <table className="submissions-table">
          <thead>
            <tr>
              {['Problem','Language','Verdict','Runtime','Memory','Submitted'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} style={{ textAlign:'center', color:'#64748b', padding:'32px 16px' }}>Loading submissions…</td></tr>}
            {error && <tr><td colSpan={6} style={{ textAlign:'center', color:'#f87171', padding:'32px 16px' }}>{error}</td></tr>}
            {!loading && !error && subs.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign:'center', color:'#64748b', padding:'32px 16px' }}>No submissions found.</td></tr>
            )}
            {!loading && !error && subs.map((s, i) => (
              <tr key={i}>
                <td>{s.problemTitle}</td>
                <td style={{ fontFamily:"'DM Mono', monospace", fontSize:13 }}>{s.language}</td>
                <td><span className={verdictCls(s.verdict)}>{s.verdict}</span></td>
                <td style={{ color:'#94a3b8', fontSize:13 }}>{s.runtime != null ? `${s.runtime}s` : '–'}</td>
                <td style={{ color:'#94a3b8', fontSize:13 }}>{s.memory != null ? `${s.memory} KB` : '–'}</td>
                <td style={{ color:'#94a3b8', fontSize:13 }}>{fmt(s.submittedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
