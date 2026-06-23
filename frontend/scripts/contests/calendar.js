(function () {
  initAppNav();

  const DAYS  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const CF_LOGO = `<img src="https://codeforces.com/favicon-32x32.png" class="cf-logo-icon" alt="CF" onerror="this.style.display='none'">`;
  const LC_LOGO = `<img src="https://leetcode.com/favicon-192x192.png" class="cf-logo-icon lc-logo-icon" alt="LC" onerror="this.style.display='none'">`;
  const CC_LOGO = `<img src="https://www.codechef.com/favicon.ico" class="cf-logo-icon cc-logo-icon" alt="CC" onerror="this.style.display='none'">`;

  let view = 'month';
  let cursor = new Date();
  let miniCursor = new Date();
  let allContests = [];
  let selectedDate = new Date();
  const activePlatforms = new Set(['algoforge', 'codeforces', 'leetcode', 'codechef']);

  function visibleContests() {
    return allContests.filter(c => activePlatforms.has(c.source || 'algoforge'));
  }

  // ---- Skeleton ----
  function renderSkeleton() {
    // Month grid skeleton: 35 cells, some with fake chips
    const chipDays = new Set([3, 7, 10, 14, 18, 21, 25, 28]);
    let cells = '';
    for (let i = 0; i < 35; i++) {
      const hasChip  = chipDays.has(i);
      const hasChip2 = i === 14 || i === 21;
      cells += `<div class="month-cell sk-cell">
        <span class="sk-block sk-day-num"></span>
        ${hasChip  ? '<div class="sk-block sk-chip"></div>' : ''}
        ${hasChip2 ? '<div class="sk-block sk-chip sk-chip-2"></div>' : ''}
      </div>`;
    }
    document.getElementById('monthGrid').innerHTML = cells;

    // Upcoming sidebar skeleton
    let items = '';
    for (let i = 0; i < 5; i++)
      items += `<div class="sk-upcoming-item">
        <span class="sk-block sk-bar"></span>
        <div class="sk-upcoming-body">
          <span class="sk-block sk-title" style="width:${60 + (i % 3) * 15}%"></span>
          <span class="sk-block sk-meta"></span>
        </div>
      </div>`;
    document.getElementById('upcomingList').innerHTML = items;
  }

  function rerenderAll() {
    render();
    renderMiniCal();
    renderUpcoming();
  }

  // ---- Fetch ----
  async function fetchContests() {
    // 1. Load AlgoForge contests first and render immediately
    try {
      const headers = window.getAuthHeaders ? window.getAuthHeaders() : {};
      const [r1, r2] = await Promise.all([
        fetch(`${API_BASE_URL}/api/contests/available`, { headers }),
        fetch(`${API_BASE_URL}/api/contests`, { headers })
      ]);
      const [d1, d2] = await Promise.all([r1.json(), r2.json()]);
      const seen = new Set();
      const merged = [];
      for (const c of [...(d1.contests || []), ...(d2.contests || [])]) {
        if (!seen.has(c.code)) { seen.add(c.code); merged.push({ ...c, source: 'algoforge' }); }
      }
      allContests = merged;
    } catch {}
    rerenderAll();

    // 2. Load all external sources in parallel — render each as it arrives
    const externalFetches = [
      fetchCodeforcesContests().then(rerenderAll),
      fetchLeetCodeContests().then(rerenderAll),
      fetchCodeChefContests().then(rerenderAll),
    ];
    await Promise.allSettled(externalFetches);
  }

  async function fetchCodeforcesContests() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/codeforces-contests`);
      const data = await res.json();
      const existing = new Set(allContests.map(c => c.code));
      (data.contests || []).forEach(c => {
        const code = `cf-${c.id}`;
        if (existing.has(code)) return;
        existing.add(code);
        const startMs = c.startTimeSeconds * 1000;
        const endMs   = startMs + c.durationSeconds * 1000;
        allContests.push({
          source: 'codeforces',
          code,
          cfId: c.id,
          title: c.name,
          description: `${c.type} · ${Math.round(c.durationSeconds / 60)} min`,
          startsAt: new Date(startMs).toISOString(),
          endsAt:   new Date(endMs).toISOString(),
          problemCount: '—',
          participantCount: '—',
          createdByName: 'Codeforces',
        });
      });
    } catch {}
  }

  async function fetchLeetCodeContests() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/leetcode-contests`);
      const data = await res.json();
      const now = Date.now();
      const existing = new Set(allContests.map(c => c.code));
      (data.contests || []).forEach(c => {
        const code = `lc-${c.titleSlug}`;
        if (existing.has(code)) return;
        existing.add(code);
        const startMs = c.startTime * 1000;
        const endMs   = startMs + c.duration * 1000;
        const durMins = Math.round(c.duration / 60);
        allContests.push({
          source: 'leetcode',
          code,
          lcSlug: c.titleSlug,
          title: c.title,
          description: `${durMins} min · LeetCode`,
          startsAt: new Date(startMs).toISOString(),
          endsAt:   new Date(endMs).toISOString(),
          problemCount: 4,
          participantCount: '—',
          createdByName: 'LeetCode',
        });
      });
    } catch {}
  }

  async function fetchCodeChefContests() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/codechef-contests`);
      const data = await res.json();
      const existing = new Set(allContests.map(c => c.code));
      (data.contests || []).forEach(c => {
        const code = `cc-${c.code}`;
        if (existing.has(code)) return;
        existing.add(code);
        const startMs = new Date(c.startTime).getTime();
        const endMs   = new Date(c.endTime).getTime();
        allContests.push({
          source: 'codechef',
          code,
          ccCode: c.code,
          title: c.name,
          description: `${c.durationMins} min · CodeChef`,
          startsAt: new Date(startMs).toISOString(),
          endsAt:   new Date(endMs).toISOString(),
          problemCount: '—',
          participantCount: '—',
          createdByName: 'CodeChef',
        });
      });
    } catch {}
  }

  // ---- Helpers ----
  function esc(v) {
    return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function getStatus(c) {
    const now = Date.now(), s = new Date(c.startsAt).getTime(), e = new Date(c.endsAt).getTime();
    if (now >= s && now < e) return 'active';
    if (now >= e) return 'ended';
    return 'upcoming';
  }

  function isCf(c) { return c.source === 'codeforces'; }
  function isLc(c) { return c.source === 'leetcode'; }
  function isCc(c) { return c.source === 'codechef'; }
  function srcCls(c) { return isCf(c) ? ' cf' : isLc(c) ? ' lc' : isCc(c) ? ' cc' : ''; }
  function srcLogo(c) { return isCf(c) ? CF_LOGO : isLc(c) ? LC_LOGO : isCc(c) ? CC_LOGO : ''; }

  function fmtTime(d) { return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  function fmtDate(d) { return new Date(d).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }); }

  function contestsOnDay(y, m, d) {
    return visibleContests().filter(c => {
      const s = new Date(c.startsAt);
      return s.getFullYear() === y && s.getMonth() === m && s.getDate() === d;
    }).sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  }

  function isToday(y, m, d) {
    const t = new Date();
    return t.getFullYear() === y && t.getMonth() === m && t.getDate() === d;
  }

  function isSelectedDay(y, m, d) {
    return selectedDate && selectedDate.getFullYear() === y && selectedDate.getMonth() === m && selectedDate.getDate() === d;
  }

  function buildTimeCol(containerId) {
    document.getElementById(containerId).innerHTML = Array.from({ length: 24 }, (_, h) => {
      const label = h === 0 ? '' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
      return `<div class="week-time-slot"><span class="week-time-label">${label}</span></div>`;
    }).join('');
  }

  // ---- Switch to Day view helper ----
  function switchToDay(y, m, d) {
    selectedDate = new Date(y, m, d);
    cursor = new Date(y, m, d);
    miniCursor = new Date(y, m, 1);
    view = 'day';
    document.querySelectorAll('.view-btn').forEach(b => b.classList.toggle('active', b.dataset.view === 'day'));
    render();
    renderMiniCal();
  }

  // ---- Mini Calendar ----
  function renderMiniCal() {
    document.getElementById('miniMonthLabel').textContent =
      MONTHS[miniCursor.getMonth()].slice(0, 3) + ' ' + miniCursor.getFullYear();

    const y = miniCursor.getFullYear(), mo = miniCursor.getMonth();
    const firstDay = new Date(y, mo, 1).getDay();
    const daysInMonth = new Date(y, mo + 1, 0).getDate();
    const prevDays = new Date(y, mo, 0).getDate();
    let html = '';

    for (let i = firstDay - 1; i >= 0; i--)
      html += `<span class="mini-cell other-month">${prevDays - i}</span>`;

    for (let d = 1; d <= daysInMonth; d++) {
      const hasCon = contestsOnDay(y, mo, d).length > 0;
      const cls = ['mini-cell',
        isToday(y, mo, d) ? 'today' : '',
        isSelectedDay(y, mo, d) ? 'selected' : '',
        hasCon ? 'has-event' : ''
      ].filter(Boolean).join(' ');
      html += `<span class="${cls}" data-y="${y}" data-m="${mo}" data-d="${d}">${d}</span>`;
    }

    const total = firstDay + daysInMonth;
    const tail = total % 7 === 0 ? 0 : 7 - (total % 7);
    for (let d = 1; d <= tail; d++)
      html += `<span class="mini-cell other-month">${d}</span>`;

    document.getElementById('miniGrid').innerHTML = html;
    document.querySelectorAll('#miniGrid .mini-cell:not(.other-month)').forEach(cell => {
      cell.addEventListener('click', () => {
        switchToDay(parseInt(cell.dataset.y), parseInt(cell.dataset.m), parseInt(cell.dataset.d));
      });
    });
  }

  // ---- Sidebar Upcoming ----
  function renderUpcoming() {
    const now = Date.now();
    const upcoming = visibleContests()
      .filter(c => new Date(c.endsAt).getTime() > now)
      .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
      .slice(0, 12);

    const container = document.getElementById('upcomingList');
    if (!upcoming.length) { container.innerHTML = '<p class="sidebar-empty">No upcoming contests.</p>'; return; }

    container.innerHTML = upcoming.map(c => {
      const status = getStatus(c);
      const timeStr = fmtTime(c.startsAt);
      const dateStr = new Date(c.startsAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
      return `<div class="sidebar-upcoming-item" data-code="${esc(c.code)}">
        <div class="sui-bar ${status}${srcCls(c)}"></div>
        <div class="sui-info">
          <div class="sui-title">${srcLogo(c)}${esc(c.title)}</div>
          <div class="sui-meta">${dateStr} · ${timeStr}</div>
        </div>
      </div>`;
    }).join('');

    container.querySelectorAll('.sidebar-upcoming-item').forEach(el => {
      el.addEventListener('click', () => {
        const c = allContests.find(x => x.code === el.dataset.code);
        if (c) openEventPanel(c);
      });
    });
  }

  // ---- Month View ----
  function renderMonthView() {
    const y = cursor.getFullYear(), mo = cursor.getMonth();
    document.getElementById('calTitle').textContent = `${MONTHS[mo]} ${y}`;

    const firstDay = new Date(y, mo, 1).getDay();
    const daysInMonth = new Date(y, mo + 1, 0).getDate();
    const prevDays = new Date(y, mo, 0).getDate();
    const MAX = 3;
    let html = '';

    for (let i = firstDay - 1; i >= 0; i--)
      html += `<div class="month-cell other-month"><span class="month-day-num">${prevDays - i}</span></div>`;

    for (let d = 1; d <= daysInMonth; d++) {
      const contests = contestsOnDay(y, mo, d);
      const visible  = contests.slice(0, MAX);
      const overflow = contests.length - MAX;

      const chips = visible.map(c => {
        const status = getStatus(c);
        return `<div class="event-chip ${status}${srcCls(c)}" data-code="${esc(c.code)}">
          ${srcLogo(c)}
          <span class="event-chip-time">${fmtTime(c.startsAt)}</span>
          <span class="event-chip-label">${esc(c.title)}</span>
        </div>`;
      }).join('');

      const moreBtn = overflow > 0
        ? `<div class="more-events" data-y="${y}" data-m="${mo}" data-d="${d}">+${overflow} more</div>` : '';

      const todayCls = isToday(y, mo, d) ? ' today' : '';
      const selCls   = isSelectedDay(y, mo, d) ? ' selected' : '';
      html += `<div class="month-cell${todayCls}${selCls}" data-y="${y}" data-m="${mo}" data-d="${d}">
        <span class="month-day-num">${d}</span>
        ${chips}${moreBtn}
      </div>`;
    }

    const total = firstDay + daysInMonth;
    const tail = total % 7 === 0 ? 0 : 7 - (total % 7);
    for (let d = 1; d <= tail; d++)
      html += `<div class="month-cell other-month"><span class="month-day-num">${d}</span></div>`;

    const grid = document.getElementById('monthGrid');
    grid.innerHTML = html;

    // click day → open day view
    grid.querySelectorAll('.month-cell:not(.other-month)').forEach(cell => {
      cell.addEventListener('click', e => {
        if (e.target.closest('.event-chip') || e.target.closest('.more-events')) return;
        switchToDay(parseInt(cell.dataset.y), parseInt(cell.dataset.m), parseInt(cell.dataset.d));
      });
    });

    grid.querySelectorAll('.event-chip').forEach(chip => {
      chip.addEventListener('click', e => {
        e.stopPropagation();
        const c = allContests.find(x => x.code === chip.dataset.code);
        if (c) openEventPanel(c);
      });
    });

    // +more → open day view
    grid.querySelectorAll('.more-events').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        switchToDay(parseInt(btn.dataset.y), parseInt(btn.dataset.m), parseInt(btn.dataset.d));
      });
    });
  }

  // ---- Week View ----
  function renderWeekView() {
    const startOfWeek = new Date(cursor);
    startOfWeek.setDate(cursor.getDate() - cursor.getDay());

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });

    const first = days[0], last = days[6];
    document.getElementById('calTitle').textContent =
      first.getMonth() === last.getMonth()
        ? `${MONTHS[first.getMonth()]} ${first.getFullYear()}`
        : `${MONTHS[first.getMonth()].slice(0,3)} – ${MONTHS[last.getMonth()].slice(0,3)} ${last.getFullYear()}`;

    const weekHeader = document.getElementById('weekHeader');
    weekHeader.style.gridTemplateColumns = `repeat(7, 1fr)`;
    weekHeader.innerHTML = days.map(d => {
      const todayCls = isToday(d.getFullYear(), d.getMonth(), d.getDate()) ? ' today' : '';
      return `<div class="week-header-cell${todayCls}" data-y="${d.getFullYear()}" data-m="${d.getMonth()}" data-d="${d.getDate()}" style="cursor:pointer">
        <div class="week-header-dow">${DAYS[d.getDay()]}</div>
        <div class="week-header-date">${d.getDate()}</div>
      </div>`;
    }).join('');

    // click week header day → open day view
    weekHeader.querySelectorAll('.week-header-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        switchToDay(parseInt(cell.dataset.y), parseInt(cell.dataset.m), parseInt(cell.dataset.d));
      });
    });

    buildTimeCol('weekTimeCol');

    const weekCols = document.getElementById('weekCols');
    weekCols.style.gridTemplateColumns = `repeat(7, 1fr)`;
    weekCols.innerHTML = days.map(d => {
      const todayCls = isToday(d.getFullYear(), d.getMonth(), d.getDate()) ? ' today' : '';
      const hourLines = Array.from({ length: 24 }, () => `<div class="week-hour-line"></div>`).join('');
      const events = contestsOnDay(d.getFullYear(), d.getMonth(), d.getDate()).map(c => {
        const start = new Date(c.startsAt), end = new Date(c.endsAt);
        const startMins = start.getHours() * 60 + start.getMinutes();
        const durMins = Math.max(30, (end - start) / 60000);
        const top = (startMins / 60) * 60, height = Math.max(28, (durMins / 60) * 60);
        return `<div class="week-event ${getStatus(c)}${srcCls(c)}" style="top:${top}px;height:${height}px" data-code="${esc(c.code)}">
          ${srcLogo(c)}
          <div class="week-event-title">${esc(c.title)}</div>
          <div class="week-event-time">${fmtTime(c.startsAt)}</div>
        </div>`;
      }).join('');
      return `<div class="week-col${todayCls}">${hourLines}${events}</div>`;
    }).join('');

    weekCols.querySelectorAll('.week-event').forEach(el => {
      el.addEventListener('click', () => {
        const c = allContests.find(x => x.code === el.dataset.code);
        if (c) openEventPanel(c);
      });
    });

    const todayIdx = days.findIndex(d => isToday(d.getFullYear(), d.getMonth(), d.getDate()));
    if (todayIdx >= 0) {
      const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
      const topPx = (nowMins / 60) * 60;
      const cols = weekCols.querySelectorAll('.week-col');
      if (cols[todayIdx]) {
        const line = document.createElement('div');
        line.className = 'week-now-line';
        line.style.top = `${topPx}px`;
        cols[todayIdx].appendChild(line);
        setTimeout(() => {
          const body = cols[todayIdx].closest('.week-body');
          if (body) body.scrollTop = Math.max(0, topPx - 120);
        }, 50);
      }
    }
  }

  // ---- Day event column layout (no overlaps) ----
  function layoutDayEvents(contests) {
    const GUTTER = 1; // % gap between columns

    // Build timed items sorted by start
    const items = contests.map(c => {
      const start = new Date(c.startsAt);
      const end   = new Date(c.endsAt);
      const startMins = start.getHours() * 60 + start.getMinutes();
      const durMins   = Math.max(45, (end - start) / 60000);
      return { c, startMins, endMins: startMins + durMins };
    }).sort((a, b) => a.startMins - b.startMins || a.endMins - b.endMins);

    // Greedy column assignment: track the end-time of the last event in each column
    const colEnds = [];
    items.forEach(ev => {
      let placed = false;
      for (let i = 0; i < colEnds.length; i++) {
        if (colEnds[i] <= ev.startMins) {
          ev.col = i;
          colEnds[i] = ev.endMins;
          placed = true;
          break;
        }
      }
      if (!placed) {
        ev.col = colEnds.length;
        colEnds.push(ev.endMins);
      }
    });

    // Find the max concurrent columns for each event's time span
    // so events in a sparse region aren't needlessly narrow
    items.forEach(ev => {
      // count how many events overlap with this one
      const concurrent = items.filter(other =>
        other.startMins < ev.endMins && other.endMins > ev.startMins
      ).length;
      ev.numCols = concurrent;
    });

    const PAD = 12; // px from left edge of the day column

    return items.map(ev => {
      const top    = (ev.startMins / 60) * 60;
      const height = Math.max(52, ((ev.endMins - ev.startMins) / 60) * 60);
      const colW   = (100 - 2 * GUTTER) / ev.numCols; // width % per column slot
      const leftPct = ev.col * (colW + GUTTER);
      const widthPct = colW - GUTTER;
      return { contest: ev.c, top, height, leftPct, widthPct };
    });
  }

  // ---- Day View ----
  function renderDayView() {
    const y = cursor.getFullYear(), mo = cursor.getMonth(), d = cursor.getDate();

    const dateLabel = new Date(y, mo, d).toLocaleDateString([], {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
    document.getElementById('calTitle').textContent = dateLabel;

    buildTimeCol('dayTimeCol');

    const contests = contestsOnDay(y, mo, d);
    const hourLines = Array.from({ length: 24 }, () => `<div class="week-hour-line"></div>`).join('');

    const events = layoutDayEvents(contests).map(({ contest: c, top, height, leftPct, widthPct }) => {
      const status = getStatus(c);
      return `<div class="day-event ${status}${srcCls(c)}"
        style="top:${top}px;height:${height}px;left:${leftPct}%;width:${widthPct}%;right:auto"
        data-code="${esc(c.code)}">
        <div class="day-event-header">
          ${srcLogo(c)}
          <span class="day-event-title">${esc(c.title)}</span>
          <span class="day-event-status-dot ${status}"></span>
        </div>
        <div class="day-event-time">${fmtTime(c.startsAt)} – ${fmtTime(c.endsAt)}</div>
        ${c.description ? `<div class="day-event-desc">${esc(c.description)}</div>` : ''}
      </div>`;
    }).join('');

    const emptyMsg = !contests.length
      ? `<div class="day-empty">No contests scheduled for this day.</div>`
      : '';

    const dayColWrap = document.getElementById('dayColWrap');
    dayColWrap.classList.toggle('today', isToday(y, mo, d));
    document.getElementById('dayCol').innerHTML = hourLines + events + emptyMsg;

    document.querySelectorAll('.day-event').forEach(el => {
      el.addEventListener('click', () => {
        const c = allContests.find(x => x.code === el.dataset.code);
        if (c) openEventPanel(c);
      });
    });

    // scroll to current time or first event
    const wrap = document.getElementById('dayColWrap');
    if (wrap) {
      const todayView = isToday(y, mo, d);
      if (todayView) {
        const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
        const topPx = (nowMins / 60) * 60;

        // draw now line
        const existing = document.getElementById('dayCol').querySelector('.week-now-line');
        if (!existing) {
          const line = document.createElement('div');
          line.className = 'week-now-line';
          line.style.top = `${topPx}px`;
          document.getElementById('dayCol').appendChild(line);
        }

        setTimeout(() => { wrap.scrollTop = Math.max(0, topPx - 120); }, 50);
      } else if (contests.length) {
        const firstStart = new Date(contests[0].startsAt);
        const firstMins = firstStart.getHours() * 60 + firstStart.getMinutes();
        setTimeout(() => { wrap.scrollTop = Math.max(0, (firstMins / 60) * 60 - 80); }, 50);
      }
    }
  }

  // ---- Render dispatcher ----
  function render() {
    document.getElementById('calMonthView').style.display = view === 'month' ? '' : 'none';
    document.getElementById('calWeekView').style.display  = view === 'week'  ? '' : 'none';
    document.getElementById('calDayView').style.display   = view === 'day'   ? '' : 'none';

    if (view === 'month') renderMonthView();
    else if (view === 'week') renderWeekView();
    else renderDayView();
  }

  // ---- Google Calendar URL builder ----
  function buildGcalUrl(contest) {
    function toGcalDate(iso) {
      // Format: YYYYMMDDTHHMMSSZ  (UTC)
      return iso.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z').slice(0, 15) + 'Z';
    }
    const start = toGcalDate(contest.startsAt);
    const end   = toGcalDate(contest.endsAt);

    let contestUrl, details;
    if (isCf(contest)) {
      contestUrl = contest.cfId ? `https://codeforces.com/contest/${contest.cfId}` : 'https://codeforces.com/contests';
      details = `Codeforces contest\n${contestUrl}`;
    } else if (isLc(contest)) {
      contestUrl = `https://leetcode.com/contest/${contest.lcSlug}`;
      details = `LeetCode contest\n${contestUrl}`;
    } else if (isCc(contest)) {
      contestUrl = `https://www.codechef.com/${contest.ccCode}`;
      details = `CodeChef contest\n${contestUrl}`;
    } else {
      contestUrl = `${API_BASE_URL.replace('localhost:8000', 'algoforge-1-mbk5.onrender.com')}/contests.html`;
      details = `AlgoForge contest · Code: ${contest.code}\n${contestUrl}`;
    }

    const p = new URLSearchParams({
      action: 'TEMPLATE',
      text: contest.title,
      dates: `${start}/${end}`,
      details,
      location: contestUrl,
    });
    return `https://calendar.google.com/calendar/render?${p.toString()}`;
  }

  // ---- Event Detail Panel ----
  function openEventPanel(contest) {
    const status = getStatus(contest);
    const start = new Date(contest.startsAt), end = new Date(contest.endsAt);
    const durMins = Math.round((end - start) / 60000);
    const durStr = durMins >= 60
      ? `${Math.floor(durMins / 60)}h${durMins % 60 ? ' ' + (durMins % 60) + 'm' : ''}`
      : `${durMins}m`;
    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
    const cf = isCf(contest);
    const lc = isLc(contest);
    const cc = isCc(contest);
    const isExternal = cf || lc || cc;

    let actionBtn;
    if (cf) {
      const cfUrl = contest.cfId ? `https://codeforces.com/contest/${contest.cfId}` : 'https://codeforces.com/contests';
      actionBtn = `<a class="ep-btn ep-btn-cf" href="${cfUrl}" target="_blank" rel="noopener">${CF_LOGO} Open on Codeforces ↗</a>`;
    } else if (lc) {
      actionBtn = `<a class="ep-btn ep-btn-lc" href="https://leetcode.com/contest/${contest.lcSlug}" target="_blank" rel="noopener">${LC_LOGO} Open on LeetCode ↗</a>`;
    } else if (cc) {
      actionBtn = `<a class="ep-btn ep-btn-cc" href="https://www.codechef.com/${contest.ccCode}" target="_blank" rel="noopener">${CC_LOGO} Open on CodeChef ↗</a>`;
    } else if (status === 'active') {
      actionBtn = `<a class="ep-btn ep-btn-primary" href="contest-editor.html?code=${esc(contest.code)}">Enter Contest</a>`;
    } else if (status === 'upcoming') {
      actionBtn = `<a class="ep-btn ep-btn-primary" href="contests.html">View in Contests</a>`;
    } else {
      actionBtn = `<a class="ep-btn ep-btn-secondary" href="contest-results.html?code=${esc(contest.code)}">View Results</a>`;
    }

    let sourceBadge = '';
    if (cf) sourceBadge = `<span class="ep-cf-badge">${CF_LOGO} Codeforces</span>`;
    if (lc) sourceBadge = `<span class="ep-lc-badge">${LC_LOGO} LeetCode</span>`;
    if (cc) sourceBadge = `<span class="ep-cc-badge">${CC_LOGO} CodeChef</span>`;

    document.getElementById('eventPanelInner').innerHTML = `
      <div class="ep-top-row">
        <div class="ep-status-bar ${status}"><span class="ep-status-dot"></span>${statusLabel}</div>
        ${sourceBadge}
      </div>
      <h2 class="ep-title">${esc(contest.title)}</h2>
      ${contest.description ? `<p class="ep-desc">${esc(contest.description)}</p>` : ''}
      <div class="ep-meta-grid">
        <div class="ep-meta-row">
          <div class="ep-meta-icon">📅</div>
          <div>
            <div class="ep-meta-label">Date</div>
            <div class="ep-meta-value">${fmtDate(contest.startsAt)}</div>
          </div>
        </div>
        <div class="ep-meta-row">
          <div class="ep-meta-icon">⏰</div>
          <div>
            <div class="ep-meta-label">Time</div>
            <div class="ep-meta-value">${fmtTime(contest.startsAt)} – ${fmtTime(contest.endsAt)} (${durStr})</div>
          </div>
        </div>
        ${!isExternal ? `
        <div class="ep-meta-row">
          <div class="ep-meta-icon">🔑</div>
          <div>
            <div class="ep-meta-label">Code</div>
            <div class="ep-meta-value"><span class="ep-code-badge">${esc(contest.code)}</span></div>
          </div>
        </div>
        <div class="ep-meta-row">
          <div class="ep-meta-icon">📝</div>
          <div>
            <div class="ep-meta-label">Problems</div>
            <div class="ep-meta-value">${contest.problemCount} problems</div>
          </div>
        </div>
        <div class="ep-meta-row">
          <div class="ep-meta-icon">👥</div>
          <div>
            <div class="ep-meta-label">Participants</div>
            <div class="ep-meta-value">${contest.participantCount} joined</div>
          </div>
        </div>
        <div class="ep-meta-row">
          <div class="ep-meta-icon">👤</div>
          <div>
            <div class="ep-meta-label">Created by</div>
            <div class="ep-meta-value">${esc(contest.createdByName || 'Unknown')}</div>
          </div>
        </div>
        ` : ''}
      </div>
      <div class="ep-divider"></div>
      <div class="ep-actions">
        ${actionBtn}
        ${!isExternal ? `<button class="ep-btn ep-btn-secondary" id="epCopyCode">Copy Code</button>` : ''}
        <a class="ep-btn ep-btn-gcal" href="${buildGcalUrl(contest)}" target="_blank" rel="noopener">
          <img src="./assets/google-calendar.svg" class="gcal-logo" alt="Google Calendar">
          Add to Google Calendar
        </a>
      </div>
    `;

    document.getElementById('epCopyCode')?.addEventListener('click', () => {
      navigator.clipboard.writeText(contest.code).then(() => {
        const btn = document.getElementById('epCopyCode');
        if (btn) { btn.textContent = 'Copied!'; setTimeout(() => { if (btn) btn.textContent = 'Copy Code'; }, 2000); }
      });
    });

    document.getElementById('eventPanel').classList.add('open');
    document.getElementById('eventPanelBackdrop').classList.add('open');
  }

  function closeEventPanel() {
    document.getElementById('eventPanel').classList.remove('open');
    document.getElementById('eventPanelBackdrop').classList.remove('open');
  }

  document.getElementById('eventPanelClose').addEventListener('click', closeEventPanel);
  document.getElementById('eventPanelBackdrop').addEventListener('click', closeEventPanel);

  // ---- Navigation ----
  document.getElementById('calToday').addEventListener('click', () => {
    const now = new Date();
    cursor = new Date(now);
    miniCursor = new Date(now.getFullYear(), now.getMonth(), 1);
    selectedDate = new Date(now);
    if (view === 'month') cursor = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (view === 'week') cursor.setDate(now.getDate() - now.getDay());
    render();
    renderMiniCal();
  });

  document.getElementById('calPrev').addEventListener('click', () => {
    if (view === 'month') {
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1);
    } else if (view === 'week') {
      cursor.setDate(cursor.getDate() - 7);
    } else {
      cursor.setDate(cursor.getDate() - 1);
      selectedDate = new Date(cursor);
    }
    miniCursor = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    render();
    renderMiniCal();
  });

  document.getElementById('calNext').addEventListener('click', () => {
    if (view === 'month') {
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    } else if (view === 'week') {
      cursor.setDate(cursor.getDate() + 7);
    } else {
      cursor.setDate(cursor.getDate() + 1);
      selectedDate = new Date(cursor);
    }
    miniCursor = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    render();
    renderMiniCal();
  });

  document.getElementById('miniPrev').addEventListener('click', () => {
    miniCursor = new Date(miniCursor.getFullYear(), miniCursor.getMonth() - 1, 1);
    renderMiniCal();
  });

  document.getElementById('miniNext').addEventListener('click', () => {
    miniCursor = new Date(miniCursor.getFullYear(), miniCursor.getMonth() + 1, 1);
    renderMiniCal();
  });

  // ---- View switcher ----
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      view = btn.dataset.view;
      if (view === 'month') {
        cursor = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
      } else if (view === 'week') {
        cursor.setDate(cursor.getDate() - cursor.getDay());
      } else if (view === 'day') {
        cursor = selectedDate ? new Date(selectedDate) : new Date();
      }
      render();
    });
  });

  document.getElementById('platformFilters').addEventListener('click', e => {
    const btn = e.target.closest('.pf-btn');
    if (!btn) return;
    const platform = btn.dataset.platform;
    if (activePlatforms.has(platform)) {
      // don't allow deselecting all
      if (activePlatforms.size === 1) return;
      activePlatforms.delete(platform);
      btn.classList.remove('active');
    } else {
      activePlatforms.add(platform);
      btn.classList.add('active');
    }
    render();
    renderUpcoming();
  });

  // ---- Init ----
  cursor = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  render();
  renderMiniCal();
  renderSkeleton();
  fetchContests();
  setInterval(fetchContests, 60000);
})();
