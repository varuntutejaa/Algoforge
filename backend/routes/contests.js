const express = require("express");
const crypto = require("crypto");
const Contest = require("../models/Contest");
const Problem = require("../models/Problem");
const Submission = require("../models/Submission");
const { loadRequestUser, ensureUserProfileFields, getUserIdFromRequest } = require("../utils/profileHelpers");

const router = express.Router();

function generateContestCode() {
  return crypto.randomBytes(3).toString("hex").toUpperCase().slice(0, 6);
}

// GET /api/contests - List all contests the user is in or created
router.get("/", async (req, res) => {
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

    // Auto-update status based on time
    const bulkOps = [];
    for (const contest of contests) {
      if (contest.status === "upcoming" && now >= contest.startsAt && now < contest.endsAt) {
        bulkOps.push({
          updateOne: {
            filter: { _id: contest._id, status: "upcoming" },
            update: { $set: { status: "active" } }
          }
        });
      } else if (contest.status !== "ended" && now >= contest.endsAt) {
        bulkOps.push({
          updateOne: {
            filter: { _id: contest._id, status: { $ne: "ended" } },
            update: { $set: { status: "ended" } }
          }
        });
      }
    }

    if (bulkOps.length) {
      await Contest.bulkWrite(bulkOps);
      // Re-fetch with updated statuses
      const updated = await Contest.find(filter).sort({ startsAt: -1 }).lean();
      return res.json({ success: true, contests: updated.map(formatContest) });
    }

    res.json({ success: true, contests: contests.map(formatContest) });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Failed to fetch contests" });
  }
});

// GET /api/contests/available - Get contests available to join (upcoming + active, not joined, not created by user)
router.get("/available", async (req, res) => {
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

// GET /api/contests/:code - Get contest details (including problems if active)
router.get("/:code", async (req, res) => {
  try {
    const code = String(req.params.code || '').toUpperCase();
    console.log(`[contests] GET /:code request for code=${code} from ip=${req.ip} headers.x-user-id=${req.headers['x-user-id']}`);
    const contest = await Contest.findOne({ code }).lean();

    if (!contest) {
      return res.status(404).json({ success: false, message: "Contest not found" });
    }

    res.json({ success: true, contest: formatContestDetail(contest) });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Failed to fetch contest" });
  }
});

// GET /api/contests/:code/leaderboard
router.get("/:code/leaderboard", async (req, res) => {
  try {
    const code = String(req.params.code || '').toUpperCase();
    console.log(`[contests] GET /:code/leaderboard for code=${code} headers.x-user-id=${req.headers['x-user-id']}`);
    const contest = await Contest.findOne({ code }).lean();

    if (!contest) {
      return res.status(404).json({ success: false, message: "Contest not found" });
    }

    const leaderboard = contest.participants
      .slice()
      .sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0))
      .map((p, index) => {
        const finishedAt = p.finishedAt || null;
        let timeTakenSeconds = null;
        try {
          if (finishedAt && contest.startsAt) {
            timeTakenSeconds = Math.max(0, Math.floor((new Date(finishedAt).getTime() - new Date(contest.startsAt).getTime()) / 1000));
          }
        } catch (e) { timeTakenSeconds = null; }

        return {
          rank: index + 1,
          name: p.name,
          score: Number(p.score) || 0,
          solvedProblems: p.solvedProblems || [],
          finishedAt: finishedAt,
          timeTakenSeconds
        };
      });

    res.json({ success: true, leaderboard });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Failed to fetch leaderboard" });
  }
});

// POST /api/contests/create - Create a new contest
router.post("/create", async (req, res) => {
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
router.post("/join", async (req, res) => {
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

    // Check if already a participant
    const alreadyJoined = contest.participants.some(
      (p) => p.userId.toString() === user._id.toString()
    );

    if (alreadyJoined) {
      return res.json({ success: true, contest: formatContest(contest.toObject()) });
    }

    contest.participants.push({
      userId: user._id,
      name: user.name || user.email,
      score: 0,
      solvedProblems: [],
    });

    await contest.save();

    console.log(`[contests] POST /join user=${user._id} joined code=${code}`);
    res.json({
      success: true,
      contest: formatContestDetail(contest.toObject())
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Failed to join contest" });
  }
});

// POST /api/contests/:code/submit - Submit a solution within a contest
router.post("/:code/submit", async (req, res) => {
  try {
    const user = await loadRequestUser(req, res);
    if (!user) return;

    const { problemId, language, sourceCode, verdict } = req.body;
    const code = String(req.params.code || '').toUpperCase();
    console.log(`[contests] POST /:code/submit for code=${code} user=${user._id} verdict=${req.body?.verdict}`);
    const contest = await Contest.findOne({ code });

    if (!contest) {
      return res.status(404).json({ success: false, message: "Contest not found" });
    }

    const now = new Date();
    if (now < contest.startsAt || now >= contest.endsAt) {
      return res.status(400).json({ success: false, message: "Contest is not active" });
    }

    const participant = contest.participants.find(
      (p) => p.userId.toString() === user._id.toString()
    );

    if (!participant) {
      return res.status(403).json({ success: false, message: "You are not a participant in this contest" });
    }

    // If accepted and not already solved this problem
    if (verdict === "Accepted" && !participant.solvedProblems.includes(problemId)) {
      if (!Array.isArray(participant.solvedProblems)) participant.solvedProblems = [];
      participant.solvedProblems.push(problemId);
      if (typeof participant.score !== 'number' || Number.isNaN(participant.score)) participant.score = 0;
      participant.score = Number(participant.score) + 1;
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

function formatContestDetail(contest) {
  return {
    ...formatContest(contest),
    problems: contest.problems,
    participants: contest.participants
  };
}

module.exports = router;