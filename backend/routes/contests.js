const express = require("express");
const crypto = require("crypto");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const Contest = require("../models/Contest");
const Problem = require("../models/Problem");
const Submission = require("../models/Submission");
const { loadRequestUser, ensureUserProfileFields, getUserIdFromRequest, getVerdict } = require("../utils/profileHelpers");
const { verifyFirebaseToken } = require("../middleware/auth");
const { formatProblem } = require("../services/problems");
const { languageIds, runTestSuite } = require("../services/judge0");

const router = express.Router();

function generateContestCode() {
  return crypto.randomBytes(3).toString("hex").toUpperCase().slice(0, 6);
}

const contestSubmitLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.firebaseUid || ipKeyGenerator(req.ip)
});

const contestReadLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.firebaseUid || ipKeyGenerator(req.ip)
});

// GET /api/contests - List all contests the user is in or created
router.get("/", contestReadLimiter, async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const filter = {};

    if (userId) {
      filter.$or = [
        { createdBy: userId },
        { "participants.userId": userId }
      ];
    }

    const contests = await Contest.find(filter)
      .sort({ startsAt: -1 })
      .lean();

    const now = new Date();

    // Auto-update status in-memory and fire-and-forget bulkWrite — no re-fetch
    const bulkOps = [];
    for (const contest of contests) {
      if (contest.status === "upcoming" && now >= contest.startsAt && now < contest.endsAt) {
        contest.status = "active";
        bulkOps.push({ updateOne: { filter: { _id: contest._id, status: "upcoming" }, update: { $set: { status: "active" } } } });
      } else if (contest.status !== "ended" && now >= contest.endsAt) {
        contest.status = "ended";
        bulkOps.push({ updateOne: { filter: { _id: contest._id, status: { $ne: "ended" } }, update: { $set: { status: "ended" } } } });
      }
    }

    if (bulkOps.length) Contest.bulkWrite(bulkOps).catch(console.error);

    res.json({ success: true, contests: contests.map(formatContest) });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Failed to fetch contests" });
  }
});

// GET /api/contests/available - Get contests available to join (upcoming + active, not joined, not created by user)
router.get("/available", contestReadLimiter, async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const now = new Date();

    const filter = {
      endsAt: { $gt: now }
    };

    if (userId) {
      filter.createdBy = { $ne: userId };
      filter["participants.userId"] = { $ne: userId };
    }

    const contests = await Contest.find(filter)
      .sort({ startsAt: 1 })
      .lean();

    res.json({ success: true, contests: contests.map(formatContest) });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Failed to fetch available contests" });
  }
});

// GET /api/contests/:code - Get contest details (problems only once it starts, unless you created it)
router.get("/:code", verifyFirebaseToken, contestReadLimiter, async (req, res) => {
  try {
    const code = String(req.params.code || '').toUpperCase();
    const contest = await Contest.findOne({ code }).lean();

    if (!contest) {
      return res.status(404).json({ success: false, message: "Contest not found" });
    }

    const isCreator = contest.createdBy && contest.createdBy.toString() === req.user._id.toString();
    const started = new Date() >= new Date(contest.startsAt);

    res.json({ success: true, contest: formatContestDetail(contest, { includeProblems: isCreator || started }) });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Failed to fetch contest" });
  }
});

// GET /api/contests/:code/leaderboard
router.get("/:code/leaderboard", verifyFirebaseToken, contestReadLimiter, async (req, res) => {
  try {
    const code = String(req.params.code || '').toUpperCase();
    const contest = await Contest.findOne({ code }).lean();

    if (!contest) {
      return res.status(404).json({ success: false, message: "Contest not found" });
    }

    const leaderboard = contest.participants
      .slice()
      .map((p) => {
        const finishedAt = p.finishedAt || null;
        let timeTakenSeconds = null;
        try {
          if (finishedAt && contest.startsAt) {
            timeTakenSeconds = Math.max(0, Math.floor((new Date(finishedAt).getTime() - new Date(contest.startsAt).getTime()) / 1000));
          }
        } catch (e) { timeTakenSeconds = null; }
        // per-problem solve times in seconds relative to contest start
        const perProblem = {};
        (p.solveTimestamps || []).forEach((st) => {
          try {
            if (st.problemId && st.solvedAt && contest.startsAt) {
              perProblem[st.problemId] = Math.max(0, Math.floor(
                (new Date(st.solvedAt).getTime() - new Date(contest.startsAt).getTime()) / 1000
              ));
            }
          } catch (e) {}
        });

        return {
          name: p.name,
          userId: p.userId ? p.userId.toString() : null,
          score: Number(p.score) || 0,
          penalty: Number(p.penalty) || 0,
          wrongAttempts: Number(p.wrongAttempts) || 0,
          solvedProblems: p.solvedProblems || [],
          perProblemTimes: perProblem,
          finishedAt,
          timeTakenSeconds
        };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        // tiebreaker: fewer wrong attempts, then faster finish
        if (a.wrongAttempts !== b.wrongAttempts) return a.wrongAttempts - b.wrongAttempts;
        if (a.timeTakenSeconds != null && b.timeTakenSeconds != null) return a.timeTakenSeconds - b.timeTakenSeconds;
        return 0;
      })
      .map((p, index) => ({ rank: index + 1, ...p }));

    res.json({ success: true, leaderboard });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Failed to fetch leaderboard" });
  }
});

