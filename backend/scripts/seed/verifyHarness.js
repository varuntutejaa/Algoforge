// Local harness verification — no Judge0, no database required.
//
// For every fully-judged seeded problem, this builds the REAL Judge0 harness
// source (the same buildJudgeSource the grader uses), wraps the problem's
// reference solution in it, executes it locally with node (js) and python3
// (python), feeds each test case's stdin, and compares stdout against the
// expected output the seeder computed.
//
// That closes the loop the seeder alone cannot: the seeder computes expected
// values with its own parse/print helpers, while the harness is separate
// generated code. If they agree for every case in two independent languages,
// the wire format contract is real rather than assumed.
//
// Usage: node scripts/seed/verifyHarness.js [--lang=js|python|both] [--filter=substr]
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const problems = require('./index');
const { tpl, computeExpected } = require('./lib');
const pythonRefs = require('./pythonRefs');
const compiledRefs = require('./compiledRefs');
const { buildJudgeSource } = require('../../services/judge0');

const langArg = (process.argv.find((a) => a.startsWith('--lang=')) || '--lang=both').split('=')[1];
const filterArg = (process.argv.find((a) => a.startsWith('--filter=')) || '--filter=').split('=')[1];
// "both" = the interpreted pair (fast, full coverage of all 45 shapes);
// "all"  = adds C/C++/Java for the problems with compiled references.
const LANGS = langArg === 'both' ? ['js', 'python']
    : langArg === 'all' ? ['js', 'python', 'c', 'cpp', 'java']
    : [langArg];

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'af-harness-'));

// The seed data stores each reference as a JS function named `solution`
// (or `twoSum` for the legacy shape). Python references are transliterated
// per shape below only where the JS reference cannot be reused; instead of
// maintaining a second set of solutions, we run python only for problems
// whose reference we can express identically. To keep this honest we run
// JS for every problem and python for the subset with a python reference.
function runJs(source, stdin) {
    const file = path.join(tmp, 'main.js');
    fs.writeFileSync(file, source);
    return execFileSync('node', [file], { input: stdin, encoding: 'utf8', timeout: 15000 });
}

function runPython(source, stdin) {
    const file = path.join(tmp, 'main.py');
    fs.writeFileSync(file, source);
    return execFileSync('python3', [file], { input: stdin, encoding: 'utf8', timeout: 15000 });
}

// Compiled languages: build once per problem, then run each test case
// against the produced binary/class (mirrors how Judge0 handles them).
function compileC(source) {
    const src = path.join(tmp, 'main.c');
    const bin = path.join(tmp, 'main_c');
    fs.writeFileSync(src, source);
    execFileSync('gcc', ['-w', '-O0', '-std=c11', src, '-o', bin], { encoding: 'utf8', timeout: 60000 });
    return (stdin) => execFileSync(bin, [], { input: stdin, encoding: 'utf8', timeout: 15000 });
}

// Judge0 runs real GCC, where <bits/stdc++.h> exists; Apple clang ships no
// such header. Shim it locally so the harness can be verified unmodified
// rather than weakening it to suit one dev machine's toolchain.
const shimInclude = path.join(tmp, 'shim');
fs.mkdirSync(path.join(shimInclude, 'bits'), { recursive: true });
fs.writeFileSync(
    path.join(shimInclude, 'bits', 'stdc++.h'),
    ['algorithm', 'array', 'bitset', 'cmath', 'cstdio', 'cstdlib', 'cstring',
        'deque', 'functional', 'iomanip', 'iostream', 'iterator', 'limits', 'list',
        'map', 'numeric', 'queue', 'set', 'sstream', 'stack', 'string',
        'unordered_map', 'unordered_set', 'utility', 'vector']
        .map((h) => `#include <${h}>`).join('\n') + '\n'
);

function compileCpp(source) {
    const src = path.join(tmp, 'main.cpp');
    const bin = path.join(tmp, 'main_cpp');
    fs.writeFileSync(src, source);
    execFileSync('g++', ['-w', '-O0', '-std=c++17', '-I', shimInclude, src, '-o', bin], { encoding: 'utf8', timeout: 90000 });
    return (stdin) => execFileSync(bin, [], { input: stdin, encoding: 'utf8', timeout: 15000 });
}

function compileJava(source) {
    const dir = fs.mkdtempSync(path.join(tmp, 'java-'));
    fs.writeFileSync(path.join(dir, 'Main.java'), source);
    execFileSync('javac', ['-nowarn', 'Main.java'], { cwd: dir, encoding: 'utf8', timeout: 120000 });
    return (stdin) => execFileSync('java', ['-cp', dir, 'Main'], { input: stdin, encoding: 'utf8', timeout: 20000 });
}

