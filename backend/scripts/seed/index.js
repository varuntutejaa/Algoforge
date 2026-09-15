// Aggregates all NeetCode 150 seed data files (order mirrors the roadmap).
//
// Content (prose, constraints, examples) lives in the per-topic files. Judging
// definitions — runner shape, reference solution, test cases — live in the
// judged-*.js files and are merged on here by id, so a problem's description
// and its grading can be edited independently.
const content = [
    ...require('./data/arrays-hashing'),
    ...require('./data/two-pointers'),
    ...require('./data/sliding-window'),
    ...require('./data/stack'),
    ...require('./data/binary-search'),
    ...require('./data/linked-list'),
    ...require('./data/trees'),
    ...require('./data/tries'),
    ...require('./data/heap'),
    ...require('./data/backtracking'),
    ...require('./data/graphs'),
    ...require('./data/advanced-graphs'),
    ...require('./data/dp-1d'),
    ...require('./data/dp-2d'),
    ...require('./data/greedy'),
    ...require('./data/intervals'),
    ...require('./data/math-geometry'),
    ...require('./data/bit-manipulation')
];

const judging = [
    ...require('./data/judged-linked-list'),
    ...require('./data/judged-trees')
];

const byId = new Map(content.map((p) => [p.id, p]));
for (const j of judging) {
    const target = byId.get(j.id);
    if (!target) throw new Error(`judging entry "${j.id}" has no matching content entry`);
    // Judging wins on the fields it defines; prose stays as authored.
    Object.assign(target, j);
    // A generated boilerplate must come from the runner template, so drop any
    // placeholder the content file carried.
    if (j.runner) delete target.boilerplate;
}

module.exports = content;
