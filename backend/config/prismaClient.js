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

// pg's Pool defaults to 10 connections. On a serverless host every warm
// instance keeps its own pool, so a handful of concurrent instances can
// exhaust Supabase's connection limit (15 on the free tier) and start
// failing requests with "max clients reached" — observed in practice. A
// serverless instance handles very few concurrent queries, so a small pool
// costs nothing and leaves headroom for other instances and for migrations.
const IS_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const POOL_MAX = Number(process.env.DB_POOL_MAX) || (IS_SERVERLESS ? 2 : 10);

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: POOL_MAX,
    // Don't let an unreachable database hang a request for the platform's
    // full function timeout.
    connectionTimeoutMillis: 10000
});
const prisma = new PrismaClient({ adapter });

module.exports = { prisma };
