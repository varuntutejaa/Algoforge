import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <div className="app-footer-brand">
          <img src="/assets/algoforge_favicon_themed.svg" alt="" className="app-footer-logo" />
          <div>
            <span className="app-footer-name">AlgoForge</span>
            <p className="app-footer-tagline">Practice. Compete. Improve.</p>
          </div>
        </div>

        <nav className="app-footer-links" aria-label="Footer">
          <div className="app-footer-col">
            <span className="app-footer-heading">Platform</span>
            <Link to="/problems">Problems</Link>
            <Link to="/contests">Contests</Link>
            <Link to="/calendar">Contest Calendar</Link>
          </div>
          <div className="app-footer-col">
            <span className="app-footer-heading">Account</span>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/submissions">Submissions</Link>
            <Link to="/login">Sign In</Link>
          </div>
        </nav>
      </div>

      <div className="app-footer-bottom">
        <span>© {new Date().getFullYear()} AlgoForge. Built by Varun Tuteja.</span>
        <span className="app-footer-meta">Judging by Judge0 · AI hints by Groq</span>
      </div>
    </footer>
  );
}
