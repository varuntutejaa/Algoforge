const express = require("express");
const cors = require("cors");
require("dotenv").config();
const compression = require("compression");

const { optionalAuth } = require('./middleware/auth');
const { connectWithRetry } = require('./config/db');

const contestRoutes = require('./routes/contests');
const externalContestsRoutes = require('./routes/externalContests');
const publicHealthRoutes = require('./routes/publicHealth');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const problemsRoutes = require('./routes/problems');
const aiRoutes = require('./routes/ai');
const submissionsRoutes = require('./routes/submissions');

const app = express();
app.use(compression());

const defaultOrigins = [
    'https://djpb60zs17m9t.cloudfront.net',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
];
const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
    : defaultOrigins;

app.use(cors({
    origin: (origin, callback) => {
        // Allow non-browser requests (no Origin header) and configured origins
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error('Not allowed by CORS'));
    }
}));
app.use(express.json());

// Mounted before DB connect so /health responds immediately (as "degraded" until Mongo connects).
app.use(publicHealthRoutes);

// Long-running hosts get a background supervisor that keeps watching the
// database and never takes the process down (see config/db.js). On a
// serverless host each invocation is short-lived and Prisma connects lazily,
// so a perpetual retry loop there would just burn execution time.
const IS_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
if (!IS_SERVERLESS) {
    connectWithRetry().catch((err) => {
        console.error('DB supervisor stopped unexpectedly:', err);
    });
}

// optionalAuth attaches req.user when a valid session is present, without rejecting anonymous requests.
app.use('/api/contests', optionalAuth, contestRoutes);
app.use('/api', externalContestsRoutes);
app.use('/api/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/problems', problemsRoutes);
app.use('/api', aiRoutes);
app.use('/submit-code', optionalAuth, submissionsRoutes);

const PORT = process.env.PORT || 8000;

function startStandaloneServer() {
    return app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);

    // Pre-warm external contest caches so first user doesn't wait
    setTimeout(async () => {
        try {
            await fetch(`http://localhost:${PORT}/api/codeforces-contests`);
            console.log('✅ Codeforces cache warmed');
        } catch {}
        try {
            await fetch(`http://localhost:${PORT}/api/leetcode-contests`);
            console.log('✅ LeetCode cache warmed');
        } catch {}
        try {
            await fetch(`http://localhost:${PORT}/api/codechef-contests`);
            console.log('✅ CodeChef cache warmed');
        } catch {}
        try {
            await fetch(`http://localhost:${PORT}/api/atcoder-contests`);
            console.log('✅ AtCoder cache warmed');
        } catch {}
        try {
            await fetch(`http://localhost:${PORT}/api/hackerrank-contests`);
            console.log('✅ HackerRank cache warmed');
        } catch {}
    }, 100);
    });
}

// Bind a port only when run as a real process. A serverless host imports this
// module and owns the request lifecycle itself, so calling listen() there
// would bind a port nothing routes to.
if (require.main === module) {
    startStandaloneServer();
}

module.exports = app;
