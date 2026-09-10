import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { fetchProblems, fetchSolvedIds } from '@/api/problems';
import DiffBadge from '@/components/ui/DiffBadge';
import { TableSkeleton, EmptyState, ErrorState } from '@/components/ui/States';
import type { Problem } from '@/types/problem';

function getDailyProblem(problems: Problem[]): Problem | null {
  if (!problems.length) return null;
  const now = new Date(), start = new Date(now.getFullYear(), 0, 0);
  return problems[Math.floor((now.getTime() - start.getTime()) / 86400000) % problems.length];
}

export default function Problems() {
  const { getHeaders } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [solvedSet, setSolvedSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const [tag, setTag] = useState('all');
  const searchRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // The solved list needs auth and is non-essential — a signed-out user
      // (or an expired token) should still get the problem list.
      const [probs, solved] = await Promise.all([
        fetchProblems(),
        fetchSolvedIds(getHeaders()).catch(() => [] as string[])
      ]);
      setProblems(probs); setSolvedSet(new Set(solved));
    } catch (e: any) { setError(e.message || 'Failed to load problems'); }
    finally { setLoading(false); }
  }, [getHeaders]);

  useEffect(() => { load(); }, [load]);

  const daily = useMemo(() => getDailyProblem(problems), [problems]);
  const allTags = useMemo(() => Array.from(new Set(problems.flatMap(p => p.tags))).sort(), [problems]);
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return problems.filter(p => {
      if (q && !p.title.toLowerCase().includes(q) && !p.tags.some(t => t.toLowerCase().includes(q))) return false;
      if (difficulty !== 'all' && p.difficulty.toLowerCase() !== difficulty) return false;
      if (tag !== 'all' && !p.tags.some(t => t.toLowerCase() === tag.toLowerCase())) return false;
      return true;
    });
  }, [problems, search, difficulty, tag]);

  const DIFFS = ['all', 'easy', 'medium', 'hard'];

  return (
    <div className="problems-page" style={{ height: 'calc(100vh - 74px)' }}>
      {/* Daily Challenge Card */}
      {daily && (
        <div className="daily-card">
          <div className="daily-inner">
            <div className="daily-left">
              <div className="daily-kicker">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L9.09 8.26L2 9.27L7 14.14L5.82 21.02L12 17.77L18.18 21.02L17 14.14L22 9.27L14.91 8.26L12 2Z" />
                </svg>
                Daily Challenge
                {solvedSet.has(daily.id) && <span className="daily-streak">✓ Solved</span>}
              </div>
              <div className="daily-title">{daily.title}</div>
              <div className="daily-tags">
                <span className={daily.difficulty.toLowerCase()}>{daily.difficulty}</span>
                {daily.tags.slice(0, 3).map(t => <span key={t}>{t}</span>)}
              </div>
            </div>
            <Link
              to={`/editor/${encodeURIComponent(daily.id)}`}
              className={`daily-solve-btn${solvedSet.has(daily.id) ? ' solved' : ''}`}
            >
              {solvedSet.has(daily.id) ? '✓ Revisit' : 'Solve Today →'}
            </Link>
          </div>
        </div>
      )}

      {/* Problems Panel */}
      <div className="problems-panel">
        <div className="panel-filters">
          {/* Search */}
          <div className="search-wrap">
            <svg className="search-icon" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="6.5" stroke="#64748b" strokeWidth="1.6" />
              <path d="M14 14l3 3" stroke="#64748b" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <input ref={searchRef} type="text" className="search-input" placeholder="Search by title or topic…"
              value={search} onChange={e => setSearch(e.target.value)} autoComplete="off" />
            {search && (
              <button className="search-clear visible" onClick={() => { setSearch(''); searchRef.current?.focus(); }}>✕</button>
            )}
          </div>

          <div className="filter-row">
            {/* Difficulty */}
            <div className="diff-group">
              {DIFFS.map(d => (
                <button key={d} onClick={() => setDifficulty(d)}
                  className={`diff-btn ${d}${difficulty === d ? ' active' : ''}`}>
                  {d === 'all' ? 'All' : d[0].toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>

            {/* Tags */}
            <div className="tag-scroll">
              {['all', ...allTags].map(t => (
                <button key={t} onClick={() => setTag(t)}
                  className={`tag-btn${tag === t ? ' active' : ''}`}>
                  {t === 'all' ? 'All Topics' : t}
                </button>
              ))}
            </div>

            <div className="results-meta">
              {!loading && `${filtered.length} of ${problems.length} problems · ${solvedSet.size} solved`}
            </div>
          </div>
        </div>

        {/* Table header */}
        <div className="prob-table-head">
          <span className="col-status"></span>
          <span className="col-num">#</span>
          <span>Title</span>
          <span>Topics</span>
          <span>Difficulty</span>
        </div>

        {/* Table body */}
        <div className="prob-table-body">
          {loading && <TableSkeleton rows={10} />}
          {!loading && error && <ErrorState message={error} onRetry={load} />}
          {!loading && !error && problems.length === 0 && (
            <EmptyState
              title="No problems yet"
              hint="The problem set hasn't been seeded for this environment."
            />
          )}
          {!loading && !error && problems.length > 0 && filtered.length === 0 && (
            <EmptyState
              title="No problems match your filters"
              hint="Try a different topic, difficulty, or search term."
              action={
                <button
                  type="button"
                  className="af-retry-btn"
                  onClick={() => { setSearch(''); setDifficulty('all'); setTag('all'); }}
                >
                  Clear filters
                </button>
              }
            />
          )}
          {!loading && !error && filtered.map(p => {
            const isDaily = p.id === daily?.id;
            const isSolved = solvedSet.has(p.id);
            const visibleTags = p.tags.slice(0, 2);
            const extra = p.tags.length - visibleTags.length;
            const idx = problems.indexOf(p) + 1;
            return (
              <Link key={p.id} to={`/editor/${encodeURIComponent(p.id)}`}
                className={`prob-row${isDaily ? ' is-daily' : ''}`}>
                <div className="col-status">
                  <div className={`status-icon${isSolved ? ' solved' : ' unsolved'}`}>
                    {isSolved ? '✓' : ''}
                  </div>
                </div>
                <span className="col-num">{idx}</span>
                <div className="col-title">
                  {isDaily && <div className="daily-dot" title="Daily challenge" />}
                  <span className="row-title">{p.title}</span>
                </div>
                <div className="col-tags">
                  {visibleTags.map(t => <span key={t} className="row-tag">{t}</span>)}
                  {extra > 0 && <span className="row-tag-more">+{extra}</span>}
                </div>
                <div><DiffBadge difficulty={p.difficulty} /></div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
