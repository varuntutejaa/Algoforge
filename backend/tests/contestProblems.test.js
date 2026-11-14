// A contest may only contain problems the judge can grade.
//
// Random contests used to sample from the whole problem table, so roughly one
// pick in five was a design or open-ended problem with no test cases. Every
// submit to one is refused with a 422, so nobody could solve every problem,
// nobody was ever marked finished, and the contest could not end early.
// Choosing such a problem by hand had the same effect.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'routes', 'contests.js'), 'utf8');
const createRoute = src.slice(src.indexOf('router.post("/create"'), src.indexOf('router.post("/join"'));

test('contest creation filters problems down to ones with test cases', () => {
    assert.ok(createRoute.length > 0, 'expected to find the create route');
    assert.ok(
        /testCases:\s*\{\s*some:\s*\{\s*\}\s*\}/.test(createRoute),
        'create should restrict problems to those with at least one test case'
    );
});

test('random contests no longer sample the whole problem table', () => {
    assert.ok(
        !/FROM problems ORDER BY random\(\)/.test(createRoute),
        'raw random sampling over every problem picks unjudgeable ones'
    );
});

test('a hand-picked unjudgeable problem is refused, not silently dropped', () => {
    assert.ok(/status\(400\)[\s\S]{0,200}can't be judged/.test(createRoute),
        'choosing an unjudgeable problem should return a 400 that says why');
});
