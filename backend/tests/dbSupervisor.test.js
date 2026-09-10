// Regression guard for the database supervisor.
//
// The supervisor previously called process.exit(1) after a few failed
// connection attempts, which meant a database outage killed the entire
// service — including /health and the contest-calendar endpoints, none of
// which need a database. These tests pin the replacement behavior: survive
// the outage, and reconnect on its own once the database returns.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const Module = require('module');

// Load config/db.js with prisma + the boilerplate migration stubbed out, so
// the supervisor's state machine can be driven deterministically.
function loadSupervisor({ failures }) {
    const dbPath = require.resolve('../config/db');
    const prismaPath = require.resolve('../config/prismaClient');
    const problemsPath = require.resolve('../services/problems');

    for (const p of [dbPath, prismaPath, problemsPath]) delete require.cache[p];

    let calls = 0;
    const fakePrisma = {
        prisma: {
            $queryRaw: async () => {
                calls++;
                if (calls <= failures) throw new Error('connection refused');
                return [{ '?column?': 1 }];
            }
        }
    };

    require.cache[prismaPath] = { id: prismaPath, filename: prismaPath, loaded: true, exports: fakePrisma };
    require.cache[problemsPath] = {
        id: problemsPath,
        filename: problemsPath,
        loaded: true,
        exports: { migratePythonBoilerplates: async () => {}, formatProblem: (p) => p, getDailyProblemId: async () => null }
    };

    const mod = require(dbPath);
    return { mod, getCalls: () => calls };
}

async function waitFor(predicate, timeoutMs = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        if (predicate()) return true;
        await new Promise((r) => setTimeout(r, 50));
    }
    return false;
}

test('supervisor reports connected once the database answers', async () => {
    const { mod } = loadSupervisor({ failures: 0 });
    assert.equal(mod.isConnected(), false, 'starts disconnected');

    mod.connectWithRetry();
    const ok = await waitFor(() => mod.isConnected());

    assert.ok(ok, 'should report connected after a successful ping');
});

test('supervisor survives a failing database instead of exiting', async () => {
    const originalExit = process.exit;
    let exited = false;
    process.exit = () => { exited = true; };

    try {
        // More failures than the old implementation tolerated before exiting.
        const { mod, getCalls } = loadSupervisor({ failures: 8 });
        mod.connectWithRetry();

        // Let it burn through several failed attempts.
        await waitFor(() => getCalls() >= 3, 6000);

        assert.equal(exited, false, 'must never call process.exit on DB failure');
        assert.equal(mod.isConnected(), false, 'stays disconnected while the DB is down');
    } finally {
        process.exit = originalExit;
    }
});

test('supervisor reconnects on its own once the database comes back', async () => {
    // Fails twice, then succeeds — mirrors a database returning mid-outage.
    const { mod } = loadSupervisor({ failures: 2 });
    mod.connectWithRetry();

    const recovered = await waitFor(() => mod.isConnected(), 15000);
    assert.ok(recovered, 'should recover without a restart once the DB answers');
});
