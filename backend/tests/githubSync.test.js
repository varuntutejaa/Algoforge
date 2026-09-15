// Behaviour guards for GitHub solution sync.
//
// The sync runs after a verdict is already decided, so the rule that matters
// most is that it can never turn a solved problem into a failure — every
// GitHub error has to come back as a reported status, not a thrown exception.
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const path = require('path');

process.env.TOKEN_ENCRYPTION_KEY = crypto.randomBytes(32).toString('base64');
process.env.GITHUB_CLIENT_ID = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-client-secret';

const { encrypt } = require('../services/crypto');

// Stub prisma so these run without a database.
const prismaPath = require.resolve('../config/prismaClient');
const updates = [];
// Rows the stubbed database hands back; individual tests reassign these.
const db = { submission: null, problem: null };
require.cache[prismaPath] = {
    id: prismaPath,
    filename: prismaPath,
    loaded: true,
    exports: {
        prisma: {
            user: { update: async (args) => { updates.push(args); return {}; } },
            submission: { findFirst: async () => db.submission },
            problem: { findUnique: async () => db.problem }
        }
    }
};

const githubPath = require.resolve('../services/github');
const realGithub = require(githubPath);

function stubGithub(pushImpl) {
    require.cache[githubPath] = {
        id: githubPath,
        filename: githubPath,
        loaded: true,
        exports: { ...realGithub, pushSolution: pushImpl }
    };
    delete require.cache[require.resolve('../services/githubSync')];
    return require('../services/githubSync');
}

const problem = { id: 'two-sum', title: 'Two Sum', difficulty: 'Easy', tags: ['Arrays'] };
function connectedUser(over = {}) {
    return {
        id: 'user-1',
        githubSyncEnabled: true,
        githubToken: encrypt('gho_testtoken'),
        githubUsername: 'octocat',
        githubRepo: 'algoforge-solutions',
        ...over
    };
}
const submission = { problem, language: 'python', sourceCode: 'print(1)', metrics: { runtime: 0.01, memory: 3200 } };

test('does nothing when the user has not connected GitHub', async () => {
    const { syncAcceptedSolution } = stubGithub(async () => { throw new Error('should not be called'); });
    const result = await syncAcceptedSolution({ user: { id: 'u', githubSyncEnabled: false }, ...submission });
    assert.equal(result, null, 'an opted-out user gets no sync field at all');
});

test('reports paused rather than pushing when auto-push is off', async () => {
    // The status is what lets the result panel offer a one-off push, so a
    // silent null here would take that option away.
    const { syncAcceptedSolution } = stubGithub(async () => { throw new Error('should not be called'); });
    const user = connectedUser({ githubSyncEnabled: false });
    const r = await syncAcceptedSolution({ user, ...submission });
    assert.deepEqual(r, { status: 'disabled' });
});

test('reports a created file on first push', async () => {
    const { syncAcceptedSolution } = stubGithub(async () => ({
        path: 'easy/two-sum/solution.py', updated: false,
        fileUrl: 'https://github.com/octocat/algoforge-solutions/blob/main/easy/two-sum/solution.py',
        commitUrl: 'https://github.com/octocat/algoforge-solutions/commit/abc'
    }));
    const r = await syncAcceptedSolution({ user: connectedUser(), ...submission });
    assert.equal(r.status, 'created');
    assert.equal(r.repo, 'octocat/algoforge-solutions');
    assert.equal(r.path, 'easy/two-sum/solution.py');
});

test('reports an update when the solution already existed', async () => {
    const { syncAcceptedSolution } = stubGithub(async () => ({ path: 'p', updated: true, fileUrl: null, commitUrl: null }));
    const r = await syncAcceptedSolution({ user: connectedUser(), ...submission });
    assert.equal(r.status, 'updated', 're-solving overwrites rather than failing');
});

test('a GitHub outage is reported, never thrown', async () => {
    const { syncAcceptedSolution } = stubGithub(async () => { throw new Error('502 Bad Gateway'); });
    const r = await syncAcceptedSolution({ user: connectedUser(), ...submission });
    assert.equal(r.status, 'failed', 'the solve must still stand');
    assert.ok(r.message);
});

