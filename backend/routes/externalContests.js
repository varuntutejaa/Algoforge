// Proxies for third-party contest listings (avoids browser CORS restrictions).
// Each endpoint returns upcoming/active contests plus recently-ended ones
// (within PAST_WINDOW_MS) so the calendar can show completed contests too.
const express = require('express');
const router = express.Router();

const PAST_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // show contests that ended within the last 30 days

let cfContestsCache = null;
let cfCacheTime = 0;

// codeforcves.com API returns all contests (including past) in one call, so we cache it for 5 minutes.
router.get('/codeforces-contests', async (req, res) => {
  try {
    const now = Date.now();
    if (cfContestsCache && now - cfCacheTime < 5 * 60 * 1000) {
      return res.json(cfContestsCache);
    }
    const apiRes = await fetch('https://codeforces.com/api/contest.list?gym=false', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AlgoForge/1.0)' }
    });
    const data = await apiRes.json();
    if (data.status !== 'OK') return res.status(502).json({ contests: [], error: 'CF API error' });
    const contests = data.result.filter(c => {
      if (c.phase === 'BEFORE' || c.phase === 'CODING') return true;
      const endMs = (c.startTimeSeconds + c.durationSeconds) * 1000;
      return c.phase === 'FINISHED' && now - endMs < PAST_WINDOW_MS;
    });
    cfContestsCache = { contests };
    cfCacheTime = now;
    res.json(cfContestsCache);
  } catch (err) {
    res.status(500).json({ contests: [], error: err.message });
  }
});

// codechef.com API returns all contests (including past) in one call, so we cache it for 10 minutes.
let ccContestsCache = null;
let ccCacheTime = 0;
router.get('/codechef-contests', async (req, res) => {
  try {
    const now = Date.now();
    if (ccContestsCache && now - ccCacheTime < 10 * 60 * 1000) {
      return res.json(ccContestsCache);
    }
    const apiRes = await fetch(
      'https://www.codechef.com/api/list/contests/all?sort_by=START&sorting_order=asc&offset=0&mode=all',
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AlgoForge/1.0)' } }
    );
    const data = await apiRes.json();
    const mapContest = c => ({
      code: c.contest_code,
      name: c.contest_name,
      startTime: c.contest_start_date_iso,
      endTime: c.contest_end_date_iso,
      durationMins: Number(c.contest_duration),
    });
    const future = (data.future_contests || []).map(mapContest);
    const past = (data.past_contests || [])
      .map(mapContest)
      .filter(c => now - new Date(c.endTime).getTime() < PAST_WINDOW_MS);
    ccContestsCache = { contests: [...future, ...past] };
    ccCacheTime = now;
    res.json(ccContestsCache);
  } catch (err) {
    res.status(500).json({ contests: [], error: err.message });
  }
});


// leetcode.com GraphQL API returns all contests (including past) in one call, so we cache it for 10 minutes.
let lcContestsCache = null;
let lcCacheTime = 0;
router.get('/leetcode-contests', async (req, res) => {
  try {
    const now = Date.now();
    if (lcContestsCache && now - lcCacheTime < 10 * 60 * 1000) {
      return res.json(lcContestsCache);
    }
    const gqlRes = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com',
        'User-Agent': 'Mozilla/5.0 (compatible; AlgoForge/1.0)',
      },
      body: JSON.stringify({
        query: `{ allContests { title titleSlug startTime duration isVirtual containsPremium } }`
      }),
    });
    const data = await gqlRes.json();
    const allContests = (data.data?.allContests || []);
    const filtered = allContests.filter(c => {
      if (c.isVirtual || c.containsPremium) return false;
      const endMs = c.startTime * 1000 + c.duration * 1000;
      return endMs > now || now - endMs < PAST_WINDOW_MS;
    });
    lcContestsCache = { contests: filtered };
    lcCacheTime = now;
    res.json(lcContestsCache);
  } catch (err) {
    res.status(500).json({ contests: [], error: err.message });
  }
});

// hackerrank.com API returns upcoming and past contests in separate calls, so we cache them for 10 minutes.

