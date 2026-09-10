// Intervals (6)
module.exports = [
    {
        id: 'insert-interval',
        title: 'Insert Interval',
        difficulty: 'Medium',
        tags: ['Intervals', 'Arrays'],
        description: [
            'You are given a list of non-overlapping intervals sorted by start, and a new interval. Insert the new interval into the list so that it remains sorted and non-overlapping (merge where necessary), and return the result.'
        ],
        constraints: ['0 <= intervals.length <= 10^4', 'intervals is sorted by start', '0 <= start <= end <= 10^5'],
        example: 'Input: intervals = [[1,3],[6,9]], newInterval = [2,5]\nOutput: [[1,5],[6,9]]',
        runner: 'intervals-new-to-intervals',
        names: { a: 'intervals', b: 'newInterval' },
        solutionJs: 'function solution(intervals, newInterval) { const res = []; let [s, e] = newInterval; let i = 0; const n = intervals.length; while (i < n && intervals[i][1] < s) res.push(intervals[i++]); while (i < n && intervals[i][0] <= e) { s = Math.min(s, intervals[i][0]); e = Math.max(e, intervals[i][1]); i++; } res.push([s, e]); while (i < n) res.push(intervals[i++]); return res; }',
        tests: [
            { name: 'Basic', input: '2\n1 3 6 9\n2 5', expect: '1 5\n6 9' },
            { name: 'Swallows several', input: '5\n1 2 3 5 6 7 8 10 12 16\n4 8', expect: '1 2\n3 10\n12 16' },
            { name: 'Empty list', input: '0\n5 7', expect: '5 7' },
            { name: 'Contained interval', input: '1\n1 5\n2 3', expect: '1 5' }
        ]
    },
    {
        id: 'merge-intervals',
        title: 'Merge Intervals',
        difficulty: 'Medium',
        tags: ['Intervals', 'Arrays', 'Sorting'],
        description: [
            'Given an array of intervals [start, end], merge all overlapping intervals and return the non-overlapping intervals that cover all the input, sorted by start.'
        ],
        constraints: ['1 <= intervals.length <= 10^4', '0 <= start <= end <= 10^4'],
        example: 'Input: intervals = [[1,3],[2,6],[8,10],[15,18]]\nOutput: [[1,6],[8,10],[15,18]]',
        runner: 'intervals',
        names: { a: 'intervals' },
        solutionJs: 'function solution(intervals) { const a = intervals.slice().sort((x, y) => x[0] - y[0]); const res = [a[0].slice()]; for (let i = 1; i < a.length; i++) { const last = res[res.length - 1]; if (a[i][0] <= last[1]) last[1] = Math.max(last[1], a[i][1]); else res.push(a[i].slice()); } return res; }',
        tests: [
            { name: 'Basic', input: '4\n1 3 2 6 8 10 15 18', expect: '1 6\n8 10\n15 18' },
            { name: 'Touching intervals', input: '2\n1 4 4 5', expect: '1 5' },
            { name: 'Single interval', input: '1\n1 4', expect: '1 4' },
            { name: 'Unsorted input', input: '3\n5 6 1 3 2 4', expect: '1 4\n5 6' }
        ]
    },
    {
        id: 'non-overlapping-intervals',
        title: 'Non Overlapping Intervals',
        difficulty: 'Medium',
        tags: ['Intervals', 'Arrays', 'Greedy', 'Sorting'],
        description: [
            'Given an array of intervals, return the minimum number of intervals you must remove so the rest are non-overlapping. Intervals that only touch at a point (e.g. [1,2] and [2,3]) do not overlap.'
        ],
        constraints: ['1 <= intervals.length <= 10^5', '-5 * 10^4 <= start < end <= 5 * 10^4'],
        example: 'Input: intervals = [[1,2],[2,3],[3,4],[1,3]]\nOutput: 1\nExplanation: Remove [1,3] and the rest are non-overlapping.',
        runner: 'intervals-to-int',
        names: { a: 'intervals' },
        solutionJs: 'function solution(intervals) { const a = intervals.slice().sort((x, y) => x[1] - y[1]); let removed = 0, end = -Infinity; for (const [s, e] of a) { if (s >= end) end = e; else removed++; } return removed; }',
        tests: [
            { name: 'Basic', input: '4\n1 2 2 3 3 4 1 3', expect: '1' },
            { name: 'All identical', input: '3\n1 2 1 2 1 2', expect: '2' },
            { name: 'Already disjoint', input: '3\n1 2 2 3 3 4', expect: '0' }
        ]
    },
    {
        id: 'meeting-rooms',
        title: 'Meeting Rooms',
        difficulty: 'Easy',
        tags: ['Intervals', 'Arrays', 'Sorting'],
        description: [
            'Given an array of meeting time intervals [start, end], determine if a single person could attend all meetings (no two meetings overlap; back-to-back meetings are fine).'
        ],
        constraints: ['0 <= intervals.length <= 10^4', '0 <= start < end <= 10^6'],
        example: 'Input: intervals = [[0,30],[5,10],[15,20]]\nOutput: false',
        runner: 'intervals-to-bool',
        names: { a: 'intervals' },
        solutionJs: 'function solution(intervals) { const a = intervals.slice().sort((x, y) => x[0] - y[0]); for (let i = 1; i < a.length; i++) { if (a[i][0] < a[i - 1][1]) return false; } return true; }',
        tests: [
            { name: 'Overlapping meetings', input: '3\n0 30 5 10 15 20', expect: 'false' },
            { name: 'Disjoint meetings', input: '2\n7 10 2 4', expect: 'true' },
            { name: 'Single meeting', input: '1\n5 8', expect: 'true' },
            { name: 'Back to back', input: '2\n1 5 5 8', expect: 'true' }
        ]
    },
    {
        id: 'meeting-rooms-ii',
        title: 'Meeting Rooms II',
        difficulty: 'Medium',
        tags: ['Intervals', 'Arrays', 'Heap', 'Sorting'],
        description: [
            'Given an array of meeting time intervals [start, end], return the minimum number of conference rooms required to hold all meetings. A room freed at time t can host a meeting starting at time t.'
        ],
        constraints: ['1 <= intervals.length <= 10^4', '0 <= start < end <= 10^6'],
        example: 'Input: intervals = [[0,30],[5,10],[15,20]]\nOutput: 2',
        runner: 'intervals-to-int',
        names: { a: 'intervals' },
        solutionJs: 'function solution(intervals) { const starts = intervals.map((iv) => iv[0]).sort((a, b) => a - b); const ends = intervals.map((iv) => iv[1]).sort((a, b) => a - b); let rooms = 0, best = 0, i = 0, j = 0; while (i < starts.length) { if (starts[i] < ends[j]) { rooms++; i++; if (rooms > best) best = rooms; } else { rooms--; j++; } } return best; }',
        tests: [
            { name: 'Basic', input: '3\n0 30 5 10 15 20', expect: '2' },
            { name: 'One room enough', input: '2\n7 10 2 4', expect: '1' },
            { name: 'Fully nested', input: '3\n1 10 2 6 3 5', expect: '3' },
            { name: 'Boundary reuse', input: '2\n1 5 5 8', expect: '1' }
        ]
    },
    {
        id: 'minimum-interval-to-include-each-query',
        title: 'Minimum Interval to Include Each Query',
        difficulty: 'Hard',
        tags: ['Intervals', 'Arrays', 'Heap', 'Sorting'],
        description: [
            'You are given intervals [left, right] and an array of queries. The size of an interval is right - left + 1.',
            'For each query q, find the size of the smallest interval containing q (left <= q <= right), or -1 if none does. Return the answers in query order.'
        ],
        constraints: ['1 <= intervals.length, queries.length <= 10^5', '1 <= left <= right <= 10^7', '1 <= queries[i] <= 10^7'],
        example: 'Input: intervals = [[1,4],[2,4],[3,6],[4,4]], queries = [2,3,4,5]\nOutput: [3,3,1,4]',
        boilerplate: {
            c: 'int* solution(int intervals[][2], int intervalsSize, int* queries, int queriesSize, int* returnSize) {\n    // Write your code here\n    *returnSize = 0;\n    return NULL;\n}',
            cpp: 'class Solution {\npublic:\n    vector<int> solution(vector<vector<int>>& intervals, vector<int>& queries) {\n        // Write your code here\n        return {};\n    }\n};',
            java: 'class Solution {\n    public int[] solution(int[][] intervals, int[] queries) {\n        // Write your code here\n        return new int[]{};\n    }\n}',
            js: 'function solution(intervals, queries) {\n    // Write your code here\n    return [];\n}',
            python: 'def solution(intervals, queries):\n    # Write your code here\n    return []'
        },
        tests: []
    }
];