test('a revoked token clears the connection and asks the user to reconnect', async () => {
    updates.length = 0;
    const { syncAcceptedSolution } = stubGithub(async () => { throw new Error('Bad credentials'); });
    const r = await syncAcceptedSolution({ user: connectedUser(), ...submission });
    assert.equal(r.status, 'reconnect');
    assert.equal(updates.length, 1, 'the dead token is cleared');
    assert.equal(updates[0].data.githubToken, null);
    assert.equal(updates[0].data.githubSyncEnabled, false);
});

test('a deleted repository is called out specifically', async () => {
    const { syncAcceptedSolution } = stubGithub(async () => { throw new Error('Not Found'); });
    const r = await syncAcceptedSolution({ user: connectedUser(), ...submission });
    assert.equal(r.status, 'missing_repo');
    assert.match(r.message, /algoforge-solutions/, 'the message names the repo so it is actionable');
});

test('an undecryptable token clears the connection instead of failing forever', async () => {
    updates.length = 0;
    const { syncAcceptedSolution } = stubGithub(async () => ({ path: 'p', updated: false }));
    const user = connectedUser({ githubToken: 'v1.garbage.garbage.garbage' });
    const r = await syncAcceptedSolution({ user, ...submission });
    assert.equal(r.status, 'reconnect');
    assert.equal(updates.length, 1);
});

test('solution paths are grouped by difficulty and use the right extension', () => {
    const p = realGithub.solutionPath(problem, 'python');
    assert.equal(p, 'easy/two-sum/solution.py');
    assert.equal(realGithub.solutionPath(problem, 'cpp'), 'easy/two-sum/solution.cpp');
    assert.equal(realGithub.solutionPath({ ...problem, difficulty: 'Hard' }, 'java'), 'hard/two-sum/solution.java');
});

test('the OAuth scope stays narrow', () => {
    assert.equal(realGithub.OAUTH_SCOPE, 'public_repo',
        'full `repo` access would be disproportionate for writing one public repo');
});

// --- one-off push ---------------------------------------------------------

test('pushStoredSolution pushes the stored accepted submission', async () => {
    let pushed = null;
    const { pushStoredSolution } = stubGithub(async (_t, args) => {
        pushed = args;
        return { path: 'easy/two-sum/solution.py', updated: false, fileUrl: 'https://f', commitUrl: 'https://c' };
    });
    db.submission = { language: 'python', sourceCode: 'print(1)', runtime: 0.02, memory: 3000 };
    db.problem = problem;

    // Paused on purpose: the whole point of this path is that it works anyway.
    const r = await pushStoredSolution({
        user: connectedUser({ githubSyncEnabled: false }),
        problemId: 'two-sum'
    });

    assert.equal(r.ok, true);
    assert.equal(r.status, 'created');
    assert.equal(pushed.sourceCode, 'print(1)', 'must push what the judge accepted');
    assert.equal(pushed.language, 'python');
});

test('pushStoredSolution refuses a problem the user has not solved', async () => {
    const { pushStoredSolution } = stubGithub(async () => { throw new Error('should not be called'); });
    db.submission = null;
    db.problem = problem;
    const r = await pushStoredSolution({ user: connectedUser(), problemId: 'two-sum' });
    assert.equal(r.ok, false);
    assert.equal(r.status, 'not_solved');
});

test('pushStoredSolution refuses when GitHub is not connected', async () => {
    const { pushStoredSolution } = stubGithub(async () => { throw new Error('should not be called'); });
    const r = await pushStoredSolution({ user: { id: 'u' }, problemId: 'two-sum' });
    assert.equal(r.ok, false);
    assert.equal(r.status, 'not_connected');
});

test('pushStoredSolution reports a missing problem', async () => {
    const { pushStoredSolution } = stubGithub(async () => { throw new Error('should not be called'); });
    db.submission = { language: 'python', sourceCode: 'print(1)' };
    db.problem = null;
    const r = await pushStoredSolution({ user: connectedUser(), problemId: 'nope' });
    assert.equal(r.ok, false);
    assert.equal(r.status, 'not_found');
});

test('a GitHub failure during a one-off push is reported, not thrown', async () => {
    const { pushStoredSolution } = stubGithub(async () => { throw new Error('502 Bad Gateway'); });
    db.submission = { language: 'python', sourceCode: 'print(1)' };
    db.problem = problem;
    const r = await pushStoredSolution({ user: connectedUser(), problemId: 'two-sum' });
    assert.equal(r.ok, false);
    assert.equal(r.status, 'failed');
});
