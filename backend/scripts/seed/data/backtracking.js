// Backtracking (9)
module.exports = [
    {
        id: 'subsets',
        title: 'Subsets',
        difficulty: 'Medium',
        tags: ['Backtracking', 'Arrays', 'Bit Manipulation'],
        description: [
            'Given an integer array nums of unique elements, return all possible subsets (the power set), including the empty subset.',
            'The solution must not contain duplicate subsets. Subsets and elements within them may be returned in any order.'
        ],
        constraints: ['1 <= nums.length <= 10', '-10 <= nums[i] <= 10', 'All elements are unique'],
        example: 'Input: nums = [1,2,3]\nOutput: [[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]',
        runner: 'array-to-nested',
        names: { a: 'nums' },
        solutionJs: 'function solution(nums) { const res = [[]]; for (const x of nums) { const len = res.length; for (let i = 0; i < len; i++) res.push([...res[i], x]); } return res; }',
        tests: [
            { name: 'Basic', input: '3\n1 2 3', expect: '\n1\n1 2\n1 2 3\n1 3\n2\n2 3\n3' },
            { name: 'Single element', input: '1\n0', expect: '\n0' },
            { name: 'Two elements with negative', input: '2\n-1 4' }
        ]
    },
    {
        id: 'combination-sum',
        title: 'Combination Sum',
        difficulty: 'Medium',
        tags: ['Backtracking', 'Arrays'],
        description: [
            'Given an array of distinct integers candidates and a target integer target, return all unique combinations of candidates where the chosen numbers sum to target. The same number may be chosen an unlimited number of times.',
            'Two combinations are unique if the multiset of chosen numbers differs. Combinations may be returned in any order.'
        ],
        constraints: ['1 <= candidates.length <= 30', '2 <= candidates[i] <= 40, all distinct', '1 <= target <= 40'],
        example: 'Input: candidates = [2,3,6,7], target = 7\nOutput: [[2,2,3],[7]]',
        runner: 'array-target-to-nested',
        names: { a: 'candidates', b: 'target' },
        solutionJs: 'function solution(candidates, target) { const res = []; const cur = []; (function go(start, remain) { if (remain === 0) { res.push([...cur]); return; } if (remain < 0) return; for (let i = start; i < candidates.length; i++) { cur.push(candidates[i]); go(i, remain - candidates[i]); cur.pop(); } })(0, target); return res; }',
        tests: [
            { name: 'Basic', input: '4\n2 3 6 7\n7', expect: '2 2 3\n7' },
            { name: 'Multiple combos', input: '3\n2 3 5\n8', expect: '2 2 2 2\n2 3 3\n3 5' },
            { name: 'No combination', input: '1\n2\n1', expect: '' }
        ]
    },
    {
        id: 'permutations',
        title: 'Permutations',
        difficulty: 'Medium',
        tags: ['Backtracking', 'Arrays'],
        description: ['Given an array nums of distinct integers, return all possible permutations, in any order.'],
        constraints: ['1 <= nums.length <= 6', '-10 <= nums[i] <= 10', 'All elements are unique'],
        example: 'Input: nums = [1,2,3]\nOutput: [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]',
        runner: 'array-to-perms',
        names: { a: 'nums' },
        solutionJs: 'function solution(nums) { const res = []; (function go(cur, rest) { if (!rest.length) { res.push(cur); return; } for (let i = 0; i < rest.length; i++) go([...cur, rest[i]], [...rest.slice(0, i), ...rest.slice(i + 1)]); })([], nums); return res; }',
        tests: [
            { name: 'Basic', input: '3\n1 2 3', expect: '1 2 3\n1 3 2\n2 1 3\n2 3 1\n3 1 2\n3 2 1' },
            { name: 'Single element', input: '1\n1', expect: '1' },
            { name: 'Two elements', input: '2\n0 1', expect: '0 1\n1 0' }
        ]
    },
    {
        id: 'subsets-ii',
        title: 'Subsets II',
        difficulty: 'Medium',
        tags: ['Backtracking', 'Arrays', 'Bit Manipulation'],
        description: [
            'Given an integer array nums that may contain duplicates, return all possible unique subsets (the power set).',
            'The solution must not contain duplicate subsets. Subsets may be returned in any order.'
        ],
        constraints: ['1 <= nums.length <= 10', '-10 <= nums[i] <= 10'],
        example: 'Input: nums = [1,2,2]\nOutput: [[],[1],[1,2],[1,2,2],[2],[2,2]]',
        runner: 'array-to-nested',
        names: { a: 'nums' },
        solutionJs: 'function solution(nums) { const a = nums.slice().sort((x, y) => x - y); const res = []; (function go(start, cur) { res.push([...cur]); for (let i = start; i < a.length; i++) { if (i > start && a[i] === a[i - 1]) continue; cur.push(a[i]); go(i + 1, cur); cur.pop(); } })(0, []); return res; }',
        tests: [
            { name: 'Basic', input: '3\n1 2 2', expect: '\n1\n1 2\n1 2 2\n2\n2 2' },
            { name: 'All duplicates', input: '3\n0 0 0', expect: '\n0\n0 0\n0 0 0' },
            { name: 'No duplicates', input: '2\n1 2', expect: '\n1\n1 2\n2' }
        ]
    },
    {
        id: 'combination-sum-ii',
        title: 'Combination Sum II',
        difficulty: 'Medium',
        tags: ['Backtracking', 'Arrays'],
        description: [
            'Given a collection of candidate numbers (which may contain duplicates) and a target, find all unique combinations where the candidates sum to target. Each candidate may be used at most once.',
            'The solution set must not contain duplicate combinations.'
        ],
        constraints: ['1 <= candidates.length <= 100', '1 <= candidates[i] <= 50', '1 <= target <= 30'],
        example: 'Input: candidates = [10,1,2,7,6,1,5], target = 8\nOutput: [[1,1,6],[1,2,5],[1,7],[2,6]]',
        runner: 'array-target-to-nested',
        names: { a: 'candidates', b: 'target' },
        solutionJs: 'function solution(candidates, target) { const a = candidates.slice().sort((x, y) => x - y); const res = []; (function go(start, remain, cur) { if (remain === 0) { res.push([...cur]); return; } for (let i = start; i < a.length; i++) { if (i > start && a[i] === a[i - 1]) continue; if (a[i] > remain) break; cur.push(a[i]); go(i + 1, remain - a[i], cur); cur.pop(); } })(0, target, []); return res; }',
        tests: [
            { name: 'Basic', input: '7\n10 1 2 7 6 1 5\n8', expect: '1 1 6\n1 2 5\n1 7\n2 6' },
            { name: 'Duplicates collapse', input: '5\n2 5 2 1 2\n5', expect: '1 2 2\n5' },
            { name: 'No solution', input: '2\n3 5\n2', expect: '' }
        ]
    },
    {
        id: 'word-search',
        title: 'Word Search',
        difficulty: 'Medium',
        tags: ['Backtracking', 'Matrix', 'DFS'],
        description: [
            'Given an m x n grid of characters board and a string word, return true if word exists in the grid.',
            'The word must be constructed from sequentially adjacent cells (horizontally or vertically neighboring); the same cell may not be used more than once.'
        ],
        constraints: ['1 <= m, n <= 6', '1 <= word.length <= 15', 'board and word consist of English letters'],
        example: 'Input: board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"\nOutput: true',
        boilerplate: {
            c: 'bool solution(char** board, int boardSize, int* boardColSize, char* word) {\n    // Write your code here\n    return false;\n}',
            cpp: 'class Solution {\npublic:\n    bool solution(vector<vector<char>>& board, string word) {\n        // Write your code here\n        return false;\n    }\n};',
            java: 'class Solution {\n    public boolean solution(char[][] board, String word) {\n        // Write your code here\n        return false;\n    }\n}',
            js: 'function solution(board, word) {\n    // Write your code here\n    return false;\n}',
            python: 'def solution(board, word):\n    # Write your code here\n    return False'
        },
        tests: []
    },
    {
        id: 'palindrome-partitioning',
        title: 'Palindrome Partitioning',
        difficulty: 'Medium',
        tags: ['Backtracking', 'Strings', 'Dynamic Programming'],
        description: ['Given a string s, partition s such that every substring of the partition is a palindrome. Return all possible palindrome partitionings of s.'],
        constraints: ['1 <= s.length <= 16', 's contains only lowercase English letters'],
        example: 'Input: s = "aab"\nOutput: [["a","a","b"],["aa","b"]]',
        boilerplate: {
            c: 'char*** solution(char* s, int* returnSize, int** returnColumnSizes) {\n    // Write your code here\n    *returnSize = 0;\n    return NULL;\n}',
            cpp: 'class Solution {\npublic:\n    vector<vector<string>> solution(string s) {\n        // Write your code here\n        return {};\n    }\n};',
            java: 'class Solution {\n    public List<List<String>> solution(String s) {\n        // Write your code here\n        return new ArrayList<>();\n    }\n}',
            js: 'function solution(s) {\n    // Write your code here\n    return [];\n}',
            python: 'def solution(s):\n    # Write your code here\n    return []'
        },
        tests: []
    },
    {
        id: 'letter-combinations-of-a-phone-number',
        title: 'Letter Combinations of a Phone Number',
        difficulty: 'Medium',
        tags: ['Backtracking', 'Strings', 'Hash Map'],
        description: [
            'Given a string containing digits from 2-9 inclusive, return all possible letter combinations that the number could represent on a classic phone keypad. Return the answer in any order.',
            'Digit-to-letter mapping: 2=abc, 3=def, 4=ghi, 5=jkl, 6=mno, 7=pqrs, 8=tuv, 9=wxyz.'
        ],
        constraints: ['0 <= digits.length <= 4', 'digits[i] is a digit in [2, 9]'],
        example: 'Input: digits = "23"\nOutput: ["ad","ae","af","bd","be","bf","cd","ce","cf"]',
        runner: 'string-to-sorted-strings',
        names: { a: 'digits' },
        solutionJs: "function solution(digits) { if (!digits) return []; const map = { 2: 'abc', 3: 'def', 4: 'ghi', 5: 'jkl', 6: 'mno', 7: 'pqrs', 8: 'tuv', 9: 'wxyz' }; let res = ['']; for (const d of digits) { const next = []; for (const p of res) for (const c of map[d]) next.push(p + c); res = next; } return res; }",
        tests: [
            { name: 'Basic', input: '23', expect: 'ad ae af bd be bf cd ce cf' },
            { name: 'Empty input', input: '', expect: '' },
            { name: 'Single digit', input: '2', expect: 'a b c' },
            { name: 'Digit with four letters', input: '7', expect: 'p q r s' }
        ]
    },
    {
        id: 'n-queens',
        title: 'N-Queens',
        difficulty: 'Hard',
        tags: ['Backtracking', 'Arrays'],
        description: [
            'The n-queens puzzle is the problem of placing n queens on an n x n chessboard such that no two queens attack each other.',
            "Given an integer n, return all distinct solutions. Each solution is a board configuration where 'Q' marks a queen and '.' an empty square."
        ],
        constraints: ['1 <= n <= 9'],
        example: 'Input: n = 4\nOutput: [[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]]',
        boilerplate: {
            c: 'char*** solution(int n, int* returnSize, int** returnColumnSizes) {\n    // Write your code here\n    *returnSize = 0;\n    return NULL;\n}',
            cpp: 'class Solution {\npublic:\n    vector<vector<string>> solution(int n) {\n        // Write your code here\n        return {};\n    }\n};',
            java: 'class Solution {\n    public List<List<String>> solution(int n) {\n        // Write your code here\n        return new ArrayList<>();\n    }\n}',
            js: 'function solution(n) {\n    // Write your code here\n    return [];\n}',
            python: 'def solution(n):\n    # Write your code here\n    return []'
        },
        tests: []
    }
];
