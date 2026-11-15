import { useEffect, useRef, useState, type ComponentType } from 'react';

/**
 * The left side of the sign-in and sign-up screens: what AlgoForge does, shown
 * as small live demos rather than described. Rotates on its own, pauses while
 * the pointer is over it, and any feature can be picked directly.
 */

const FEATURES = [
  { id: 'judge', label: 'Judge', title: 'Run against real test cases', copy: 'Write in C++, Python, Java, JavaScript or C. Every submission is judged, timed and measured.' },
  { id: 'hints', label: 'AI hints', title: 'Hints that unlock as you work', copy: 'Stuck? Hints open over time, and an AI code review opens after you solve it, so you learn instead of copying.' },
  { id: 'contests', label: 'Contests', title: 'Live contests with friends', copy: 'Create a timed room, share the code, and watch the leaderboard move with every accepted solution.' },
  { id: 'calendar', label: 'Calendar', title: 'Every contest in one place', copy: 'LeetCode, Codeforces, CodeChef and AtCoder rounds alongside your own, so you never miss one.' },
  { id: 'github', label: 'GitHub', title: 'Accepted means committed', copy: 'Connect GitHub and each accepted solution is pushed to your repository, building a portfolio as you practise.' },
] as const;

type FeatureId = typeof FEATURES[number]['id'];
const ROTATE_MS = 6500;

function JudgeDemo() {
  const code = [
    ['kw', 'def '], ['fn', 'twoSum'], ['', '(nums, target):'],
    null,
    ['', '    seen = {}'],
    null,
    ['kw', '    for '], ['', 'i, x '], ['kw', 'in '], ['fn', 'enumerate'], ['', '(nums):'],
    null,
    ['kw', '        if '], ['', 'target - x '], ['kw', 'in '], ['', 'seen:'],
    null,
    ['kw', '            return '], ['', '[seen[target - x], i]'],
    null,
    ['', '        seen[x] = i'],
  ] as const;
  // Group the flat token list into lines.
  const lines: Array<Array<readonly [string, string]>> = [[]];
  for (const t of code) { if (t === null) lines.push([]); else lines[lines.length - 1].push(t); }
  const tests = ['[2,7,11,15], 9', '[3,2,4], 6', '[3,3], 6', '[1,5,9,13], 22'];

  return (
    <div className="sc-judge">
      <div className="sc-window">
        <div className="sc-window-bar"><span /><span /><span /><em>two-sum.py</em></div>
        <pre className="sc-code">
          {lines.map((line, i) => (
            <div key={i} className="sc-code-line" style={{ animationDelay: `${i * 0.18}s` }}>
              <span className="sc-ln">{i + 1}</span>
              {line.map(([cls, text], j) => <span key={j} className={cls ? `sc-${cls}` : undefined}>{text}</span>)}
            </div>
          ))}
        </pre>
      </div>
      <div className="sc-tests">
        {tests.map((t, i) => (
          <div key={t} className="sc-test" style={{ animationDelay: `${1.5 + i * 0.45}s` }}>
            <span className="sc-test-dot" />
            <code>{t}</code>
            <span className="sc-test-time">{[12, 9, 8, 11][i]} ms</span>
          </div>
        ))}
        <div className="sc-verdict" style={{ animationDelay: '3.4s' }}>
          <strong>Accepted</strong><span>4 / 4 tests · 12 ms · 14.1 MB</span>
        </div>
      </div>
    </div>
  );
}

