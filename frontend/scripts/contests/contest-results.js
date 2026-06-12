(function () {
  initAppNav();

  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const page = document.getElementById('resultsPage');

  function escapeHtml(v) {
    return String(v)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

  function fmt(sec) {
    if (sec == null) return '--';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  function ordinal(n) {
    const s = ['th','st','nd','rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function scoreClass(score) {
    if (score > 0) return 'score-pos';
    if (score < 0) return 'score-neg';
    return 'score-zero';
  }

  function err(msg) {
    page.innerHTML = `<div class="results-error">${escapeHtml(msg)}</div>`;
  }

  if (!code) { err('No contest code provided.'); return; }

  async function load() {
    try {
      const [contestRes, lbRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/contests/${encodeURIComponent(code)}`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/api/contests/${encodeURIComponent(code)}/leaderboard`, { headers: getAuthHeaders() })
      ]);

      const contestData = await contestRes.json();
      const lbData = await lbRes.json();

      if (!contestData.success) { err(contestData.message || 'Contest not found'); return; }
      if (!lbData.success) { err('Failed to load leaderboard'); return; }

      const contest = contestData.contest;
      const lb = lbData.leaderboard || [];
      const problems = contest.problems || [];

      const user = typeof getAlgoforgeUser === 'function' ? getAlgoforgeUser() : null;
      const fuid = user?.firebaseUid || user?.uid;
      const myEntry = lb.find(e =>
        (fuid && e.firebaseUid && e.firebaseUid === fuid) ||
        e.name === user?.name || e.name === user?.email
      );

      const startedAt = new Date(contest.startsAt);
      const endedAt   = new Date(contest.endsAt);
      const duration  = Math.round((endedAt - startedAt) / 60000);

      // ── Hero ──
      const heroHtml = `
        <div class="results-hero">
          <a class="results-back" href="contests.html">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path d="M13 4l-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Back to Contests
          </a>
          <h1>${escapeHtml(contest.title)}</h1>
          <div class="results-meta-row">
            <span class="results-meta-item">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="7.5" stroke="#64748b" stroke-width="1.5"/>
                <path d="M10 6v4l3 2" stroke="#64748b" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              ${duration} min
            </span>
            <span class="results-meta-item">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <path d="M10 2a8 8 0 100 16A8 8 0 0010 2z" stroke="#64748b" stroke-width="1.5"/>
                <path d="M6 10h8M10 6v8" stroke="#64748b" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              ${lb.length} participant${lb.length !== 1 ? 's' : ''}
            </span>
            <span class="results-meta-item">
              ${startedAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span class="results-meta-item">
              ${problems.length} problem${problems.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      `;

      // ── My result banner ──
      let myBannerHtml = '';
      if (myEntry) {
        const mySolved = (myEntry.solvedProblems || []).length;
        const myScoreStr = myEntry.score > 0 ? `+${myEntry.score}` : `${myEntry.score}`;
        myBannerHtml = `
          <div class="my-result-banner">
            <div class="my-result-rank">${ordinal(myEntry.rank)}</div>
            <div class="my-result-info">
              <div class="my-result-name">Your Result</div>
              <div class="my-result-sub">${escapeHtml(myEntry.name)}</div>
            </div>
            <div class="my-result-stats">
              <div class="my-stat">
                <span class="my-stat-val good">${mySolved}/${problems.length}</span>
                <span class="my-stat-label">Solved</span>
              </div>
              <div class="my-stat">
                <span class="my-stat-val blue">${myScoreStr}</span>
                <span class="my-stat-label">Score</span>
              </div>
              ${myEntry.penalty < 0 ? `
              <div class="my-stat">
                <span class="my-stat-val bad">${myEntry.penalty}</span>
                <span class="my-stat-label">Penalty</span>
              </div>` : ''}
              ${myEntry.wrongAttempts > 0 ? `
              <div class="my-stat">
                <span class="my-stat-val bad">${myEntry.wrongAttempts}</span>
                <span class="my-stat-label">Wrong</span>
              </div>` : ''}
              ${myEntry.timeTakenSeconds != null ? `
              <div class="my-stat">
                <span class="my-stat-val blue">${fmt(myEntry.timeTakenSeconds)}</span>
                <span class="my-stat-label">Finish Time</span>
              </div>` : ''}
            </div>
          </div>
        `;
      }

      // ── Podium (top 3) ──
      const medals = ['🥇','🥈','🥉'];
      const podiumSlots = [lb[1], lb[0], lb[2]]; // visual order: 2nd left, 1st center, 3rd right
      const visualRanks = [2, 1, 3];
      let podiumHtml = '';
      if (lb.length > 0) {
        const slots = podiumSlots.map((entry, i) => {
          if (!entry) return `<div class="podium-slot rank-${visualRanks[i]}"></div>`;
          const solved = (entry.solvedProblems || []).length;
          const scoreStr = entry.score > 0 ? `+${entry.score}` : `${entry.score}`;
          return `
            <div class="podium-slot rank-${visualRanks[i]}">
              <div class="podium-card">
                <div class="podium-medal">${medals[visualRanks[i] - 1]}</div>
                <div class="podium-name">${escapeHtml(entry.name)}</div>
                <div class="podium-score">${scoreStr}</div>
                <div class="podium-solved">${solved}/${problems.length} solved</div>
              </div>
              <div class="podium-bar"></div>
            </div>
          `;
        }).join('');
        podiumHtml = `
          <div class="podium-section">
            <div class="section-label">Top Finishers</div>
            <div class="podium">${slots}</div>
          </div>
        `;
      }

      // ── Problem header columns ──
      const probHeaders = problems.map((p, i) =>
        `<th class="center">P${i + 1}<br><span style="font-size:10px;font-weight:500;text-transform:none;letter-spacing:0">${escapeHtml(p.title.length > 12 ? p.title.slice(0, 12) + '…' : p.title)}</span></th>`
      ).join('');

      // ── Table rows ──
      const rows = lb.map(entry => {
        const isMe = entry === myEntry;
        const solvedSet = new Set(entry.solvedProblems || []);
        const rankClass = entry.rank === 1 ? 'r1' : entry.rank === 2 ? 'r2' : entry.rank === 3 ? 'r3' : '';

        const probCells = problems.map(p => {
          if (solvedSet.has(p.problemId)) {
            const t = entry.perProblemTimes?.[p.problemId];
            return `
              <td class="td-prob center">
                <div class="prob-cell-solved">
                  <span class="prob-check">✓</span>
                  ${t != null ? `<span class="prob-time">${fmt(t)}</span>` : ''}
                </div>
              </td>`;
          }
          return `<td class="td-prob center"><span class="prob-unsolved">—</span></td>`;
        }).join('');

        const scoreStr = entry.score > 0 ? `+${entry.score}` : `${entry.score}`;

        return `
          <tr class="${isMe ? 'is-me' : ''}">
            <td class="td-rank ${rankClass}">${entry.rank}</td>
            <td class="td-name">
              ${escapeHtml(entry.name)}
              ${isMe ? '<span class="me-badge">You</span>' : ''}
            </td>
            ${probCells}
            <td class="td-score ${scoreClass(entry.score)}">${scoreStr}</td>
            <td class="td-penalty ${entry.penalty === 0 ? 'none' : ''}">${entry.penalty < 0 ? entry.penalty : '—'}</td>
            <td class="td-wrong ${entry.wrongAttempts > 0 ? 'has-wrong' : ''}">${entry.wrongAttempts > 0 ? entry.wrongAttempts : '—'}</td>
            <td class="td-time">${entry.timeTakenSeconds != null ? fmt(entry.timeTakenSeconds) : '—'}</td>
          </tr>`;
      }).join('');

      const tableHtml = lb.length === 0
        ? `<div class="lb-empty">No participants yet.</div>`
        : `
          <div class="lb-section">
            <table class="lb-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  ${probHeaders}
                  <th>Score</th>
                  <th>Penalty</th>
                  <th>Wrong</th>
                  <th>Finish</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>`;

      page.innerHTML = heroHtml + myBannerHtml + podiumHtml
        + `<div class="section-label" style="margin-bottom:16px">Full Standings</div>`
        + tableHtml;

    } catch (e) {
      err('Failed to load results: ' + (e.message || String(e)));
    }
  }

  load();
})();
