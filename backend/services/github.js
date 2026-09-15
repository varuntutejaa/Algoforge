// GitHub integration: exchange the OAuth code, make sure the solutions repo
// exists, and commit accepted solutions into it.
//
// Scope is deliberately `public_repo` rather than `repo` — this feature only
// needs to write to one public solutions repository, and asking for full
// private-repo access for that would be disproportionate.

const GITHUB_API = 'https://api.github.com';
const OAUTH_SCOPE = 'public_repo';

const EXT = {
    python: 'py',
    js: 'js',
    java: 'java',
    cpp: 'cpp',
    c: 'c'
};

function isConfigured() {
    return Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
}

/** URL the browser is sent to so the user can authorize the app. */
function buildAuthorizeUrl(state, redirectUri) {
    const params = new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID,
        redirect_uri: redirectUri,
        scope: OAUTH_SCOPE,
        state,
        allow_signup: 'false'
    });
    return `https://github.com/login/oauth/authorize?${params}`;
}

async function gh(path, token, options = {}) {
    const res = await fetch(`${GITHUB_API}${path}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'AlgoForge',
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...options.headers
        }
    });
    const text = await res.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text }; }
    return { ok: res.ok, status: res.status, body };
}

/** Trades the ?code from the callback for a user access token. */
async function exchangeCodeForToken(code, redirectUri) {
    const res = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': 'AlgoForge' },
        body: JSON.stringify({
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code,
            redirect_uri: redirectUri
        })
    });
    const data = await res.json();
    // GitHub answers 200 with an `error` field rather than a non-2xx status.
    if (!res.ok || data.error || !data.access_token) {
        throw new Error(data.error_description || data.error || 'Could not exchange the GitHub code');
    }
    return { accessToken: data.access_token, scope: data.scope };
}

async function getAuthenticatedUser(token) {
    const { ok, body, status } = await gh('/user', token);
    if (!ok) throw new Error(`GitHub rejected the token (${status})`);
    return { login: body.login, avatarUrl: body.avatar_url };
}

/**
 * Create the solutions repo if it isn't there yet. Returns true when it was
 * created, false when it already existed — an existing repo is reused rather
 * than treated as an error, so reconnecting is safe.
 */
async function ensureRepo(token, owner, repo) {
    const existing = await gh(`/repos/${owner}/${repo}`, token);
    if (existing.ok) return false;
    if (existing.status !== 404) {
        throw new Error(existing.body?.message || `Could not read the repository (${existing.status})`);
    }

    const created = await gh('/user/repos', token, {
        method: 'POST',
        body: JSON.stringify({
            name: repo,
            description: 'Accepted AlgoForge solutions, pushed automatically.',
            private: false,
            auto_init: true // gives the repo a first commit so contents writes have a base
        })
    });
    if (!created.ok) {
        throw new Error(created.body?.message || `Could not create the repository (${created.status})`);
    }
    return true;
}

function solutionPath(problem, language) {
    const ext = EXT[language] || 'txt';
    const difficulty = (problem.difficulty || 'unrated').toLowerCase();
    // Grouped by difficulty so the repo reads like a portfolio rather than a
    // flat dump; the problem id is already a slug.
    return `${difficulty}/${problem.id}/solution.${ext}`;
}

function fileHeader(problem, language, metrics) {
    const comment = language === 'python' ? '#' : '//';
    const lines = [
        `${problem.title}  (${problem.difficulty})`,
        problem.tags?.length ? `Topics: ${problem.tags.join(', ')}` : null,
        metrics?.runtime != null ? `Runtime: ${metrics.runtime}s` : null,
        metrics?.memory != null ? `Memory: ${metrics.memory} KB` : null,
        `Solved on AlgoForge`
    ].filter(Boolean);
    return lines.map((l) => `${comment} ${l}`).join('\n') + '\n\n';
}

/**
 * Commit a solution. The Contents API needs the current blob sha to replace an
 * existing file, so an already-solved problem updates in place instead of
 * failing — re-solving with a better approach overwrites the old answer.
 */
async function pushSolution(token, { owner, repo, problem, language, sourceCode, metrics }) {
    const path = solutionPath(problem, language);
    const content = Buffer.from(fileHeader(problem, language, metrics) + sourceCode, 'utf8').toString('base64');

    const existing = await gh(`/repos/${owner}/${repo}/contents/${encodeURI(path)}`, token);
    const sha = existing.ok ? existing.body?.sha : undefined;

    const res = await gh(`/repos/${owner}/${repo}/contents/${encodeURI(path)}`, token, {
        method: 'PUT',
        body: JSON.stringify({
            message: `${sha ? 'Update' : 'Add'} ${problem.title} (${problem.difficulty})`,
            content,
            ...(sha ? { sha } : {})
        })
    });
    if (!res.ok) {
        throw new Error(res.body?.message || `Could not commit the solution (${res.status})`);
    }
    return {
        path,
        updated: Boolean(sha),
        commitUrl: res.body?.commit?.html_url || null,
        fileUrl: res.body?.content?.html_url || null
    };
}

module.exports = {
    isConfigured,
    buildAuthorizeUrl,
    exchangeCodeForToken,
    getAuthenticatedUser,
    ensureRepo,
    pushSolution,
    solutionPath,
    OAUTH_SCOPE
};
