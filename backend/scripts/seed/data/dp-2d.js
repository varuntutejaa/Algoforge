// 2-D Dynamic Programming (11)
module.exports = [
    {
        id: 'unique-paths',
        title: 'Unique Paths',
        difficulty: 'Medium',
        tags: ['Dynamic Programming', 'Math', 'Combinatorics'],
        description: [
            'A robot starts at the top-left corner of an m x n grid and wants to reach the bottom-right corner. It can only move down or right.',
            'Return the number of distinct paths the robot can take.'
        ],
        constraints: ['1 <= m, n <= 100', 'The answer fits in a 32-bit integer'],
        example: 'Input: m = 3, n = 7\nOutput: 28',
        runner: 'two-ints-to-int',
        names: { a: 'm', b: 'n' },
        solutionJs: 'function solution(m, n) { const dp = new Array(n).fill(1); for (let i = 1; i < m; i++) { for (let j = 1; j < n; j++) dp[j] += dp[j - 1]; } return dp[n - 1]; }',
        tests: [
            { name: 'Basic', input: '3 7', expect: '28' },
            { name: 'Small grid', input: '3 2', expect: '3' },
            { name: 'Single cell', input: '1 1', expect: '1' },
            { name: 'Square grid', input: '10 10', expect: '48620' }
        ]
    },
    {
        id: 'longest-common-subsequence',
        title: 'Longest Common Subsequence',
        difficulty: 'Medium',
        tags: ['Dynamic Programming', 'Strings'],
        description: [
            'Given two strings text1 and text2, return the length of their longest common subsequence (a sequence derived by deleting zero or more characters without changing the relative order of the rest), or 0 if there is none.'
        ],
        constraints: ['1 <= text1.length, text2.length <= 1000', 'Both strings consist of lowercase English letters'],
        example: 'Input: text1 = "abcde", text2 = "ace"\nOutput: 3\nExplanation: The LCS is "ace".',
        runner: 'two-strings-to-int',
        names: { a: 'text1', b: 'text2' },
        solutionJs: 'function solution(text1, text2) { const m = text1.length, n = text2.length; const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0)); for (let i = 1; i <= m; i++) { for (let j = 1; j <= n; j++) { dp[i][j] = text1[i - 1] === text2[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]); } } return dp[m][n]; }',
        tests: [
            { name: 'Basic', input: 'abcde\nace', expect: '3' },
            { name: 'Identical strings', input: 'abc\nabc', expect: '3' },
            { name: 'No common subsequence', input: 'abc\ndef', expect: '0' },
            { name: 'Single common letter', input: 'bsbininm\njmjkbkjkv', expect: '1' }
        ]
    },
    {
        id: 'best-time-to-buy-and-sell-stock-with-cooldown',
        title: 'Best Time to Buy and Sell Stock with Cooldown',
        difficulty: 'Medium',
        tags: ['Dynamic Programming', 'Arrays'],
        description: [
            'You are given an array prices where prices[i] is the price of a stock on day i. You may complete as many transactions as you like, but after selling you must cooldown one day before buying again, and you may hold at most one share at a time.',
            'Return the maximum profit you can achieve.'
        ],
        constraints: ['1 <= prices.length <= 5000', '0 <= prices[i] <= 1000'],
        example: 'Input: prices = [1,2,3,0,2]\nOutput: 3\nExplanation: buy, sell, cooldown, buy, sell.',
        runner: 'array-to-int',
        names: { a: 'prices' },
        solutionJs: 'function solution(prices) { let hold = -Infinity, sold = 0, rest = 0; for (const p of prices) { const prevSold = sold; sold = hold + p; hold = Math.max(hold, rest - p); rest = Math.max(rest, prevSold); } return Math.max(sold, rest); }',
        tests: [
            { name: 'Basic', input: '5\n1 2 3 0 2', expect: '3' },
            { name: 'Single day', input: '1\n1', expect: '0' },
            { name: 'One trade', input: '2\n1 2', expect: '1' },
            { name: 'Cooldown matters', input: '5\n2 1 4 5 0' }
        ]
    },
    {
        id: 'coin-change-ii',
        title: 'Coin Change II',
        difficulty: 'Medium',
        tags: ['Dynamic Programming', 'Arrays'],
        description: [
            'You are given coins of different denominations and an amount. Return the number of distinct combinations of coins that make up that amount (order does not matter). You have an infinite supply of each coin.',
            'If the amount cannot be made up, return 0.'
        ],
        constraints: ['1 <= coins.length <= 300', '1 <= coins[i] <= 5000, all distinct', '0 <= amount <= 5000'],
        example: 'Input: coins = [1,2,5], amount = 5\nOutput: 4\nExplanation: 5, 2+2+1, 2+1+1+1, 1+1+1+1+1.',
        runner: 'array-target-to-int',
        names: { a: 'coins', b: 'amount' },
        solutionJs: 'function solution(coins, amount) { const dp = new Array(amount + 1).fill(0); dp[0] = 1; for (const c of coins) { for (let a = c; a <= amount; a++) dp[a] += dp[a - c]; } return dp[amount]; }',
        tests: [
            { name: 'Basic', input: '3\n1 2 5\n5', expect: '4' },
            { name: 'Impossible', input: '1\n2\n3', expect: '0' },
            { name: 'Exact single coin', input: '1\n10\n10', expect: '1' },
            { name: 'Zero amount', input: '2\n2 3\n0', expect: '1' }
        ]
    },
    {
        id: 'target-sum',
        title: 'Target Sum',
        difficulty: 'Medium',
        tags: ['Dynamic Programming', 'Arrays', 'Backtracking'],
        description: [
            "You are given an integer array nums and an integer target. For each number you choose either a '+' or '-' sign, then concatenate the signed numbers into an expression.",
            'Return the number of different expressions that evaluate to target.'
        ],
        constraints: ['1 <= nums.length <= 20', '0 <= nums[i] <= 1000', '-1000 <= target <= 1000'],
        example: 'Input: nums = [1,1,1,1,1], target = 3\nOutput: 5',
        runner: 'array-target-to-int',
        names: { a: 'nums', b: 'target' },
        solutionJs: 'function solution(nums, target) { let counts = new Map([[0, 1]]); for (const x of nums) { const next = new Map(); for (const [s, c] of counts) { next.set(s + x, (next.get(s + x) || 0) + c); next.set(s - x, (next.get(s - x) || 0) + c); } counts = next; } return counts.get(target) || 0; }',
        tests: [
            { name: 'Basic', input: '5\n1 1 1 1 1\n3', expect: '5' },
            { name: 'Single element hit', input: '1\n1\n1', expect: '1' },
            { name: 'Unreachable target', input: '1\n1\n2', expect: '0' },
            { name: 'Zeros double the ways', input: '3\n0 0 1\n1', expect: '4' }
        ]
    },
    {
        id: 'interleaving-string',
        title: 'Interleaving String',
        difficulty: 'Hard',
        tags: ['Dynamic Programming', 'Strings'],
        description: [
            'Given strings s1, s2 and s3, return true if s3 is formed by an interleaving of s1 and s2: a merge that preserves the left-to-right order of the characters of both strings.'
        ],
        constraints: ['0 <= s1.length, s2.length <= 100', '0 <= s3.length <= 200'],
        example: 'Input: s1 = "aabcc", s2 = "dbbca", s3 = "aadbbcbcac"\nOutput: true',
        runner: 'three-strings-to-bool',
        names: { a: 's1', b: 's2', c: 's3' },
        solutionJs: 'function solution(s1, s2, s3) { const m = s1.length, n = s2.length; if (m + n !== s3.length) return false; const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(false)); dp[0][0] = true; for (let i = 0; i <= m; i++) { for (let j = 0; j <= n; j++) { if (i > 0 && dp[i - 1][j] && s1[i - 1] === s3[i + j - 1]) dp[i][j] = true; if (j > 0 && dp[i][j - 1] && s2[j - 1] === s3[i + j - 1]) dp[i][j] = true; } } return dp[m][n]; }',
        tests: [
            { name: 'Valid interleaving', input: 'aabcc\ndbbca\naadbbcbcac', expect: 'true' },
            { name: 'Invalid interleaving', input: 'aabcc\ndbbca\naadbbbaccc', expect: 'false' },
            { name: 'All empty', input: '\n\n', expect: 'true' },
            { name: 'One string empty', input: 'abc\n\nabc', expect: 'true' },
            { name: 'Length mismatch', input: 'a\nb\nabc', expect: 'false' }
        ]
    },
    {
        id: 'longest-increasing-path-in-a-matrix',
        title: 'Longest Increasing Path in a Matrix',
        difficulty: 'Hard',
        tags: ['Dynamic Programming', 'Matrix', 'DFS', 'Memoization'],
        description: [
            'Given an m x n integer matrix, return the length of the longest strictly increasing path. From each cell you can move up, down, left or right (no diagonals, no wrapping).'
        ],
        constraints: ['1 <= m, n <= 200', '0 <= matrix[i][j] <= 2^31 - 1'],
        example: 'Input: matrix = [[9,9,4],[6,6,8],[2,1,1]]\nOutput: 4\nExplanation: The path is [1, 2, 6, 9].',
        runner: 'matrix-to-int',
        names: { a: 'matrix' },
        solutionJs: 'function solution(matrix) { const r = matrix.length, c = matrix[0].length; const memo = Array.from({ length: r }, () => new Array(c).fill(0)); const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]; function dfs(i, j) { if (memo[i][j]) return memo[i][j]; let best = 1; for (const [di, dj] of dirs) { const ni = i + di, nj = j + dj; if (ni >= 0 && nj >= 0 && ni < r && nj < c && matrix[ni][nj] > matrix[i][j]) best = Math.max(best, 1 + dfs(ni, nj)); } memo[i][j] = best; return best; } let ans = 0; for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) ans = Math.max(ans, dfs(i, j)); return ans; }',
        tests: [
            { name: 'Basic', input: '3 3\n9 9 4 6 6 8 2 1 1', expect: '4' },
            { name: 'Second example', input: '3 3\n3 4 5 3 2 6 2 2 1', expect: '4' },
            { name: 'Single cell', input: '1 1\n1', expect: '1' },
            { name: 'Strict increase required', input: '1 3\n7 7 7', expect: '1' }
        ]
    },
    {
        id: 'distinct-subsequences',
        title: 'Distinct Subsequences',
        difficulty: 'Hard',
        tags: ['Dynamic Programming', 'Strings'],
        description: [
            'Given two strings s and t, return the number of distinct subsequences of s that equal t. The answer is guaranteed to fit in a 32-bit signed integer.'
        ],
        constraints: ['1 <= s.length, t.length <= 1000', 's and t consist of English letters'],
        example: 'Input: s = "rabbbit", t = "rabbit"\nOutput: 3',
        runner: 'two-strings-to-int',
        names: { a: 's', b: 't' },
        solutionJs: 'function solution(s, t) { const m = s.length, n = t.length; const dp = new Array(n + 1).fill(0); dp[0] = 1; for (let i = 1; i <= m; i++) { for (let j = n; j >= 1; j--) { if (s[i - 1] === t[j - 1]) dp[j] += dp[j - 1]; } } return dp[n]; }',
        tests: [
            { name: 'Basic', input: 'rabbbit\nrabbit', expect: '3' },
            { name: 'Multiple picks', input: 'babgbag\nbag', expect: '5' },
            { name: 't longer than s', input: 'abc\nabcd', expect: '0' }
        ]
    },
    {
        id: 'edit-distance',
        title: 'Edit Distance',
        difficulty: 'Medium',
        tags: ['Dynamic Programming', 'Strings'],
        description: [
            'Given two strings word1 and word2, return the minimum number of operations required to convert word1 to word2. Allowed operations: insert a character, delete a character, replace a character.'
        ],
        constraints: ['0 <= word1.length, word2.length <= 500', 'Both consist of lowercase English letters'],
        example: 'Input: word1 = "horse", word2 = "ros"\nOutput: 3',
        runner: 'two-strings-to-int',
        names: { a: 'word1', b: 'word2' },
        solutionJs: 'function solution(word1, word2) { const m = word1.length, n = word2.length; const dp = Array.from({ length: m + 1 }, (_, i) => { const row = new Array(n + 1).fill(0); row[0] = i; return row; }); for (let j = 0; j <= n; j++) dp[0][j] = j; for (let i = 1; i <= m; i++) { for (let j = 1; j <= n; j++) { dp[i][j] = word1[i - 1] === word2[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]); } } return dp[m][n]; }',
        tests: [
            { name: 'Basic', input: 'horse\nros', expect: '3' },
            { name: 'Longer words', input: 'intention\nexecution', expect: '5' },
            { name: 'Empty source', input: '\nabc', expect: '3' },
            { name: 'Identical words', input: 'same\nsame', expect: '0' }
        ]
    },
    {
        id: 'burst-balloons',
        title: 'Burst Balloons',
        difficulty: 'Hard',
        tags: ['Dynamic Programming', 'Arrays', 'Divide and Conquer'],
        description: [
            'You are given n balloons, each painted with a number nums[i]. When you burst balloon i you gain nums[left] * nums[i] * nums[right] coins, where left and right are its current neighbors (out-of-bounds neighbors count as 1). After a burst, its neighbors become adjacent.',
            'Return the maximum coins you can collect by bursting all the balloons.'
        ],
        constraints: ['1 <= nums.length <= 300', '0 <= nums[i] <= 100'],
        example: 'Input: nums = [3,1,5,8]\nOutput: 167\nExplanation: [3,1,5,8] -> [3,5,8] -> [3,8] -> [8] -> [] gives 15 + 120 + 24 + 8 = 167.',
        runner: 'array-to-int',
        names: { a: 'nums' },
        solutionJs: 'function solution(nums) { const a = [1, ...nums, 1]; const n = a.length; const dp = Array.from({ length: n }, () => new Array(n).fill(0)); for (let len = 2; len < n; len++) { for (let l = 0; l + len < n; l++) { const r = l + len; for (let k = l + 1; k < r; k++) { const cand = dp[l][k] + dp[k][r] + a[l] * a[k] * a[r]; if (cand > dp[l][r]) dp[l][r] = cand; } } } return dp[0][n - 1]; }',
        tests: [
            { name: 'Basic', input: '4\n3 1 5 8', expect: '167' },
            { name: 'Single balloon', input: '1\n5', expect: '5' },
            { name: 'Two balloons', input: '2\n1 5', expect: '10' },
            { name: 'Contains zero', input: '3\n2 0 3', expect: '9' }
        ]
    },
    {
        id: 'regular-expression-matching',
        title: 'Regular Expression Matching',
        difficulty: 'Hard',
        tags: ['Dynamic Programming', 'Strings', 'Recursion'],
        description: [
            "Given an input string s and a pattern p, implement regular expression matching with support for '.' (matches any single character) and '*' (matches zero or more of the preceding element).",
            'The matching must cover the entire input string, not a partial match.'
        ],
        constraints: ['1 <= s.length <= 20', '1 <= p.length <= 20', "s contains only lowercase letters; p contains lowercase letters, '.' and '*'", "Every '*' is preceded by a valid character"],
        example: 'Input: s = "aa", p = "a*"\nOutput: true',
        runner: 'two-strings-to-bool',
        names: { a: 's', b: 'p' },
        solutionJs: "function solution(s, p) { const m = s.length, n = p.length; const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(false)); dp[0][0] = true; for (let j = 1; j <= n; j++) if (p[j - 1] === '*') dp[0][j] = dp[0][j - 2]; for (let i = 1; i <= m; i++) { for (let j = 1; j <= n; j++) { if (p[j - 1] === '*') { dp[i][j] = dp[i][j - 2] || ((p[j - 2] === '.' || p[j - 2] === s[i - 1]) && dp[i - 1][j]); } else { dp[i][j] = (p[j - 1] === '.' || p[j - 1] === s[i - 1]) && dp[i - 1][j - 1]; } } } return dp[m][n]; }",
        tests: [
            { name: 'No match', input: 'aa\na', expect: 'false' },
            { name: 'Star repeats', input: 'aa\na*', expect: 'true' },
            { name: 'Dot star', input: 'ab\n.*', expect: 'true' },
            { name: 'Zero occurrences', input: 'aab\nc*a*b', expect: 'true' },
            { name: 'Classic tricky case', input: 'mississippi\nmis*is*p*.', expect: 'false' }
        ]
    }
];
