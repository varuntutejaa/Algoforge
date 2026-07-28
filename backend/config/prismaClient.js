// Shared Prisma client singleton — its own module so both config/db.js and
// services/problems.js can depend on it without a circular require.
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set in environment. Set DATABASE_URL to your PostgreSQL connection string.');
    process.exit(1);
}

const adapter = new PrismaPg(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

module.exports = { prisma };