const COMPILERS = { c: compileC, cpp: compileCpp, java: compileJava };

function main() {
    let judged = problems.filter((p) => p.tests && p.tests.length && p.solutionJs);
    if (filterArg) judged = judged.filter((p) => p.id.includes(filterArg));

    let cases = 0;
    let pass = 0;
    const failures = [];
    const shapesSeen = new Set();
    const pyShapes = new Set();
    const compiledShapes = new Set();

    for (const p of judged) {
        shapesSeen.add(p.runner);
        // Boilerplate must exist for every language (contract with the editor).
        const bp = p.boilerplate || tpl[p.runner](p.names || {});
        for (const lang of ['c', 'cpp', 'java', 'js', 'python']) {
            if (!bp[lang]) failures.push({ id: p.id, lang, detail: 'missing boilerplate' });
        }

        // Compile the C/C++/Java references for this problem once, if present.
        const compiled = {};
        for (const lang of ['c', 'cpp', 'java']) {
            const ref = compiledRefs[p.id]?.[lang];
            if (!ref || !LANGS.includes(lang)) continue;
            try {
                compiled[lang] = COMPILERS[lang](buildJudgeSource({ runner: p.runner }, lang, ref));
                compiledShapes.add(`${p.runner}:${lang}`);
            } catch (e) {
                failures.push({ id: p.id, lang, detail: 'COMPILE: ' + (e.stderr || e.message || '').toString().slice(0, 300) });
            }
        }

        for (const t of p.tests) {
            const expected = computeExpected(p.runner, p.solutionJs, t.input);

            for (const lang of ['c', 'cpp', 'java']) {
                if (!compiled[lang]) continue;
                cases++;
                try {
                    const out = compiled[lang](t.input);
                    if (out.trim() === expected.trim()) pass++;
                    else failures.push({ id: p.id, lang, test: t.name, got: out.trim().slice(0, 120), want: expected.trim().slice(0, 120) });
                } catch (e) {
                    failures.push({ id: p.id, lang, test: t.name, detail: (e.stderr || e.message || '').toString().slice(0, 200) });
                }
            }

            if (LANGS.includes('js')) {
                cases++;
                try {
                    const source = buildJudgeSource({ runner: p.runner }, 'js', p.solutionJs);
                    const out = runJs(source, t.input);
                    if (out.trim() === expected.trim()) pass++;
                    else failures.push({ id: p.id, lang: 'js', test: t.name, got: out.trim().slice(0, 120), want: expected.trim().slice(0, 120) });
                } catch (e) {
                    failures.push({ id: p.id, lang: 'js', test: t.name, detail: (e.stderr || e.message || '').toString().slice(0, 200) });
                }
            }

            if (LANGS.includes('python') && pythonRefs[p.id]) {
                cases++;
                pyShapes.add(p.runner);
                try {
                    const source = buildJudgeSource({ runner: p.runner }, 'python', pythonRefs[p.id]);
                    const out = runPython(source, t.input);
                    if (out.trim() === expected.trim()) pass++;
                    else failures.push({ id: p.id, lang: 'python', test: t.name, got: out.trim().slice(0, 120), want: expected.trim().slice(0, 120) });
                } catch (e) {
                    failures.push({ id: p.id, lang: 'python', test: t.name, detail: (e.stderr || e.message || '').toString().slice(0, 200) });
                }
            }
        }
    }

    console.log(`Problems: ${judged.length}   shapes exercised: ${shapesSeen.size}`);
    if (LANGS.includes('python')) {
        const missing = [...shapesSeen].filter((s) => !pyShapes.has(s));
        console.log(`Shapes cross-checked in Python: ${pyShapes.size}/${shapesSeen.size}` +
            (missing.length ? `  (no python ref: ${missing.join(', ')})` : ''));
    }
    if (compiledShapes.size) console.log(`Compiled-language harnesses exercised: ${compiledShapes.size} (shape:lang pairs)`);
    console.log(`Harness executions: ${cases}   passed: ${pass}`);

    if (failures.length) {
        console.error(`\nFAILURES (${failures.length}):`);
        for (const f of failures.slice(0, 40)) console.error('  ' + JSON.stringify(f));
        process.exit(1);
    }
    console.log('\nAll generated harnesses produced exactly the seeded expected output.');
}

main();
