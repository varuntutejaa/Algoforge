// The contest submit response has to carry the rebuilt leaderboard.
//
// A solve used to take a visible beat to appear: the client judged the code via
// /submit-code, posted it again to the contest route (which judged it a second
// time), then issued a third request for the leaderboard. Returning the board
// with the verdict is what removes that wait, so these guard the contract the
// client now depends on.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'routes', 'contests.js'), 'utf8');

test('the submit route responds with the verdict and the rebuilt leaderboard', () => {
    const submitResponse = src.match(/res\.json\(\{\s*success:\s*true,\s*verdict[^}]*\}\)/);
    assert.ok(submitResponse, 'submit should respond with a verdict');
    for (const field of ['verdict', 'results', 'leaderboard']) {
        assert.ok(
            submitResponse[0].includes(field),
            `submit response must include ${field} so the client needs no follow-up request`
        );
    }
});

test('leaderboard building is shared, not duplicated per route', () => {
    assert.ok(/function buildLeaderboard\(/.test(src), 'expected a shared buildLeaderboard()');
    assert.ok(/async function loadLeaderboard\(/.test(src), 'expected a shared loadLeaderboard()');

    // Both the GET route and the submit route must go through it, or the two
    // can drift and report different scores for the same contest.
    const uses = src.match(/loadLeaderboard\(/g) || [];
    assert.ok(uses.length >= 3, `expected the helper to be defined and used by both routes, saw ${uses.length}`);
});

test('the verdict is still computed server-side', () => {
    // The client sends no verdict now, but the important part is that the
    // server never trusts one if it ever did again.
    assert.ok(
        /const verdict = getVerdict\(/.test(src),
        'the contest verdict must come from the judge, never from the request body'
    );
    assert.ok(
        !/verdict\s*=\s*req\.body\.verdict/.test(src),
        'a client-supplied verdict would let anyone award themselves points'
    );
});

test('the contest list never returns every contest to an anonymous caller', () => {
    // GET /api/contests is "my contests". It builds a Prisma filter from the
    // caller's id, and an empty filter matches every row -- so a missing
    // identity must short-circuit, not fall through to findMany.
    const route = src.slice(src.indexOf('router.get("/", contestReadLimiter'));
    const body = route.slice(0, route.indexOf('router.', 10));

    assert.ok(
        /if \(!userId\)[\s\S]{0,120}contests: \[\]/.test(body),
        'an anonymous caller must get an empty list, not an unfiltered query'
    );
    assert.ok(
        !/where,\s*$/m.test(body.slice(0, body.indexOf('orderBy'))),
        'the query must not be driven by a possibly-empty `where` object'
    );
});
