// PostgreSQL connectivity supervisor.
//
// A database outage must not take the whole service down: /health and the
// external contest-calendar endpoints need no database at all, and the
// health route already has a degraded mode (503 + db: disconnected) for
// exactly this case. So this never exits the process — it retries with
// capped exponential backoff and keeps retrying in the background, so the
// service self-heals as soon as the database comes back.
const { prisma } = require('./prismaClient');
const { migratePythonBoilerplates } = require('../services/problems');

const INITIAL_DELAY_MS = 3000;
const MAX_DELAY_MS = 60000;

let connected = false;
let migrated = false;

function isConnected() {
    return connected;
}

async function ping() {
    await prisma.$queryRaw`SELECT 1`;
}

// Runs for the lifetime of the process. Resolves once the first successful
// connection is made, but keeps supervising afterwards so a database that
// disappears later is picked back up without a redeploy.
async function connectWithRetry() {
    let delay = INITIAL_DELAY_MS;
    let attempt = 0;

    for (;;) {
        attempt++;
        try {
            await ping();

            if (!connected) {
                connected = true;
                console.log('PostgreSQL Connected');
                // One-off data migration, only after we actually have a database.
                if (!migrated) {
                    migrated = true;
                    try {
                        await migratePythonBoilerplates();
                    } catch (err) {
                        migrated = false;
                        console.error('Boilerplate migration failed (will retry on next reconnect):', err.message);
                    }
                }
            }

            delay = INITIAL_DELAY_MS;
            attempt = 0;
            // Healthy — poll slowly so a later outage is noticed and logged.
            await sleep(MAX_DELAY_MS);
        } catch (err) {
            if (connected) {
                console.error(`PostgreSQL connection lost: ${err.message}`);
                console.error('Serving in degraded mode — /health and calendar endpoints stay up.');
            }
            connected = false;

            // Keep the log readable during a long outage: report the first few
            // attempts, then only once per (capped) backoff window.
            if (attempt <= 5 || delay >= MAX_DELAY_MS) {
                console.error(`PostgreSQL connection attempt ${attempt} failed: ${err.message}`);
            }

            await sleep(delay);
            delay = Math.min(delay * 2, MAX_DELAY_MS);
        }
    }
}

// unref'd so the supervisor's perpetual retry loop never becomes the reason
// the process stays alive — the HTTP server owns the process lifetime, and a
// pending backoff timer must not block graceful shutdown (or hang tests).
function sleep(ms) {
    return new Promise((resolve) => {
        const timer = setTimeout(resolve, ms);
        if (typeof timer.unref === 'function') timer.unref();
    });
}

module.exports = { prisma, connectWithRetry, isConnected };
