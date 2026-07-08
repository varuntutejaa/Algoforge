// Persist / retrieve a user's in-progress code per problem+language.
const express = require('express');
const router = express.Router();
const UserCode = require('../models/UserCode');
const { verifyFirebaseToken } = require('../middleware/auth');
const { languageIds } = require('../services/judge0');

router.post('/save', verifyFirebaseToken, async (req, res) => {
    try {
        const user = req.user;
        const { problemId, language, sourceCode } = req.body;

        if (!problemId || !language || typeof sourceCode !== "string") {
            return res.status(400).json({
                success: false,
                message: "problemId, language, and sourceCode are required"
            });
        }

        if (!languageIds[language]) {
            return res.status(400).json({
                success: false,
                message: "Unsupported language"
            });
        }

        const saved = await UserCode.findOneAndUpdate(
            { userId: user._id, problemId, language },
            {
                userId: user._id,
                problemId,
                language,
                sourceCode,
                updatedAt: new Date()
            },
            { upsert: true, returnDocument: "after", runValidators: true }
        );

        res.json({
            success: true,
            updatedAt: saved.updatedAt
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Failed to save code"
        });
    }
});

router.get('/:problemId/:language', verifyFirebaseToken, async (req, res) => {
    try {
        const user = req.user;
        const { problemId, language } = req.params;

        if (!languageIds[language]) {
            return res.status(400).json({
                success: false,
                message: "Unsupported language"
            });
        }

        const savedCode = await UserCode.findOne({
            userId: user._id,
            problemId,
            language
        }).lean();

        if (!savedCode) {
            return res.status(404).json({
                success: false,
                message: "No saved code"
            });
        }

        res.json({
            success: true,
            sourceCode: savedCode.sourceCode,
            updatedAt: savedCode.updatedAt
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch saved code"
        });
    }
});

module.exports = router;
