// Math & Geometry (8)
module.exports = [
    {
        id: 'rotate-image',
        title: 'Rotate Image',
        difficulty: 'Medium',
        tags: ['Math', 'Matrix'],
        description: [
            'You are given an n x n 2D matrix representing an image. Rotate the image by 90 degrees clockwise, in place — do not allocate another 2D matrix.'
        ],
        constraints: ['1 <= n <= 20', '-1000 <= matrix[i][j] <= 1000'],
        example: 'Input: matrix = [[1,2,3],[4,5,6],[7,8,9]]\nOutput: [[7,4,1],[8,5,2],[9,6,3]]',
        runner: 'matrix-inplace',
        names: { a: 'matrix' },
        solutionJs: 'function solution(matrix) { const n = matrix.length; for (let i = 0; i < n; i++) { for (let j = i + 1; j < n; j++) { [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]]; } } for (const row of matrix) row.reverse(); }',
        tests: [
            { name: 'Basic 3x3', input: '3 3\n1 2 3 4 5 6 7 8 9', expect: '7 4 1 8 5 2 9 6 3' },
            { name: '2x2', input: '2 2\n1 2 3 4', expect: '3 1 4 2' },
            { name: 'Single cell', input: '1 1\n5', expect: '5' },
            { name: '4x4', input: '4 4\n5 1 9 11 2 4 8 10 13 3 6 7 15 14 12 16', expect: '15 13 2 5 14 3 4 1 12 6 8 9 16 7 10 11' }
        ]
    },
    {
        id: 'spiral-matrix',
        title: 'Spiral Matrix',
        difficulty: 'Medium',
        tags: ['Math', 'Matrix'],
        description: ['Given an m x n matrix, return all its elements in spiral order (clockwise from the top-left).'],
        constraints: ['1 <= m, n <= 10', '-100 <= matrix[i][j] <= 100'],
        example: 'Input: matrix = [[1,2,3],[4,5,6],[7,8,9]]\nOutput: [1,2,3,6,9,8,7,4,5]',
        runner: 'matrix-to-array',
        names: { a: 'matrix' },
        solutionJs: 'function solution(matrix) { const res = []; let top = 0, bottom = matrix.length - 1, left = 0, right = matrix[0].length - 1; while (top <= bottom && left <= right) { for (let j = left; j <= right; j++) res.push(matrix[top][j]); top++; for (let i = top; i <= bottom; i++) res.push(matrix[i][right]); right--; if (top <= bottom) { for (let j = right; j >= left; j--) res.push(matrix[bottom][j]); bottom--; } if (left <= right) { for (let i = bottom; i >= top; i--) res.push(matrix[i][left]); left++; } } return res; }',
        tests: [
            { name: 'Square', input: '3 3\n1 2 3 4 5 6 7 8 9', expect: '1 2 3 6 9 8 7 4 5' },
            { name: 'Rectangle', input: '3 4\n1 2 3 4 5 6 7 8 9 10 11 12', expect: '1 2 3 4 8 12 11 10 9 5 6 7' },
            { name: 'Single cell', input: '1 1\n7', expect: '7' },
            { name: 'Single row', input: '1 4\n1 2 3 4', expect: '1 2 3 4' },
            { name: 'Single column', input: '3 1\n1 2 3', expect: '1 2 3' }
        ]
    },
    {
        id: 'set-matrix-zeroes',
        title: 'Set Matrix Zeroes',
        difficulty: 'Medium',
        tags: ['Math', 'Matrix'],
        description: ["Given an m x n integer matrix, if an element is 0, set its entire row and column to 0. Do it in place."],
        constraints: ['1 <= m, n <= 200', '-2^31 <= matrix[i][j] <= 2^31 - 1'],
        example: 'Input: matrix = [[1,1,1],[1,0,1],[1,1,1]]\nOutput: [[1,0,1],[0,0,0],[1,0,1]]',
        runner: 'matrix-inplace',
        names: { a: 'matrix' },
        solutionJs: 'function solution(matrix) { const rows = new Set(), cols = new Set(); const m = matrix.length, n = matrix[0].length; for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) if (matrix[i][j] === 0) { rows.add(i); cols.add(j); } for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) if (rows.has(i) || cols.has(j)) matrix[i][j] = 0; }',
        tests: [
            { name: 'Center zero', input: '3 3\n1 1 1 1 0 1 1 1 1', expect: '1 0 1 0 0 0 1 0 1' },
            { name: 'Two zeros', input: '3 4\n0 1 2 0 3 4 5 2 1 3 1 5', expect: '0 0 0 0 0 4 5 0 0 3 1 0' },
            { name: 'No zeros', input: '2 2\n1 2 3 4', expect: '1 2 3 4' }
        ]
    },
    {
        id: 'happy-number',
        title: 'Happy Number',
        difficulty: 'Easy',
        tags: ['Math', 'Hash Map', 'Two Pointers'],
        description: [
            'A happy number is defined by repeatedly replacing the number by the sum of the squares of its digits. The process either reaches 1 (happy) or loops endlessly in a cycle that never includes 1.',
            'Return true if n is a happy number, and false if not.'
        ],
        constraints: ['1 <= n <= 2^31 - 1'],
        example: 'Input: n = 19\nOutput: true\nExplanation: 1^2+9^2=82, 8^2+2^2=68, 6^2+8^2=100, 1^2+0^2+0^2=1.',
        runner: 'int-to-bool',
        names: { a: 'n' },
        solutionJs: 'function solution(n) { const seen = new Set(); while (n !== 1 && !seen.has(n)) { seen.add(n); let s = 0; while (n) { const d = n % 10; s += d * d; n = (n / 10) | 0; } n = s; } return n === 1; }',
        tests: [
            { name: 'Happy', input: '19', expect: 'true' },
            { name: 'Unhappy', input: '2', expect: 'false' },
            { name: 'Already one', input: '1', expect: 'true' },
            { name: 'Single digit happy', input: '7', expect: 'true' }
        ]
    },
    {
        id: 'plus-one',
        title: 'Plus One',
        difficulty: 'Easy',
        tags: ['Math', 'Arrays'],
        description: [
            'You are given a large integer represented as an array digits, most significant digit first (no leading zeros except the number 0). Increment the integer by one and return the resulting digit array.'
        ],
        constraints: ['1 <= digits.length <= 100', '0 <= digits[i] <= 9'],
        example: 'Input: digits = [1,2,3]\nOutput: [1,2,4]',
        runner: 'array-to-array',
        names: { a: 'digits' },
        solutionJs: 'function solution(digits) { const d = digits.slice(); for (let i = d.length - 1; i >= 0; i--) { if (d[i] < 9) { d[i]++; return d; } d[i] = 0; } return [1, ...d]; }',
        tests: [
            { name: 'Basic', input: '3\n1 2 3', expect: '1 2 4' },
            { name: 'All nines', input: '3\n9 9 9', expect: '1 0 0 0' },
            { name: 'Zero', input: '1\n0', expect: '1' },
            { name: 'Trailing nine', input: '2\n8 9', expect: '9 0' }
        ]
    },
    {
        id: 'pow-x-n',
        title: 'Pow(x, n)',
        difficulty: 'Medium',
        tags: ['Math', 'Recursion', 'Binary Search'],
        description: ['Implement pow(x, n), which calculates x raised to the power n (n may be negative). Answers are checked to 5 decimal places.'],
        constraints: ['-100.0 < x < 100.0', '-2^31 <= n <= 2^31 - 1', 'The result is between -10^4 and 10^4'],
        example: 'Input: x = 2.00000, n = 10\nOutput: 1024.00000',
        runner: 'double-int-to-double',
        names: { a: 'x', b: 'n' },
        solutionJs: 'function solution(x, n) { let e = n < 0 ? -n : n; let base = x, result = 1; while (e > 0) { if (e % 2 === 1) result *= base; base *= base; e = Math.floor(e / 2); } return n < 0 ? 1 / result : result; }',
        tests: [
            { name: 'Basic', input: '2.0 10', expect: '1024.00000' },
            { name: 'Fractional base', input: '2.1 3', expect: '9.26100' },
            { name: 'Negative exponent', input: '2.0 -2', expect: '0.25000' },
            { name: 'Zero exponent', input: '1.5 0', expect: '1.00000' }
        ]
    },
    {
        id: 'multiply-strings',
        title: 'Multiply Strings',
        difficulty: 'Medium',
        tags: ['Math', 'Strings', 'Simulation'],
        description: [
            'Given two non-negative integers num1 and num2 represented as strings, return their product as a string. You must not use any built-in big-integer library or convert the inputs to integers directly.'
        ],
        constraints: ['1 <= num1.length, num2.length <= 200', 'num1 and num2 consist of digits with no leading zeros (except "0" itself)'],
        example: 'Input: num1 = "123", num2 = "456"\nOutput: "56088"',
        runner: 'two-strings-to-string',
        names: { a: 'num1', b: 'num2' },
        solutionJs: "function solution(num1, num2) { if (num1 === '0' || num2 === '0') return '0'; const m = num1.length, n = num2.length; const res = new Array(m + n).fill(0); for (let i = m - 1; i >= 0; i--) { for (let j = n - 1; j >= 0; j--) { const mul = (num1.charCodeAt(i) - 48) * (num2.charCodeAt(j) - 48) + res[i + j + 1]; res[i + j + 1] = mul % 10; res[i + j] += Math.floor(mul / 10); } } let s = res.join(''); let k = 0; while (k < s.length - 1 && s[k] === '0') k++; return s.slice(k); }",
        tests: [
            { name: 'Small numbers', input: '2\n3', expect: '6' },
            { name: 'Basic', input: '123\n456', expect: '56088' },
            { name: 'Multiply by zero', input: '0\n52', expect: '0' },
            { name: 'Carries everywhere', input: '999\n999', expect: '998001' }
        ]
    },
    {
        id: 'detect-squares',
        title: 'Detect Squares',
        difficulty: 'Medium',
        tags: ['Math', 'Hash Map', 'Design'],
        description: [
            'Design a data structure that stores points on the plane (duplicates allowed) and counts axis-aligned squares.',
            'Implement add(point), and count(point) which returns the number of ways to choose three previously added points that form an axis-aligned square (positive area) with the query point.'
        ],
        constraints: ['point = [x, y] with 0 <= x, y <= 1000', 'At most 3000 calls to add and count'],
        example: 'add([3,10]); add([11,2]); add([3,2]); count([11,10]) -> 1; count([14,8]) -> 0; add([11,2]); count([11,10]) -> 2',
        boilerplate: {
            c: 'typedef struct {\n    // Define your fields here\n} DetectSquares;\n\nDetectSquares* detectSquaresCreate() {\n    return NULL;\n}\n\nvoid detectSquaresAdd(DetectSquares* obj, int* point) {\n}\n\nint detectSquaresCount(DetectSquares* obj, int* point) {\n    return 0;\n}',
            cpp: 'class DetectSquares {\npublic:\n    DetectSquares() {\n    }\n\n    void add(vector<int> point) {\n    }\n\n    int count(vector<int> point) {\n        return 0;\n    }\n};',
            java: 'class DetectSquares {\n    public DetectSquares() {\n    }\n\n    public void add(int[] point) {\n    }\n\n    public int count(int[] point) {\n        return 0;\n    }\n}',
            js: 'class DetectSquares {\n    constructor() {\n    }\n\n    add(point) {\n    }\n\n    count(point) {\n        return 0;\n    }\n}',
            python: 'class DetectSquares:\n    def __init__(self):\n        pass\n\n    def add(self, point):\n        pass\n\n    def count(self, point):\n        return 0'
        },
        tests: []
    }
];
