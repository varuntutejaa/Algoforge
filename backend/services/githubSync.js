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
    if (!user?.githubSyncEnabled || !user.githubToken) return null;
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

module.exports = { syncAcceptedSolution };
