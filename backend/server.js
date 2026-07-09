const express = require("express");
const cors = require("cors");
require("dotenv").config();
const compression = require("compression");

const { optionalAuth } = require('./middleware/auth');
const { connectWithRetry } = require('./config/db');

const contestRoutes = require('./routes/contests');
const externalContestsRoutes = require('./routes/externalContests');
const healthRoutes = require('./routes/health');
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

connectWithRetry();

// optionalAuth verifies a Firebase token when present, without rejecting anonymous requests.
app.use('/api/contests', optionalAuth, contestRoutes);
app.use('/api', externalContestsRoutes);
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/problems', problemsRoutes);
app.use('/api', aiRoutes);
app.use('/submit-code', optionalAuth, submissionsRoutes);

app.listen(8000, () => {
    console.log("Server running on 8000");

    // Pre-warm external contest caches so first user doesn't wait
    setTimeout(async () => {
        try {
            await fetch('http://localhost:8000/api/codeforces-contests');
            console.log('✅ Codeforces cache warmed');
        } catch {}
        try {
            await fetch('http://localhost:8000/api/leetcode-contests');
            console.log('✅ LeetCode cache warmed');
        } catch {}
        try {
            await fetch('http://localhost:8000/api/codechef-contests');
            console.log('✅ CodeChef cache warmed');
        } catch {}
        try {
            await fetch('http://localhost:8000/api/atcoder-contests');
            console.log('✅ AtCoder cache warmed');
        } catch {}
        try {
            await fetch('http://localhost:8000/api/hackerrank-contests');
            console.log('✅ HackerRank cache warmed');
        } catch {}
    }, 100);
});
