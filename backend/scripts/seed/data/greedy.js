// Greedy (8)
module.exports = [
    {
        id: 'maximum-subarray',
        title: 'Maximum Subarray',
        difficulty: 'Medium',
        tags: ['Greedy', 'Dynamic Programming', 'Arrays'],
        description: ['Given an integer array nums, find the contiguous non-empty subarray with the largest sum, and return that sum.'],
        constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
        example: 'Input: nums = [-2,1,-3,4,-1,2,1,-5,4]\nOutput: 6\nExplanation: The subarray [4,-1,2,1] has the largest sum 6.',
        runner: 'array-to-int',
        names: { a: 'nums' },
        solutionJs: 'function solution(nums) { let best = nums[0], cur = nums[0]; for (let i = 1; i < nums.length; i++) { cur = Math.max(nums[i], cur + nums[i]); if (cur > best) best = cur; } return best; }',
        tests: [
            { name: 'Basic', input: '9\n-2 1 -3 4 -1 2 1 -5 4', expect: '6' },
            { name: 'Single element', input: '1\n1', expect: '1' },
            { name: 'All positive', input: '5\n5 4 -1 7 8', expect: '23' },
            { name: 'All negative', input: '3\n-3 -1 -2', expect: '-1' }
        ]
    },
    {
        id: 'jump-game',
        title: 'Jump Game',
        difficulty: 'Medium',
        tags: ['Greedy', 'Arrays', 'Dynamic Programming'],
        description: [
            'You are given an integer array nums. You start at the first index, and nums[i] is your maximum jump length from position i.',
            'Return true if you can reach the last index, or false otherwise.'
        ],
        constraints: ['1 <= nums.length <= 10^4', '0 <= nums[i] <= 10^5'],
        example: 'Input: nums = [2,3,1,1,4]\nOutput: true',
        runner: 'array-to-bool',
        names: { a: 'nums' },
        solutionJs: 'function solution(nums) { let reach = 0; for (let i = 0; i < nums.length; i++) { if (i > reach) return false; if (i + nums[i] > reach) reach = i + nums[i]; } return true; }',
        tests: [
            { name: 'Reachable', input: '5\n2 3 1 1 4', expect: 'true' },
            { name: 'Stuck at zero', input: '5\n3 2 1 0 4', expect: 'false' },
            { name: 'Single index', input: '1\n0', expect: 'true' },
            { name: 'Zero at start', input: '2\n0 1', expect: 'false' }
        ]
    },
    {
        id: 'jump-game-ii',
        title: 'Jump Game II',
        difficulty: 'Medium',
        tags: ['Greedy', 'Arrays', 'Dynamic Programming'],
        description: [
            'Given an array nums where nums[i] is your maximum jump length from index i, return the minimum number of jumps needed to reach the last index. The tests guarantee you can reach it.'
        ],
        constraints: ['1 <= nums.length <= 10^4', '0 <= nums[i] <= 1000', 'The last index is always reachable'],
        example: 'Input: nums = [2,3,1,1,4]\nOutput: 2\nExplanation: Jump from index 0 to 1, then to the last index.',
        runner: 'array-to-int',
        names: { a: 'nums' },
        solutionJs: 'function solution(nums) { let jumps = 0, end = 0, far = 0; for (let i = 0; i < nums.length - 1; i++) { far = Math.max(far, i + nums[i]); if (i === end) { jumps++; end = far; } } return jumps; }',
        tests: [
            { name: 'Basic', input: '5\n2 3 1 1 4', expect: '2' },
            { name: 'With zero', input: '5\n2 3 0 1 4', expect: '2' },
            { name: 'Already there', input: '1\n0', expect: '0' },
            { name: 'Step by step', input: '2\n1 1', expect: '1' }
        ]
    },
    {
        id: 'gas-station',
        title: 'Gas Station',
        difficulty: 'Medium',
        tags: ['Greedy', 'Arrays'],
        description: [
            'There are n gas stations along a circular route; gas[i] is the fuel available at station i and cost[i] is the fuel needed to travel to station i + 1. You start with an empty tank.',
            "Return the index of the starting station from which you can travel around the circuit once clockwise, or -1 if it is impossible. If a solution exists, it is guaranteed to be unique."
        ],
        constraints: ['1 <= n <= 10^5', '0 <= gas[i], cost[i] <= 10^4'],
        example: 'Input: gas = [1,2,3,4,5], cost = [3,4,5,1,2]\nOutput: 3',
        runner: 'two-arrays-to-int',
        names: { a: 'gas', b: 'cost' },
        solutionJs: 'function solution(gas, cost) { let total = 0, tank = 0, start = 0; for (let i = 0; i < gas.length; i++) { const d = gas[i] - cost[i]; total += d; tank += d; if (tank < 0) { start = i + 1; tank = 0; } } return total < 0 ? -1 : start; }',
        tests: [
            { name: 'Basic', input: '5\n1 2 3 4 5\n5\n3 4 5 1 2', expect: '3' },
            { name: 'Impossible', input: '3\n2 3 4\n3\n3 4 3', expect: '-1' },
            { name: 'Single station', input: '1\n5\n1\n4', expect: '0' },
            { name: 'Single station short', input: '1\n2\n1\n3', expect: '-1' }
        ]
    },
    {
        id: 'hand-of-straights',
        title: 'Hand of Straights',
        difficulty: 'Medium',
        tags: ['Greedy', 'Arrays', 'Hash Map', 'Sorting'],
        description: [
            'Alice has a hand of cards with values hand[i]. She wants to rearrange them into groups, each of size groupSize and consisting of groupSize consecutive values.',
            'Return true if she can rearrange the entire hand this way, or false otherwise.'
        ],
        constraints: ['1 <= hand.length <= 10^4', '0 <= hand[i] <= 10^9', '1 <= groupSize <= hand.length'],
        example: 'Input: hand = [1,2,3,6,2,3,4,7,8], groupSize = 3\nOutput: true\nExplanation: Groups [1,2,3], [2,3,4], [6,7,8].',
        runner: 'array-target-to-bool',
        names: { a: 'hand', b: 'groupSize' },
        solutionJs: 'function solution(hand, groupSize) { if (hand.length % groupSize) return false; const count = new Map(); for (const c of hand) count.set(c, (count.get(c) || 0) + 1); const keys = [...count.keys()].sort((a, b) => a - b); for (const k of keys) { const need = count.get(k); if (need <= 0) continue; for (let v = k; v < k + groupSize; v++) { const have = count.get(v) || 0; if (have < need) return false; count.set(v, have - need); } } return true; }',
        tests: [
            { name: 'Basic', input: '9\n1 2 3 6 2 3 4 7 8\n3', expect: 'true' },
            { name: 'Not divisible', input: '5\n1 2 3 4 5\n4', expect: 'false' },
            { name: 'Duplicate runs', input: '4\n1 1 2 2\n2', expect: 'true' },
            { name: 'Gap breaks run', input: '2\n1 3\n2', expect: 'false' }
        ]
    },
    {
        id: 'merge-triplets-to-form-target-triplet',
        title: 'Merge Triplets to Form Target Triplet',
        difficulty: 'Medium',
        tags: ['Greedy', 'Arrays'],
        description: [
            'You are given a list of triplets and a target triplet. In one operation you may pick two of your triplets [a1,b1,c1] and [a2,b2,c2] and update one of them to [max(a1,a2), max(b1,b2), max(c1,c2)].',
            'Return true if it is possible to obtain the target triplet as one of your triplets.'
        ],
        constraints: ['1 <= triplets.length <= 10^5', '1 <= values <= 1000'],
        example: 'Input: triplets = [[2,5,3],[1,8,4],[1,7,5]], target = [2,7,5]\nOutput: true',
        boilerplate: {
            c: 'bool solution(int triplets[][3], int tripletsSize, int* target) {\n    // Write your code here\n    return false;\n}',
            cpp: 'class Solution {\npublic:\n    bool solution(vector<vector<int>>& triplets, vector<int>& target) {\n        // Write your code here\n        return false;\n    }\n};',
            java: 'class Solution {\n    public boolean solution(int[][] triplets, int[] target) {\n        // Write your code here\n        return false;\n    }\n}',
            js: 'function solution(triplets, target) {\n    // Write your code here\n    return false;\n}',
            python: 'def solution(triplets, target):\n    # Write your code here\n    return False'
        },
        tests: []
    },
    {
        id: 'partition-labels',
        title: 'Partition Labels',
        difficulty: 'Medium',
        tags: ['Greedy', 'Strings', 'Two Pointers'],
        description: [
            'You are given a string s. Partition it into as many parts as possible so that each letter appears in at most one part, and return an array of the sizes of these parts (concatenating the parts in order must reproduce s).'
        ],
        constraints: ['1 <= s.length <= 500', 's consists of lowercase English letters'],
        example: 'Input: s = "ababcbacadefegdehijhklij"\nOutput: [9,7,8]',
        runner: 'string-to-array',
        names: { a: 's' },
        solutionJs: 'function solution(s) { const last = {}; for (let i = 0; i < s.length; i++) last[s[i]] = i; const res = []; let start = 0, end = 0; for (let i = 0; i < s.length; i++) { end = Math.max(end, last[s[i]]); if (i === end) { res.push(end - start + 1); start = i + 1; } } return res; }',
        tests: [
            { name: 'Basic', input: 'ababcbacadefegdehijhklij', expect: '9 7 8' },
            { name: 'One big part', input: 'eccbbbbdec', expect: '10' },
            { name: 'Single character', input: 'a', expect: '1' },
            { name: 'All distinct', input: 'abc', expect: '1 1 1' }
        ]
    },
    {
        id: 'valid-parenthesis-string',
        title: 'Valid Parenthesis String',
        difficulty: 'Medium',
        tags: ['Greedy', 'Strings', 'Dynamic Programming'],
        description: [
            "Given a string s containing '(', ')' and '*', return true if s can be valid. '*' can be treated as '(', ')' or an empty string.",
            'A string is valid if every ( has a matching ) and pairs close in the correct order.'
        ],
        constraints: ['1 <= s.length <= 100', "s[i] is '(', ')' or '*'"],
        example: 'Input: s = "(*))"\nOutput: true',
        runner: 'string-to-bool',
        names: { a: 's' },
        solutionJs: "function solution(s) { let lo = 0, hi = 0; for (const c of s) { if (c === '(') { lo++; hi++; } else if (c === ')') { lo--; hi--; } else { lo--; hi++; } if (hi < 0) return false; if (lo < 0) lo = 0; } return lo === 0; }",
        tests: [
            { name: 'Simple pair', input: '()', expect: 'true' },
            { name: 'Star as close', input: '(*))', expect: 'true' },
            { name: 'Unclosed opens', input: '(((', expect: 'false' },
            { name: 'Star before open', input: '*(', expect: 'false' },
            { name: 'Reversed pair', input: ')(', expect: 'false' }
        ]
    }
];
