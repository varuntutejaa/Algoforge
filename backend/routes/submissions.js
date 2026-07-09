const express = require('express');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const router = express.Router();
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const { getVerdict, getSubmissionMetrics, updateStreak } = require('../utils/profileHelpers');
const { formatProblem, getDailyProblemId } = require('../services/problems');
const { languageIds, runJudge0Submission } = require('../services/judge0');

const submitLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.firebaseUid || ipKeyGenerator(req.ip)
});

router.post('/', submitLimiter, async (req, res) => {
    try {
        const { problemId = "two-sum", language, sourceCode, action = "submit" } = req.body;
        const isSubmit = action === "submit";
        const problemDoc = await Problem.findOne({ id: problemId });

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
        const results = [];

        for (const testCase of problem.testCases) {
            const result = await runJudge0Submission(problem, language, sourceCode, testCase);
            results.push(result);
        }

        const passed = results.every((result) => result.passed);
        const verdict = getVerdict(results, passed);
        const { runtime, memory } = getSubmissionMetrics(results);
        const user = req.user;

        if (user && isSubmit) {
            await Submission.create({
                userId: user._id,
                problemId: problem.id,
                problemTitle: problemDoc.title,
                language,
                verdict,
                runtime,
                memory,
                sourceCode,
                submittedAt: new Date()
            });

            user.totalSubmissions += 1;

            if (passed && verdict === "Accepted") {
                user.acceptedSubmissions += 1;
                user.problemsSolved = (user.problemsSolved || 0) + 1;

                const dailyId = await getDailyProblemId();
                if (dailyId && problem.id === dailyId) {
                    updateStreak(user);
                }

                const alreadySolved = user.solvedProblems.some(
                    (entry) => entry.problemId === problem.id
                );

                if (!alreadySolved) {
                    user.solvedProblems.push({
                        problemId: problem.id,
                        solvedAt: new Date()
                    });
                }
            }

            await user.save();
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
