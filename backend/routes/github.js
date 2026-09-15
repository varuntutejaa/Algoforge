// GitHub solution-sync: connect an account, manage the setting, disconnect.
//
// The OAuth `state` is a signed, short-lived value carrying the AlgoForge user
// id. GitHub sends the browser back to the callback with no Authorization
// header, so the state is what tells us who is connecting — and signing it is
// what stops someone attaching their own GitHub account to another user's
// AlgoForge account (a CSRF on the connect flow).
const express = require('express');
const crypto = require('crypto');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const router = express.Router();

const { prisma } = require('../config/prismaClient');
const { requireAuth } = require('../middleware/auth');
const { encrypt, isConfigured: cryptoReady } = require('../services/crypto');
const github = require('../services/github');
const { pushStoredSolution } = require('../services/githubSync');

const STATE_TTL_MS = 10 * 60 * 1000;

const githubLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip)
});

function stateSecret() {
    // Reuses the token encryption key as an HMAC secret; both are server-side
    // secrets with the same lifetime, and this avoids a second key to manage.
    return process.env.TOKEN_ENCRYPTION_KEY || '';
}

function signState(userId) {
    const payload = `${userId}.${Date.now()}`;
    const mac = crypto.createHmac('sha256', stateSecret()).update(payload).digest('base64url');
    return `${Buffer.from(payload).toString('base64url')}.${mac}`;
}

function verifyState(state) {
    if (typeof state !== 'string' || !state.includes('.')) return null;
    const idx = state.lastIndexOf('.');
    const payloadB64 = state.slice(0, idx);
    const mac = state.slice(idx + 1);

    const payload = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const expected = crypto.createHmac('sha256', stateSecret()).update(payload).digest('base64url');

    const a = Buffer.from(mac);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    const [userId, issuedAt] = payload.split('.');
    if (!userId || !issuedAt) return null;
    if (Date.now() - Number(issuedAt) > STATE_TTL_MS) return null;
    return userId;
}

function callbackUrl(req) {
    // Must match the callback registered on the GitHub OAuth app exactly.
    return process.env.GITHUB_CALLBACK_URL || `${req.protocol}://${req.get('host')}/api/github/callback`;
}

function frontendUrl() {
    const origins = (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
    // Prefer a non-localhost origin so a production callback doesn't bounce the
    // user to a dev server.
    return origins.find((o) => !o.includes('localhost') && !o.includes('127.0.0.1')) || origins[0] || '';
}

function unavailable(res) {
    return res.status(503).json({
        success: false,
        message: 'GitHub sync is not configured on this server.'
    });
}

/** Current connection state, for rendering the settings panel. */
router.get('/status', requireAuth, githubLimiter, async (req, res) => {
    const u = req.user;
    res.json({
        success: true,
        configured: github.isConfigured() && cryptoReady(),
        connected: Boolean(u.githubToken),
        username: u.githubUsername || null,
        repo: u.githubRepo || null,
        syncEnabled: Boolean(u.githubSyncEnabled),
        connectedAt: u.githubConnectedAt || null
    });
});

/** Starts the OAuth dance; the client redirects to the returned url. */
router.get('/connect', requireAuth, githubLimiter, async (req, res) => {
    if (!github.isConfigured() || !cryptoReady()) return unavailable(res);
    const url = github.buildAuthorizeUrl(signState(req.user.id), callbackUrl(req));
    res.json({ success: true, url });
});

/**
 * GitHub redirects the browser here. This is a top-level navigation with no
 * Authorization header, so identity comes from the signed state, and the
 * response is a redirect back into the app rather than JSON.
 */
router.get('/callback', async (req, res) => {
    const site = frontendUrl();
    const back = (params) => res.redirect(`${site}/settings?${new URLSearchParams(params)}`);

    try {
        if (!github.isConfigured() || !cryptoReady()) return back({ github: 'unavailable' });

        const { code, state, error } = req.query;
        if (error) return back({ github: 'denied' });
        if (!code || !state) return back({ github: 'invalid' });

        const userId = verifyState(state);
        if (!userId) return back({ github: 'expired' });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return back({ github: 'invalid' });

        const { accessToken } = await github.exchangeCodeForToken(code, callbackUrl(req));
        const { login } = await github.getAuthenticatedUser(accessToken);

        const repo = user.githubRepo || 'algoforge-solutions';
        await github.ensureRepo(accessToken, login, repo);

        await prisma.user.update({
            where: { id: userId },
            data: {
                githubToken: encrypt(accessToken),
                githubUsername: login,
                githubRepo: repo,
                githubSyncEnabled: true,
                githubConnectedAt: new Date()
            }
        });

        return back({ github: 'connected', user: login, repo });
    } catch (err) {
        console.error('GitHub callback failed:', err.message);
        return back({ github: 'failed' });
    }
});

/** Toggle auto-push, or point it at a different repository. */
router.patch('/settings', requireAuth, githubLimiter, async (req, res) => {
    const { syncEnabled, repo } = req.body;
    const data = {};

    if (typeof syncEnabled === 'boolean') data.githubSyncEnabled = syncEnabled;

    if (repo !== undefined) {
        // GitHub's own rule for repository names.
        if (typeof repo !== 'string' || !/^[A-Za-z0-9._-]{1,100}$/.test(repo)) {
            return res.status(400).json({
                success: false,
                message: 'Repository name may only contain letters, numbers, dots, hyphens and underscores.'
            });
        }
        data.githubRepo = repo;
    }

    if (!Object.keys(data).length) {
        return res.status(400).json({ success: false, message: 'Nothing to update' });
    }

    const updated = await prisma.user.update({ where: { id: req.user.id }, data });
    res.json({
        success: true,
        syncEnabled: updated.githubSyncEnabled,
        repo: updated.githubRepo
    });
});

/**
 * One-off push, for users who keep auto-push off but want a particular
 * solution in their repo. Takes only a problem id — the code pushed is the
 * accepted submission already stored for this user.
 */
router.post('/push', requireAuth, githubLimiter, async (req, res) => {
    const { problemId } = req.body;
    if (!problemId || typeof problemId !== 'string') {
        return res.status(400).json({ success: false, message: 'problemId is required' });
    }

    const result = await pushStoredSolution({ user: req.user, problemId });
    if (!result.ok) {
        const code = result.status === 'not_solved' ? 400
            : result.status === 'not_connected' ? 400
            : result.status === 'not_found' ? 404
            : result.status === 'unavailable' ? 503
            : 502;
        return res.status(code).json({ success: false, status: result.status, message: result.message });
    }

    res.json({
        success: true,
        status: result.status,
        path: result.path,
        url: result.url,
        commitUrl: result.commitUrl,
        repo: result.repo
    });
});

/** Forget the token. Cannot revoke GitHub's grant for the user, so say so. */
router.post('/disconnect', requireAuth, githubLimiter, async (req, res) => {
    await prisma.user.update({
        where: { id: req.user.id },
        data: {
            githubToken: null,
            githubUsername: null,
            githubSyncEnabled: false,
            githubConnectedAt: null
        }
    });
    res.json({
        success: true,
        message: 'GitHub disconnected. You can also revoke access from your GitHub settings.'
    });
});

module.exports = router;