function HintsDemo() {
  const hints = [
    { at: 240, text: 'A hash map can tell you in O(1) whether you have already seen the complement.' },
    { at: 540, text: 'Store each value’s index as you go, then look up target − x before inserting x.' },
    { at: 840, text: 'One pass is enough: check, return if found, otherwise record and continue.' },
  ];
  // A fast-forwarded clock: about ten minutes of "time on problem" in five seconds.
  const [elapsed, setElapsed] = useState(200);
  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => (e >= 700 ? e : e + 12)), 100);
    return () => clearInterval(t);
  }, []);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const next = hints.find((h) => h.at > elapsed);
  const prev = [...hints].reverse().find((h) => h.at <= elapsed)?.at ?? 0;
  const progress = next ? (elapsed - prev) / (next.at - prev) : 1;

  return (
    <div className="sc-hints">
      <div className="sc-timer">
        <svg viewBox="0 0 44 44" aria-hidden="true">
          <circle cx="22" cy="22" r="19" className="sc-timer-track" />
          <circle cx="22" cy="22" r="19" className="sc-timer-fill" style={{ strokeDashoffset: 119.4 * (1 - progress) }} />
        </svg>
        <div>
          <strong>{fmt(elapsed)} on this problem</strong>
          <span>{next ? `Next hint at ${fmt(next.at)}` : 'All hints unlocked'}</span>
        </div>
      </div>
      {hints.map((h, i) => {
        const open = elapsed >= h.at;
        return (
          <div key={h.at} className={`sc-hint${open ? ' unlocked' : ''}`}>
            <span className="sc-hint-icon" aria-hidden="true">
              {open
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" /></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>}
            </span>
            <div className="sc-hint-body">
              <strong>Hint {i + 1}</strong>
              {open ? <p className="sc-hint-text">{h.text}</p> : <p className="sc-hint-locked">Unlocks at {fmt(h.at)}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const RACERS = [
  { name: 'Ananya', hue: 280 },
  { name: 'Rohan', hue: 200 },
  { name: 'You', hue: 24 },
  { name: 'Meera', hue: 150 },
  { name: 'Kabir', hue: 340 },
];

function ContestsDemo() {
  const [scores, setScores] = useState([300, 200, 200, 100, 0]);
  const [secs, setSecs] = useState(42 * 60 + 18);

  useEffect(() => {
    const solve = setInterval(() => {
      setScores((s) => {
        const next = [...s];
        // "You" climb more often, so the demo has a story.
        const who = Math.random() < 0.45 ? 2 : Math.floor(Math.random() * next.length);
        next[who] = Math.min(next[who] + 100, 500);
        return next;
      });
    }, 1300);
    const tick = setInterval(() => setSecs((t) => Math.max(t - 1, 0)), 1000);
    return () => { clearInterval(solve); clearInterval(tick); };
  }, []);

  const order = RACERS.map((r, i) => ({ ...r, score: scores[i], i }))
    .sort((a, b) => b.score - a.score || a.i - b.i);
  const rankOf = new Map(order.map((r, rank) => [r.i, rank]));
  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');

  return (
    <div className="sc-contest">
      <div className="sc-contest-head">
        <div><strong>Friday Night DSA</strong><span>Code <code>X7K2QP</code></span></div>
        <span className="sc-live"><i />Live · {mm}:{ss}</span>
      </div>
      <div className="sc-board" style={{ height: RACERS.length * 52 }}>
        {RACERS.map((r, i) => {
          const rank = rankOf.get(i) ?? i;
          return (
            <div key={r.name} className={`sc-row${r.name === 'You' ? ' sc-row-you' : ''}`} style={{ transform: `translateY(${rank * 52}px)` }}>
              <span className="sc-rank">{rank + 1}</span>
              <span className="sc-avatar" style={{ background: `hsl(${r.hue} 55% 42%)` }}>{r.name[0]}</span>
              <span className="sc-name">{r.name}</span>
              <span className="sc-bar"><span style={{ width: `${(scores[i] / 500) * 100}%` }} /></span>
              <span className="sc-score">{scores[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CalendarDemo() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const events = [
    { day: 1, top: 18, label: 'Codeforces Div. 2', cls: 'cf' },
    { day: 2, top: 58, label: 'Your contest', cls: 'af' },
    { day: 3, top: 30, label: 'CodeChef Starters', cls: 'cc' },
    { day: 5, top: 10, label: 'AtCoder ABC', cls: 'ac' },
    { day: 5, top: 62, label: 'LeetCode Weekly', cls: 'lc' },
    { day: 6, top: 40, label: 'LeetCode Biweekly', cls: 'lc' },
  ];
  return (
    <div className="sc-calendar">
      {days.map((d, i) => (
        <div key={d} className="sc-day">
          <span className="sc-day-name">{d}</span>
          <span className={`sc-day-num${i === 4 ? ' today' : ''}`}>{17 + i}</span>
          <div className="sc-day-col">
            {events.filter((e) => e.day === i).map((e, j) => (
              <span key={e.label} className={`sc-event sc-event-${e.cls}`}
                style={{ top: `${e.top}%`, animationDelay: `${0.25 + (i + j) * 0.18}s` }}>
                {e.label}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function GithubDemo() {
  // A deterministic "contribution graph" that fills in left to right.
  const cells = Array.from({ length: 7 * 30 }, (_, i) => ((i * 37 + 11) % 9));
  return (
    <div className="sc-github">
      <div className="sc-push">
        <div className="sc-push-card">
          <span className="sc-pill sc-pill-ok">Accepted</span>
          <strong>Two Sum</strong>
          <span>Python · 12 ms</span>
        </div>
        <div className="sc-push-arrow" aria-hidden="true"><span /></div>
        <div className="sc-push-card sc-commit">
          <span className="sc-pill">commit a1f9e2c</span>
          <strong>Add Two Sum (Easy)</strong>
          <span>easy/two-sum/solution.py</span>
        </div>
      </div>
      <div className="sc-graph" aria-hidden="true">
        {cells.map((v, i) => (
          <span key={i} className={`sc-cell sc-l${v > 6 ? 3 : v > 4 ? 2 : v > 2 ? 1 : 0}`}
            style={{ animationDelay: `${0.8 + Math.floor(i / 7) * 0.045}s` }} />
        ))}
      </div>
    </div>
  );
}

const DEMOS: Record<FeatureId, ComponentType> = {
  judge: JudgeDemo,
  hints: HintsDemo,
  contests: ContestsDemo,
  calendar: CalendarDemo,
  github: GithubDemo,
};

export default function AuthShowcase() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [cycle, setCycle] = useState(0);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (paused || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const t = setTimeout(() => setActive((a) => (a + 1) % FEATURES.length), ROTATE_MS);
    return () => clearTimeout(t);
  }, [active, paused, cycle]);

  // A soft spotlight follows the pointer across the panel.
  function onPointerMove(e: React.PointerEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  }

  function pick(i: number) {
    setActive(i);
    setCycle((c) => c + 1); // restart the rotation timer and the demo
  }

  const feature = FEATURES[active];
  const Demo = DEMOS[feature.id];

  return (
    <section
      ref={ref}
      className="auth-showcase"
      aria-label="What AlgoForge does"
      onPointerMove={onPointerMove}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <div className="sc-glow" aria-hidden="true" />
      <div className="sc-inner">
        <p className="sc-kicker">Algorithm practice, end to end</p>
        <h2 className="sc-headline">Practise. Compete. <span>Ship your solutions.</span></h2>

        <div className="sc-tabs" role="tablist" aria-label="Features">
          {FEATURES.map((f, i) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              id={`sc-tab-${f.id}`}
              aria-selected={i === active}
              aria-controls="sc-stage"
              className={`sc-tab${i === active ? ' active' : ''}`}
              onClick={() => pick(i)}
            >
              {f.label}
              {i === active && (
                <span key={`${active}-${cycle}`} className={`sc-tab-progress${paused ? ' paused' : ''}`} style={{ animationDuration: `${ROTATE_MS}ms` }} />
              )}
            </button>
          ))}
        </div>

        <div className="sc-stage" id="sc-stage" role="tabpanel" aria-labelledby={`sc-tab-${feature.id}`}>
          <div className="sc-copy" key={`copy-${feature.id}`}>
            <h3>{feature.title}</h3>
            <p>{feature.copy}</p>
          </div>
          <div className="sc-demo" key={`demo-${feature.id}-${cycle}`} aria-hidden="true">
            <Demo />
          </div>
        </div>
      </div>
    </section>
  );
}
