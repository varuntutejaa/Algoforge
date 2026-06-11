(function(){
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');

  const titleEl = document.getElementById('resultsTitle');
  const subtitleEl = document.getElementById('resultsSubtitle');
  const container = document.getElementById('leaderboardContainer');

  function escapeHtml(v){ return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function formatDuration(sec){
    if (sec == null) return '--';
    const hours = Math.floor(sec/3600);
    const mins = Math.floor((sec%3600)/60);
    const secs = sec%60;
    if (hours>0) return `${hours}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
    return `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  }

  if (!code) {
    if (container) container.innerHTML = '<p style="color:#f87171">No contest code provided.</p>';
    if (titleEl) titleEl.textContent = 'Contest Results';
    if (subtitleEl) subtitleEl.textContent = '';
    return;
  }

  async function load() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/contests/${encodeURIComponent(code)}`);
      const data = await res.json();
      if (!data.success) {
        container.innerHTML = `<p style="color:#f87171">${escapeHtml(data.message || 'Contest not found')}</p>`;
        return;
      }

      const contest = data.contest;
      if (titleEl) titleEl.textContent = `${escapeHtml(contest.title)} — Results`;
      if (subtitleEl) subtitleEl.textContent = `${escapeHtml(contest.code)} · ${escapeHtml(new Date(contest.startsAt).toLocaleString())} — ${escapeHtml(new Date(contest.endsAt).toLocaleString())}`;

      // load leaderboard
      const lbRes = await fetch(`${API_BASE_URL}/api/contests/${encodeURIComponent(code)}/leaderboard`);
      const lbData = await lbRes.json();
      if (!lbData.success) {
        if (container) container.innerHTML = `<p style="color:#f87171">Failed to load leaderboard.</p>`;
        return;
      }

      if (!Array.isArray(lbData.leaderboard) || lbData.leaderboard.length === 0) {
        if (container) container.innerHTML = '<p style="color:#64748b">No participants yet.</p>';
        return;
      }

      if (container) container.innerHTML = `
        <table class="leaderboard-table" style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="text-align:left;color:#94a3b8;font-weight:700;font-size:12px">
              <th style="padding:8px">Rank</th>
              <th style="padding:8px">Name</th>
              <th style="padding:8px">Score</th>
              <th style="padding:8px">Time Taken</th>
              <th style="padding:8px">Solved</th>
            </tr>
          </thead>
          <tbody>
            ${lbData.leaderboard.map((e)=>{
              return `
                <tr style="border-top:1px solid rgba(255,255,255,0.04);">
                  <td style="padding:10px;vertical-align:middle">${e.rank}</td>
                  <td style="padding:10px;vertical-align:middle">${escapeHtml(e.name)}</td>
                  <td style="padding:10px;vertical-align:middle">${e.score}</td>
                  <td style="padding:10px;vertical-align:middle">${e.timeTakenSeconds!=null?formatDuration(e.timeTakenSeconds):'--'}</td>
                  <td style="padding:10px;vertical-align:middle">${(e.solvedProblems||[]).length}/${contest.problemCount}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;

    } catch (err) {
      if (container) container.innerHTML = `<p style="color:#f87171">Error loading results: ${escapeHtml(err.message||String(err))}</p>`;
    }
  }

  load();
})();