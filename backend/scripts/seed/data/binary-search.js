// Binary Search (7)
module.exports = [
    {
        id: 'binary-search',
        title: 'Binary Search',
        difficulty: 'Easy',
        tags: ['Binary Search', 'Arrays'],
        description: [
            'Given a sorted (ascending) array of distinct integers nums and an integer target, return the index of target if it exists in nums, or -1 otherwise.',
            'You must write an algorithm with O(log n) runtime complexity.'
        ],
        constraints: ['1 <= nums.length <= 10^4', '-10^4 <= nums[i], target <= 10^4', 'All elements of nums are distinct and sorted ascending'],
        example: 'Input: nums = [-1,0,3,5,9,12], target = 9\nOutput: 4',
        runner: 'array-target-to-int',
        names: { a: 'nums', b: 'target' },
        solutionJs: 'function solution(nums, target) { let l = 0, r = nums.length - 1; while (l <= r) { const m = (l + r) >> 1; if (nums[m] === target) return m; if (nums[m] < target) l = m + 1; else r = m - 1; } return -1; }',
        tests: [
            { name: 'Found', input: '6\n-1 0 3 5 9 12\n9', expect: '4' },
            { name: 'Not found', input: '6\n-1 0 3 5 9 12\n2', expect: '-1' },
            { name: 'Single element hit', input: '1\n5\n5', expect: '0' },
            { name: 'Single element miss', input: '1\n5\n-5', expect: '-1' },
            { name: 'Last element', input: '2\n1 3\n3', expect: '1' }
        ]
    },
    {
        id: 'search-a-2d-matrix',
        title: 'Search a 2D Matrix',
        difficulty: 'Medium',
        tags: ['Binary Search', 'Matrix'],
        description: [
            'You are given an m x n integer matrix with two properties: each row is sorted in non-decreasing order, and the first integer of each row is greater than the last integer of the previous row.',
            'Given an integer target, return true if target is in the matrix, or false otherwise. You must write a solution in O(log(m * n)) time.'
        ],
        constraints: ['1 <= m, n <= 100', '-10^4 <= matrix[i][j], target <= 10^4'],
        example: 'Input: matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3\nOutput: true',
        runner: 'matrix-target-to-bool',
        names: { a: 'matrix', b: 'target' },
        solutionJs: 'function solution(matrix, target) { const m = matrix.length, n = matrix[0].length; let l = 0, r = m * n - 1; while (l <= r) { const mid = (l + r) >> 1; const v = matrix[(mid / n) | 0][mid % n]; if (v === target) return true; if (v < target) l = mid + 1; else r = mid - 1; } return false; }',
        tests: [
            { name: 'Found', input: '3 4\n1 3 5 7 10 11 16 20 23 30 34 60\n3', expect: 'true' },
            { name: 'Not found', input: '3 4\n1 3 5 7 10 11 16 20 23 30 34 60\n13', expect: 'false' },
            { name: 'Single cell hit', input: '1 1\n1\n1', expect: 'true' },
            { name: 'Single row miss', input: '1 2\n1 3\n2', expect: 'false' }
        ]
    },
    {
        id: 'koko-eating-bananas',
        title: 'Koko Eating Bananas',
        difficulty: 'Medium',
        tags: ['Binary Search', 'Arrays'],
        description: [
            'Koko has piles of bananas; piles[i] is the number of bananas in the i-th pile. The guards will return in h hours.',
            'Each hour, Koko chooses one pile and eats up to k bananas from it (if the pile has fewer than k, she finishes it and eats nothing more that hour). Return the minimum integer k such that she can eat all the bananas within h hours.'
        ],
        constraints: ['1 <= piles.length <= 10^4', 'piles.length <= h <= 10^9', '1 <= piles[i] <= 10^9'],
        example: 'Input: piles = [3,6,7,11], h = 8\nOutput: 4',
        runner: 'array-target-to-int',
        names: { a: 'piles', b: 'h' },
        solutionJs: 'function solution(piles, h) { let l = 1, r = Math.max(...piles); while (l < r) { const k = (l + r) >> 1; let hours = 0; for (const p of piles) hours += Math.ceil(p / k); if (hours <= h) r = k; else l = k + 1; } return l; }',
        tests: [
            { name: 'Basic', input: '4\n3 6 7 11\n8', expect: '4' },
            { name: 'Tight schedule', input: '5\n30 11 23 4 20\n5', expect: '30' },
            { name: 'One extra hour', input: '5\n30 11 23 4 20\n6', expect: '23' },
            { name: 'Single huge pile', input: '1\n1000000\n2', expect: '500000' }
        ]
    },
    {
        id: 'find-minimum-in-rotated-sorted-array',
        title: 'Find Minimum in Rotated Sorted Array',
        difficulty: 'Medium',
        tags: ['Binary Search', 'Arrays'],
        description: [
            'Suppose an array of unique elements, sorted in ascending order, is rotated between 1 and n times. Given the rotated array nums, return the minimum element.',
            'You must write an algorithm that runs in O(log n) time.'
        ],
        constraints: ['1 <= nums.length <= 5000', '-5000 <= nums[i] <= 5000', 'All elements are unique'],
        example: 'Input: nums = [3,4,5,1,2]\nOutput: 1',
        runner: 'array-to-int',
        names: { a: 'nums' },
        solutionJs: 'function solution(nums) { let l = 0, r = nums.length - 1; while (l < r) { const m = (l + r) >> 1; if (nums[m] > nums[r]) l = m + 1; else r = m; } return nums[l]; }',
        tests: [
            { name: 'Basic', input: '5\n3 4 5 1 2', expect: '1' },
            { name: 'Rotated further', input: '7\n4 5 6 7 0 1 2', expect: '0' },
            { name: 'Full rotation', input: '5\n11 13 15 17 19', expect: '11' },
            { name: 'Single element', input: '1\n1', expect: '1' },
            { name: 'Two elements', input: '2\n2 1', expect: '1' }
        ]
    },
    {
        id: 'search-in-rotated-sorted-array',
        title: 'Search in Rotated Sorted Array',
        difficulty: 'Medium',
        tags: ['Binary Search', 'Arrays'],
        description: [
            'You are given a sorted array of distinct integers that has possibly been rotated at an unknown pivot. Given the array nums and an integer target, return the index of target if it is in nums, or -1 if it is not.',
            'You must write an algorithm with O(log n) runtime complexity.'
        ],
        constraints: ['1 <= nums.length <= 5000', '-10^4 <= nums[i], target <= 10^4', 'All values of nums are unique'],
        example: 'Input: nums = [4,5,6,7,0,1,2], target = 0\nOutput: 4',
        runner: 'array-target-to-int',
        names: { a: 'nums', b: 'target' },
        solutionJs: 'function solution(nums, target) { let l = 0, r = nums.length - 1; while (l <= r) { const m = (l + r) >> 1; if (nums[m] === target) return m; if (nums[l] <= nums[m]) { if (nums[l] <= target && target < nums[m]) r = m - 1; else l = m + 1; } else { if (nums[m] < target && target <= nums[r]) l = m + 1; else r = m - 1; } } return -1; }',
        tests: [
            { name: 'Found in right half', input: '7\n4 5 6 7 0 1 2\n0', expect: '4' },
            { name: 'Not found', input: '7\n4 5 6 7 0 1 2\n3', expect: '-1' },
            { name: 'Single element miss', input: '1\n1\n0', expect: '-1' },
            { name: 'Small rotation', input: '3\n5 1 3\n3', expect: '2' },
            { name: 'Two elements', input: '2\n3 1\n1', expect: '1' }
        ]
    },
    {
        id: 'time-based-key-value-store',
        title: 'Time Based Key-Value Store',
        difficulty: 'Medium',
        tags: ['Binary Search', 'Design', 'Hash Map'],
        description: [
            'Design a time-based key-value data structure that can store multiple values for the same key at different timestamps, and retrieve the value at a given timestamp.',
            'Implement set(key, value, timestamp) and get(key, timestamp). get returns the value with the largest timestamp_prev <= timestamp for that key, or "" if there is none. All timestamps passed to set are strictly increasing per key.'
        ],
        constraints: ['1 <= key.length, value.length <= 100', '1 <= timestamp <= 10^7', 'At most 2 * 10^5 calls to set and get'],
        example: 'set("foo","bar",1); get("foo",1) -> "bar"; get("foo",3) -> "bar"; set("foo","bar2",4); get("foo",4) -> "bar2"; get("foo",5) -> "bar2"',
        boilerplate: {
            c: 'typedef struct {\n    // Define your fields here\n} TimeMap;\n\nTimeMap* timeMapCreate() {\n    return NULL;\n}\n\nvoid timeMapSet(TimeMap* obj, char* key, char* value, int timestamp) {\n}\n\nchar* timeMapGet(TimeMap* obj, char* key, int timestamp) {\n    return "";\n}',
            cpp: 'class TimeMap {\npublic:\n    TimeMap() {\n    }\n\n    void set(string key, string value, int timestamp) {\n    }\n\n    string get(string key, int timestamp) {\n        return "";\n    }\n};',
            java: 'class TimeMap {\n    public TimeMap() {\n    }\n\n    public void set(String key, String value, int timestamp) {\n    }\n\n    public String get(String key, int timestamp) {\n        return "";\n    }\n}',
            js: 'class TimeMap {\n    constructor() {\n    }\n\n    set(key, value, timestamp) {\n    }\n\n    get(key, timestamp) {\n        return \'\';\n    }\n}',
            python: "class TimeMap:\n    def __init__(self):\n        pass\n\n    def set(self, key, value, timestamp):\n        pass\n\n    def get(self, key, timestamp):\n        return ''"
        },
        tests: []
    },
    {
        id: 'median-of-two-sorted-arrays',
        title: 'Median of Two Sorted Arrays',
        difficulty: 'Hard',
        tags: ['Binary Search', 'Arrays', 'Divide and Conquer'],
        description: [
            'Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays combined.',
            'The overall run time complexity should be O(log(m + n)).'
        ],
        constraints: ['0 <= m, n <= 1000', '1 <= m + n <= 2000', '-10^6 <= nums1[i], nums2[i] <= 10^6'],
        example: 'Input: nums1 = [1,3], nums2 = [2]\nOutput: 2.00000\nExplanation: The merged array is [1,2,3]; the median is 2.',
        runner: 'two-arrays-to-double',
        names: { a: 'nums1', b: 'nums2' },
        solutionJs: 'function solution(nums1, nums2) { const m = [...nums1, ...nums2].sort((x, y) => x - y); const n = m.length; return n % 2 ? m[(n - 1) / 2] : (m[n / 2 - 1] + m[n / 2]) / 2; }',
        tests: [
            { name: 'Odd total', input: '2\n1 3\n1\n2', expect: '2.00000' },
            { name: 'Even total', input: '2\n1 2\n2\n3 4', expect: '2.50000' },
            { name: 'One empty array', input: '0\n1\n1', expect: '1.00000' },
            { name: 'Negatives', input: '3\n-5 -3 -1\n2\n-4 -2', expect: '-3.00000' }
        ]
    }
];
