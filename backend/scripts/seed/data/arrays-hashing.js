// Arrays & Hashing (9)
module.exports = [
    {
        id: 'contains-duplicate',
        title: 'Contains Duplicate',
        difficulty: 'Easy',
        tags: ['Arrays', 'Hash Map'],
        description: [
            'Given an integer array nums, return true if any value appears at least twice in the array, and false if every element is distinct.'
        ],
        constraints: ['1 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9'],
        example: 'Input: nums = [1,2,3,1]\nOutput: true\nExplanation: The value 1 appears twice.',
        runner: 'array-to-bool',
        names: { a: 'nums' },
        solutionJs: 'function solution(nums) { return new Set(nums).size !== nums.length; }',
        tests: [
            { name: 'Duplicate present', input: '4\n1 2 3 1', expect: 'true' },
            { name: 'All distinct', input: '4\n1 2 3 4', expect: 'false' },
            { name: 'Single element', input: '1\n7', expect: 'false' },
            { name: 'Many duplicates', input: '10\n1 1 1 3 3 4 3 2 4 2', expect: 'true' },
            { name: 'Negative duplicate', input: '3\n-1 5 -1', expect: 'true' }
        ]
    },
    {
        id: 'valid-anagram',
        title: 'Valid Anagram',
        difficulty: 'Easy',
        tags: ['Arrays', 'Hash Map', 'Strings'],
        description: [
            'Given two strings s and t, return true if t is an anagram of s, and false otherwise.',
            'An anagram is a word formed by rearranging the letters of another word, using all the original letters exactly once.'
        ],
        constraints: ['1 <= s.length, t.length <= 5 * 10^4', 's and t consist of lowercase English letters'],
        example: 'Input: s = "anagram", t = "nagaram"\nOutput: true',
        runner: 'two-strings-to-bool',
        names: { a: 's', b: 't' },
        solutionJs: "function solution(s, t) { if (s.length !== t.length) return false; return s.split('').sort().join('') === t.split('').sort().join(''); }",
        tests: [
            { name: 'Anagram', input: 'anagram\nnagaram', expect: 'true' },
            { name: 'Not an anagram', input: 'rat\ncar', expect: 'false' },
            { name: 'Different lengths', input: 'a\nab', expect: 'false' },
            { name: 'Same letters different counts', input: 'aacc\nccac', expect: 'false' },
            { name: 'Single letter', input: 'a\na', expect: 'true' }
        ]
    },
    {
        id: 'two-sum',
        title: 'Two Sum',
        difficulty: 'Easy',
        tags: ['Arrays', 'Hash Map'],
        description: [
            'Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target.',
            'You may assume that each input has exactly one solution, and you may not use the same element twice. Return the answer with the smaller index first.'
        ],
        constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', 'Exactly one valid answer exists'],
        example: 'Input: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nExplanation: nums[0] + nums[1] == 9.',
        runner: 'two-sum',
        names: {},
        solutionJs: 'function twoSum(nums, target) { const m = new Map(); for (let i = 0; i < nums.length; i++) { const c = target - nums[i]; if (m.has(c)) return [m.get(c), i]; m.set(nums[i], i); } return []; }',
        tests: [
            { name: 'Basic', input: '4\n2 7 11 15\n9', expect: '0 1' },
            { name: 'Answer not at start', input: '3\n3 2 4\n6', expect: '1 2' },
            { name: 'Duplicate values', input: '2\n3 3\n6', expect: '0 1' },
            { name: 'Negative numbers', input: '5\n-1 -2 -3 -4 -5\n-8', expect: '2 4' }
        ]
    },
    {
        id: 'group-anagrams',
        title: 'Group Anagrams',
        difficulty: 'Medium',
        tags: ['Arrays', 'Hash Map', 'Strings'],
        description: [
            'Given an array of strings strs, group the anagrams together. You may return the groups and the strings within each group in any order.',
            'Two strings are anagrams if one can be formed by rearranging the letters of the other.'
        ],
        constraints: ['1 <= strs.length <= 10^4', '0 <= strs[i].length <= 100', 'strs[i] consists of lowercase English letters'],
        example: 'Input: strs = ["eat","tea","tan","ate","nat","bat"]\nOutput: [["bat"],["nat","tan"],["ate","eat","tea"]]',
        boilerplate: {
            c: 'char*** solution(char** strs, int strsSize, int* returnSize, int** returnColumnSizes) {\n    // Write your code here\n    *returnSize = 0;\n    return NULL;\n}',
            cpp: 'class Solution {\npublic:\n    vector<vector<string>> solution(vector<string>& strs) {\n        // Write your code here\n        return {};\n    }\n};',
            java: 'class Solution {\n    public List<List<String>> solution(String[] strs) {\n        // Write your code here\n        return new ArrayList<>();\n    }\n}',
            js: 'function solution(strs) {\n    // Write your code here\n    return [];\n}',
            python: 'def solution(strs):\n    # Write your code here\n    return []'
        },
        tests: []
    },
    {
        id: 'top-k-frequent-elements',
        title: 'Top K Frequent Elements',
        difficulty: 'Medium',
        tags: ['Arrays', 'Hash Map', 'Sorting'],
        description: [
            'Given an integer array nums and an integer k, return the k most frequent elements. You may return the answer in any order.',
            'It is guaranteed that the answer is unique — no two candidate elements have the same frequency at the cutoff.'
        ],
        constraints: ['1 <= nums.length <= 10^5', '1 <= k <= number of distinct elements', 'The answer is guaranteed to be unique'],
        example: 'Input: nums = [1,1,1,2,2,3], k = 2\nOutput: [1,2]',
        runner: 'array-k-to-sorted-array',
        names: { a: 'nums', b: 'k' },
        solutionJs: 'function solution(nums, k) { const m = new Map(); for (const x of nums) m.set(x, (m.get(x) || 0) + 1); return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, k).map((e) => e[0]); }',
        tests: [
            { name: 'Basic', input: '6 2\n1 1 1 2 2 3', expect: '1 2' },
            { name: 'Single element', input: '1 1\n1', expect: '1' },
            { name: 'Three winners', input: '8 3\n4 4 4 6 6 7 7 10' },
            { name: 'Negatives', input: '5 2\n-1 -1 -2 -2 -3', expect: '-2 -1' }
        ]
    },
    {
        id: 'encode-and-decode-strings',
        title: 'Encode and Decode Strings',
        difficulty: 'Medium',
        tags: ['Arrays', 'Strings', 'Design'],
        description: [
            'Design an algorithm to encode a list of strings into a single string, and a matching algorithm to decode that single string back into the original list.',
            'The strings may contain any characters, including the delimiter characters your encoding uses. decode(encode(strs)) must equal strs.'
        ],
        constraints: ['1 <= strs.length <= 200', '0 <= strs[i].length <= 200', 'strs[i] may contain any ASCII character'],
        example: 'Input: strs = ["neet","code","love","you"]\nencode -> "4#neet4#code4#love4#you"\ndecode -> ["neet","code","love","you"]',
        boilerplate: {
            c: 'char* encode(char** strs, int strsSize) {\n    // Write your code here\n    return "";\n}\n\nchar** decode(char* s, int* returnSize) {\n    // Write your code here\n    *returnSize = 0;\n    return NULL;\n}',
            cpp: 'class Solution {\npublic:\n    string encode(vector<string>& strs) {\n        // Write your code here\n        return "";\n    }\n\n    vector<string> decode(string s) {\n        // Write your code here\n        return {};\n    }\n};',
            java: 'class Solution {\n    public String encode(List<String> strs) {\n        // Write your code here\n        return "";\n    }\n\n    public List<String> decode(String s) {\n        // Write your code here\n        return new ArrayList<>();\n    }\n}',
            js: 'function encode(strs) {\n    // Write your code here\n    return \'\';\n}\n\nfunction decode(s) {\n    // Write your code here\n    return [];\n}',
            python: 'def encode(strs):\n    # Write your code here\n    return \'\'\n\ndef decode(s):\n    # Write your code here\n    return []'
        },
        tests: []
    },
    {
        id: 'product-of-array-except-self',
        title: 'Product of Array Except Self',
        difficulty: 'Medium',
        tags: ['Arrays', 'Prefix Sum'],
        description: [
            'Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].',
            'You must write an algorithm that runs in O(n) time without using the division operation. The product of any prefix or suffix fits in a 32-bit integer.'
        ],
        constraints: ['2 <= nums.length <= 10^5', '-30 <= nums[i] <= 30'],
        example: 'Input: nums = [1,2,3,4]\nOutput: [24,12,8,6]',
        runner: 'array-to-array',
        names: { a: 'nums' },
        solutionJs: 'function solution(nums) { const n = nums.length; const res = new Array(n).fill(1); let p = 1; for (let i = 0; i < n; i++) { res[i] = p; p *= nums[i]; } let s = 1; for (let i = n - 1; i >= 0; i--) { res[i] *= s; s *= nums[i]; } return res; }',
        tests: [
            { name: 'Basic', input: '4\n1 2 3 4', expect: '24 12 8 6' },
            { name: 'Contains zero', input: '5\n-1 1 0 -3 3', expect: '0 0 9 0 0' },
            { name: 'Two elements', input: '2\n3 5', expect: '5 3' },
            { name: 'All equal', input: '4\n2 2 2 2', expect: '8 8 8 8' }
        ]
    },
    {
        id: 'valid-sudoku',
        title: 'Valid Sudoku',
        difficulty: 'Medium',
        tags: ['Arrays', 'Hash Map', 'Matrix'],
        description: [
            'Determine if a 9x9 Sudoku board is valid. Only the filled cells need to be validated: each row, each column, and each of the nine 3x3 sub-boxes must contain the digits 1-9 without repetition.',
            'A partially filled board can be valid even if it is not solvable.'
        ],
        constraints: ['board.length == 9', 'board[i].length == 9', "board[i][j] is a digit 1-9 or '.'"],
        example: 'Input: a 9x9 board with no repeated digit in any row, column, or 3x3 box\nOutput: true',
        boilerplate: {
            c: 'bool solution(char board[9][9]) {\n    // Write your code here\n    return false;\n}',
            cpp: 'class Solution {\npublic:\n    bool solution(vector<vector<char>>& board) {\n        // Write your code here\n        return false;\n    }\n};',
            java: 'class Solution {\n    public boolean solution(char[][] board) {\n        // Write your code here\n        return false;\n    }\n}',
            js: 'function solution(board) {\n    // Write your code here\n    return false;\n}',
            python: 'def solution(board):\n    # Write your code here\n    return False'
        },
        tests: []
    },
    {
        id: 'longest-consecutive-sequence',
        title: 'Longest Consecutive Sequence',
        difficulty: 'Medium',
        tags: ['Arrays', 'Hash Map'],
        description: [
            'Given an unsorted array of integers nums, return the length of the longest run of consecutive integers that all appear in the array (the elements of the run do not need to be adjacent in the array).',
            'You must write an algorithm that runs in O(n) time.'
        ],
        constraints: ['0 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9'],
        example: 'Input: nums = [100,4,200,1,3,2]\nOutput: 4\nExplanation: The longest consecutive sequence is [1,2,3,4].',
        runner: 'array-to-int',
        names: { a: 'nums' },
        solutionJs: 'function solution(nums) { const s = new Set(nums); let best = 0; for (const x of s) { if (!s.has(x - 1)) { let len = 1, y = x; while (s.has(y + 1)) { y++; len++; } if (len > best) best = len; } } return best; }',
        tests: [
            { name: 'Basic', input: '6\n100 4 200 1 3 2', expect: '4' },
            { name: 'With duplicates', input: '10\n0 3 7 2 5 8 4 6 0 1', expect: '9' },
            { name: 'Empty array', input: '0', expect: '0' },
            { name: 'Single element', input: '1\n5', expect: '1' },
            { name: 'Negatives beat positives', input: '7\n-2 -3 -1 5 6 7 8', expect: '4' }
        ]
    }
];