// POST /api/contests/create - Create a new contest
router.post("/create", verifyFirebaseToken, async (req, res) => {
  try {
    const user = await loadRequestUser(req, res);
    if (!user) return;

    const { title, description, problems, startsAt, durationMinutes, isRandom } = req.body;

    if (!title || !startsAt || !durationMinutes || durationMinutes < 1) {
      return res.status(400).json({
        success: false,
        message: "Title, start time, and duration (>=1 minute) are required"
      });
    }

    // Generate unique code
    let code;
    let exists = true;
    while (exists) {
      code = generateContestCode();
      exists = await Contest.findOne({ code });
    }

    const startsAtDate = new Date(startsAt);
    const endsAtDate = new Date(startsAtDate.getTime() + durationMinutes * 60 * 1000);

    let contestProblems = [];

    if (isRandom) {
      // Pick random problems from the database
      const count = problems?.count || 3;
      const allProblems = await Problem.aggregate([{ $sample: { size: count } }]);
      contestProblems = allProblems.map((p) => ({
        problemId: p.id,
        title: p.title
      }));
    } else if (problems && Array.isArray(problems) && problems.length > 0) {
      // Use selected problems
      const problemDocs = await Problem.find({ id: { $in: problems } }).lean();
      contestProblems = problemDocs.map((p) => ({
        problemId: p.id,
        title: p.title
      }));
    } else {
      return res.status(400).json({
        success: false,
        message: "At least one problem must be selected"
      });
    }

    const contest = new Contest({
      code,
      title,
      description: description || "",
      createdBy: user._id,
      createdByName: user.name || user.email,
      problems: contestProblems,
      startsAt: startsAtDate,
      endsAt: endsAtDate,
      status: new Date() >= startsAtDate ? "active" : "upcoming",
      isRandom: !!isRandom
    });

    await contest.save();

    // Add creator as participant
    contest.participants.push({
      userId: user._id,
      firebaseUid: req.firebaseUid || "",
      name: user.name || user.email,
      score: 0,
      solvedProblems: [],
    });
    await contest.save();

    res.status(201).json({
      success: true,
      contest: formatContest(contest.toObject())
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Failed to create contest" });
  }
});

// POST /api/contests/join - Join a contest by code
router.post("/join", verifyFirebaseToken, async (req, res) => {
  try {
    const user = await loadRequestUser(req, res);
    if (!user) return;

    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: "Contest code is required" });
    }

    const contest = await Contest.findOne({ code: code.toUpperCase() });

    if (!contest) {
      return res.status(404).json({ success: false, message: "Contest not found" });
    }

    const now = new Date();

    if (now >= contest.endsAt) {
      return res.status(400).json({ success: false, message: "This contest has already ended" });
    }

    const isCreator = contest.createdBy && contest.createdBy.toString() === user._id.toString();
    const includeProblems = isCreator || now >= contest.startsAt;

    // Check if already a participant
    const existing = contest.participants.find(
      (p) => p.userId && p.userId.toString() === user._id.toString()
    );

    if (existing) {
      // Backfill firebaseUid if it was empty (older join) so refresh-matching works
      if (!existing.firebaseUid && req.firebaseUid) {
        existing.firebaseUid = req.firebaseUid;
        await contest.save();
      }
      return res.json({ success: true, contest: formatContestDetail(contest.toObject(), { includeProblems }) });
    }

    contest.participants.push({
      userId: user._id,
      firebaseUid: req.firebaseUid || "",
      name: user.name || user.email,
      score: 0,
      solvedProblems: [],
    });

    await contest.save();

    console.log(`[contests] POST /join user=${user._id} joined code=${code}`);
    res.json({
      success: true,
      contest: formatContestDetail(contest.toObject(), { includeProblems })
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Failed to join contest" });
  }
});

// POST /api/contests/:code/submit - Submit a solution within a contest
router.post("/:code/submit", verifyFirebaseToken, contestSubmitLimiter, async (req, res) => {
  try {
    const user = await loadRequestUser(req, res);
    if (!user) return;

    const { problemId, language, sourceCode } = req.body;

    if (typeof problemId !== "string") {
      return res.status(400).json({ success: false, message: "problemId must be a string" });
    }

    const code = String(req.params.code || '').toUpperCase();
    console.log(`[contests] POST /:code/submit for code=${code} user=${user._id} problemId=${problemId}`);
    const contest = await Contest.findOne({ code });

    if (!contest) {
      return res.status(404).json({ success: false, message: "Contest not found" });
    }

    const now = new Date();
    if (now < contest.startsAt || now >= contest.endsAt) {
      return res.status(400).json({ success: false, message: "Contest is not active" });
    }

    const inContest = contest.problems.some((p) => p.problemId === problemId);
    if (!inContest) {
      return res.status(400).json({ success: false, message: "Problem is not part of this contest" });
    }

    if (!languageIds[language]) {
      return res.status(400).json({ success: false, message: "Unsupported language" });
    }

    if (!sourceCode || typeof sourceCode !== "string") {
      return res.status(400).json({ success: false, message: "Source code is required" });
    }

    // Verdict is computed here, server-side, against the real judge — never trust a client-supplied verdict.
    const problemDoc = await Problem.findOne({ id: problemId });
    if (!problemDoc) {
      return res.status(404).json({ success: false, message: "Problem not found" });
    }

    const problem = formatProblem(problemDoc);
    const { ready, results, passed } = await runTestSuite(problem, language, sourceCode);

    if (!ready) {
      return res.status(422).json({
        success: false,
        message: "This problem doesn't have test cases yet and can't be judged."
      });
    }

    const verdict = getVerdict(results, passed);

    let participant = contest.participants.find(
      (p) => p.userId && p.userId.toString() === user._id.toString()
    );

    // Self-heal: if the user submits but isn't registered yet (join failed,
    // direct URL, expired token at join time), register them now so their
    // solve is always recorded and they appear on the leaderboard.
    if (!participant) {
      contest.participants.push({
        userId: user._id,
        firebaseUid: req.firebaseUid || "",
        name: user.name || user.email,
        score: 0,
        solvedProblems: [],
      });
      participant = contest.participants[contest.participants.length - 1];
      console.log(`[contests] /submit auto-registered user=${user._id} in code=${code}`);
    }

    // Backfill firebaseUid for participants joined before this field existed
    if (!participant.firebaseUid && req.firebaseUid) {
      participant.firebaseUid = req.firebaseUid;
    }

    const alreadySolved = participant.solvedProblems.includes(problemId);

    if (!alreadySolved) {
      if (verdict === "Accepted") {
        if (!Array.isArray(participant.solvedProblems)) participant.solvedProblems = [];
        participant.solvedProblems.push(problemId);
        if (!Array.isArray(participant.solveTimestamps)) participant.solveTimestamps = [];
        participant.solveTimestamps.push({ problemId, solvedAt: new Date() });
        if (typeof participant.score !== 'number' || Number.isNaN(participant.score)) participant.score = 0;
        participant.score = Number(participant.score) + 100;
      } else {
        participant.score = (Number(participant.score) || 0) - 10;
        participant.penalty = (Number(participant.penalty) || 0) - 10;
        participant.wrongAttempts = (Number(participant.wrongAttempts) || 0) + 1;
      }
    }

    // Check if all problems solved - mark finished
    if (participant.solvedProblems.length === contest.problems.length && !participant.finishedAt) {
      participant.finishedAt = new Date();
    }

    // If every participant has finished all problems, end the contest early
    try {
      const allFinished = contest.participants.length > 0 && contest.participants.every((p) => {
        const solvedCount = Array.isArray(p.solvedProblems) ? p.solvedProblems.length : 0;
        return p.finishedAt || solvedCount === contest.problems.length;
      });

      if (allFinished) {
        contest.status = 'ended';
        contest.endsAt = new Date();
      }
    } catch (e) {
      // ignore
    }

    await contest.save();

    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Failed to record contest submission" });
  }
});

function formatContest(contest) {
  return {
    code: contest.code,
    title: contest.title,
    description: contest.description || "",
    createdByName: contest.createdByName,
    problemCount: contest.problems.length,
    participantCount: contest.participants.length,
    startsAt: contest.startsAt,
    endsAt: contest.endsAt,
    status: contest.status,
    isRandom: contest.isRandom
  };
}

function formatContestDetail(contest, { includeProblems = true } = {}) {
  return {
    ...formatContest(contest),
    problems: includeProblems ? contest.problems : [],
    participants: (contest.participants || []).map(({ firebaseUid, ...rest }) => rest)
  };
}

module.exports = router;