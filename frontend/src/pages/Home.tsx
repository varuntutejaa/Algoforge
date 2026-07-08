import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { IconZap, IconTrophy, IconSparkle, IconFlame, IconCalendar, IconBarChart } from '@/components/ui/Icons';

const features = [
  { icon: IconZap, accent: 'blue', title: '150+ Problems', desc: 'NeetCode 150 curated problems — Arrays, Trees, Graphs, DP, and more.' },
  { icon: IconTrophy, accent: 'violet', title: 'Live Contests', desc: 'Create or join timed coding contests with a real-time leaderboard.' },
  { icon: IconSparkle, accent: 'sky', title: 'AI Hints', desc: 'Time-gated AI hints powered by Groq LLaMA — no spoilers, just a nudge.' },
  { icon: IconFlame, accent: 'rose', title: 'Daily Streaks', desc: 'Build consistency with a daily challenge. Track your streak.' },
  { icon: IconCalendar, accent: 'emerald', title: 'Contest Calendar', desc: 'Never miss a Codeforces, LeetCode, or CodeChef contest.' },
  { icon: IconBarChart, accent: 'indigo', title: 'Progress Dashboard', desc: 'Activity heatmap, difficulty breakdown, and acceptance rate.' },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="home-page">
      <div className="home-glow" aria-hidden="true" />

      <section className="hero">
        <div className="hero-badge">
          <IconSparkle className="hero-badge-icon" />
          <span>AI-powered practice platform</span>
        </div>

        <h1>
          Master Algorithms,<br />
          <span className="hero-accent">Forge Your Future</span>
        </h1>

        <p className="hero-sub">
          Practice 150+ curated problems, compete in live contests, and get AI-powered hints
          to level up your competitive programming skills.
        </p>

        <div className="hero-actions">
          {user ? (
            <Link to="/problems" className="hero-cta primary">Start Practicing</Link>
          ) : (
            <>
              <Link to="/signup" className="hero-cta primary">Get Started Free</Link>
              <Link to="/login" className="hero-cta secondary">Sign In</Link>
            </>
          )}
        </div>
      </section>

      <section className="features-section">
        <div className="features-heading">
          <span className="features-eyebrow">Everything you need</span>
          <h2>One platform to practice, compete, and improve</h2>
        </div>

        <div className="features-grid">
          {features.map(f => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="feature-card">
                <div className={`feature-icon accent-${f.accent}`}>
                  <Icon className="feature-icon-svg" />
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
