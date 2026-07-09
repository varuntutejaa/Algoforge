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

function updateStreak(user, activityDate = new Date()) {
  const today = startOfDay(activityDate);
  const lastActivity = user.lastActivityDate ? startOfDay(user.lastActivityDate) : null;

  if (lastActivity && isSameDay(lastActivity, today)) {
    return;
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
}

function formatProfile(user) {
  const solvedProblems = user.solvedProblems || [];
  const totalSubmissions = user.totalSubmissions || 0;
  const acceptedSubmissions = user.acceptedSubmissions || 0;
  const acceptanceRate = totalSubmissions
    ? Math.round((acceptedSubmissions / totalSubmissions) * 100)
    : 0;

  return {
    name: user.name || "",
    email: user.email || "",
    problemsSolved: solvedProblems.length,
    totalSubmissions,
    acceptedSubmissions,
    acceptanceRate,
    currentStreak: user.currentStreak || 0,
    longestStreak: user.longestStreak || 0
  };
}

function ensureUserProfileFields(user) {
  if (!user.solvedProblems) user.solvedProblems = [];
  if (user.totalSubmissions == null) user.totalSubmissions = 0;
  if (user.acceptedSubmissions == null) user.acceptedSubmissions = 0;
  if (user.currentStreak == null) user.currentStreak = 0;
  if (user.longestStreak == null) user.longestStreak = 0;
  return user;
}

function getUserIdFromRequest(req) {
    // Only ever trust the Firebase-authenticated user set by middleware —
    // never a client-supplied header/body/query id (that was an IDOR).
    return req.user ? req.user._id : null;
}

async function loadRequestUser(req, res) {
    const User = require('../models/users');
    
    // If Firebase middleware already loaded the user, use it
    if (req.user) {
        ensureUserProfileFields(req.user);
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

    const user = await User.findById(userId);

    if (!user) {
        res.status(404).json({
            success: false,
            message: "User not found"
        });
        return null;
    }

    ensureUserProfileFields(user);
    return user;
}

module.exports = {
  getVerdict,
  getSubmissionMetrics,
  updateStreak,
  formatProfile,
  ensureUserProfileFields,
  startOfDay,
  getUserIdFromRequest,
  loadRequestUser
};
