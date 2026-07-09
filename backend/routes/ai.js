// Groq-backed AI code review + progressive hints.
const express = require('express');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const router = express.Router();
const Problem = require('../models/Problem');
const { verifyFirebaseToken } = require('../middleware/auth');

const GROQ_MODEL = 'llama-3.3-70b-versatile';

const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.firebaseUid || ipKeyGenerator(req.ip)
});

router.use(verifyFirebaseToken, aiLimiter);

async function callGroq(groqKey, { systemPrompt, userMessage, temperature, maxTokens }) {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user',   content: userMessage }
            ],
            temperature,
            max_tokens: maxTokens
        })
    });
    if (!groqRes.ok) {
        const err = await groqRes.text();
        const error = new Error('AI service error');
        error.detail = err;
        throw error;
    }
    const data = await groqRes.json();
    return data.choices?.[0]?.message?.content?.trim();
}

router.post('/review', async (req, res) => {
    const { problemId, code, language } = req.body;
    if (!problemId || !code) return res.status(400).json({ error: 'Missing problemId or code' });

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return res.status(503).json({ error: 'AI service not configured' });

    try {
        const problemDoc = await Problem.findOne({ id: problemId }).lean();
        if (!problemDoc) return res.status(404).json({ error: 'Problem not found' });

        const title       = problemDoc.title || '';
        const description = (problemDoc.description || []).join('\n');
        const constraints = (problemDoc.constraints || []).join('\n');

        const systemPrompt = `You are an expert code reviewer for competitive programming. The user has just solved a problem successfully (all test cases passed). Provide a structured review of their solution.

Your review MUST follow exactly this format with these exact section headers:
**Time Complexity**
[Analysis]

**Space Complexity**
[Analysis]

**What You Did Well**
[1-2 specific positives]

**How to Improve**
[2-3 concrete suggestions to optimize or clean up the code — mention specific lines or patterns if possible]

**Alternative Approaches**
[2-3 different ways to solve this problem with a one-line tradeoff for each — e.g. brute force, different data structure, mathematical insight. Mention their time/space complexity briefly.]

Be concise, precise, and educational. Do not re-explain the problem. Do not write full working code for any approach.`;

        const userMessage = `Problem: ${title}

Description:
${description}

Constraints:
${constraints}

My accepted ${language} solution:
\`\`\`${language}
${code.trim().slice(0, 2000)}
\`\`\`

Please review my solution.`;

        const review = await callGroq(groqKey, { systemPrompt, userMessage, temperature: 0.4, maxTokens: 700 });
        res.json({ review: review || 'Review unavailable.' });
    } catch (err) {
        console.error('Review endpoint error:', err);
        if (err.detail) return res.status(502).json({ error: 'AI service error', detail: err.detail });
        res.status(500).json({ error: err.message });
    }
});

router.post('/hint', async (req, res) => {
    const { problemId, hintNumber, code, language, elapsedSeconds } = req.body;
    if (!problemId || !hintNumber) return res.status(400).json({ error: 'Missing problemId or hintNumber' });

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return res.status(503).json({ error: 'AI service not configured' });

    try {
        const problemDoc = await Problem.findOne({ id: problemId }).lean();
        if (!problemDoc) return res.status(404).json({ error: 'Problem not found' });

        const title       = problemDoc.title || '';
        const description = (problemDoc.description || []).join('\n');
        const constraints = (problemDoc.constraints || []).join('\n');
        const examples    = (problemDoc.examples || []).map((ex, i) =>
            `Example ${i + 1}:\n  Input: ${ex.input}\n  Output: ${ex.output}${ex.explanation ? '\n  Explanation: ' + ex.explanation : ''}`
        ).join('\n');
        const testCases   = (problemDoc.testCases || []).slice(0, 3).map((tc, i) =>
            `Test ${i + 1}: input=${JSON.stringify(tc.input)} expected=${JSON.stringify(tc.output)}`
        ).join('\n');

        const elapsedMin  = Math.floor((elapsedSeconds || 0) / 60);
        const hasCode     = code && code.trim().length > 10;
        const codeSnippet = hasCode ? code.trim().slice(0, 1200) : null;

        const hintPersonality = [
            `You are giving Hint 1 of 3. The user has spent ~${elapsedMin} minutes on this problem. Give a very gentle conceptual nudge — point them toward the right problem-solving pattern or ask a guiding question. Do NOT name the algorithm or data structure directly. Do NOT reveal any implementation step. 2-3 sentences max.`,
            `You are giving Hint 2 of 3. The user has spent ~${elapsedMin} minutes. Look at their current code approach if provided. If they are on the wrong track, gently redirect them. If on the right track, hint at the key insight they are missing without revealing the solution. Mention time/space complexity to think about if relevant. 3-4 sentences max.`,
            `You are giving Hint 3 of 3. The user has spent ~${elapsedMin} minutes. Examine their code closely. Identify the specific step or logic gap that is blocking them. Give a concrete implementation hint — describe what to do next without writing the code for them. You may reference a specific line or concept in their code. 4-5 sentences max.`
        ][hintNumber - 1];

        const systemPrompt = `You are a helpful coding mentor giving progressive hints for a LeetCode-style problem.
${hintPersonality}
Rules:
- Never provide a complete solution or full algorithm
- Never write out the final working code
- Be encouraging and Socratic
- Keep the hint tight and focused on ONE thing
- If the user has no code yet, focus on the problem pattern only`;

        const userMessage = `Problem: ${title}

Description:
${description}

Constraints:
${constraints}

Examples:
${examples}

Test Cases:
${testCases}

${codeSnippet ? `User's current ${language || 'code'} (${elapsedMin} min in):\n\`\`\`\n${codeSnippet}\n\`\`\`` : `The user has not written any code yet (${elapsedMin} min in).`}

Give Hint ${hintNumber}.`;

        const hint = await callGroq(groqKey, { systemPrompt, userMessage, temperature: 0.5, maxTokens: 300 });
        res.json({ hint: hint || 'No hint available.' });
    } catch (err) {
        console.error('Hint endpoint error:', err);
        if (err.detail) return res.status(502).json({ error: 'AI service error', detail: err.detail });
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
