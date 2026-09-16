import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  IconBarChart,
  IconBulb,
  IconCalendar,
  IconCheck,
  IconFlame,
  IconPlay,
  IconSend,
  IconSparkle,
  IconTrophy,
  IconZap,
} from '@/components/ui/Icons';

const platformStats = [
  { value: '150+', label: 'curated problems' },
  { value: '5', label: 'language runners' },
  { value: '3', label: 'timed AI hints' },
  { value: '24/7', label: 'contest calendar' },
];

const problemRows = [
  { title: 'Longest Consecutive Sequence', topic: 'Arrays', difficulty: 'Medium', solved: true },
  { title: 'Binary Tree Level Order', topic: 'Trees', difficulty: 'Medium', solved: true },
  { title: 'Network Delay Time', topic: 'Graphs', difficulty: 'Hard', solved: false },
  { title: 'House Robber II', topic: 'Dynamic Programming', difficulty: 'Medium', solved: false },
];

const editorDemos = [
  {
    path: '/editor/number-of-islands',
    language: 'C++ solution',
    status: 'Accepted',
    tests: '34 / 34 tests',
    runtime: '84 ms',
    memory: '18.2 MB',
    code: `queue<pair<int,int>> q;
q.push({r, c});
grid[r][c] = '0';

while (!q.empty()) {
  auto [row, col] = q.front();
  q.pop();

  for (auto [dr, dc] : DIRS) {
    flood(row + dr, col + dc, q);
  }
}`,
  },
  {
    path: '/editor/longest-substring-without-repeating-characters',
    language: 'Python solution',
    status: 'Running',
    tests: '18 / 21 tests',
    runtime: 'checking',
    memory: 'pending',
    code: `left = 0
seen = {}
best = 0

for right, char in enumerate(s):
    if char in seen and seen[char] >= left:
        left = seen[char] + 1

    seen[char] = right
    best = max(best, right - left + 1)`,
  },
  {
    path: '/editor/course-schedule',
    language: 'JavaScript solution',
    status: 'Accepted',
    tests: '46 / 46 tests',
    runtime: '71 ms',
    memory: '51.4 MB',
    code: `const queue = indegree
  .map((deg, node) => deg === 0 ? node : -1)
  .filter(node => node !== -1);

while (queue.length) {
  const course = queue.shift();
  completed++;

  for (const next of graph[course]) {
    if (--indegree[next] === 0) queue.push(next);
  }
}`,
  },
];

const workflows = [
  {
    icon: IconZap,
    eyebrow: 'Practice',
    title: 'A serious problem workspace, not a toy editor',
    copy: 'Curated DSA tracks, persisted solution slots, Monaco editing, and judged runs give learners the same rhythm they use in interviews and contests.',
  },
  {
    icon: IconSparkle,
    eyebrow: 'AI Review',
    title: 'Guidance arrives after effort',
    copy: 'Hints unlock over time, and code review opens after acceptance so AI supports thinking instead of replacing it.',
  },
  {
    icon: IconTrophy,
    eyebrow: 'Competition',
    title: 'Contests with the operational pieces already there',
    copy: 'Timed rooms, invite codes, submissions, results, and leaderboard views make AlgoForge useful for classrooms, clubs, and teams.',
  },
];

const capabilityBlocks = [
  { icon: IconCalendar, title: 'Contest calendar', copy: 'Track Codeforces, LeetCode, CodeChef, and your own events in one planning surface.' },
  { icon: IconBarChart, title: 'Progress analytics', copy: 'Heatmaps, streaks, acceptance rate, and difficulty distribution keep improvement measurable.' },
  { icon: IconFlame, title: 'Daily momentum', copy: 'Daily practice and streak feedback help users build a habit without overwhelming them.' },
  { icon: IconSend, title: 'GitHub sync', copy: 'Accepted solutions can be pushed into a connected repository as a long-term portfolio.' },
];

