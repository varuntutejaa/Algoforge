const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const Problem = require('../models/Problem');

const update = {
  title: 'Generate Parentheses',
  difficulty: 'Medium',
  tags: ['Stack', 'Strings', 'Backtracking'],
  description: [
    'Given n pairs of parentheses, write a function to generate all combinations of well-formed (balanced) parentheses.',
    'A combination is well-formed if every opening parenthesis has a matching closing parenthesis, and at no point does a closing parenthesis appear before its matching opening parenthesis.',
  ],
  constraints: [
    '1 <= n <= 8',
    'Return the combinations in any order — the grader compares them sorted.',
  ],
  example: 'Input: n = 3\nOutput: ["((()))","(()())","(())()","()(())","()()()"]\nExplanation: These are the 5 well-formed combinations of 3 pairs of parentheses.',
  boilerplate: {
    c: 'char** solution(int n, int* returnSize) {\n    // Write your solution here\n    *returnSize = 0;\n    return NULL;\n}',
    cpp: 'class Solution {\npublic:\n    vector<string> solution(int n) {\n        // Write your solution here\n        return {};\n    }\n};',
    java: 'class Solution {\n    public String[] solution(int n) {\n        // Write your solution here\n        return new String[] {};\n    }\n}',
    js: 'function solution(n) {\n  // Write your solution here\n  return [];\n}',
    python: 'def solution(n):\n    # Write your solution here\n    pass',
  },
  testCases: [
    { name: 'n = 1', input: '1\n', expected: '()\n' },
    { name: 'n = 2', input: '2\n', expected: '(()) ()()\n' },
    { name: 'n = 3', input: '3\n', expected: '((())) (()()) (())() ()(()) ()()()\n' },
  ],
  runner: 'n-to-sorted-strings',
};

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const res = await Problem.findOneAndUpdate({ id: 'generate-parentheses' }, { $set: update }, { new: true });
  if (!res) {
    console.error('No problem with id "generate-parentheses" found.');
  } else {
    console.log('Updated:', res.id, '-', res.title);
  }
  await mongoose.disconnect();
})();
