// Problem document formatting + one-off data migrations.
const Problem = require('../models/Problem');

function formatBoilerplate(boilerplate) {
    if (!boilerplate) return {};
    if (boilerplate instanceof Map) {
        return Object.fromEntries(boilerplate);
    }
    return boilerplate;
}

function formatProblem(problem) {
    const doc = problem.toObject ? problem.toObject() : problem;

    return {
        id: doc.id,
        title: doc.title,
        difficulty: doc.difficulty,
        tags: doc.tags,
        description: doc.description,
        constraints: doc.constraints,
        example: doc.example,
        boilerplate: formatBoilerplate(doc.boilerplate),
        testCases: doc.testCases,
        runner: doc.runner || null
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
        const problems = await Problem.find({}).lean();
        for (const p of problems) {
            if (p.boilerplate && !p.boilerplate.get ? !p.boilerplate['python'] : !(p.boilerplate instanceof Map ? p.boilerplate.get('python') : p.boilerplate['python'])) {
                const runnerKey = p.runner || 'array-to-int';
                const pyBoiler = pythonBoilerplates[runnerKey] || pythonBoilerplates['array-to-int'];
                await Problem.updateOne({ _id: p._id }, { $set: { 'boilerplate.python': pyBoiler } });
                console.log(`✅ Added Python boilerplate to: ${p.id}`);
            }
        }
    } catch (e) {
        console.error('Python boilerplate migration error:', e.message);
    }
}

async function getDailyProblemId() {
    const problems = await Problem.find().select('id').sort({ createdAt: 1 }).lean();
    if (!problems.length) return null;
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return problems[dayOfYear % problems.length].id;
}

module.exports = { formatProblem, migratePythonBoilerplates, getDailyProblemId };
