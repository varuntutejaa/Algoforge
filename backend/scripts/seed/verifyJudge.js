// E2E judge verification: for every fully-judged seeded problem, submit its
// JS reference solution through the running backend's /submit-code and
// require an Accepted verdict. Proves harness + boilerplate contract +
// test cases + expected outputs agree end-to-end through Judge0.
//
// Usage: node scripts/seed/verifyJudge.js [backendUrl] [--sample=N] [--start=id]
const problems = require('./index');

const BACKEND = process.argv.find((a) => a.startsWith('http')) || 'http://localhost:8000';
const sampleArg = process.argv.find((a) => a.startsWith('--sample='));
const startArg = process.argv.find((a) => a.startsWith('--start='));
const SAMPLE = sampleArg ? parseInt(sampleArg.split('=')[1], 10) : Infinity;
const START = startArg ? startArg.split('=')[1] : null;

async function submit(problemId, sourceCode) {
    const res = await fetch(`${BACKEND}/submit-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId, language: 'js', sourceCode, action: 'run' })
    });
    const json = await res.json().catch(() => null);
    return { status: res.status, json };
}

async function main() {
    let judged = problems.filter((p) => p.tests && p.tests.length && p.solutionJs);
    if (START) {
        const i = judged.findIndex((p) => p.id === START);
        if (i >= 0) judged = judged.slice(i);
    }
    judged = judged.slice(0, SAMPLE);

    console.log(`Verifying ${judged.length} problems against ${BACKEND} (language: js)\n`);
    let pass = 0;
    const failures = [];

    for (const p of judged) {
        let out;
        for (let attempt = 1; attempt <= 3; attempt++) {
            out = await submit(p.id, p.solutionJs);
            if (out.status === 200 && out.json) break;
            await new Promise((r) => setTimeout(r, 4000 * attempt));
        }
        const ok = out.status === 200 && out.json?.passed === true;
        if (ok) {
            pass++;
            console.log(`  PASS  ${p.id} (${out.json.passedTests}/${out.json.totalTests})`);
        } else {
            const firstFail = out.json?.results?.find((r) => !r.passed);
            failures.push({ id: p.id, status: out.status, detail: firstFail || out.json?.message || 'no response' });
            console.log(`  FAIL  ${p.id} — ${JSON.stringify(firstFail || out.json?.message || out.status).slice(0, 220)}`);
        }
        // Be polite to the public Judge0 CE instance.
        await new Promise((r) => setTimeout(r, 800));
    }

    console.log(`\n${pass}/${judged.length} problems fully Accepted.`);
    if (failures.length) {
        console.log('Failures:');
        for (const f of failures) console.log(`  - ${f.id}: ${JSON.stringify(f.detail).slice(0, 300)}`);
        process.exit(1);
    }
}

main();
