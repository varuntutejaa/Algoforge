import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/api';

function getDailyId(problems: Array<{ id: string }>) {
  if (!problems.length) return null;
  const now = new Date(), start = new Date(now.getFullYear(), 0, 0);
  const day = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return problems[day % problems.length].id;
}

function StreakBadge({ getHeaders }: { getHeaders: () => HeadersInit }) {
  const [streak, setStreak] = useState(0);
  const [solvedToday, setSolvedToday] = useState(false);
  const [dailyId, setDailyId] = useState<string | null>(null);

  useEffect(() => {
    if (!localStorage.getItem('algoforge-id-token')) return;
    Promise.all([
      fetch(`${API_BASE_URL}/profile/streak`, { headers: getHeaders() }),
      fetch(`${API_BASE_URL}/problems`),
    ]).then(async ([s, p]) => {
      if (s.ok) { const d = await s.json(); setStreak(d.currentStreak || 0); setSolvedToday(!!d.solvedToday); }
      if (p.ok) { const d = await p.json(); setDailyId(getDailyId(d.problems || [])); }
    }).catch(() => {});
  }, [getHeaders]);

  const streakCls = streak === 0
    ? 'nav-streak streak-zero'
    : !solvedToday ? 'nav-streak streak-at-risk' : 'nav-streak';

  return (
    <Link
      to={dailyId ? `/editor/${dailyId}` : '/problems'}
      className={streakCls}
      title={streak === 0 ? "No streak — solve today's daily!" : `${streak}-day streak`}
    >
      <svg className="nav-streak-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C12 2 9 7 9 11C9 12.5 9.5 14 10 15C9 14.5 8 13 8 11C8 11 5 14 5 17C5 20.3 8.1 23 12 23C15.9 23 19 20.3 19 17C19 12 12 2 12 2Z" />
      </svg>
      <span className="nav-streak-count">{streak}</span>
    </Link>
  );
}

function ProfileMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, []);

  if (!user) return (
    <div className="nav-auth-buttons">
      <Link to="/login" className="nav-login-btn">Login</Link>
      <Link to="/signup" className="nav-signup-btn">Get Started</Link>
    </div>
  );

  const avatar = user.photoURL
    ? <img src={user.photoURL} alt={user.name} referrerPolicy="no-referrer" />
    : <span>{(user.name || user.email || 'U')[0].toUpperCase()}</span>;

  return (
    <div className="profile-menu" ref={ref}>
      <button
        className="profile-trigger"
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
      >
        <div className="profile-avatar">{avatar}</div>
        <span className="profile-name">{user.name || user.email}</span>
        <span className="profile-caret">▾</span>
      </button>

      <div className={`profile-dropdown${open ? ' open' : ''}`}>
        <Link to="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link>
        <Link to="/submissions" onClick={() => setOpen(false)}>My Submissions</Link>
        <button onClick={async () => { await logout(); navigate('/'); }}>Logout</button>
      </div>
    </div>
  );
}

export default function Navbar() {
  const { user, getHeaders } = useAuth();

  return (
    <nav className="app-navbar">
      <Link to="/" className="brand">
        <img src="/assets/algoforge_favicon_themed.svg" alt="AlgoForge" className="brand-icon" />
        <span className="brand-text">AlgoForge</span>
      </Link>

      <div className="nav-center">
        <Link to="/problems">Problems</Link>
        <Link to="/contests">Contests</Link>
        <Link to="/calendar">Calendar</Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {user && <StreakBadge getHeaders={getHeaders} />}
        <ProfileMenu />
      </div>
    </nav>
  );
}