export default function Home() {
  const { user } = useAuth();
  const [editorDemoIndex, setEditorDemoIndex] = useState(0);
  const primaryHref = user ? '/problems' : '/signup';
  const primaryLabel = user ? 'Open problem set' : 'Start practicing free';
  const activeEditorDemo = editorDemos[editorDemoIndex];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setEditorDemoIndex((index) => (index + 1) % editorDemos.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero-content">
          <div className="home-kicker">
            <IconSparkle aria-hidden="true" />
            <span>Production-grade algorithm practice</span>
          </div>

          <h1>Train like interviews, contests, and real engineering all matter.</h1>

          <p className="home-hero-copy">
            AlgoForge brings judged coding practice, AI-assisted learning, live contests,
            progress analytics, and calendar planning into one focused platform.
          </p>

          <div className="home-actions" aria-label="Primary actions">
            <Link to={primaryHref} className="home-btn home-btn-primary">
              <IconPlay aria-hidden="true" />
              <span>{primaryLabel}</span>
            </Link>
            <Link to="/contests" className="home-btn home-btn-secondary">
              <IconTrophy aria-hidden="true" />
              <span>Explore contests</span>
            </Link>
          </div>

          <dl className="home-stats" aria-label="Platform highlights">
            {platformStats.map((stat) => (
              <div key={stat.label}>
                <dt>{stat.value}</dt>
                <dd>{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="home-product-visual" aria-label="AlgoForge product preview">
          <div className="product-frame">
            <div className="product-topbar">
              <div className="product-window-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <span className="product-path">{activeEditorDemo.path}</span>
              <span className="product-live">Live judge</span>
            </div>

            <div className="product-grid">
              <section className="product-panel product-problems" aria-label="Problem queue preview">
                <div className="product-panel-head">
                  <span>Problem queue</span>
                  <strong>47%</strong>
                </div>
                <div className="problem-list-preview">
                  {problemRows.map((row) => (
                    <div key={row.title} className="problem-preview-row">
                      <span className={row.solved ? 'problem-status solved' : 'problem-status'} aria-hidden="true">
                        {row.solved ? <IconCheck /> : null}
                      </span>
                      <div>
                        <strong>{row.title}</strong>
                        <span>{row.topic}</span>
                      </div>
                      <em className={`difficulty-${row.difficulty.toLowerCase()}`}>{row.difficulty}</em>
                    </div>
                  ))}
                </div>
              </section>

              <section className="product-panel product-editor" aria-label="Editor preview">
                <div className="product-panel-head">
                  <span>{activeEditorDemo.language}</span>
                  <strong className={activeEditorDemo.status === 'Running' ? 'status-running' : ''}>
                    {activeEditorDemo.status}
                  </strong>
                </div>
                <pre key={activeEditorDemo.path}>
                  <code>{activeEditorDemo.code}</code>
                  <span className="editor-cursor" aria-hidden="true" />
                </pre>
                <div className="judge-strip">
                  <span><IconCheck /> {activeEditorDemo.tests}</span>
                  <span>Runtime {activeEditorDemo.runtime}</span>
                  <span>Memory {activeEditorDemo.memory}</span>
                </div>
                <div className="editor-demo-tabs" aria-label="Editor preview rotation">
                  {editorDemos.map((demo, index) => (
                    <button
                      key={demo.path}
                      type="button"
                      aria-label={`Show ${demo.language}`}
                      aria-pressed={index === editorDemoIndex}
                      className={index === editorDemoIndex ? 'active' : ''}
                      onClick={() => setEditorDemoIndex(index)}
                    />
                  ))}
                </div>
              </section>

              <section className="product-panel product-ai" aria-label="AI review preview">
                <div className="product-panel-head">
                  <span>AI review</span>
                  <strong>Unlocked</strong>
                </div>
                <div className="review-lines">
                  <span />
                  <span />
                  <span />
                </div>
                <p>Time complexity is optimal for a sparse graph. Consider naming the relaxation helper around intent rather than mechanics.</p>
              </section>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section home-workflows" aria-labelledby="workflow-heading">
        <div className="section-heading">
          <span>Built for repeat use</span>
          <h2 id="workflow-heading">The core loops users come back to every day</h2>
        </div>

        <div className="workflow-grid">
          {workflows.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="workflow-card">
                <div className="workflow-icon"><Icon aria-hidden="true" /></div>
                <span>{item.eyebrow}</span>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="home-section home-operating-system" aria-labelledby="ops-heading">
        <div className="ops-copy">
          <span className="section-eyebrow">One operating system</span>
          <h2 id="ops-heading">From daily reps to organized competition</h2>
          <p>
            A platform for millions needs more than a landing page. AlgoForge already connects
            the high-frequency parts of technical growth: practice, accountability, judging,
            review, contests, and long-term history.
          </p>
          <Link to="/problems" className="home-inline-link">Browse the problem set</Link>
        </div>

        <div className="ops-board" aria-label="Platform capabilities">
          {capabilityBlocks.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="ops-item">
                <Icon aria-hidden="true" />
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="home-final-cta" aria-labelledby="final-cta-heading">
        <div>
          <span>Ready when the user is</span>
          <h2 id="final-cta-heading">Ship the practice environment learners deserve.</h2>
        </div>
        <Link to={primaryHref} className="home-btn home-btn-primary">
          <IconBulb aria-hidden="true" />
          <span>{primaryLabel}</span>
        </Link>
      </section>
    </main>
  );
}
