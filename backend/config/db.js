// PostgreSQL (RDS) connection check with retry + logging.
const { prisma } = require('./prismaClient');
const { migratePythonBoilerplates } = require('../services/problems');

async function connectWithRetry(retries = 5, delayMs = 3000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await prisma.$queryRaw`SELECT 1`;
            console.log('PostgreSQL Connected');
            await migratePythonBoilerplates();
            return;
        } catch (err) {
            console.error(`PostgreSQL connection attempt ${attempt} failed: ${err.message}`);
            if (attempt < retries) {
                console.log(`Retrying in ${delayMs}ms...`);
                await new Promise((r) => setTimeout(r, delayMs));
            } else {
                console.error('All PostgreSQL connection attempts failed.');
                console.error(err);
                process.exit(1);
            }
        }
    }
}

module.exports = { prisma, connectWithRetry };
