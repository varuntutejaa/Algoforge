// Shared Prisma client singleton — its own module so both config/db.js and
// services/problems.js can depend on it without a circular require.
//
// Deliberately does NOT exit on a missing DATABASE_URL here: the pg Pool
// underneath the adapter connects lazily, so an absent/bad URL only surfaces
// as a query error, which config/db.js's connectWithRetry (fail-fast after
// retries) and routes/publicHealth.js (report 503 degraded) already handle.
// Exiting here would crash anything that merely requires this module without
// a live DB configured, e.g. importing routes/publicHealth.js in a test.
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set in environment. Set DATABASE_URL to your PostgreSQL connection string.');
}

const adapter = new PrismaPg(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

module.exports = { prisma };
