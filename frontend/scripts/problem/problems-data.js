(function (root, factory) {
  const data = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = data;
  }

  root.algoforgeProblems = data;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  return {
    'two-sum': {
      id: 'two-sum',
      title: 'Two Sum',
      difficulty: 'Easy',
      tags: ['Arrays', 'Hash Map'],
      expectedComplexity: 'O(n)',
      runner: 'two-sum',
      summary: 'Return the indices of two numbers in an array that add up to a target.',
      description: [
        'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
        'You may assume that each input has exactly one solution, and you may not use the same element twice.'
      ],
      example: `Input: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nExplanation: nums[0] + nums[1] = 9`,
      constraints: ['2 <= nums.length <= 10,000', '-1,000,000 <= nums[i] <= 1,000,000', 'Exactly one valid answer exists.'],
      testCases: [
        { name: 'Sample test', input: '4\n2 7 11 15\n9\n', expected: '0 1\n' },
        { name: 'Middle pair', input: '3\n3 2 4\n6\n', expected: '1 2\n' },
        { name: 'Duplicate values', input: '2\n3 3\n6\n', expected: '0 1\n' }
      ],
      boilerplate: {
        c: `int* twoSum(int* nums, int numsSize, int target, int* returnSize) {\n    *returnSize = 0;\n    return NULL;\n}`,
        cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        return {};\n    }\n};`,
        java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        return new int[] {};\n    }\n}`,
        js: `function twoSum(nums, target) {\n  return [];\n}`
      }
    },

    'maximum-subarray': {
      id: 'maximum-subarray',
      title: 'Maximum Subarray',
      difficulty: 'Medium',
      tags: ['Arrays', 'Dynamic Programming'],
      expectedComplexity: 'O(n)',
      runner: 'array-to-int',
      summary: 'Find the contiguous subarray with the largest sum.',
      description: ['Given an integer array nums, find the subarray with the largest sum, and return its sum.', 'A subarray is a contiguous non-empty sequence of elements within an array.'],
      example: `Input: nums = [-2,1,-3,4,-1,2,1,-5,4]\nOutput: 6\nExplanation: The subarray [4,-1,2,1] has the largest sum 6.`,
      constraints: ['1 <= nums.length <= 100,000', '-10,000 <= nums[i] <= 10,000'],
      testCases: [
        { name: 'Mixed values', input: '9\n-2 1 -3 4 -1 2 1 -5 4\n', expected: '6\n' },
        { name: 'Single element', input: '1\n1\n', expected: '1\n' },
        { name: 'All positive', input: '4\n5 4 -1 7\n', expected: '15\n' },
        { name: 'All negative', input: '3\n-1 -2 -3\n', expected: '-1\n' }
      ],
      boilerplate: {
        c: `int solution(int* nums, int n) {\n    // Write your solution here\n    return 0;\n}`,
        cpp: `class Solution {\npublic:\n    int solution(vector<int>& nums) {\n        // Write your solution here\n        return 0;\n    }\n};`,
        java: `class Solution {\n    public int solution(int[] nums) {\n        // Write your solution here\n        return 0;\n    }\n}`,
        js: `function solution(nums) {\n  // Write your solution here\n  return 0;\n}`
      }
    },

    'product-of-array-except-self': {
      id: 'product-of-array-except-self',
      title: 'Product of Array Except Self',
      difficulty: 'Medium',
      tags: ['Arrays', 'Prefix Sum'],
      expectedComplexity: 'O(n)',
      runner: 'array-to-array',
      summary: 'Return an array where each element is the product of all other elements.',
      description: ['Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].', 'The product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer.'],
      example: `Input: nums = [1,2,3,4]\nOutput: [24,12,8,6]`,
      constraints: ['2 <= nums.length <= 100,000', '-30 <= nums[i] <= 30'],
      testCases: [
        { name: 'Basic', input: '4\n1 2 3 4\n', expected: '24 12 8 6\n' },
        { name: 'Two elements', input: '2\n2 3\n', expected: '3 2\n' }
      ],
      boilerplate: {
        c: `int* solution(int* nums, int n, int* returnSize) {\n    *returnSize = 0;\n    return NULL;\n}`,
        cpp: `class Solution {\npublic:\n    vector<int> solution(vector<int>& nums) {\n        return {};\n    }\n};`,
        java: `class Solution {\n    public int[] solution(int[] nums) {\n        return new int[] {};\n    }\n}`,
        js: `function solution(nums) {\n  return [];\n}`
      }
    },

    'rotate-array': {
      id: 'rotate-array',
      title: 'Rotate Array',
      difficulty: 'Medium',
      tags: ['Arrays'],
      expectedComplexity: 'O(n)',
      runner: 'array-k-inplace',
      summary: 'Rotate an array to the right by k steps.',
      description: ['Given an integer array nums, rotate the array to the right by k steps, where k is non-negative.'],
      example: `Input: nums = [1,2,3,4,5,6,7], k = 3\nOutput: [5,6,7,1,2,3,4]`,
      constraints: ['1 <= nums.length <= 100,000', '0 <= k <= 100,000'],
      testCases: [
        { name: 'Basic', input: '7 3\n1 2 3 4 5 6 7\n', expected: '5 6 7 1 2 3 4\n' },
        { name: 'Full rotation', input: '3 3\n1 2 3\n', expected: '1 2 3\n' }
      ],
      boilerplate: {
        c: `void solution(int* nums, int n, int k) {\n    // Write your solution here\n}`,
        cpp: `class Solution {\npublic:\n    void solution(vector<int>& nums, int k) {\n        // Write your solution here\n    }\n};`,
        java: `class Solution {\n    public void solution(int[] nums, int k) {\n        // Write your solution here\n    }\n}`,
        js: `function solution(nums, k) {\n  // Write your solution here\n}`
      }
    },

    'sort-colors': {
      id: 'sort-colors',
      title: 'Sort Colors',
      difficulty: 'Medium',
      tags: ['Arrays', 'Two Pointers', 'Sorting'],
      expectedComplexity: 'O(n)',
      runner: 'array-inplace',
      summary: 'Sort an array of 0s, 1s, and 2s in-place in a single pass.',
      description: ['Given an array nums with n objects colored red, white, or blue, sort them in-place so that objects of the same color are adjacent.', 'Use integers 0, 1, 2 to represent red, white, and blue.'],
      example: `Input: nums = [2,0,2,1,1,0]\nOutput: [0,0,1,1,2,2]`,
      constraints: ['1 <= nums.length <= 300,000', 'nums[i] is 0, 1, or 2'],
      testCases: [
        { name: 'Mixed', input: '6\n2 0 2 1 1 0\n', expected: '0 0 1 1 2 2\n' },
        { name: 'Already sorted', input: '3\n0 1 2\n', expected: '0 1 2\n' }
      ],
      boilerplate: {
        c: `void solution(int* nums, int n) {\n    // Write your solution here\n}`,
        cpp: `class Solution {\npublic:\n    void solution(vector<int>& nums) {\n        // Write your solution here\n    }\n};`,
        java: `class Solution {\n    public void solution(int[] nums) {\n        // Write your solution here\n    }\n}`,
        js: `function solution(nums) {\n  // Write your solution here\n}`
      }
    },

    'longest-consecutive-sequence': {
      id: 'longest-consecutive-sequence',
      title: 'Longest Consecutive Sequence',
      difficulty: 'Medium',
      tags: ['Arrays', 'Hash Set'],
      expectedComplexity: 'O(n)',
      runner: 'array-to-int',
      summary: 'Find the length of the longest consecutive elements sequence.',
      description: ['Given an unsorted array of integers nums, return the length of the longest consecutive elements sequence.', 'You must write an algorithm that runs in O(n) time.'],
      example: `Input: nums = [100,4,200,1,3,2]\nOutput: 4\nExplanation: The longest consecutive sequence is [1,2,3,4].`,
      constraints: ['0 <= nums.length <= 100,000', '-10^9 <= nums[i] <= 10^9'],
      testCases: [
        { name: 'Basic', input: '6\n100 4 200 1 3 2\n', expected: '4\n' },
        { name: 'No sequence', input: '3\n0 3 7\n', expected: '1\n' }
      ],
      boilerplate: {
        c: `int solution(int* nums, int n) {\n    // Write your solution here\n    return 0;\n}`,
        cpp: `class Solution {\npublic:\n    int solution(vector<int>& nums) {\n        // Write your solution here\n        return 0;\n    }\n};`,
        java: `class Solution {\n    public int solution(int[] nums) {\n        // Write your solution here\n        return 0;\n    }\n}`,
        js: `function solution(nums) {\n  // Write your solution here\n  return 0;\n}`
      }
    },

    'trapping-rain-water': {
      id: 'trapping-rain-water',
      title: 'Trapping Rain Water',
      difficulty: 'Hard',
      tags: ['Arrays', 'Two Pointers', 'Stack'],
      expectedComplexity: 'O(n)',
      runner: 'array-to-int',
      summary: 'Calculate how much water can be trapped between bars after rain.',
      description: ['Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.'],
      example: `Input: height = [0,1,0,2,1,0,1,3,2,1,2,1]\nOutput: 6\nExplanation: 6 units of rain water are trapped.`,
      constraints: ['1 <= n <= 200,000', '0 <= height[i] <= 100,000'],
      testCases: [
        { name: 'Classic', input: '12\n0 1 0 2 1 0 1 3 2 1 2 1\n', expected: '6\n' },
        { name: 'No water', input: '3\n1 1 1\n', expected: '0\n' }
      ],
      boilerplate: {
        c: `int solution(int* nums, int n) {\n    // Write your solution here\n    return 0;\n}`,
        cpp: `class Solution {\npublic:\n    int solution(vector<int>& nums) {\n        // Write your solution here\n        return 0;\n    }\n};`,
        java: `class Solution {\n    public int solution(int[] nums) {\n        // Write your solution here\n        return 0;\n    }\n}`,
        js: `function solution(nums) {\n  // Write your solution here\n  return 0;\n}`
      }
    },

    'sliding-window-maximum': {
      id: 'sliding-window-maximum',
      title: 'Sliding Window Maximum',
      difficulty: 'Hard',
      tags: ['Arrays', 'Queue', 'Sliding Window'],
      expectedComplexity: 'O(n)',
      runner: 'array-k-to-array',
      summary: 'Find the maximum value in each sliding window of size k.',
      description: ['You are given an array of integers nums and a sliding window of size k moving from left to right.', 'Return the max value in each window as it slides from left to right.'],
      example: `Input: nums = [1,3,-1,-3,5,3,6,7], k = 3\nOutput: [3,3,5,5,6,7]`,
      constraints: ['1 <= nums.length <= 100,000', '-10,000 <= nums[i] <= 10,000', '1 <= k <= nums.length'],
      testCases: [
        { name: 'Basic', input: '8 3\n1 3 -1 -3 5 3 6 7\n', expected: '3 3 5 5 6 7\n' },
        { name: 'k=1', input: '4 1\n1 2 3 4\n', expected: '1 2 3 4\n' }
      ],
      boilerplate: {
        c: `int* solution(int* nums, int n, int k, int* returnSize) {\n    *returnSize = 0;\n    return NULL;\n}`,
        cpp: `class Solution {\npublic:\n    vector<int> solution(vector<int>& nums, int k) {\n        return {};\n    }\n};`,
        java: `class Solution {\n    public int[] solution(int[] nums, int k) {\n        return new int[] {};\n    }\n}`,
        js: `function solution(nums, k) {\n  return [];\n}`
      }
    },

    'longest-increasing-subsequence': {
      id: 'longest-increasing-subsequence',
      title: 'Longest Increasing Subsequence',
      difficulty: 'Medium',
      tags: ['Arrays', 'Binary Search', 'Dynamic Programming'],
      expectedComplexity: 'O(n log n)',
      runner: 'array-to-int',
      summary: 'Find the length of the longest strictly increasing subsequence.',
      description: ['Given an integer array nums, return the length of the longest strictly increasing subsequence.'],
      example: `Input: nums = [10,9,2,5,3,7,101,18]\nOutput: 4\nExplanation: The LIS is [2,3,7,101] with length 4.`,
      constraints: ['1 <= nums.length <= 25,000', '-10,000 <= nums[i] <= 10,000'],
      testCases: [
        { name: 'Basic', input: '8\n10 9 2 5 3 7 101 18\n', expected: '4\n' },
        { name: 'Sorted', input: '5\n0 1 0 3 2\n', expected: '3\n' }
      ],
      boilerplate: {
        c: `int solution(int* nums, int n) {\n    // Write your solution here\n    return 0;\n}`,
        cpp: `class Solution {\npublic:\n    int solution(vector<int>& nums) {\n        // Write your solution here\n        return 0;\n    }\n};`,
        java: `class Solution {\n    public int solution(int[] nums) {\n        // Write your solution here\n        return 0;\n    }\n}`,
        js: `function solution(nums) {\n  // Write your solution here\n  return 0;\n}`
      }
    },

    'maximum-product-subarray': {
      id: 'maximum-product-subarray',
      title: 'Maximum Product Subarray',
      difficulty: 'Medium',
      tags: ['Arrays', 'Dynamic Programming'],
      expectedComplexity: 'O(n)',
      runner: 'array-to-int',
      summary: 'Find the contiguous subarray with the largest product.',
      description: ['Given an integer array nums, find a subarray that has the largest product, and return the product.', 'The answer will fit in a 32-bit integer.'],
      example: `Input: nums = [2,3,-2,4]\nOutput: 6\nExplanation: [2,3] has the largest product 6.`,
      constraints: ['1 <= nums.length <= 20,000', '-10 <= nums[i] <= 10'],
      testCases: [
        { name: 'Basic', input: '4\n2 3 -2 4\n', expected: '6\n' },
        { name: 'All negative', input: '3\n-2 -3 -4\n', expected: '12\n' }
      ],
      boilerplate: {
        c: `int solution(int* nums, int n) {\n    // Write your solution here\n    return 0;\n}`,
        cpp: `class Solution {\npublic:\n    int solution(vector<int>& nums) {\n        // Write your solution here\n        return 0;\n    }\n};`,
        java: `class Solution {\n    public int solution(int[] nums) {\n        // Write your solution here\n        return 0;\n    }\n}`,
        js: `function solution(nums) {\n  // Write your solution here\n  return 0;\n}`
      }
    },

    'merge-intervals': {
      id: 'merge-intervals',
      title: 'Merge Intervals',
      difficulty: 'Medium',
      tags: ['Arrays', 'Sorting'],
      expectedComplexity: 'O(n log n)',
      runner: 'intervals',
      summary: 'Merge all overlapping intervals.',
      description: ['Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals.', 'Return an array of the non-overlapping intervals that cover all the intervals in the input.'],
      example: `Input: intervals = [[1,3],[2,6],[8,10],[15,18]]\nOutput: [[1,6],[8,10],[15,18]]`,
      constraints: ['1 <= intervals.length <= 10,000', 'intervals[i].length == 2', '0 <= starti <= endi <= 10,000'],
      testCases: [
        { name: 'Basic', input: '4\n1 3\n2 6\n8 10\n15 18\n', expected: '1 6\n8 10\n15 18\n' },
        { name: 'All overlap', input: '3\n1 4\n2 3\n5 6\n', expected: '1 4\n5 6\n' }
      ],
      boilerplate: {
        c: `int** solution(int intervals[][2], int n, int* returnSize) {\n    *returnSize = 0;\n    return NULL;\n}`,
        cpp: `class Solution {\npublic:\n    vector<vector<int>> solution(vector<vector<int>>& intervals) {\n        return {};\n    }\n};`,
        java: `class Solution {\n    public int[][] solution(int[][] intervals) {\n        return new int[][] {};\n    }\n}`,
        js: `function solution(intervals) {\n  return [];\n}`
      }
    },

    'word-frequency': {
      id: 'word-frequency',
      title: 'Top K Frequent Words',
      difficulty: 'Medium',
      tags: ['Hash Map', 'Sorting', 'Heap'],
      expectedComplexity: 'O(n log n)',
      runner: 'words-k',
      summary: 'Return the k most frequent words from a list, sorted by frequency.',
      description: ['Given an array of strings words and an integer k, return the k most frequent strings.', 'Return the answer sorted by frequency from highest to lowest. If two words have the same frequency, sort them alphabetically.'],
      example: `Input: words = ["i","love","leetcode","i","love","coding"], k = 2\nOutput: ["i","love"]`,
      constraints: ['1 <= words.length <= 500', '1 <= k <= words.length', '1 <= words[i].length <= 10'],
      testCases: [
        { name: 'Basic', input: '6 2\ni love leetcode i love coding\n', expected: 'i love\n' },
        { name: 'Single word', input: '3 1\nthe the the\n', expected: 'the\n' }
      ],
      boilerplate: {
        c: `char** solution(char words[][100], int n, int k, int* returnSize) {\n    *returnSize = 0;\n    return NULL;\n}`,
        cpp: `class Solution {\npublic:\n    vector<string> solution(vector<string>& words, int k) {\n        return {};\n    }\n};`,
        java: `class Solution {\n    public String[] solution(String[] words, int k) {\n        return new String[] {};\n    }\n}`,
        js: `function solution(words, k) {\n  return [];\n}`
      }
    }
  };
});