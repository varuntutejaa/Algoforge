const express = require('express');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const router = express.Router();
const { prisma } = require('../config/prismaClient');
const { getVerdict, getSubmissionMetrics, updateStreak } = require('../utils/profileHelpers');
const { formatProblem, getDailyProblemId } = require('../services/problems');
const { languageIds, runTestSuite } = require('../services/judge0');

const submitLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip)
});

router.post('/', submitLimiter, async (req, res) => {
    try {
        const { problemId = "two-sum", language, sourceCode, action = "submit" } = req.body;

        if (typeof problemId !== "string") {
            return res.status(400).json({
                success: false,
                message: "problemId must be a string"
            });
        }

        const isSubmit = action === "submit";
        const problemDoc = await prisma.problem.findUnique({
            where: { id: problemId },
            include: { testCases: true }
        });

        if (!problemDoc) {
            return res.status(404).json({
                success: false,
                message: "Problem not found"
            });
        }

        if (!languageIds[language]) {
            return res.status(400).json({
                success: false,
                message: "Unsupported language"
            });
        }

        if (!sourceCode || typeof sourceCode !== "string") {
            return res.status(400).json({
                success: false,
                message: "Source code is required"
            });
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
        const { runtime, memory } = getSubmissionMetrics(results);
        const user = req.user;

        if (user && isSubmit) {
            await prisma.$transaction(async (tx) => {
                await tx.submission.create({
                    data: {
                        userId: user.id,
                        problemId: problem.id,
                        problemTitle: problemDoc.title,
                        language,
                        verdict,
                        runtime,
                        memory,
                        sourceCode,
                        submittedAt: new Date()
                    }
                });

                const updateData = { totalSubmissions: { increment: 1 } };

                if (passed && verdict === "Accepted") {
                    updateData.acceptedSubmissions = { increment: 1 };

                    const dailyId = await getDailyProblemId();
                    if (dailyId && problem.id === dailyId) {
                        const changed = updateStreak(user);
                        if (changed) {
                            updateData.currentStreak = user.currentStreak;
                            updateData.longestStreak = user.longestStreak;
                            updateData.lastActivityDate = user.lastActivityDate;
                        }
                    }

                    // Upsert instead of the old find-in-array + push de-dup —
                    // the (userId, problemId) primary key enforces uniqueness.
                    await tx.solvedProblem.upsert({
                        where: { userId_problemId: { userId: user.id, problemId: problem.id } },
                        update: {},
                        create: { userId: user.id, problemId: problem.id }
                    });
                }

                await tx.user.update({ where: { id: user.id }, data: updateData });
            });
        }

        res.json({
            success: true,
            passed,
            action: isSubmit ? "submit" : "run",
            totalTests: results.length,
            passedTests: results.filter((result) => result.passed).length,
            results,
            verdict
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Code submission failed",
            error: error.message
        });
    }
});

module.exports = router;
