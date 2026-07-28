// Public, unauthenticated health endpoint for load-balancer/deploy-pipeline checks.
// Deliberately minimal — no config/env details exposed.
const express = require('express');
const { prisma } = require('../config/prismaClient');
const router = express.Router();

const startedAt = Date.now();

router.get('/health', async (req, res) => {
    let dbConnected = false;
    try {
        await prisma.$queryRaw`SELECT 1`;
        dbConnected = true;
    } catch {
        dbConnected = false;
    }

    res.status(dbConnected ? 200 : 503).json({
        status: dbConnected ? 'ok' : 'degraded',
        version: process.env.APP_VERSION || 'dev',
        uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
        db: dbConnected ? 'connected' : 'disconnected'
    });
});

module.exports = router;
