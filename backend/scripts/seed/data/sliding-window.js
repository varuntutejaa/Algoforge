// Sliding Window (6)
module.exports = [
    {
        id: 'best-time-to-buy-and-sell-stock',
        title: 'Best Time to Buy and Sell Stock',
        difficulty: 'Easy',
        tags: ['Sliding Window', 'Arrays', 'Dynamic Programming'],
        description: [
            'You are given an array prices where prices[i] is the price of a given stock on the i-th day.',
            'You want to maximize your profit by choosing a single day to buy one stock and a different day in the future to sell it. Return the maximum profit you can achieve; if no profit is possible, return 0.'
        ],
        constraints: ['1 <= prices.length <= 10^5', '0 <= prices[i] <= 10^4'],
        example: 'Input: prices = [7,1,5,3,6,4]\nOutput: 5\nExplanation: Buy on day 2 (price 1) and sell on day 5 (price 6).',
        runner: 'array-to-int',
        names: { a: 'prices' },
        solutionJs: 'function solution(prices) { let min = Infinity, best = 0; for (const p of prices) { if (p < min) min = p; else if (p - min > best) best = p - min; } return best; }',
        tests: [
            { name: 'Basic', input: '6\n7 1 5 3 6 4', expect: '5' },
            { name: 'Decreasing prices', input: '5\n7 6 4 3 1', expect: '0' },
            { name: 'Single day', input: '1\n10', expect: '0' },
            { name: 'Best at the ends', input: '2\n1 100', expect: '99' }
        ]
    },
    {
        id: 'longest-substring-without-repeating-characters',
        title: 'Longest Substring Without Repeating Characters',
        difficulty: 'Medium',
        tags: ['Sliding Window', 'Strings', 'Hash Map'],
        description: [
            'Given a string s, find the length of the longest substring without repeating characters.'
        ],
        constraints: ['0 <= s.length <= 5 * 10^4', 's consists of English letters, digits, symbols and spaces'],
        example: 'Input: s = "abcabcbb"\nOutput: 3\nExplanation: The answer is "abc" with length 3.',
        runner: 'string-to-int',
        names: { a: 's' },
        solutionJs: 'function solution(s) { const last = new Map(); let start = 0, best = 0; for (let i = 0; i < s.length; i++) { const ch = s[i]; if (last.has(ch) && last.get(ch) >= start) start = last.get(ch) + 1; last.set(ch, i); if (i - start + 1 > best) best = i - start + 1; } return best; }',
        tests: [
            { name: 'Basic', input: 'abcabcbb', expect: '3' },
            { name: 'All same characters', input: 'bbbbb', expect: '1' },
            { name: 'Window restarts', input: 'pwwkew', expect: '3' },
            { name: 'Empty string', input: '', expect: '0' },
            { name: 'Tricky restart', input: 'abba', expect: '2' }
        ]
    },
    {
        id: 'longest-repeating-character-replacement',
        title: 'Longest Repeating Character Replacement',
        difficulty: 'Medium',
        tags: ['Sliding Window', 'Strings', 'Hash Map'],
        description: [
            'You are given a string s of uppercase English letters and an integer k. You can choose any character of the string and change it to any other uppercase letter, at most k times.',
            'Return the length of the longest substring containing the same letter you can get after performing the operations.'
        ],
        constraints: ['1 <= s.length <= 10^5', 's consists of only uppercase English letters', '0 <= k <= s.length'],
        example: 'Input: s = "ABAB", k = 2\nOutput: 4\nExplanation: Replace the two A\'s (or the two B\'s) to get "BBBB" (or "AAAA").',
        runner: 'string-k-to-int',
        names: { a: 's', b: 'k' },
        solutionJs: 'function solution(s, k) { const count = new Array(26).fill(0); let start = 0, maxFreq = 0, best = 0; for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i) - 65; count[c]++; if (count[c] > maxFreq) maxFreq = count[c]; while (i - start + 1 - maxFreq > k) { count[s.charCodeAt(start) - 65]--; start++; } if (i - start + 1 > best) best = i - start + 1; } return best; }',
        tests: [
            { name: 'Basic', input: 'ABAB\n2', expect: '4' },
            { name: 'Middle replacement', input: 'AABABBA\n1', expect: '4' },
            { name: 'No replacements needed', input: 'AAAA\n0', expect: '4' },
            { name: 'All distinct, one change', input: 'ABCDE\n1', expect: '2' }
        ]
    },
    {
        id: 'permutation-in-string',
        title: 'Permutation in String',
        difficulty: 'Medium',
        tags: ['Sliding Window', 'Strings', 'Hash Map'],
        description: [
            'Given two strings s1 and s2, return true if s2 contains a permutation of s1 as a substring, and false otherwise.'
        ],
        constraints: ['1 <= s1.length, s2.length <= 10^4', 's1 and s2 consist of lowercase English letters'],
        example: 'Input: s1 = "ab", s2 = "eidbaooo"\nOutput: true\nExplanation: s2 contains "ba", a permutation of s1.',
        runner: 'two-strings-to-bool',
        names: { a: 's1', b: 's2' },
        solutionJs: 'function solution(s1, s2) { if (s1.length > s2.length) return false; const need = new Array(26).fill(0), win = new Array(26).fill(0); for (const c of s1) need[c.charCodeAt(0) - 97]++; for (let i = 0; i < s2.length; i++) { win[s2.charCodeAt(i) - 97]++; if (i >= s1.length) win[s2.charCodeAt(i - s1.length) - 97]--; if (i >= s1.length - 1 && need.every((v, j) => v === win[j])) return true; } return false; }',
        tests: [
            { name: 'Basic', input: 'ab\neidbaooo', expect: 'true' },
            { name: 'No permutation', input: 'ab\neidboaoo', expect: 'false' },
            { name: 'Exact match', input: 'a\na', expect: 'true' },
            { name: 's1 longer than s2', input: 'abc\nab', expect: 'false' },
            { name: 'Permutation at the end', input: 'adc\ndcda', expect: 'true' }
        ]
    },
    {
        id: 'minimum-window-substring',
        title: 'Minimum Window Substring',
        difficulty: 'Hard',
        tags: ['Sliding Window', 'Strings', 'Hash Map'],
        description: [
            'Given two strings s and t, return the minimum window substring of s that contains every character of t (including duplicates). If there is no such substring, return the empty string "".',
            'The test cases are generated such that the answer is unique.'
        ],
        constraints: ['1 <= s.length, t.length <= 10^5', 's and t consist of uppercase and lowercase English letters'],
        example: 'Input: s = "ADOBECODEBANC", t = "ABC"\nOutput: "BANC"',
        runner: 'two-strings-to-string',
        names: { a: 's', b: 't' },
        solutionJs: "function solution(s, t) { if (t.length > s.length) return ''; const need = new Map(); for (const c of t) need.set(c, (need.get(c) || 0) + 1); let required = need.size, formed = 0, l = 0; const win = new Map(); let best = [Infinity, 0, 0]; for (let r = 0; r < s.length; r++) { const c = s[r]; win.set(c, (win.get(c) || 0) + 1); if (need.has(c) && win.get(c) === need.get(c)) formed++; while (formed === required) { if (r - l + 1 < best[0]) best = [r - l + 1, l, r]; const lc = s[l]; win.set(lc, win.get(lc) - 1); if (need.has(lc) && win.get(lc) < need.get(lc)) formed--; l++; } } return best[0] === Infinity ? '' : s.slice(best[1], best[2] + 1); }",
        tests: [
            { name: 'Basic', input: 'ADOBECODEBANC\nABC', expect: 'BANC' },
            { name: 'Whole string', input: 'a\na', expect: 'a' },
            { name: 'Impossible', input: 'a\naa', expect: '' },
            { name: 'Window at the end', input: 'ab\nb', expect: 'b' }
        ]
    },
    {
        id: 'sliding-window-maximum',
        title: 'Sliding Window Maximum',
        difficulty: 'Hard',
        tags: ['Sliding Window', 'Arrays', 'Deque'],
        description: [
            'You are given an array of integers nums and a sliding window of size k which moves from the very left of the array to the very right. You can only see the k numbers inside the window as it slides one position at a time.',
            'Return an array of the maximum value in each window position.'
        ],
        constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4', '1 <= k <= nums.length'],
        example: 'Input: nums = [1,3,-1,-3,5,3,6,7], k = 3\nOutput: [3,3,5,5,6,7]',
        runner: 'array-k-to-array',
        names: { a: 'nums', b: 'k' },
        solutionJs: 'function solution(nums, k) { const dq = []; const res = []; for (let i = 0; i < nums.length; i++) { while (dq.length && nums[dq[dq.length - 1]] <= nums[i]) dq.pop(); dq.push(i); if (dq[0] <= i - k) dq.shift(); if (i >= k - 1) res.push(nums[dq[0]]); } return res; }',
        tests: [
            { name: 'Basic', input: '8 3\n1 3 -1 -3 5 3 6 7', expect: '3 3 5 5 6 7' },
            { name: 'Window of one', input: '1 1\n1', expect: '1' },
            { name: 'Repeated maxima', input: '5 2\n4 3 3 2 5', expect: '4 3 3 5' },
            { name: 'Whole-array window', input: '6 6\n-5 -2 -9 -1 -7 -3', expect: '-1' }
        ]
    }
];
