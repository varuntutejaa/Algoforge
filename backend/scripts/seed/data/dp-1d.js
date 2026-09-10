// 1-D Dynamic Programming (12)
module.exports = [
    {
        id: 'climbing-stairs',
        title: 'Climbing Stairs',
        difficulty: 'Easy',
        tags: ['Dynamic Programming', 'Math'],
        description: [
            'You are climbing a staircase that takes n steps to reach the top. Each time you can climb either 1 or 2 steps. In how many distinct ways can you climb to the top?'
        ],
        constraints: ['1 <= n <= 45'],
        example: 'Input: n = 3\nOutput: 3\nExplanation: 1+1+1, 1+2 and 2+1.',
        runner: 'int-to-int',
        names: { a: 'n' },
        solutionJs: 'function solution(n) { let a = 1, b = 1; for (let i = 2; i <= n; i++) { [a, b] = [b, a + b]; } return b; }',
        tests: [
            { name: 'Two steps', input: '2', expect: '2' },
            { name: 'Three steps', input: '3', expect: '3' },
            { name: 'One step', input: '1', expect: '1' },
            { name: 'Upper bound', input: '45', expect: '1836311903' }
        ]
    },
    {
        id: 'min-cost-climbing-stairs',
        title: 'Min Cost Climbing Stairs',
        difficulty: 'Easy',
        tags: ['Dynamic Programming', 'Arrays'],
        description: [
            'You are given an array cost where cost[i] is the cost of stepping on the i-th stair. After paying, you can climb one or two steps. You may start from step 0 or step 1.',
            'Return the minimum cost to reach the top of the floor (one past the last stair).'
        ],
        constraints: ['2 <= cost.length <= 1000', '0 <= cost[i] <= 999'],
        example: 'Input: cost = [10,15,20]\nOutput: 15\nExplanation: Start at index 1, pay 15, climb two steps to the top.',
        runner: 'array-to-int',
        names: { a: 'cost' },
        solutionJs: 'function solution(cost) { let a = 0, b = 0; for (let i = 2; i <= cost.length; i++) { [a, b] = [b, Math.min(b + cost[i - 1], a + cost[i - 2])]; } return b; }',
        tests: [
            { name: 'Basic', input: '3\n10 15 20', expect: '15' },
            { name: 'Longer stairs', input: '10\n1 100 1 1 1 100 1 1 100 1', expect: '6' },
            { name: 'Free stairs', input: '2\n0 0', expect: '0' }
        ]
    },
    {
        id: 'house-robber',
        title: 'House Robber',
        difficulty: 'Medium',
        tags: ['Dynamic Programming', 'Arrays'],
        description: [
            'You are a robber planning to rob houses along a street; nums[i] is the money in the i-th house. Adjacent houses have connected alarms, so you cannot rob two adjacent houses.',
            'Return the maximum amount of money you can rob without alerting the police.'
        ],
        constraints: ['1 <= nums.length <= 100', '0 <= nums[i] <= 400'],
        example: 'Input: nums = [2,7,9,3,1]\nOutput: 12\nExplanation: Rob houses 0, 2 and 4 (2 + 9 + 1).',
        runner: 'array-to-int',
        names: { a: 'nums' },
        solutionJs: 'function solution(nums) { let rob = 0, skip = 0; for (const x of nums) { [rob, skip] = [skip + x, Math.max(rob, skip)]; } return Math.max(rob, skip); }',
        tests: [
            { name: 'Basic', input: '4\n1 2 3 1', expect: '4' },
            { name: 'Alternating', input: '5\n2 7 9 3 1', expect: '12' },
            { name: 'Single house', input: '1\n5', expect: '5' },
            { name: 'Two houses', input: '2\n2 1', expect: '2' }
        ]
    },
    {
        id: 'house-robber-ii',
        title: 'House Robber II',
        difficulty: 'Medium',
        tags: ['Dynamic Programming', 'Arrays'],
        description: [
            'Same setting as House Robber, but the houses are arranged in a circle: the first and last houses are adjacent.',
            'Return the maximum amount of money you can rob without robbing two adjacent houses.'
        ],
        constraints: ['1 <= nums.length <= 100', '0 <= nums[i] <= 1000'],
        example: 'Input: nums = [2,3,2]\nOutput: 3\nExplanation: You cannot rob both house 0 and house 2.',
        runner: 'array-to-int',
        names: { a: 'nums' },
        solutionJs: 'function solution(nums) { if (nums.length === 1) return nums[0]; function robLine(a) { let rob = 0, skip = 0; for (const x of a) { [rob, skip] = [skip + x, Math.max(rob, skip)]; } return Math.max(rob, skip); } return Math.max(robLine(nums.slice(1)), robLine(nums.slice(0, -1))); }',
        tests: [
            { name: 'Basic circle', input: '3\n2 3 2', expect: '3' },
            { name: 'Skip the wrap', input: '4\n1 2 3 1', expect: '4' },
            { name: 'Single house', input: '1\n1', expect: '1' },
            { name: 'Ascending', input: '3\n1 2 3', expect: '3' }
        ]
    },
    {
        id: 'longest-palindromic-substring',
        title: 'Longest Palindromic Substring',
        difficulty: 'Medium',
        tags: ['Dynamic Programming', 'Strings', 'Two Pointers'],
        description: [
            'Given a string s, return the longest palindromic substring in s. The test cases are chosen such that the answer is unique.'
        ],
        constraints: ['1 <= s.length <= 1000', 's consists of digits and English letters'],
        example: 'Input: s = "cbbd"\nOutput: "bb"',
        runner: 'string-to-string',
        names: { a: 's' },
        solutionJs: "function solution(s) { let best = ''; function expand(l, r) { while (l >= 0 && r < s.length && s[l] === s[r]) { l--; r++; } const cand = s.slice(l + 1, r); if (cand.length > best.length) best = cand; } for (let i = 0; i < s.length; i++) { expand(i, i); expand(i, i + 1); } return best; }",
        tests: [
            { name: 'Even palindrome', input: 'cbbd', expect: 'bb' },
            { name: 'Single character', input: 'a', expect: 'a' },
            { name: 'Whole string', input: 'abcba', expect: 'abcba' },
            { name: 'Odd palindrome inside', input: 'xabacaby', expect: 'bacab' }
        ]
    },
    {
        id: 'palindromic-substrings',
        title: 'Palindromic Substrings',
        difficulty: 'Medium',
        tags: ['Dynamic Programming', 'Strings', 'Two Pointers'],
        description: ['Given a string s, return the number of palindromic substrings in it. Substrings with different start or end indices count separately even if they consist of the same characters.'],
        constraints: ['1 <= s.length <= 1000', 's consists of lowercase English letters'],
        example: 'Input: s = "aaa"\nOutput: 6\nExplanation: "a","a","a","aa","aa","aaa".',
        runner: 'string-to-int',
        names: { a: 's' },
        solutionJs: 'function solution(s) { let count = 0; function expand(l, r) { while (l >= 0 && r < s.length && s[l] === s[r]) { count++; l--; r++; } } for (let i = 0; i < s.length; i++) { expand(i, i); expand(i, i + 1); } return count; }',
        tests: [
            { name: 'All distinct', input: 'abc', expect: '3' },
            { name: 'Repeated letter', input: 'aaa', expect: '6' },
            { name: 'Single character', input: 'a', expect: '1' },
            { name: 'Even palindrome', input: 'abba', expect: '6' }
        ]
    },
    {
        id: 'decode-ways',
        title: 'Decode Ways',
        difficulty: 'Medium',
        tags: ['Dynamic Programming', 'Strings'],
        description: [
            'A message of letters A-Z is encoded to digits with A=1 ... Z=26. Given a string s of digits, return the number of ways it can be decoded (e.g., "11106" can be "AAJF" or "KJF").',
            'A leading zero in a group makes it invalid: "06" cannot be decoded.'
        ],
        constraints: ['1 <= s.length <= 100', 's contains only digits'],
        example: 'Input: s = "226"\nOutput: 3\nExplanation: "BZ" (2 26), "VF" (22 6), or "BBF" (2 2 6).',
        runner: 'string-to-int',
        names: { a: 's' },
        solutionJs: "function solution(s) { if (!s.length || s[0] === '0') return 0; let prev = 1, cur = 1; for (let i = 1; i < s.length; i++) { let next = 0; if (s[i] !== '0') next += cur; const two = parseInt(s.slice(i - 1, i + 1), 10); if (two >= 10 && two <= 26) next += prev; prev = cur; cur = next; } return cur; }",
        tests: [
            { name: 'Two ways', input: '12', expect: '2' },
            { name: 'Three ways', input: '226', expect: '3' },
            { name: 'Leading zero group', input: '06', expect: '0' },
            { name: 'Zero forces pairing', input: '2101', expect: '1' },
            { name: 'Longer message', input: '11106', expect: '2' }
        ]
    },
    {
        id: 'coin-change',
        title: 'Coin Change',
        difficulty: 'Medium',
        tags: ['Dynamic Programming', 'Arrays', 'BFS'],
        description: [
            'You are given coins of different denominations and an amount. Return the fewest number of coins needed to make up that amount, or -1 if it cannot be made. You have an infinite supply of each coin.'
        ],
        constraints: ['1 <= coins.length <= 12', '1 <= coins[i] <= 2^31 - 1', '0 <= amount <= 10^4'],
        example: 'Input: coins = [1,2,5], amount = 11\nOutput: 3\nExplanation: 11 = 5 + 5 + 1.',
        runner: 'array-target-to-int',
        names: { a: 'coins', b: 'amount' },
        solutionJs: 'function solution(coins, amount) { const dp = new Array(amount + 1).fill(Infinity); dp[0] = 0; for (let a = 1; a <= amount; a++) { for (const c of coins) if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1; } return dp[amount] === Infinity ? -1 : dp[amount]; }',
        tests: [
            { name: 'Basic', input: '3\n1 2 5\n11', expect: '3' },
            { name: 'Impossible', input: '1\n2\n3', expect: '-1' },
            { name: 'Zero amount', input: '1\n1\n0', expect: '0' },
            { name: 'Large amount', input: '4\n186 419 83 408\n6249', expect: '20' }
        ]
    },
    {
        id: 'maximum-product-subarray',
        title: 'Maximum Product Subarray',
        difficulty: 'Medium',
        tags: ['Dynamic Programming', 'Arrays'],
        description: [
            'Given an integer array nums, find the contiguous non-empty subarray that has the largest product, and return that product.'
        ],
        constraints: ['1 <= nums.length <= 2 * 10^4', '-10 <= nums[i] <= 10', 'Every product fits in a 32-bit integer'],
        example: 'Input: nums = [2,3,-2,4]\nOutput: 6\nExplanation: The subarray [2,3] has product 6.',
        runner: 'array-to-int',
        names: { a: 'nums' },
        solutionJs: 'function solution(nums) { let best = nums[0], curMax = nums[0], curMin = nums[0]; for (let i = 1; i < nums.length; i++) { const x = nums[i]; const cands = [x, curMax * x, curMin * x]; curMax = Math.max(...cands); curMin = Math.min(...cands); if (curMax > best) best = curMax; } return best; }',
        tests: [
            { name: 'Basic', input: '4\n2 3 -2 4', expect: '6' },
            { name: 'Zero splits', input: '3\n-2 0 -1', expect: '0' },
            { name: 'Two negatives multiply', input: '3\n-2 3 -4', expect: '24' },
            { name: 'Single negative', input: '1\n-5', expect: '-5' }
        ]
    },
    {
        id: 'word-break',
        title: 'Word Break',
        difficulty: 'Medium',
        tags: ['Dynamic Programming', 'Strings', 'Hash Map'],
        description: [
            'Given a string s and a dictionary of strings wordDict, return true if s can be segmented into a space-separated sequence of one or more dictionary words. Words may be reused.'
        ],
        constraints: ['1 <= s.length <= 300', '1 <= wordDict.length <= 1000', 'All strings consist of lowercase English letters'],
        example: 'Input: s = "leetcode", wordDict = ["leet","code"]\nOutput: true',
        runner: 'string-words-to-bool',
        names: { a: 's', b: 'wordDict' },
        solutionJs: 'function solution(s, wordDict) { const words = new Set(wordDict); const dp = new Array(s.length + 1).fill(false); dp[0] = true; for (let i = 1; i <= s.length; i++) { for (let j = 0; j < i; j++) { if (dp[j] && words.has(s.slice(j, i))) { dp[i] = true; break; } } } return dp[s.length]; }',
        tests: [
            { name: 'Basic', input: 'leetcode\n2\nleet code', expect: 'true' },
            { name: 'Word reuse', input: 'applepenapple\n2\napple pen', expect: 'true' },
            { name: 'Cannot segment', input: 'catsandog\n5\ncats dog sand and cat', expect: 'false' },
            { name: 'No matching word', input: 'a\n1\nb', expect: 'false' }
        ]
    },
    {
        id: 'longest-increasing-subsequence',
        title: 'Longest Increasing Subsequence',
        difficulty: 'Medium',
        tags: ['Dynamic Programming', 'Arrays', 'Binary Search'],
        description: ['Given an integer array nums, return the length of the longest strictly increasing subsequence.'],
        constraints: ['1 <= nums.length <= 2500', '-10^4 <= nums[i] <= 10^4'],
        example: 'Input: nums = [10,9,2,5,3,7,101,18]\nOutput: 4\nExplanation: One longest increasing subsequence is [2,3,7,101].',
        runner: 'array-to-int',
        names: { a: 'nums' },
        solutionJs: 'function solution(nums) { const dp = new Array(nums.length).fill(1); let best = 1; for (let i = 1; i < nums.length; i++) { for (let j = 0; j < i; j++) { if (nums[j] < nums[i] && dp[j] + 1 > dp[i]) dp[i] = dp[j] + 1; } if (dp[i] > best) best = dp[i]; } return best; }',
        tests: [
            { name: 'Basic', input: '8\n10 9 2 5 3 7 101 18', expect: '4' },
            { name: 'With zeros', input: '6\n0 1 0 3 2 3', expect: '4' },
            { name: 'All equal', input: '7\n7 7 7 7 7 7 7', expect: '1' },
            { name: 'Single element', input: '1\n10', expect: '1' }
        ]
    },
    {
        id: 'partition-equal-subset-sum',
        title: 'Partition Equal Subset Sum',
        difficulty: 'Medium',
        tags: ['Dynamic Programming', 'Arrays'],
        description: ['Given an integer array nums, return true if the array can be partitioned into two subsets whose sums are equal.'],
        constraints: ['1 <= nums.length <= 200', '1 <= nums[i] <= 100'],
        example: 'Input: nums = [1,5,11,5]\nOutput: true\nExplanation: [1,5,5] and [11] both sum to 11.',
        runner: 'array-to-bool',
        names: { a: 'nums' },
        solutionJs: 'function solution(nums) { const total = nums.reduce((a, b) => a + b, 0); if (total % 2) return false; const target = total / 2; const dp = new Array(target + 1).fill(false); dp[0] = true; for (const x of nums) { for (let t = target; t >= x; t--) if (dp[t - x]) dp[t] = true; } return dp[target]; }',
        tests: [
            { name: 'Basic', input: '4\n1 5 11 5', expect: 'true' },
            { name: 'Odd total', input: '4\n1 2 3 5', expect: 'false' },
            { name: 'Simple pair', input: '2\n1 1', expect: 'true' },
            { name: 'Single element', input: '1\n3', expect: 'false' }
        ]
    }
];
