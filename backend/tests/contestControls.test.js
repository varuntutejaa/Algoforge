// Creator controls and visibility for contests.
//
// A private contest must never be listed: the join code is the only way in.
// Only the creator may end a contest early. The leaderboard poll carries the
// end time, which is how open arenas learn the contest was ended early.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'routes', 'contests.js'), 'utf8');
const schema = fs.readFileSync(path.join(__dirname, '..', 'prisma', 'schema.prisma'), 'utf8');

function route(start, next) {
    const from = src.indexOf(start);
    assert.ok(from >= 0, `expected to find ${start}`);
    const to = next ? src.indexOf(next, from + 1) : src.length;
    return src.slice(from, to);
}

test('contests have a private flag that defaults to public', () => {
    assert.ok(/isPrivate\s+Boolean\s+@default\(false\)/.test(schema));
});

test('the available list never includes private contests', () => {
    const available = route('router.get("/available"', 'router.get("/:code"');
    assert.ok(/isPrivate:\s*false/.test(available), '/available must filter out private contests');
});

test('only the creator can end a contest', () => {
    const end = route('router.post("/:code/end"', 'router.post("/join"');
    assert.ok(/requireAuth/.test(end), 'ending must require sign-in');
    assert.ok(/createdBy\s*!==\s*req\.user\.id[\s\S]{0,80}status\(403\)/.test(end), 'non-creators must get a 403');
});

test('joining is rate limited, since the code is the key to a private contest', () => {
    assert.ok(/router\.post\("\/join",\s*requireAuth,\s*contestJoinLimiter/.test(src));
});

test('the leaderboard carries profile pictures and the current end time', () => {
    assert.ok(/profilePicture:\s*p\.user\?\.profilePicture/.test(src), 'entries should carry profilePicture');
    const get = route('router.get("/:code/leaderboard"', 'router.post("/create"');
    assert.ok(/endsAt:\s*board\.endsAt/.test(get) && /status:\s*board\.status/.test(get),
        'the poll needs endsAt and status to notice an early end');
});
