// Bridge between "a submission was accepted" and "commit it to the user's
// repository".
//
// Everything here is best-effort by design. A submission is the user's work and
// its verdict is already decided by the time we get called, so a GitHub outage,
// a revoked token or a deleted repository must never turn a solve into an
// error. Failures are returned as a structured result for the UI to surface,
// and logged, but never thrown.
const { prisma } = require('../config/prismaClient');
const { decrypt, isConfigured: cryptoReady } = require('./crypto');
const github = require('./github');

/**
 * @returns {Promise<null|{status:string, ...}>} null when the user has not
 * opted in at all (so the response stays clean), otherwise a result object.
 */
async function syncAcceptedSolution({ user, problem, language, sourceCode, metrics }) {
    if (!user?.githubToken) return null;
    // Connected but auto-push paused: say so rather than staying silent, so the
    // result panel can offer a one-off push instead of making the user go to
    // settings, flip a switch and re-submit.
    if (!user.githubSyncEnabled) return { status: 'disabled' };
    if (!github.isConfigured() || !cryptoReady()) {
        return { status: 'unavailable', message: 'GitHub sync is not configured on this server.' };
    }

    let token;
    try {
        token = decrypt(user.githubToken);
    } catch (err) {
        // A key rotation or a tampered row lands here. The stored value is
        // unusable, so clear it rather than failing on every future submission.
        console.error('GitHub token could not be decrypted, clearing it:', err.message);
        await clearConnection(user.id);
        return { status: 'reconnect', message: 'GitHub connection expired. Please reconnect.' };
    }

    try {
        const result = await github.pushSolution(token, {
            owner: user.githubUsername,
            repo: user.githubRepo,
            problem,
            language,
            sourceCode,
            metrics
        });
        return {
            status: result.updated ? 'updated' : 'created',
            path: result.path,
            url: result.fileUrl,
            commitUrl: result.commitUrl,
            repo: `${user.githubUsername}/${user.githubRepo}`
        };
    } catch (err) {
        const message = err.message || 'Could not push to GitHub';

        // 401 means the user revoked the grant on GitHub's side; keeping the
        // dead token would fail silently on every later submission.
        if (/\b401\b|Bad credentials|rejected the token/i.test(message)) {
            await clearConnection(user.id);
            return { status: 'reconnect', message: 'GitHub access was revoked. Please reconnect.' };
        }
        // 404 on a repo we expected means it was renamed or deleted.
        if (/Not Found/i.test(message)) {
            return {
                status: 'missing_repo',
                message: `Repository ${user.githubUsername}/${user.githubRepo} was not found. Check it still exists.`
            };
        }

        console.error('GitHub push failed:', message);
        return { status: 'failed', message };
    }
}

/**
 * On-demand push for a user who has connected GitHub but left auto-push off.
 *
 * Deliberately pushes the stored *accepted* submission rather than code sent
 * with the request: this endpoint writes to someone's repository, and taking
 * arbitrary file contents from the client would turn it into a general-purpose
 * GitHub writer. Pushing what the judge actually accepted also means the repo
 * only ever contains verified-correct solutions.
 */
async function pushStoredSolution({ user, problemId }) {
    if (!user?.githubToken) {
        return { ok: false, status: 'not_connected', message: 'Connect GitHub first.' };
    }
    if (!github.isConfigured() || !cryptoReady()) {
        return { ok: false, status: 'unavailable', message: 'GitHub sync is not configured on this server.' };
    }

    const submission = await prisma.submission.findFirst({
        where: { userId: user.id, problemId, verdict: 'Accepted' },
        orderBy: { submittedAt: 'desc' }
    });
    if (!submission) {
        return { ok: false, status: 'not_solved', message: 'Solve this problem first — only accepted solutions can be pushed.' };
    }

    const problem = await prisma.problem.findUnique({ where: { id: problemId } });
    if (!problem) {
        return { ok: false, status: 'not_found', message: 'Problem not found.' };
    }

    // Reuse the same path/error handling as the automatic push by running it
    // against a user object with sync temporarily treated as enabled.
    const result = await syncAcceptedSolution({
        user: { ...user, githubSyncEnabled: true },
        problem,
        language: submission.language,
        sourceCode: submission.sourceCode,
        metrics: { runtime: submission.runtime, memory: submission.memory }
    });

    if (!result || result.status === 'created' || result.status === 'updated') {
        return { ok: true, ...(result || {}) };
    }
    return { ok: false, ...result };
}

async function clearConnection(userId) {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: { githubToken: null, githubSyncEnabled: false }
        });
    } catch (err) {
        console.error('Could not clear the GitHub connection:', err.message);
    }
}

module.exports = { syncAcceptedSolution, pushStoredSolution };
