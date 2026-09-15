// Guards the mounting rule that a path-less router.use() breaks.
//
// routes/ai.js is mounted at '/api'. It previously called
// router.use(requireAuth, ...) with no path, which in Express applies to every
// request reaching that router — so it gated all of /api/*, including routes
// mounted after it. That silently 401'd the GitHub OAuth callback, which must
// be public because GitHub redirects the browser there with no Authorization
// header.
//
// These tests assert the shape of the routers rather than the symptom, so the
// mistake is caught wherever it reappears.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

function source(file) {
    return fs.readFileSync(path.join(__dirname, '..', 'routes', file), 'utf8');
}

/** Comments mentioning router.use() would otherwise trip the scan below. */
function code(file) {
    return source(file)
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .filter((line) => !line.trim().startsWith('//'))
        .join('\n');
}

test('no router mounted at a shared prefix installs a path-less auth middleware', () => {
    const server = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

    // Routers mounted on a prefix that other routers also live under.
    const sharedPrefixMounts = [...server.matchAll(/app\.use\(\s*['"](\/api)['"]\s*,\s*(\w+)/g)]
        .map((m) => m[2]);

    assert.ok(sharedPrefixMounts.length > 0, 'expected at least one router mounted at /api');

    const fileFor = {
        externalContestsRoutes: 'externalContests.js',
        aiRoutes: 'ai.js'
    };

    for (const varName of sharedPrefixMounts) {
        const file = fileFor[varName];
        if (!file) continue;
        const pathless = /router\.use\(\s*(?!['"])/.test(code(file));
        assert.equal(
            pathless, false,
            `${file} is mounted at /api and calls router.use() without a path, which gates every /api/* route`
        );
    }
});

test('the GitHub OAuth callback is not behind requireAuth', () => {
    const src = source('github.js');
    const line = src.split('\n').find((l) => l.includes("router.get('/callback'"));
    assert.ok(line, 'callback route should exist');
    assert.ok(
        !line.includes('requireAuth'),
        'GitHub redirects the browser here with no Authorization header, so it must be public'
    );
});

test('the other GitHub routes do require auth', () => {
    const src = source('github.js');
    for (const route of ["router.get('/status'", "router.get('/connect'", "router.patch('/settings'", "router.post('/push'", "router.post('/disconnect'"]) {
        const line = src.split('\n').find((l) => l.includes(route));
        assert.ok(line, `${route} should exist`);
        assert.ok(line.includes('requireAuth'), `${route} must be authenticated`);
    }
});

test('AI routes still require auth, just per route', () => {
    const src = source('ai.js');
    for (const route of ["router.post('/review'", "router.post('/hint'"]) {
        const line = src.split('\n').find((l) => l.includes(route));
        assert.ok(line, `${route} should exist`);
        assert.ok(
            /protect|requireAuth/.test(line),
            `${route} must still be protected — these call a paid API`
        );
    }
});
