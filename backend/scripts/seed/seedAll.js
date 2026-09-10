// Seeds the NeetCode 150 into the database.
//
// Phase 1 (always): validate — generate boilerplates, run every judged
// problem's JS reference solution over its test inputs to compute expected
// outputs, and assert them against any hand-written `expect` values. Any
// mismatch aborts before the DB is touched.
//
// Phase 2 (skipped with --dry-run): upsert problems + replace their test
// cases in the database.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const problems = require('./index');
const { tpl, computeExpected } = require('./lib');

const DRY_RUN = process.argv.includes('--dry-run');

function build() {
    const errors = [];
    const built = [];

    for (const p of problems) {
        const entry = {
            id: p.id,
            title: p.title,
            difficulty: p.difficulty,
            tags: p.tags,
            description: p.description,
            constraints: p.constraints || [],
            example: p.example,
            runner: p.runner || null,
            boilerplate: p.boilerplate || null,
            testCases: []
        };

        if (!entry.boilerplate) {
            if (!p.runner || !tpl[p.runner]) {
                errors.push(`${p.id}: no boilerplate and no template for runner "${p.runner}"`);
                continue;
            }
            entry.boilerplate = tpl[p.runner](p.names || {});
        }

        for (const lang of ['c', 'cpp', 'java', 'js', 'python']) {
            if (!entry.boilerplate[lang]) errors.push(`${p.id}: missing ${lang} boilerplate`);
        }

        if (p.tests && p.tests.length) {
            if (!p.solutionJs) {
                errors.push(`${p.id}: has tests but no reference solution`);
                continue;
            }
            for (const t of p.tests) {
                let expected;
                try {
                    expected = computeExpected(p.runner, p.solutionJs, t.input);
                } catch (e) {
                    errors.push(`${p.id} [${t.name}]: reference threw: ${e.message}`);
                    continue;
                }
                if (t.expect !== undefined && expected.trim() !== t.expect.trim()) {
                    errors.push(`${p.id} [${t.name}]: reference produced ${JSON.stringify(expected)} but expect says ${JSON.stringify(t.expect)}`);
                    continue;
                }
                entry.testCases.push({ name: t.name, input: t.input, expected });
            }
        }

        built.push(entry);
    }

    return { built, errors };
}

async function main() {
    const { built, errors } = build();

    const judged = built.filter((p) => p.testCases.length > 0);
    const contentOnly = built.filter((p) => p.testCases.length === 0);
    console.log(`Problems built: ${built.length} (${judged.length} fully judged, ${contentOnly.length} content-only)`);
    console.log(`Test cases total: ${judged.reduce((s, p) => s + p.testCases.length, 0)}`);

    if (errors.length) {
        console.error(`\nVALIDATION FAILED — ${errors.length} error(s):`);
        for (const e of errors) console.error('  - ' + e);
        process.exit(1);
    }
    console.log('Validation passed: every expect matches its reference solution.');

    if (DRY_RUN) {
        console.log('\n--dry-run: not touching the database.');
        return;
    }

    const { prisma } = require('../../config/prismaClient');
    let created = 0;
    let updated = 0;

    for (const p of built) {
        const data = {
            title: p.title,
            difficulty: p.difficulty,
            tags: p.tags,
            description: p.description,
            constraints: p.constraints,
            example: p.example,
            boilerplate: p.boilerplate,
            runner: p.runner
        };
        const existing = await prisma.problem.findUnique({ where: { id: p.id }, select: { id: true } });
        if (existing) {
            await prisma.$transaction([
                prisma.testCase.deleteMany({ where: { problemId: p.id } }),
                prisma.problem.update({
                    where: { id: p.id },
                    data: { ...data, testCases: { create: p.testCases } }
                })
            ]);
            updated++;
        } else {
            await prisma.problem.create({
                data: { id: p.id, ...data, testCases: { create: p.testCases } }
            });
            created++;
        }
        process.stdout.write(`  ${existing ? 'updated' : 'created'}  ${p.id}\n`);
    }

    console.log(`\nDone. Created: ${created}, Updated: ${updated}`);
    await prisma.$disconnect();
}

main().catch(async (err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
