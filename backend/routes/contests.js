const express = require("express");
const crypto = require("crypto");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const { prisma } = require("../config/prismaClient");
const { loadRequestUser, getUserIdFromRequest, getVerdict } = require("../utils/profileHelpers");
const { requireAuth } = require("../middleware/auth");
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
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip)
});

const contestReadLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip)
});

// GET /api/contests - List all contests the user is in or created
router.get("/", contestReadLimiter, async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const where = userId
      ? { OR: [{ createdBy: userId }, { participants: { some: { userId } } }] }
      : {};

    const contests = await prisma.contest.findMany({
      where,
      orderBy: { startsAt: "desc" },
      include: { problems: true, participants: true }
    });

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
    const where = { endsAt: { gt: new Date() } };

    if (userId) {
      where.createdBy = { not: userId };
      where.participants = { none: { userId } };
    }

    const contests = await prisma.contest.findMany({
      where,
      orderBy: { startsAt: "asc" },
      include: { problems: true, participants: true }
    });

    res.json({ success: true, contests: contests.map(formatContest) });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Failed to fetch available contests" });
  }
});

// GET /api/contests/:code - Get contest details (problems only once it starts, unless you created it)
router.get("/:code", requireAuth, contestReadLimiter, async (req, res) => {
  try {
    const code = String(req.params.code || "").toUpperCase();
    const contest = await prisma.contest.findUnique({
      where: { code },
      include: {
        problems: { orderBy: { position: "asc" } },
        participants: { include: { solves: true } }
      }
    });

    if (!contest) {
      return res.status(404).json({ success: false, message: "Contest not found" });
    }

    const isCreator = contest.createdBy === req.user.id;
    const started = new Date() >= contest.startsAt;

    res.json({ success: true, contest: formatContestDetail(contest, { includeProblems: isCreator || started }) });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Failed to fetch contest" });
  }
});

