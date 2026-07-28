const express = require('express');
const router = express.Router();
const { prisma } = require('../config/prismaClient');
const { requireAuth } = require('../middleware/auth');
const { formatProfile, startOfDay } = require('../utils/profileHelpers');

router.get('/', requireAuth, async (req, res) => {
    try {
        const user = req.user;
        const solvedCount = await prisma.solvedProblem.count({ where: { userId: user.id } });
        res.json({
            success: true,
            profile: formatProfile(user, solvedCount)
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch profile"
        });
    }
});

router.get('/streak', requireAuth, async (req, res) => {
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
            await prisma.user.update({ where: { id: user.id }, data: { currentStreak: 0 } });
        }
        const currentStreak = isActive ? (user.currentStreak || 0) : 0;
        res.json({ currentStreak, longestStreak: user.longestStreak || 0, solvedToday });
    } catch (error) {
        res.status(500).json({ currentStreak: 0, longestStreak: 0, solvedToday: false });
    }
});

router.get('/solved', requireAuth, async (req, res) => {
    try {
        const user = req.user;
        const solvedRows = await prisma.solvedProblem.findMany({
            where: { userId: user.id },
            orderBy: { solvedAt: 'desc' },
            include: { problem: { select: { title: true, difficulty: true, tags: true } } }
        });

        const solved = solvedRows.map((row) => ({
            problemId: row.problemId,
            solvedAt: row.solvedAt,
            title: row.problem?.title || row.problemId,
            difficulty: row.problem?.difficulty || "Unknown",
            tags: row.problem?.tags || []
        }));
        const solvedIds = solvedRows.map((row) => row.problemId);

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

router.get('/submissions', requireAuth, async (req, res) => {
    try {
        const user = req.user;
        const where = { userId: user.id };
        const verdict = req.query.verdict;

        if (verdict && verdict !== "All") {
            where.verdict = verdict;
        }

        const submissions = await prisma.submission.findMany({
            where,
            orderBy: { submittedAt: 'desc' }
        });

        res.json({
            success: true,
            submissions: submissions.map((submission) => ({
                id: submission.id,
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

router.get('/activity', requireAuth, async (req, res) => {
    try {
        const user = req.user;
        const days = Number(req.query.days) || 365;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (days - 1));
        startDate.setHours(0, 0, 0, 0);

        const activity = await prisma.$queryRaw`
            SELECT to_char(submitted_at, 'YYYY-MM-DD') AS date, COUNT(*)::int AS count
            FROM submissions
            WHERE user_id = ${user.id} AND verdict = 'Accepted' AND submitted_at >= ${startDate}
            GROUP BY date
            ORDER BY date ASC
        `;

        res.json({
            success: true,
            activity: activity.map((entry) => ({
                date: entry.date,
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
