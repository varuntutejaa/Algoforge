// Stack (7)
module.exports = [
    {
        id: 'valid-parentheses',
        title: 'Valid Parentheses',
        difficulty: 'Easy',
        tags: ['Stack', 'Strings'],
        description: [
            "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
            'An input string is valid if open brackets are closed by the same type of bracket, open brackets are closed in the correct order, and every close bracket has a corresponding open bracket.'
        ],
        constraints: ['1 <= s.length <= 10^4', "s consists only of the characters '()[]{}'"],
        example: 'Input: s = "()[]{}"\nOutput: true',
        runner: 'string-to-bool',
        names: { a: 's' },
        solutionJs: "function solution(s) { const pairs = { ')': '(', ']': '[', '}': '{' }; const st = []; for (const c of s) { if (c === '(' || c === '[' || c === '{') st.push(c); else { if (st.pop() !== pairs[c]) return false; } } return st.length === 0; }",
        tests: [
            { name: 'Simple pair', input: '()', expect: 'true' },
            { name: 'All types', input: '()[]{}', expect: 'true' },
            { name: 'Wrong type', input: '(]', expect: 'false' },
            { name: 'Wrong order', input: '([)]', expect: 'false' },
            { name: 'Nested', input: '{[]}', expect: 'true' },
            { name: 'Unclosed open', input: '(', expect: 'false' },
            { name: 'Close without open', input: ']', expect: 'false' }
        ]
    },
    {
        id: 'min-stack',
        title: 'Min Stack',
        difficulty: 'Medium',
        tags: ['Stack', 'Design'],
        description: [
            'Design a stack that supports push, pop, top, and retrieving the minimum element, all in constant time.',
            'Implement the MinStack class with the operations push(val), pop(), top() and getMin().'
        ],
        constraints: ['-2^31 <= val <= 2^31 - 1', 'pop, top and getMin are always called on non-empty stacks', 'At most 3 * 10^4 calls in total'],
        example: 'Input: push(-2), push(0), push(-3), getMin(), pop(), top(), getMin()\nOutput: -3, 0, -2',
        boilerplate: {
            c: 'typedef struct {\n    // Define your fields here\n} MinStack;\n\nMinStack* minStackCreate() {\n    return NULL;\n}\n\nvoid minStackPush(MinStack* obj, int val) {\n}\n\nvoid minStackPop(MinStack* obj) {\n}\n\nint minStackTop(MinStack* obj) {\n    return 0;\n}\n\nint minStackGetMin(MinStack* obj) {\n    return 0;\n}',
            cpp: 'class MinStack {\npublic:\n    MinStack() {\n    }\n\n    void push(int val) {\n    }\n\n    void pop() {\n    }\n\n    int top() {\n        return 0;\n    }\n\n    int getMin() {\n        return 0;\n    }\n};',
            java: 'class MinStack {\n    public MinStack() {\n    }\n\n    public void push(int val) {\n    }\n\n    public void pop() {\n    }\n\n    public int top() {\n        return 0;\n    }\n\n    public int getMin() {\n        return 0;\n    }\n}',
            js: 'class MinStack {\n    constructor() {\n    }\n\n    push(val) {\n    }\n\n    pop() {\n    }\n\n    top() {\n        return 0;\n    }\n\n    getMin() {\n        return 0;\n    }\n}',
            python: 'class MinStack:\n    def __init__(self):\n        pass\n\n    def push(self, val):\n        pass\n\n    def pop(self):\n        pass\n\n    def top(self):\n        return 0\n\n    def getMin(self):\n        return 0'
        },
        tests: []
    },
    {
        id: 'evaluate-reverse-polish-notation',
        title: 'Evaluate Reverse Polish Notation',
        difficulty: 'Medium',
        tags: ['Stack', 'Arrays', 'Math'],
        description: [
            'You are given an array of strings tokens representing an arithmetic expression in Reverse Polish Notation. Evaluate the expression and return its value.',
            "Valid operators are '+', '-', '*' and '/'. Each operand may be an integer or another expression. Division between two integers truncates toward zero. No division by zero occurs, and all intermediate results fit in a 32-bit integer."
        ],
        constraints: ['1 <= tokens.length <= 10^4', "tokens[i] is an operator or an integer in [-200, 200]"],
        example: 'Input: tokens = ["2","1","+","3","*"]\nOutput: 9\nExplanation: ((2 + 1) * 3) = 9.',
        runner: 'words-to-int',
        names: { a: 'tokens' },
        solutionJs: "function solution(tokens) { const st = []; for (const t of tokens) { if (t === '+' || t === '-' || t === '*' || t === '/') { const b = st.pop(), a = st.pop(); let v; if (t === '+') v = a + b; else if (t === '-') v = a - b; else if (t === '*') v = a * b; else v = Math.trunc(a / b); st.push(v); } else st.push(parseInt(t, 10)); } return st[0]; }",
        tests: [
            { name: 'Basic', input: '5\n2 1 + 3 *', expect: '9' },
            { name: 'Truncating division', input: '5\n4 13 5 / +', expect: '6' },
            { name: 'Long expression', input: '13\n10 6 9 3 + -11 * / * 17 + 5 +', expect: '22' },
            { name: 'Negative operand', input: '3\n-3 9 +', expect: '6' },
            { name: 'Single number', input: '1\n42', expect: '42' }
        ]
    },
    {
        id: 'generate-parentheses',
        title: 'Generate Parentheses',
        difficulty: 'Medium',
        tags: ['Stack', 'Strings', 'Backtracking'],
        description: [
            'Given n pairs of parentheses, generate all combinations of well-formed parentheses. You may return the combinations in any order.'
        ],
        constraints: ['1 <= n <= 8'],
        example: 'Input: n = 3\nOutput: ["((()))","(()())","(())()","()(())","()()()"]',
        runner: 'n-to-sorted-strings',
        names: { a: 'n' },
        solutionJs: "function solution(n) { const res = []; (function go(cur, open, close) { if (cur.length === n * 2) { res.push(cur); return; } if (open < n) go(cur + '(', open + 1, close); if (close < open) go(cur + ')', open, close + 1); })('', 0, 0); return res; }",
        tests: [
            { name: 'Basic', input: '3', expect: '((())) (()()) (())() ()(()) ()()()' },
            { name: 'Single pair', input: '1', expect: '()' },
            { name: 'Two pairs', input: '2', expect: '(()) ()()' }
        ]
    },
    {
        id: 'daily-temperatures',
        title: 'Daily Temperatures',
        difficulty: 'Medium',
        tags: ['Stack', 'Arrays', 'Monotonic Stack'],
        description: [
            'Given an array of integers temperatures representing daily temperatures, return an array answer such that answer[i] is the number of days you have to wait after the i-th day to get a warmer temperature. If no future day is warmer, answer[i] == 0.'
        ],
        constraints: ['1 <= temperatures.length <= 10^5', '30 <= temperatures[i] <= 100'],
        example: 'Input: temperatures = [73,74,75,71,69,72,76,73]\nOutput: [1,1,4,2,1,1,0,0]',
        runner: 'array-to-array',
        names: { a: 'temperatures' },
        solutionJs: 'function solution(temperatures) { const res = new Array(temperatures.length).fill(0); const st = []; for (let i = 0; i < temperatures.length; i++) { while (st.length && temperatures[st[st.length - 1]] < temperatures[i]) { const j = st.pop(); res[j] = i - j; } st.push(i); } return res; }',
        tests: [
            { name: 'Basic', input: '8\n73 74 75 71 69 72 76 73', expect: '1 1 4 2 1 1 0 0' },
            { name: 'Strictly rising', input: '4\n30 40 50 60', expect: '1 1 1 0' },
            { name: 'Single day', input: '1\n50', expect: '0' },
            { name: 'Strictly falling', input: '4\n90 80 70 60', expect: '0 0 0 0' }
        ]
    },
    {
        id: 'car-fleet',
        title: 'Car Fleet',
        difficulty: 'Medium',
        tags: ['Stack', 'Arrays', 'Sorting'],
        description: [
            'There are n cars traveling to the same destination at position target, all driving along a one-lane road. You are given the starting position and speed of each car. A car can never pass the car ahead of it, but it can catch up and then travel at the slower car\'s speed, forming a fleet.',
            'Return the number of car fleets that will arrive at the destination.'
        ],
        constraints: ['1 <= n <= 10^5', '0 < target <= 10^6', '0 <= position[i] < target, all positions distinct', '0 < speed[i] <= 10^6'],
        example: 'Input: target = 12, position = [10,8,0,5,3], speed = [2,4,1,1,3]\nOutput: 3',
        boilerplate: {
            c: 'int solution(int target, int* position, int positionSize, int* speed, int speedSize) {\n    // Write your code here\n    return 0;\n}',
            cpp: 'class Solution {\npublic:\n    int solution(int target, vector<int>& position, vector<int>& speed) {\n        // Write your code here\n        return 0;\n    }\n};',
            java: 'class Solution {\n    public int solution(int target, int[] position, int[] speed) {\n        // Write your code here\n        return 0;\n    }\n}',
            js: 'function solution(target, position, speed) {\n    // Write your code here\n    return 0;\n}',
            python: 'def solution(target, position, speed):\n    # Write your code here\n    return 0'
        },
        tests: []
    },
    {
        id: 'largest-rectangle-in-histogram',
        title: 'Largest Rectangle in Histogram',
        difficulty: 'Hard',
        tags: ['Stack', 'Arrays', 'Monotonic Stack'],
        description: [
            "Given an array of integers heights representing a histogram's bar heights where the width of each bar is 1, return the area of the largest rectangle that fits entirely within the histogram."
        ],
        constraints: ['1 <= heights.length <= 10^5', '0 <= heights[i] <= 10^4'],
        example: 'Input: heights = [2,1,5,6,2,3]\nOutput: 10\nExplanation: The rectangle over bars 5 and 6 has area 5 * 2 = 10.',
        runner: 'array-to-int',
        names: { a: 'heights' },
        solutionJs: 'function solution(heights) { const st = []; let best = 0; const h = [...heights, 0]; for (let i = 0; i < h.length; i++) { while (st.length && h[st[st.length - 1]] >= h[i]) { const top = st.pop(); const height = h[top]; const width = st.length ? i - st[st.length - 1] - 1 : i; if (height * width > best) best = height * width; } st.push(i); } return best; }',
        tests: [
            { name: 'Basic', input: '6\n2 1 5 6 2 3', expect: '10' },
            { name: 'Two bars', input: '2\n2 4', expect: '4' },
            { name: 'Zero height', input: '1\n0', expect: '0' },
            { name: 'Uniform bars', input: '5\n5 5 5 5 5', expect: '25' },
            { name: 'Small mixed', input: '4\n2 1 2 3', expect: '4' }
        ]
    }
];
