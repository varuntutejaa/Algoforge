// Problem formatting + one-off data migrations.
const { prisma } = require('../config/prismaClient');

// `problem` may or may not have `testCases` included (Prisma relation), and
// `boilerplate` is a plain JSONB object now — no Mongoose Map handling needed.
function formatProblem(problem) {
    return {
        id: problem.id,
        title: problem.title,
        difficulty: problem.difficulty,
        tags: problem.tags,
        description: problem.description,
        constraints: problem.constraints,
        example: problem.example,
        boilerplate: problem.boilerplate || {},
        testCases: (problem.testCases || []).map((tc) => ({
            name: tc.name,
            input: tc.input,
            expected: tc.expected
        })),
        runner: problem.runner || null
    };
}

// Add Python boilerplates to any problems missing them
async function migratePythonBoilerplates() {
    const pythonBoilerplates = {
        'two-sum': 'def twoSum(nums, target):\n    # Write your solution here\n    pass',
        'array-to-int': 'def solution(nums):\n    # Write your solution here\n    pass',
        'array-to-array': 'def solution(nums):\n    # Write your solution here\n    pass',
        'array-k-to-array': 'def solution(nums, k):\n    # Write your solution here\n    pass',
        'array-k-inplace': 'def solution(nums, k):\n    # Write your solution here\n    pass',
        'array-inplace': 'def solution(nums):\n    # Write your solution here\n    pass',
        'intervals': 'def solution(intervals):\n    # Write your solution here\n    pass',
        'words-k': 'def solution(words, k):\n    # Write your solution here\n    pass',
    };
    try {
        const problems = await prisma.problem.findMany({ select: { id: true, runner: true, boilerplate: true } });
        for (const p of problems) {
            const boilerplate = p.boilerplate || {};
            if (!boilerplate.python) {
                const runnerKey = p.runner || 'array-to-int';
                const pyBoiler = pythonBoilerplates[runnerKey] || pythonBoilerplates['array-to-int'];
                await prisma.problem.update({
                    where: { id: p.id },
                    data: { boilerplate: { ...boilerplate, python: pyBoiler } }
                });
                console.log(`✅ Added Python boilerplate to: ${p.id}`);
            }
        }
    } catch (e) {
        console.error('Python boilerplate migration error:', e.message);
    }
}

async function getDailyProblemId() {
    const problems = await prisma.problem.findMany({ select: { id: true }, orderBy: { createdAt: 'asc' } });
    if (!problems.length) return null;
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return problems[dayOfYear % problems.length].id;
}

module.exports = { formatProblem, migratePythonBoilerplates, getDailyProblemId };