// GET /api/contests/:code/leaderboard
router.get("/:code/leaderboard", requireAuth, contestReadLimiter, async (req, res) => {
  try {
    const code = String(req.params.code || "").toUpperCase();
    const contest = await prisma.contest.findUnique({
      where: { code },
      include: { participants: { include: { solves: true } } }
    });

    if (!contest) {
      return res.status(404).json({ success: false, message: "Contest not found" });
    }

    const leaderboard = contest.participants
      .map((p) => {
        const finishedAt = p.finishedAt || null;
        let timeTakenSeconds = null;
        if (finishedAt && contest.startsAt) {
          timeTakenSeconds = Math.max(0, Math.floor((new Date(finishedAt).getTime() - new Date(contest.startsAt).getTime()) / 1000));
        }

        // per-problem solve times in seconds relative to contest start
        const perProblem = {};
        for (const st of p.solves) {
          if (st.problemId && st.solvedAt && contest.startsAt) {
            perProblem[st.problemId] = Math.max(0, Math.floor(
              (new Date(st.solvedAt).getTime() - new Date(contest.startsAt).getTime()) / 1000
            ));
          }
        }

        return {
          name: p.name,
          userId: p.userId,
          score: p.score,
          penalty: p.penalty,
          wrongAttempts: p.wrongAttempts,
          solvedProblems: p.solves.map((s) => s.problemId),
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
router.post("/create", requireAuth, async (req, res) => {
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
      exists = await prisma.contest.findUnique({ where: { code } });
    }

    const startsAtDate = new Date(startsAt);
    const endsAtDate = new Date(startsAtDate.getTime() + durationMinutes * 60 * 1000);

    let contestProblems = [];

    if (isRandom) {
      // Pick random problems from the database
      const count = problems?.count || 3;
      const sampled = await prisma.$queryRaw`SELECT id, title FROM problems ORDER BY random() LIMIT ${count}`;
      contestProblems = sampled.map((p) => ({ problemId: p.id, title: p.title }));
    } else if (problems && Array.isArray(problems) && problems.length > 0) {
      // Use selected problems
      const problemDocs = await prisma.problem.findMany({ where: { id: { in: problems } } });
      contestProblems = problemDocs.map((p) => ({ problemId: p.id, title: p.title }));
    } else {
      return res.status(400).json({
        success: false,
        message: "At least one problem must be selected"
      });
    }

    const contest = await prisma.contest.create({
      data: {
        code,
        title,
        description: description || "",
        createdBy: user.id,
        createdByName: user.name || user.email,
        startsAt: startsAtDate,
        endsAt: endsAtDate,
        isRandom: !!isRandom,
        problems: {
          create: contestProblems.map((p, index) => ({ problemId: p.problemId, title: p.title, position: index }))
        },
        participants: {
          create: [{ userId: user.id, authId: req.user?.authId || "", name: user.name || user.email }]
        }
      },
      include: { problems: true, participants: true }
    });

    res.status(201).json({ success: true, contest: formatContest(contest) });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Failed to create contest" });
  }
});

// POST /api/contests/join - Join a contest by code
router.post("/join", requireAuth, async (req, res) => {
  try {
    const user = await loadRequestUser(req, res);
    if (!user) return;

    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: "Contest code is required" });
    }

    const contest = await prisma.contest.findUnique({
      where: { code: code.toUpperCase() },
      include: { problems: true, participants: { include: { solves: true } } }
    });

    if (!contest) {
      return res.status(404).json({ success: false, message: "Contest not found" });
    }

    const now = new Date();

    if (now >= contest.endsAt) {
      return res.status(400).json({ success: false, message: "This contest has already ended" });
    }

    const isCreator = contest.createdBy === user.id;
    const includeProblems = isCreator || now >= contest.startsAt;

    // Check if already a participant
    const existing = contest.participants.find((p) => p.userId === user.id);

    if (existing) {
      // Backfill authId if it was empty (older join) so refresh-matching works
      if (!existing.authId && req.user?.authId) {
        await prisma.contestParticipant.update({
          where: { contestId_userId: { contestId: contest.id, userId: user.id } },
          data: { authId: req.user.authId }
        });
        existing.authId = req.user.authId;
      }
      return res.json({ success: true, contest: formatContestDetail(contest, { includeProblems }) });
    }

    const newParticipant = await prisma.contestParticipant.create({
      data: { contestId: contest.id, userId: user.id, authId: req.user?.authId || "", name: user.name || user.email },
      include: { solves: true }
    });
    contest.participants.push(newParticipant);

    console.log(`[contests] POST /join user=${user.id} joined code=${code}`);
    res.json({ success: true, contest: formatContestDetail(contest, { includeProblems }) });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Failed to join contest" });
  }
});

// POST /api/contests/:code/submit - Submit a solution within a contest
router.post("/:code/submit", requireAuth, contestSubmitLimiter, async (req, res) => {
  try {
    const user = await loadRequestUser(req, res);
    if (!user) return;

    const { problemId, language, sourceCode } = req.body;

    if (typeof problemId !== "string") {
      return res.status(400).json({ success: false, message: "problemId must be a string" });
    }

    const code = String(req.params.code || "").toUpperCase();
    console.log(`[contests] POST /:code/submit for code=${code} user=${user.id} problemId=${problemId}`);
    const contest = await prisma.contest.findUnique({
      where: { code },
      include: { problems: true }
    });

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
    const problemDoc = await prisma.problem.findUnique({ where: { id: problemId }, include: { testCases: true } });
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

    await prisma.$transaction(async (tx) => {
      let participant = await tx.contestParticipant.findUnique({
        where: { contestId_userId: { contestId: contest.id, userId: user.id } },
        include: { solves: true }
      });

      // Self-heal: if the user submits but isn't registered yet (join failed,
      // direct URL, expired token at join time), register them now so their
      // solve is always recorded and they appear on the leaderboard.
      if (!participant) {
        participant = await tx.contestParticipant.create({
          data: { contestId: contest.id, userId: user.id, authId: req.user?.authId || "", name: user.name || user.email },
          include: { solves: true }
        });
        console.log(`[contests] /submit auto-registered user=${user.id} in code=${code}`);
      } else if (!participant.authId && req.user?.authId) {
        // Backfill authId for participants joined before this field existed
        await tx.contestParticipant.update({
          where: { contestId_userId: { contestId: contest.id, userId: user.id } },
          data: { authId: req.user.authId }
        });
      }

      const alreadySolved = participant.solves.some((s) => s.problemId === problemId);
      const participantUpdate = {};

      if (!alreadySolved) {
        if (verdict === "Accepted") {
          participantUpdate.score = { increment: 100 };
          await tx.contestSolve.create({ data: { contestId: contest.id, userId: user.id, problemId, solvedAt: new Date() } });
        } else {
          participantUpdate.score = { increment: -10 };
          participantUpdate.penalty = { increment: -10 };
          participantUpdate.wrongAttempts = { increment: 1 };
        }
      }

      // Check if all problems solved - mark finished
      const newSolvedCount = participant.solves.length + (!alreadySolved && verdict === "Accepted" ? 1 : 0);
      if (newSolvedCount === contest.problems.length && !participant.finishedAt) {
        participantUpdate.finishedAt = new Date();
      }

      if (Object.keys(participantUpdate).length > 0) {
        await tx.contestParticipant.update({
          where: { contestId_userId: { contestId: contest.id, userId: user.id } },
          data: participantUpdate
        });
      }

      // If every participant has finished all problems, end the contest early
      const allParticipants = await tx.contestParticipant.findMany({ where: { contestId: contest.id } });
      const allFinished = allParticipants.length > 0 && allParticipants.every((p) => p.finishedAt != null);

      if (allFinished) {
        await tx.contest.update({ where: { id: contest.id }, data: { endsAt: new Date() } });
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Failed to record contest submission" });
  }
});

// `status` isn't a stored column — it's computed from startsAt/endsAt plus
// whether every participant has already finished (replaces a race-prone
// fire-and-forget bulkWrite that used to patch a stored status field).
function computeStatus(contest, participants) {
  const now = new Date();
  if (now < contest.startsAt) return "upcoming";
  if (now >= contest.endsAt) return "ended";
  if (participants.length > 0 && participants.every((p) => p.finishedAt != null)) return "ended";
  return "active";
}

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
    status: computeStatus(contest, contest.participants),
    isRandom: contest.isRandom
  };
}

function formatContestDetail(contest, { includeProblems = true } = {}) {
  return {
    ...formatContest(contest),
    problems: includeProblems ? contest.problems.map((p) => ({ problemId: p.problemId, title: p.title })) : [],
    participants: (contest.participants || []).map((p) => ({
      userId: p.userId,
      name: p.name,
      score: p.score,
      penalty: p.penalty,
      wrongAttempts: p.wrongAttempts,
      solvedProblems: (p.solves || []).map((s) => s.problemId),
      finishedAt: p.finishedAt
    }))
  };
}

module.exports = router;
