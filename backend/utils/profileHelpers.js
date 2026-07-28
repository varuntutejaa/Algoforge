const { prisma } = require('../config/prismaClient');

function startOfDay(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function isSameDay(a, b) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function getVerdict(results, passed) {
  if (passed) {
    return "Accepted";
  }

  const statuses = results.map((result) => (result.status || "").toLowerCase());

  if (statuses.some((status) => status.includes("compilation"))) {
    return "Compile Error";
  }

  if (statuses.some((status) => status.includes("runtime"))) {
    return "Runtime Error";
  }

  return "Wrong Answer";
}

function getSubmissionMetrics(results) {
  const runtimes = results
    .map((result) => parseFloat(result.time))
    .filter((value) => Number.isFinite(value));
  const memories = results
    .map((result) => Number(result.memory))
    .filter((value) => Number.isFinite(value));

  return {
    runtime: runtimes.length ? Math.max(...runtimes) : null,
    memory: memories.length ? Math.max(...memories) : null
  };
}

// Mutates `user` in place (matching the pre-existing call sites' expectation
// that they still need to persist it themselves) — returns the fields that
// changed so the caller can pass them straight into a Prisma update.
function updateStreak(user, activityDate = new Date()) {
  const today = startOfDay(activityDate);
  const lastActivity = user.lastActivityDate ? startOfDay(user.lastActivityDate) : null;

  if (lastActivity && isSameDay(lastActivity, today)) {
    return false;
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (lastActivity && isSameDay(lastActivity, yesterday)) {
    user.currentStreak += 1;
  } else {
    user.currentStreak = 1;
  }

  if (user.currentStreak > user.longestStreak) {
    user.longestStreak = user.currentStreak;
  }

  user.lastActivityDate = today;
  return true;
}

// `solvedCount` is passed in (derived via `prisma.solvedProblem.count(...)`)
// rather than read off `user` — there's no embedded array anymore, and this
// keeps formatProfile a pure formatting function with a single source of
// truth for "how many problems solved" (previously this and the stored
// `user.problemsSolved` counter could drift from each other).
function formatProfile(user, solvedCount) {
  const totalSubmissions = user.totalSubmissions || 0;
  const acceptedSubmissions = user.acceptedSubmissions || 0;
  const acceptanceRate = totalSubmissions
    ? Math.round((acceptedSubmissions / totalSubmissions) * 100)
    : 0;

  return {
    name: user.name || "",
    email: user.email || "",
    problemsSolved: solvedCount,
    totalSubmissions,
    acceptedSubmissions,
    acceptanceRate,
    currentStreak: user.currentStreak || 0,
    longestStreak: user.longestStreak || 0
  };
}

function getUserIdFromRequest(req) {
    // Only ever trust the authenticated user set by middleware —
    // never a client-supplied header/body/query id (that was an IDOR).
    return req.user ? req.user.id : null;
}

async function loadRequestUser(req, res) {
    if (req.user) {
        return req.user;
    }

    const userId = getUserIdFromRequest(req);

    if (!userId) {
        res.status(401).json({
            success: false,
            message: "User authentication required"
        });
        return null;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
        res.status(404).json({
            success: false,
            message: "User not found"
        });
        return null;
    }

    return user;
}

module.exports = {
  getVerdict,
  getSubmissionMetrics,
  updateStreak,
  formatProfile,
  startOfDay,
  getUserIdFromRequest,
  loadRequestUser
};
