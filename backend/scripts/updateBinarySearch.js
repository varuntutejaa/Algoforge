const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const Problem = require('../models/Problem');

const update = {
  title: 'Binary Search',
  difficulty: 'Easy',
  tags: ['Binary Search', 'Arrays'],
  description: [
    'Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums.',
    'If target exists, then return its index. Otherwise, return -1.',
  ],
  constraints: [
    '1 <= nums.length <= 10,000',
    '-10,000 < nums[i], target < 10,000',
    'All the integers in nums are unique.',
    'nums is sorted in ascending order.',
    'You must write an algorithm with O(log n) runtime complexity.',
  ],
  example: 'Input: nums = [-1,0,3,5,9,12], target = 9\nOutput: 4\nExplanation: 9 exists in nums and its index is 4',
  boilerplate: {
    c: 'int solution(int* nums, int numsSize, int target) {\n    // Write your solution here\n    return -1;\n}',
    cpp: 'class Solution {\npublic:\n    int solution(vector<int>& nums, int target) {\n        // Write your solution here\n        return -1;\n    }\n};',
    java: 'class Solution {\n    public int solution(int[] nums, int target) {\n        // Write your solution here\n        return -1;\n    }\n}',
    js: 'function solution(nums, target) {\n  // Write your solution here\n  return -1;\n}',
    python: 'def solution(nums, target):\n    # Write your solution here\n    return -1',
  },
  testCases: [
    { name: 'Found in middle', input: '6\n-1 0 3 5 9 12\n9\n', expected: '4\n' },
    { name: 'Not found', input: '6\n-1 0 3 5 9 12\n2\n', expected: '-1\n' },
    { name: 'Single element found', input: '1\n5\n5\n', expected: '0\n' },
    { name: 'Single element not found', input: '1\n5\n-5\n', expected: '-1\n' },
    { name: 'Target at start', input: '5\n1 2 3 4 5\n1\n', expected: '0\n' },
    { name: 'Target at end', input: '5\n1 2 3 4 5\n5\n', expected: '4\n' },
    { name: 'Negative numbers', input: '6\n-9 -5 -3 0 2 8\n-3\n', expected: '2\n' },
    { name: 'Larger array', input: '10\n1 3 5 7 9 11 13 15 17 19\n13\n', expected: '6\n' },
  ],
  runner: 'array-target-to-int',
};

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const res = await Problem.findOneAndUpdate({ id: 'binary-search' }, { $set: update }, { new: true });
  if (!res) {
    console.error('No problem with id "binary-search" found.');
  } else {
    console.log('Updated:', res.id, '-', res.title);
  }
  await mongoose.disconnect();
})();
