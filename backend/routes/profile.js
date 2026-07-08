const express = require('express');
const router = express.Router();
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const { verifyFirebaseToken } = require('../middleware/auth');
const { formatProfile, ensureUserProfileFields, startOfDay } = require('../utils/profileHelpers');

router.get('/', verifyFirebaseToken, async (req, res) => {
    try {
        const user = req.user;
        res.json({
            success: true,
            profile: formatProfile(user)
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch profile"
        });
    }
});

router.get('/streak', verifyFirebaseToken, async (req, res) => {
    try {
        const user = req.user;
        const today = startOfDay(new Date());
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
        const lastActivity = user.lastActivityDate ? startOfDay(user.lastActivityDate) : null;
        const isActive = lastActivity && (
            lastActivity.getTime() === today.getTime() ||
            lastActivity.getTime() === yesterday.getTime()
        );
        const solvedToday = !!(lastActivity && lastActivity.getTime() === today.getTime());
        // streak expired — reset DB value so it doesn't linger
        if (!isActive && user.currentStreak > 0) {
            user.currentStreak = 0;
            await user.save();
        }
        const currentStreak = isActive ? (user.currentStreak || 0) : 0;
        res.json({ currentStreak, longestStreak: user.longestStreak || 0, solvedToday });
    } catch (error) {
        res.status(500).json({ currentStreak: 0, longestStreak: 0, solvedToday: false });
    }
});

router.get('/solved', verifyFirebaseToken, async (req, res) => {
    try {
        const user = req.user;
        ensureUserProfileFields(user);
        const solvedIds = user.solvedProblems.map((entry) => entry.problemId);
        const problems = await Problem.find({ id: { $in: solvedIds } }).lean();
        const problemMap = new Map(problems.map((problem) => [problem.id, problem]));

        const solved = user.solvedProblems
            .slice()
            .sort((a, b) => new Date(b.solvedAt) - new Date(a.solvedAt))
            .map((entry) => {
                const problem = problemMap.get(entry.problemId);
                return {
                    problemId: entry.problemId,
                    solvedAt: entry.solvedAt,
                    title: problem?.title || entry.problemId,
                    difficulty: problem?.difficulty || "Unknown",
                    tags: problem?.tags || []
                };
            });

        res.json({
            success: true,
            solved,
            solvedIds
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch solved problems"
        });
    }
});

router.get('/submissions', verifyFirebaseToken, async (req, res) => {
    try {
        const user = req.user;
        const filter = { userId: user._id };
        const verdict = req.query.verdict;

        if (verdict && verdict !== "All") {
            filter.verdict = verdict;
        }

        const submissions = await Submission.find(filter)
            .sort({ submittedAt: -1 })
            .lean();

        res.json({
            success: true,
            submissions: submissions.map((submission) => ({
                id: submission._id.toString(),
                problemId: submission.problemId,
                problemTitle: submission.problemTitle,
                language: submission.language,
                verdict: submission.verdict,
                runtime: submission.runtime,
                memory: submission.memory,
                submittedAt: submission.submittedAt
            }))
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch submissions"
        });
    }
});

router.get('/activity', verifyFirebaseToken, async (req, res) => {
    try {
        const user = req.user;
        const days = Number(req.query.days) || 365;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (days - 1));
        startDate.setHours(0, 0, 0, 0);

        const activity = await Submission.aggregate([
            {
                $match: {
                    userId: user._id,
                    verdict: "Accepted",
                    submittedAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$submittedAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            success: true,
            activity: activity.map((entry) => ({
                date: entry._id,
                count: entry.count
            }))
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch activity"
        });
    }
});

module.exports = router;
