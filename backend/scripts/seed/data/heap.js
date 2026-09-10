// Heap / Priority Queue (7)
module.exports = [
    {
        id: 'kth-largest-element-in-a-stream',
        title: 'Kth Largest Element in a Stream',
        difficulty: 'Easy',
        tags: ['Heap', 'Design', 'Trees'],
        description: [
            'Design a class to find the k-th largest element in a stream of numbers (the k-th largest in sorted order, not the k-th distinct element).',
            'Implement KthLargest(k, nums) which initializes the stream, and add(val) which appends val and returns the current k-th largest element.'
        ],
        constraints: ['1 <= k <= 10^4', '0 <= nums.length <= 10^4', '-10^4 <= nums[i], val <= 10^4', 'At least k elements are present whenever add is called'],
        example: 'KthLargest kth = new KthLargest(3, [4,5,8,2]);\nkth.add(3) -> 4; kth.add(5) -> 5; kth.add(10) -> 5; kth.add(9) -> 8; kth.add(4) -> 8',
        boilerplate: {
            c: 'typedef struct {\n    // Define your fields here\n} KthLargest;\n\nKthLargest* kthLargestCreate(int k, int* nums, int numsSize) {\n    return NULL;\n}\n\nint kthLargestAdd(KthLargest* obj, int val) {\n    return 0;\n}',
            cpp: 'class KthLargest {\npublic:\n    KthLargest(int k, vector<int>& nums) {\n    }\n\n    int add(int val) {\n        return 0;\n    }\n};',
            java: 'class KthLargest {\n    public KthLargest(int k, int[] nums) {\n    }\n\n    public int add(int val) {\n        return 0;\n    }\n}',
            js: 'class KthLargest {\n    constructor(k, nums) {\n    }\n\n    add(val) {\n        return 0;\n    }\n}',
            python: 'class KthLargest:\n    def __init__(self, k, nums):\n        pass\n\n    def add(self, val):\n        return 0'
        },
        tests: []
    },
    {
        id: 'last-stone-weight',
        title: 'Last Stone Weight',
        difficulty: 'Easy',
        tags: ['Heap', 'Arrays'],
        description: [
            'You are given an array of integers stones where stones[i] is the weight of the i-th stone. On each turn, choose the two heaviest stones x <= y and smash them together: if x == y both are destroyed; otherwise the stone of weight y - x remains.',
            'Return the weight of the last remaining stone, or 0 if none remain.'
        ],
        constraints: ['1 <= stones.length <= 30', '1 <= stones[i] <= 1000'],
        example: 'Input: stones = [2,7,4,1,8,1]\nOutput: 1',
        runner: 'array-to-int',
        names: { a: 'stones' },
        solutionJs: 'function solution(stones) { const a = stones.slice(); while (a.length > 1) { a.sort((x, y) => y - x); const y = a.shift(), x = a.shift(); if (y !== x) a.push(y - x); } return a.length ? a[0] : 0; }',
        tests: [
            { name: 'Basic', input: '6\n2 7 4 1 8 1', expect: '1' },
            { name: 'Single stone', input: '1\n1', expect: '1' },
            { name: 'Equal pair annihilates', input: '2\n5 5', expect: '0' },
            { name: 'Leftover difference', input: '3\n10 4 4', expect: '2' }
        ]
    },
    {
        id: 'k-closest-points-to-origin',
        title: 'K Closest Points to Origin',
        difficulty: 'Medium',
        tags: ['Heap', 'Arrays', 'Math', 'Sorting'],
        description: [
            'Given an array of points on the plane and an integer k, return the k points closest to the origin (0, 0), measured by Euclidean distance.',
            'You may return the answer in any order; it is guaranteed to be unique (aside from ordering).'
        ],
        constraints: ['1 <= k <= points.length <= 10^4', '-10^4 <= xi, yi <= 10^4'],
        example: 'Input: points = [[1,3],[-2,2]], k = 1\nOutput: [[-2,2]]',
        boilerplate: {
            c: 'int** solution(int points[][2], int pointsSize, int k, int* returnSize) {\n    // Write your code here\n    *returnSize = 0;\n    return NULL;\n}',
            cpp: 'class Solution {\npublic:\n    vector<vector<int>> solution(vector<vector<int>>& points, int k) {\n        // Write your code here\n        return {};\n    }\n};',
            java: 'class Solution {\n    public int[][] solution(int[][] points, int k) {\n        // Write your code here\n        return new int[][]{};\n    }\n}',
            js: 'function solution(points, k) {\n    // Write your code here\n    return [];\n}',
            python: 'def solution(points, k):\n    # Write your code here\n    return []'
        },
        tests: []
    },
    {
        id: 'kth-largest-element-in-an-array',
        title: 'Kth Largest Element in an Array',
        difficulty: 'Medium',
        tags: ['Heap', 'Arrays', 'Sorting'],
        description: [
            'Given an integer array nums and an integer k, return the k-th largest element in the array (in sorted order, not the k-th distinct element).',
            'Can you solve it without fully sorting the array?'
        ],
        constraints: ['1 <= k <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
        example: 'Input: nums = [3,2,1,5,6,4], k = 2\nOutput: 5',
        runner: 'array-target-to-int',
        names: { a: 'nums', b: 'k' },
        solutionJs: 'function solution(nums, k) { return nums.slice().sort((a, b) => b - a)[k - 1]; }',
        tests: [
            { name: 'Basic', input: '6\n3 2 1 5 6 4\n2', expect: '5' },
            { name: 'With duplicates', input: '9\n3 2 3 1 2 4 5 5 6\n4', expect: '4' },
            { name: 'Single element', input: '1\n1\n1', expect: '1' },
            { name: 'All negatives', input: '4\n-1 -2 -3 -4\n2', expect: '-2' }
        ]
    },
    {
        id: 'task-scheduler',
        title: 'Task Scheduler',
        difficulty: 'Medium',
        tags: ['Heap', 'Arrays', 'Greedy'],
        description: [
            'You are given a list of CPU tasks (labeled A-Z) and a cooldown n. Each CPU cycle completes one task or idles, and two tasks with the same label must be at least n cycles apart.',
            'Return the minimum number of CPU cycles required to complete all tasks.'
        ],
        constraints: ['1 <= tasks.length <= 10^4', 'tasks[i] is an uppercase English letter', '0 <= n <= 100'],
        example: 'Input: tasks = ["A","A","A","B","B","B"], n = 2\nOutput: 8\nExplanation: A -> B -> idle -> A -> B -> idle -> A -> B.',
        runner: 'words-k-to-int',
        names: { a: 'tasks', b: 'n' },
        solutionJs: 'function solution(tasks, n) { const freq = new Map(); for (const t of tasks) freq.set(t, (freq.get(t) || 0) + 1); const maxFreq = Math.max(...freq.values()); let countMax = 0; for (const v of freq.values()) if (v === maxFreq) countMax++; return Math.max(tasks.length, (maxFreq - 1) * (n + 1) + countMax); }',
        tests: [
            { name: 'Basic', input: '6 2\nA A A B B B', expect: '8' },
            { name: 'No cooldown', input: '6 0\nA A A B B B', expect: '6' },
            { name: 'Many idles', input: '12 2\nA A A A A A B C D E F G', expect: '16' },
            { name: 'Single task', input: '1 5\nZ', expect: '1' }
        ]
    },
    {
        id: 'design-twitter',
        title: 'Design Twitter',
        difficulty: 'Medium',
        tags: ['Heap', 'Design', 'Hash Map'],
        description: [
            'Design a simplified version of Twitter where users can post tweets, follow and unfollow other users, and see the 10 most recent tweets in their news feed.',
            'Implement postTweet(userId, tweetId), getNewsFeed(userId) (10 most recent tweets from the user and everyone they follow, most recent first), follow(followerId, followeeId) and unfollow(followerId, followeeId).'
        ],
        constraints: ['1 <= userId, tweetId <= 500', 'All tweet ids are unique', 'At most 3 * 10^4 calls in total'],
        example: 'postTweet(1,5); getNewsFeed(1) -> [5]; follow(1,2); postTweet(2,6); getNewsFeed(1) -> [6,5]; unfollow(1,2); getNewsFeed(1) -> [5]',
        boilerplate: {
            c: 'typedef struct {\n    // Define your fields here\n} Twitter;\n\nTwitter* twitterCreate() {\n    return NULL;\n}\n\nvoid twitterPostTweet(Twitter* obj, int userId, int tweetId) {\n}\n\nint* twitterGetNewsFeed(Twitter* obj, int userId, int* retSize) {\n    *retSize = 0;\n    return NULL;\n}\n\nvoid twitterFollow(Twitter* obj, int followerId, int followeeId) {\n}\n\nvoid twitterUnfollow(Twitter* obj, int followerId, int followeeId) {\n}',
            cpp: 'class Twitter {\npublic:\n    Twitter() {\n    }\n\n    void postTweet(int userId, int tweetId) {\n    }\n\n    vector<int> getNewsFeed(int userId) {\n        return {};\n    }\n\n    void follow(int followerId, int followeeId) {\n    }\n\n    void unfollow(int followerId, int followeeId) {\n    }\n};',
            java: 'class Twitter {\n    public Twitter() {\n    }\n\n    public void postTweet(int userId, int tweetId) {\n    }\n\n    public List<Integer> getNewsFeed(int userId) {\n        return new ArrayList<>();\n    }\n\n    public void follow(int followerId, int followeeId) {\n    }\n\n    public void unfollow(int followerId, int followeeId) {\n    }\n}',
            js: 'class Twitter {\n    constructor() {\n    }\n\n    postTweet(userId, tweetId) {\n    }\n\n    getNewsFeed(userId) {\n        return [];\n    }\n\n    follow(followerId, followeeId) {\n    }\n\n    unfollow(followerId, followeeId) {\n    }\n}',
            python: 'class Twitter:\n    def __init__(self):\n        pass\n\n    def postTweet(self, userId, tweetId):\n        pass\n\n    def getNewsFeed(self, userId):\n        return []\n\n    def follow(self, followerId, followeeId):\n        pass\n\n    def unfollow(self, followerId, followeeId):\n        pass'
        },
        tests: []
    },
    {
        id: 'find-median-from-data-stream',
        title: 'Find Median from Data Stream',
        difficulty: 'Hard',
        tags: ['Heap', 'Design', 'Sorting'],
        description: [
            'The median is the middle value in an ordered list (or the mean of the two middle values for an even count).',
            'Implement MedianFinder: addNum(num) adds an integer from the stream, and findMedian() returns the median of all elements so far.'
        ],
        constraints: ['-10^5 <= num <= 10^5', 'findMedian is only called after at least one addNum', 'At most 5 * 10^4 calls in total'],
        example: 'addNum(1); addNum(2); findMedian() -> 1.5; addNum(3); findMedian() -> 2.0',
        boilerplate: {
            c: 'typedef struct {\n    // Define your fields here\n} MedianFinder;\n\nMedianFinder* medianFinderCreate() {\n    return NULL;\n}\n\nvoid medianFinderAddNum(MedianFinder* obj, int num) {\n}\n\ndouble medianFinderFindMedian(MedianFinder* obj) {\n    return 0.0;\n}',
            cpp: 'class MedianFinder {\npublic:\n    MedianFinder() {\n    }\n\n    void addNum(int num) {\n    }\n\n    double findMedian() {\n        return 0.0;\n    }\n};',
            java: 'class MedianFinder {\n    public MedianFinder() {\n    }\n\n    public void addNum(int num) {\n    }\n\n    public double findMedian() {\n        return 0.0;\n    }\n}',
            js: 'class MedianFinder {\n    constructor() {\n    }\n\n    addNum(num) {\n    }\n\n    findMedian() {\n        return 0;\n    }\n}',
            python: 'class MedianFinder:\n    def __init__(self):\n        pass\n\n    def addNum(self, num):\n        pass\n\n    def findMedian(self):\n        return 0.0'
        },
        tests: []
    }
];
