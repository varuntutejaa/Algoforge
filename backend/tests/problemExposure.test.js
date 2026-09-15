// Regression guard for test-case exposure.
//
// GET /problems/:id is public and used to return every test case with its
// expected output. That let anyone read the answers and submit a lookup table
// instead of a solution — confirmed Accepted 5/5 against a real problem, which
// on a contest leaderboard is free points.
//
// The judge still needs the real data, so the split is: formatProblem for
// server-side grading, formatProblemPublic for anything a client sees.
const test = require('node:test');
const assert = require('node:assert/strict');
const { formatProblem, formatProblemPublic } = require('../services/problems');

const sample = {
    id: 'contains-duplicate',
    title: 'Contains Duplicate',
    difficulty: 'Easy',
    tags: ['Arrays'],
    description: ['...'],
    constraints: ['...'],
    example: 'Input: ...',
    boilerplate: { python: 'def solution(nums): pass' },
    runner: 'array-to-bool',
    testCases: [
        { name: 'Duplicate present', input: '4\n1 2 3 1', expected: 'true' },
        { name: 'All distinct', input: '4\n1 2 3 4', expected: 'false' }
    ]
};

test('the judge-facing shape keeps real test data', () => {
    const p = formatProblem(sample);
    assert.equal(p.testCases.length, 2);
    assert.equal(p.testCases[0].input, '4\n1 2 3 1');
    assert.equal(p.testCases[0].expected, 'true');
});

test('the public shape never carries inputs or expected outputs', () => {
    const p = formatProblemPublic(sample);

    for (const tc of p.testCases) {
        assert.equal(tc.input, undefined, 'test case input must not be exposed');
        assert.equal(tc.expected, undefined, 'expected output must not be exposed');
    }

    // Belt and braces: no expected value should appear anywhere in the payload.
    const serialized = JSON.stringify(p);
    assert.ok(!serialized.includes('1 2 3 1'), 'no test input may leak into the payload');
});

test('the public shape still tells the editor how many tests there are', () => {
    const p = formatProblemPublic(sample);
    assert.equal(p.testCaseCount, 2);
    assert.equal(p.testCases.length, 2, 'names are kept so the UI can list them');
    assert.equal(p.testCases[0].name, 'Duplicate present');
});

test('the public shape preserves everything a solver legitimately needs', () => {
    const p = formatProblemPublic(sample);
    assert.equal(p.title, sample.title);
    assert.deepEqual(p.description, sample.description);
    assert.deepEqual(p.constraints, sample.constraints);
    assert.equal(p.example, sample.example);
    assert.deepEqual(p.boilerplate, sample.boilerplate);
    assert.equal(p.runner, sample.runner);
});
