const express = require('express');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const router = express.Router();
const { prisma } = require('../config/prismaClient');
const { formatProblem } = require('../services/problems');
const { requireAdminKey } = require('../middleware/adminAuth');

const adminWriteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(req.ip)
});

router.get('/', async (req, res) => {
    try {
        const problems = await prisma.problem.findMany({
            select: {
                id: true,
                title: true,
                difficulty: true,
                tags: true,
                description: true,
                _count: { select: { testCases: true } }
            },
            orderBy: { createdAt: 'asc' }
        });

        res.json({
            success: true,
            problems: problems.map((problem) => ({
                id: problem.id,
                title: problem.title,
                difficulty: problem.difficulty,
                tags: problem.tags,
                summary: problem.description[0] || "",
                testCaseCount: problem._count.testCases
            }))
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch problems"
        });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const problem = await prisma.problem.findUnique({
            where: { id: req.params.id },
            include: { testCases: true }
        });

        if (!problem) {
            return res.status(404).json({
                success: false,
                message: "Problem not found"
            });
        }

        res.json({
            success: true,
            problem: formatProblem(problem)
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch problem"
        });
    }
});

// Create a new problem (admin)
router.post('/', requireAdminKey, adminWriteLimiter, async (req, res) => {
    try {
        const {
            id,
            title,
            difficulty,
            tags = [],
            description,
            constraints = [],
            example,
            boilerplate,
            testCases,
            runner = null
        } = req.body;

        if (!id || !title || !difficulty || !description || !example || !boilerplate || !testCases) {
            return res.status(400).json({
                success: false,
                message: "Missing required problem fields"
            });
        }

        const existingProblem = await prisma.problem.findUnique({ where: { id } });
        if (existingProblem) {
            return res.status(409).json({
                success: false,
                message: "Problem with this id already exists"
            });
        }

        const problem = await prisma.problem.create({
            data: {
                id,
                title,
                difficulty,
                tags,
                description,
                constraints,
                example,
                boilerplate,
                runner,
                testCases: {
                    create: testCases.map((tc) => ({ name: tc.name, input: tc.input, expected: tc.expected }))
                }
            },
            include: { testCases: true }
        });

        res.status(201).json({
            success: true,
            problem: formatProblem(problem)
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Failed to create problem"
        });
    }
});

module.exports = router;