let hrContestsCache = null;
let hrCacheTime = 0;
router.get('/hackerrank-contests', async (req, res) => {
  try {
    const now = Date.now();
    if (hrContestsCache && now - hrCacheTime < 10 * 60 * 1000) {
      return res.json(hrContestsCache);
    }
    const headers = { 'User-Agent': 'Mozilla/5.0 (compatible; AlgoForge/1.0)' };
    const MAX_DURATION_DAYS = 30;
    const mapContest = c => ({
      id:           c.id,
      slug:         c.slug,
      title:        c.name,
      startTime:    c.epoch_starttime * 1000,
      endTime:      c.epoch_endtime * 1000,
      durationMins: Math.round((c.epoch_endtime - c.epoch_starttime) / 60),
    });

    const [upcomingRes, pastRes] = await Promise.all([
      fetch('https://www.hackerrank.com/rest/contests/upcoming?offset=0&limit=100', { headers }),
      fetch('https://www.hackerrank.com/rest/contests/archived?offset=0&limit=100', { headers }),
    ]);
    const [upcomingData, pastData] = await Promise.all([upcomingRes.json(), pastRes.json()]);

    const upcoming = (upcomingData.models || [])
      .filter(c => !c.ended && (c.epoch_endtime - c.epoch_starttime) < MAX_DURATION_DAYS * 86400)
      .map(mapContest);
    const past = (pastData.models || [])
      .filter(c =>
        (c.epoch_endtime - c.epoch_starttime) < MAX_DURATION_DAYS * 86400 &&
        now - c.epoch_endtime * 1000 < PAST_WINDOW_MS
      )
      .map(mapContest);

    hrContestsCache = { contests: [...upcoming, ...past] };
    hrCacheTime = now;
    res.json(hrContestsCache);
  } catch (err) {
    res.status(500).json({ contests: [], error: err.message });
  }
});

// Shared parser for AtCoder's contest-list tables (used for both the
// "Upcoming Contests" table and the Contest Archive table — same markup shape).
function parseAtCoderTable(tableHtml) {
  const rowRegex = /<tr>([\s\S]*?)<\/tr>/g;
  const rows = [];
  let rowMatch;
  while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
    const cells = [];
    const cellRe = /<td[^>]*>([\s\S]*?)<\/td>/g;
    let cellMatch;
    while ((cellMatch = cellRe.exec(rowMatch[1])) !== null) cells.push(cellMatch[1]);
    if (cells.length < 3) continue;

    const timeMatch = cells[0].match(/<time[^>]*>([^<]+)<\/time>/);
    const linkMatch = cells[1].match(/href="\/contests\/([^"]+)"[^>]*>([^<\n]+)/);
    const durMatch  = cells[2].match(/(\d+):(\d+)/);
    if (!timeMatch || !linkMatch || !durMatch) continue;

    // Parse "2026-06-27 21:00:00+0900" → ms
    const startStr = timeMatch[1].trim().replace(' ', 'T');
    const startMs  = new Date(startStr).getTime();
    if (isNaN(startMs)) continue;

    const durationMins = parseInt(durMatch[1]) * 60 + parseInt(durMatch[2]);
    const endMs = startMs + durationMins * 60 * 1000;

    rows.push({
      id:           linkMatch[1].trim(),
      title:        linkMatch[2].trim(),
      startTime:    startMs,
      endTime:      endMs,
      durationMins,
      rateChange:   '',
    });
  }
  return rows;
}


// atcoder.jp does not provide a public API, so we scrape the contest list pages. We cache the results for 10 minutes.
let atContestsCache = null;
let atCacheTime = 0;
router.get('/atcoder-contests', async (req, res) => {
  try {
    const now = Date.now();
    if (atContestsCache && now - atCacheTime < 10 * 60 * 1000) {
      return res.json(atContestsCache);
    }
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
    };

    const [upcomingHtml, archiveHtml] = await Promise.all([
      fetch('https://atcoder.jp/contests/?lang=en', { headers }).then(r => r.text()),
      fetch('https://atcoder.jp/contests/archive?lang=en', { headers }).then(r => r.text()),
    ]);

    const upcomingTable = upcomingHtml.match(/Upcoming Contests[\s\S]*?<\/table>/);
    const upcoming = (upcomingTable ? parseAtCoderTable(upcomingTable[0]) : [])
      .filter(c => c.endTime >= now);

    // Archive page is sorted most-recent-first — first table on the page is enough.
    const archiveTable = archiveHtml.match(/<table[\s\S]*?<\/table>/);
    const past = (archiveTable ? parseAtCoderTable(archiveTable[0]) : [])
      .filter(c => c.endTime < now && now - c.endTime < PAST_WINDOW_MS);

    atContestsCache = { contests: [...upcoming, ...past] };
    atCacheTime = now;
    res.json(atContestsCache);
  } catch (err) {
    res.status(500).json({ contests: [], error: err.message });
  }
});

module.exports = router;
