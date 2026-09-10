// Two Pointers (5)
module.exports = [
    {
        id: 'valid-palindrome',
        title: 'Valid Palindrome',
        difficulty: 'Easy',
        tags: ['Two Pointers', 'Strings'],
        description: [
            'A phrase is a palindrome if, after converting all uppercase letters to lowercase and removing all non-alphanumeric characters, it reads the same forward and backward.',
            'Given a string s, return true if it is a palindrome, or false otherwise.'
        ],
        constraints: ['0 <= s.length <= 2 * 10^5', 's consists of printable ASCII characters'],
        example: 'Input: s = "A man, a plan, a canal: Panama"\nOutput: true\nExplanation: "amanaplanacanalpanama" is a palindrome.',
        runner: 'string-to-bool',
        names: { a: 's' },
        solutionJs: "function solution(s) { const t = s.toLowerCase().replace(/[^a-z0-9]/g, ''); return t === t.split('').reverse().join(''); }",
        tests: [
            { name: 'Classic phrase', input: 'A man, a plan, a canal: Panama', expect: 'true' },
            { name: 'Not a palindrome', input: 'race a car', expect: 'false' },
            { name: 'Empty after cleaning', input: '.,!?', expect: 'true' },
            { name: 'Digit mismatch', input: '0P', expect: 'false' },
            { name: 'Alphanumeric mix', input: '1a2 ,2a1', expect: 'true' }
        ]
    },
    {
        id: 'two-sum-ii',
        title: 'Two Sum II - Input Array Is Sorted',
        difficulty: 'Medium',
        tags: ['Two Pointers', 'Arrays', 'Binary Search'],
        description: [
            'Given a 1-indexed array of integers numbers, sorted in non-decreasing order, find two numbers that add up to a specific target. Return the 1-based indices of the two numbers as [index1, index2] with index1 < index2.',
            'The tests are generated so that there is exactly one solution, and you may not use the same element twice. Your solution must use only constant extra space.'
        ],
        constraints: ['2 <= numbers.length <= 3 * 10^4', '-1000 <= numbers[i] <= 1000', 'numbers is sorted in non-decreasing order', 'Exactly one solution exists'],
        example: 'Input: numbers = [2,7,11,15], target = 9\nOutput: [1,2]\nExplanation: 2 + 7 == 9, so index1 = 1, index2 = 2.',
        runner: 'array-target-to-array',
        names: { a: 'numbers', b: 'target' },
        solutionJs: 'function solution(numbers, target) { let l = 0, r = numbers.length - 1; while (l < r) { const s = numbers[l] + numbers[r]; if (s === target) return [l + 1, r + 1]; if (s < target) l++; else r--; } return []; }',
        tests: [
            { name: 'Basic', input: '4\n2 7 11 15\n9', expect: '1 2' },
            { name: 'Middle pair', input: '3\n2 3 4\n6', expect: '1 3' },
            { name: 'Negative numbers', input: '2\n-1 0\n-1', expect: '1 2' },
            { name: 'Duplicates at the end', input: '5\n1 2 3 4 4\n8', expect: '4 5' }
        ]
    },
    {
        id: '3sum',
        title: '3Sum',
        difficulty: 'Medium',
        tags: ['Two Pointers', 'Arrays', 'Sorting'],
        description: [
            'Given an integer array nums, return all unique triplets [nums[i], nums[j], nums[k]] such that i, j and k are distinct indices and nums[i] + nums[j] + nums[k] == 0.',
            'The solution set must not contain duplicate triplets. Triplets may be returned in any order, and the numbers within a triplet may be in any order.'
        ],
        constraints: ['3 <= nums.length <= 3000', '-10^5 <= nums[i] <= 10^5'],
        example: 'Input: nums = [-1,0,1,2,-1,-4]\nOutput: [[-1,-1,2],[-1,0,1]]',
        runner: 'array-to-nested',
        names: { a: 'nums' },
        solutionJs: 'function solution(nums) { nums = nums.slice().sort((a, b) => a - b); const res = []; for (let i = 0; i < nums.length - 2; i++) { if (i > 0 && nums[i] === nums[i - 1]) continue; let l = i + 1, r = nums.length - 1; while (l < r) { const s = nums[i] + nums[l] + nums[r]; if (s === 0) { res.push([nums[i], nums[l], nums[r]]); while (l < r && nums[l] === nums[l + 1]) l++; while (l < r && nums[r] === nums[r - 1]) r--; l++; r--; } else if (s < 0) l++; else r--; } } return res; }',
        tests: [
            { name: 'Basic', input: '6\n-1 0 1 2 -1 -4', expect: '-1 -1 2\n-1 0 1' },
            { name: 'No triplet', input: '3\n0 1 1', expect: '' },
            { name: 'All zeros', input: '3\n0 0 0', expect: '0 0 0' },
            { name: 'Two valid triplets', input: '5\n-2 0 1 1 2', expect: '-2 0 2\n-2 1 1' }
        ]
    },
    {
        id: 'container-with-most-water',
        title: 'Container With Most Water',
        difficulty: 'Medium',
        tags: ['Two Pointers', 'Arrays', 'Greedy'],
        description: [
            'You are given an integer array height of length n. There are n vertical lines such that the two endpoints of the i-th line are (i, 0) and (i, height[i]).',
            'Find two lines that, together with the x-axis, form a container that holds the most water, and return the maximum amount of water it can store. You may not slant the container.'
        ],
        constraints: ['2 <= height.length <= 10^5', '0 <= height[i] <= 10^4'],
        example: 'Input: height = [1,8,6,2,5,4,8,3,7]\nOutput: 49\nExplanation: Lines at indices 1 and 8 hold min(8,7) * 7 = 49 units.',
        runner: 'array-to-int',
        names: { a: 'height' },
        solutionJs: 'function solution(height) { let l = 0, r = height.length - 1, best = 0; while (l < r) { const area = Math.min(height[l], height[r]) * (r - l); if (area > best) best = area; if (height[l] < height[r]) l++; else r--; } return best; }',
        tests: [
            { name: 'Basic', input: '9\n1 8 6 2 5 4 8 3 7', expect: '49' },
            { name: 'Two lines', input: '2\n1 1', expect: '1' },
            { name: 'Best at the ends', input: '5\n4 3 2 1 4', expect: '16' },
            { name: 'Contains zero height', input: '4\n0 2 3 0', expect: '2' }
        ]
    },
    {
        id: 'trapping-rain-water',
        title: 'Trapping Rain Water',
        difficulty: 'Hard',
        tags: ['Two Pointers', 'Arrays', 'Dynamic Programming'],
        description: [
            'Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water the map can trap after raining.'
        ],
        constraints: ['1 <= height.length <= 2 * 10^4', '0 <= height[i] <= 10^5'],
        example: 'Input: height = [0,1,0,2,1,0,1,3,2,1,2,1]\nOutput: 6',
        runner: 'array-to-int',
        names: { a: 'height' },
        solutionJs: 'function solution(height) { let l = 0, r = height.length - 1, lMax = 0, rMax = 0, res = 0; while (l < r) { if (height[l] < height[r]) { if (height[l] >= lMax) lMax = height[l]; else res += lMax - height[l]; l++; } else { if (height[r] >= rMax) rMax = height[r]; else res += rMax - height[r]; r--; } } return res; }',
        tests: [
            { name: 'Basic', input: '12\n0 1 0 2 1 0 1 3 2 1 2 1', expect: '6' },
            { name: 'Valley', input: '6\n4 2 0 3 2 5', expect: '9' },
            { name: 'Single bar', input: '1\n5', expect: '0' },
            { name: 'Monotonic slope', input: '4\n5 4 3 2', expect: '0' },
            { name: 'Repeated valleys', input: '5\n3 0 3 0 3', expect: '6' }
        ]
    }
];
