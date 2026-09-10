// Bit Manipulation (7)
module.exports = [
    {
        id: 'single-number',
        title: 'Single Number',
        difficulty: 'Easy',
        tags: ['Bit Manipulation', 'Arrays'],
        description: [
            'Given a non-empty array of integers nums, every element appears twice except for one. Find that single element.',
            'You must implement a solution with linear runtime and constant extra space.'
        ],
        constraints: ['1 <= nums.length <= 3 * 10^4', '-3 * 10^4 <= nums[i] <= 3 * 10^4', 'Every element appears twice except one'],
        example: 'Input: nums = [4,1,2,1,2]\nOutput: 4',
        runner: 'array-to-int',
        names: { a: 'nums' },
        solutionJs: 'function solution(nums) { let x = 0; for (const v of nums) x ^= v; return x; }',
        tests: [
            { name: 'Basic', input: '3\n2 2 1', expect: '1' },
            { name: 'Longer array', input: '5\n4 1 2 1 2', expect: '4' },
            { name: 'Single element', input: '1\n1', expect: '1' },
            { name: 'Negative single', input: '3\n-1 7 7', expect: '-1' }
        ]
    },
    {
        id: 'number-of-1-bits',
        title: 'Number of 1 Bits',
        difficulty: 'Easy',
        tags: ['Bit Manipulation', 'Math'],
        description: ['Given a non-negative integer n, return the number of set bits (1s) in its binary representation.'],
        constraints: ['0 <= n <= 2^31 - 1'],
        example: 'Input: n = 11\nOutput: 3\nExplanation: 11 is 1011 in binary.',
        runner: 'int-to-int',
        names: { a: 'n' },
        solutionJs: 'function solution(n) { let c = 0; while (n) { n &= n - 1; c++; } return c; }',
        tests: [
            { name: 'Basic', input: '11', expect: '3' },
            { name: 'Power of two', input: '128', expect: '1' },
            { name: 'All 31 bits set', input: '2147483647', expect: '31' },
            { name: 'Zero', input: '0', expect: '0' }
        ]
    },
    {
        id: 'counting-bits',
        title: 'Counting Bits',
        difficulty: 'Easy',
        tags: ['Bit Manipulation', 'Dynamic Programming'],
        description: ['Given an integer n, return an array ans of length n + 1 where ans[i] is the number of 1 bits in the binary representation of i.'],
        constraints: ['0 <= n <= 10^5'],
        example: 'Input: n = 5\nOutput: [0,1,1,2,1,2]',
        runner: 'int-to-array',
        names: { a: 'n' },
        solutionJs: 'function solution(n) { const dp = new Array(n + 1).fill(0); for (let i = 1; i <= n; i++) dp[i] = dp[i >> 1] + (i & 1); return dp; }',
        tests: [
            { name: 'Small', input: '2', expect: '0 1 1' },
            { name: 'Basic', input: '5', expect: '0 1 1 2 1 2' },
            { name: 'Zero', input: '0', expect: '0' }
        ]
    },
    {
        id: 'reverse-bits',
        title: 'Reverse Bits',
        difficulty: 'Easy',
        tags: ['Bit Manipulation', 'Math'],
        description: ['Reverse the bits of a given 32-bit unsigned integer and return the resulting unsigned integer.'],
        constraints: ['0 <= n < 2^32'],
        example: 'Input: n = 43261596 (00000010100101000001111010011100)\nOutput: 964176192 (00111001011110000010100101000000)',
        runner: 'long-to-long',
        names: { a: 'n' },
        solutionJs: 'function solution(n) { let r = 0; for (let i = 0; i < 32; i++) { r = r * 2 + (n % 2); n = Math.floor(n / 2); } return r; }',
        tests: [
            { name: 'Basic', input: '43261596', expect: '964176192' },
            { name: 'Almost all ones', input: '4294967293', expect: '3221225471' },
            { name: 'Zero', input: '0', expect: '0' },
            { name: 'One', input: '1', expect: '2147483648' }
        ]
    },
    {
        id: 'missing-number',
        title: 'Missing Number',
        difficulty: 'Easy',
        tags: ['Bit Manipulation', 'Arrays', 'Math'],
        description: ['Given an array nums containing n distinct numbers taken from the range [0, n], return the one number in the range that is missing from the array.'],
        constraints: ['1 <= n <= 10^4', 'All numbers are unique and in [0, n]'],
        example: 'Input: nums = [3,0,1]\nOutput: 2',
        runner: 'array-to-int',
        names: { a: 'nums' },
        solutionJs: 'function solution(nums) { const n = nums.length; let x = n; for (let i = 0; i < n; i++) x ^= i ^ nums[i]; return x; }',
        tests: [
            { name: 'Basic', input: '3\n3 0 1', expect: '2' },
            { name: 'Longer array', input: '9\n9 6 4 2 3 5 7 0 1', expect: '8' },
            { name: 'Missing one', input: '1\n0', expect: '1' },
            { name: 'Missing last', input: '2\n0 1', expect: '2' }
        ]
    },
    {
        id: 'sum-of-two-integers',
        title: 'Sum of Two Integers',
        difficulty: 'Medium',
        tags: ['Bit Manipulation', 'Math'],
        description: ['Given two integers a and b, return their sum without using the + and - operators (use bitwise operations instead).'],
        constraints: ['-1000 <= a, b <= 1000'],
        example: 'Input: a = 1, b = 2\nOutput: 3',
        runner: 'two-ints-to-int',
        names: { a: 'a', b: 'b' },
        solutionJs: 'function solution(a, b) { while (b !== 0) { const carry = (a & b) << 1; a = a ^ b; b = carry; } return a; }',
        tests: [
            { name: 'Basic', input: '1 2', expect: '3' },
            { name: 'Another pair', input: '2 3', expect: '5' },
            { name: 'Opposites cancel', input: '-1 1', expect: '0' },
            { name: 'Both negative', input: '-5 -7', expect: '-12' }
        ]
    },
    {
        id: 'reverse-integer',
        title: 'Reverse Integer',
        difficulty: 'Medium',
        tags: ['Bit Manipulation', 'Math'],
        description: [
            'Given a signed 32-bit integer x, return x with its digits reversed. If reversing causes the value to go outside the signed 32-bit range [-2^31, 2^31 - 1], return 0.',
            'Assume the environment does not allow you to store 64-bit integers.'
        ],
        constraints: ['-2^31 <= x <= 2^31 - 1'],
        example: 'Input: x = -123\nOutput: -321',
        runner: 'int-to-int',
        names: { a: 'x' },
        solutionJs: "function solution(x) { const s = Math.sign(x); const r = parseInt(String(Math.abs(x)).split('').reverse().join(''), 10) * s; return r < -(2 ** 31) || r > 2 ** 31 - 1 ? 0 : r; }",
        tests: [
            { name: 'Basic', input: '123', expect: '321' },
            { name: 'Negative', input: '-123', expect: '-321' },
            { name: 'Trailing zero', input: '120', expect: '21' },
            { name: 'Overflow to zero', input: '1534236469', expect: '0' },
            { name: 'Minimum value', input: '-2147483648', expect: '0' }
        ]
    }
];
