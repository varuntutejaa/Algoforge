const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const Problem = require('../models/Problem');

const STUB_BOILERPLATE = {
  c: '// Coming soon\nint solution() {\n    return 0;\n}',
  cpp: '// Coming soon\nclass Solution {\npublic:\n    void solution() {\n    }\n};',
  java: '// Coming soon\nclass Solution {\n    public void solution() {\n    }\n}',
  js: '// Coming soon\nfunction solution() {\n}',
  python: '# Coming soon\ndef solution():\n    pass',
};

const neetcode150 = [
  // Arrays & Hashing
  { id: 'contains-duplicate',            title: 'Contains Duplicate',                          difficulty: 'Easy',   tags: ['Arrays', 'Hash Map'] },
  { id: 'valid-anagram',                  title: 'Valid Anagram',                               difficulty: 'Easy',   tags: ['Arrays', 'Hash Map', 'Strings'] },
  { id: 'two-sum',                        title: 'Two Sum',                                     difficulty: 'Easy',   tags: ['Arrays', 'Hash Map'] },
  { id: 'group-anagrams',                 title: 'Group Anagrams',                              difficulty: 'Medium', tags: ['Arrays', 'Hash Map', 'Strings'] },
  { id: 'top-k-frequent-elements',        title: 'Top K Frequent Elements',                     difficulty: 'Medium', tags: ['Arrays', 'Hash Map', 'Sorting'] },
  { id: 'encode-and-decode-strings',      title: 'Encode and Decode Strings',                   difficulty: 'Medium', tags: ['Arrays', 'Strings', 'Design'] },
  { id: 'product-of-array-except-self',  title: 'Product of Array Except Self',                difficulty: 'Medium', tags: ['Arrays', 'Prefix Sum'] },
  { id: 'valid-sudoku',                   title: 'Valid Sudoku',                                difficulty: 'Medium', tags: ['Arrays', 'Hash Map', 'Matrix'] },
  { id: 'longest-consecutive-sequence',   title: 'Longest Consecutive Sequence',                difficulty: 'Medium', tags: ['Arrays', 'Hash Map'] },

  // Two Pointers
  { id: 'valid-palindrome',              title: 'Valid Palindrome',                            difficulty: 'Easy',   tags: ['Two Pointers', 'Strings'] },
  { id: 'two-sum-ii',                    title: 'Two Sum II - Input Array Is Sorted',          difficulty: 'Medium', tags: ['Two Pointers', 'Arrays', 'Binary Search'] },
  { id: '3sum',                          title: '3Sum',                                        difficulty: 'Medium', tags: ['Two Pointers', 'Arrays', 'Sorting'] },
  { id: 'container-with-most-water',     title: 'Container With Most Water',                   difficulty: 'Medium', tags: ['Two Pointers', 'Arrays', 'Greedy'] },
  { id: 'trapping-rain-water',           title: 'Trapping Rain Water',                         difficulty: 'Hard',   tags: ['Two Pointers', 'Arrays', 'Dynamic Programming'] },

  // Sliding Window
  { id: 'best-time-to-buy-and-sell-stock',             title: 'Best Time to Buy and Sell Stock',             difficulty: 'Easy',   tags: ['Sliding Window', 'Arrays', 'Dynamic Programming'] },
  { id: 'longest-substring-without-repeating-characters', title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', tags: ['Sliding Window', 'Strings', 'Hash Map'] },
  { id: 'longest-repeating-character-replacement',     title: 'Longest Repeating Character Replacement',     difficulty: 'Medium', tags: ['Sliding Window', 'Strings', 'Hash Map'] },
  { id: 'permutation-in-string',                       title: 'Permutation in String',                       difficulty: 'Medium', tags: ['Sliding Window', 'Strings', 'Hash Map'] },
  { id: 'minimum-window-substring',                    title: 'Minimum Window Substring',                    difficulty: 'Hard',   tags: ['Sliding Window', 'Strings', 'Hash Map'] },
  { id: 'sliding-window-maximum',                      title: 'Sliding Window Maximum',                      difficulty: 'Hard',   tags: ['Sliding Window', 'Arrays', 'Deque'] },

  // Stack
  { id: 'valid-parentheses',             title: 'Valid Parentheses',                           difficulty: 'Easy',   tags: ['Stack', 'Strings'] },
  { id: 'min-stack',                     title: 'Min Stack',                                   difficulty: 'Medium', tags: ['Stack', 'Design'] },
  { id: 'evaluate-reverse-polish-notation', title: 'Evaluate Reverse Polish Notation',         difficulty: 'Medium', tags: ['Stack', 'Arrays', 'Math'] },
  { id: 'generate-parentheses',          title: 'Generate Parentheses',                        difficulty: 'Medium', tags: ['Stack', 'Strings', 'Backtracking'] },
  { id: 'daily-temperatures',            title: 'Daily Temperatures',                          difficulty: 'Medium', tags: ['Stack', 'Arrays', 'Monotonic Stack'] },
  { id: 'car-fleet',                     title: 'Car Fleet',                                   difficulty: 'Medium', tags: ['Stack', 'Arrays', 'Sorting'] },
  { id: 'largest-rectangle-in-histogram', title: 'Largest Rectangle in Histogram',            difficulty: 'Hard',   tags: ['Stack', 'Arrays', 'Monotonic Stack'] },

  // Binary Search
  { id: 'binary-search',                 title: 'Binary Search',                               difficulty: 'Easy',   tags: ['Binary Search', 'Arrays'] },
  { id: 'search-a-2d-matrix',            title: 'Search a 2D Matrix',                          difficulty: 'Medium', tags: ['Binary Search', 'Matrix'] },
  { id: 'koko-eating-bananas',           title: 'Koko Eating Bananas',                         difficulty: 'Medium', tags: ['Binary Search', 'Arrays'] },
  { id: 'find-minimum-in-rotated-sorted-array', title: 'Find Minimum in Rotated Sorted Array', difficulty: 'Medium', tags: ['Binary Search', 'Arrays'] },
  { id: 'search-in-rotated-sorted-array', title: 'Search in Rotated Sorted Array',            difficulty: 'Medium', tags: ['Binary Search', 'Arrays'] },
  { id: 'time-based-key-value-store',    title: 'Time Based Key-Value Store',                  difficulty: 'Medium', tags: ['Binary Search', 'Design', 'Hash Map'] },
  { id: 'median-of-two-sorted-arrays',   title: 'Median of Two Sorted Arrays',                 difficulty: 'Hard',   tags: ['Binary Search', 'Arrays', 'Divide and Conquer'] },

  // Linked List
  { id: 'reverse-linked-list',           title: 'Reverse Linked List',                         difficulty: 'Easy',   tags: ['Linked List', 'Recursion'] },
  { id: 'merge-two-sorted-lists',        title: 'Merge Two Sorted Lists',                      difficulty: 'Easy',   tags: ['Linked List', 'Recursion'] },
  { id: 'reorder-list',                  title: 'Reorder List',                                difficulty: 'Medium', tags: ['Linked List', 'Two Pointers', 'Stack'] },
  { id: 'remove-nth-node-from-end-of-list', title: 'Remove Nth Node From End of List',       difficulty: 'Medium', tags: ['Linked List', 'Two Pointers'] },
  { id: 'copy-list-with-random-pointer', title: 'Copy List With Random Pointer',              difficulty: 'Medium', tags: ['Linked List', 'Hash Map'] },
  { id: 'add-two-numbers',               title: 'Add Two Numbers',                             difficulty: 'Medium', tags: ['Linked List', 'Math', 'Recursion'] },
  { id: 'linked-list-cycle',             title: 'Linked List Cycle',                           difficulty: 'Easy',   tags: ['Linked List', 'Two Pointers', 'Hash Map'] },
  { id: 'find-the-duplicate-number',     title: 'Find the Duplicate Number',                   difficulty: 'Medium', tags: ['Linked List', 'Arrays', 'Two Pointers', 'Binary Search'] },
  { id: 'lru-cache',                     title: 'LRU Cache',                                   difficulty: 'Medium', tags: ['Linked List', 'Hash Map', 'Design'] },
  { id: 'merge-k-sorted-lists',          title: 'Merge K Sorted Lists',                        difficulty: 'Hard',   tags: ['Linked List', 'Heap', 'Divide and Conquer'] },
  { id: 'reverse-nodes-in-k-group',      title: 'Reverse Nodes in K-Group',                   difficulty: 'Hard',   tags: ['Linked List', 'Recursion'] },

  // Trees
  { id: 'invert-binary-tree',            title: 'Invert Binary Tree',                          difficulty: 'Easy',   tags: ['Trees', 'Recursion', 'BFS'] },
  { id: 'maximum-depth-of-binary-tree',  title: 'Maximum Depth of Binary Tree',                difficulty: 'Easy',   tags: ['Trees', 'Recursion', 'BFS'] },
  { id: 'diameter-of-binary-tree',       title: 'Diameter of Binary Tree',                     difficulty: 'Easy',   tags: ['Trees', 'Recursion'] },
  { id: 'balanced-binary-tree',          title: 'Balanced Binary Tree',                        difficulty: 'Easy',   tags: ['Trees', 'Recursion'] },
  { id: 'same-tree',                     title: 'Same Tree',                                   difficulty: 'Easy',   tags: ['Trees', 'Recursion', 'BFS'] },
  { id: 'subtree-of-another-tree',       title: 'Subtree of Another Tree',                     difficulty: 'Easy',   tags: ['Trees', 'Recursion', 'Hash Map'] },
  { id: 'lowest-common-ancestor-of-a-bst', title: 'Lowest Common Ancestor of a BST',         difficulty: 'Medium', tags: ['Trees', 'BST', 'Recursion'] },
  { id: 'binary-tree-level-order-traversal', title: 'Binary Tree Level Order Traversal',     difficulty: 'Medium', tags: ['Trees', 'BFS'] },
  { id: 'binary-tree-right-side-view',   title: 'Binary Tree Right Side View',                 difficulty: 'Medium', tags: ['Trees', 'BFS', 'DFS'] },
  { id: 'count-good-nodes-in-binary-tree', title: 'Count Good Nodes in Binary Tree',          difficulty: 'Medium', tags: ['Trees', 'DFS', 'BFS'] },
  { id: 'validate-binary-search-tree',   title: 'Validate Binary Search Tree',                 difficulty: 'Medium', tags: ['Trees', 'BST', 'DFS'] },
  { id: 'kth-smallest-element-in-a-bst', title: 'Kth Smallest Element in a BST',             difficulty: 'Medium', tags: ['Trees', 'BST', 'DFS'] },
  { id: 'construct-binary-tree-from-preorder-and-inorder-traversal', title: 'Construct Binary Tree from Preorder and Inorder Traversal', difficulty: 'Medium', tags: ['Trees', 'Arrays', 'Divide and Conquer'] },
  { id: 'binary-tree-maximum-path-sum',  title: 'Binary Tree Maximum Path Sum',                difficulty: 'Hard',   tags: ['Trees', 'DFS', 'Dynamic Programming'] },
  { id: 'serialize-and-deserialize-binary-tree', title: 'Serialize and Deserialize Binary Tree', difficulty: 'Hard', tags: ['Trees', 'BFS', 'DFS', 'Design'] },

  // Tries
  { id: 'implement-trie-prefix-tree',    title: 'Implement Trie (Prefix Tree)',                difficulty: 'Medium', tags: ['Tries', 'Design', 'Hash Map'] },
  { id: 'design-add-and-search-words-data-structure', title: 'Design Add and Search Words Data Structure', difficulty: 'Medium', tags: ['Tries', 'Design', 'DFS'] },
  { id: 'word-search-ii',                title: 'Word Search II',                              difficulty: 'Hard',   tags: ['Tries', 'Backtracking', 'Matrix'] },

  // Heap / Priority Queue
  { id: 'kth-largest-element-in-a-stream', title: 'Kth Largest Element in a Stream',          difficulty: 'Easy',   tags: ['Heap', 'Design', 'Trees'] },
  { id: 'last-stone-weight',             title: 'Last Stone Weight',                           difficulty: 'Easy',   tags: ['Heap', 'Arrays'] },
  { id: 'k-closest-points-to-origin',    title: 'K Closest Points to Origin',                  difficulty: 'Medium', tags: ['Heap', 'Arrays', 'Math', 'Sorting'] },
  { id: 'kth-largest-element-in-an-array', title: 'Kth Largest Element in an Array',          difficulty: 'Medium', tags: ['Heap', 'Arrays', 'Sorting'] },
  { id: 'task-scheduler',                title: 'Task Scheduler',                              difficulty: 'Medium', tags: ['Heap', 'Arrays', 'Greedy'] },
  { id: 'design-twitter',                title: 'Design Twitter',                              difficulty: 'Medium', tags: ['Heap', 'Design', 'Hash Map'] },
  { id: 'find-median-from-data-stream',  title: 'Find Median from Data Stream',                difficulty: 'Hard',   tags: ['Heap', 'Design', 'Sorting'] },

  // Backtracking
  { id: 'subsets',                       title: 'Subsets',                                     difficulty: 'Medium', tags: ['Backtracking', 'Arrays', 'Bit Manipulation'] },
  { id: 'combination-sum',               title: 'Combination Sum',                             difficulty: 'Medium', tags: ['Backtracking', 'Arrays'] },
  { id: 'permutations',                  title: 'Permutations',                                difficulty: 'Medium', tags: ['Backtracking', 'Arrays'] },
  { id: 'subsets-ii',                    title: 'Subsets II',                                  difficulty: 'Medium', tags: ['Backtracking', 'Arrays', 'Bit Manipulation'] },
  { id: 'combination-sum-ii',            title: 'Combination Sum II',                          difficulty: 'Medium', tags: ['Backtracking', 'Arrays'] },
  { id: 'word-search',                   title: 'Word Search',                                 difficulty: 'Medium', tags: ['Backtracking', 'Matrix', 'DFS'] },
  { id: 'palindrome-partitioning',       title: 'Palindrome Partitioning',                     difficulty: 'Medium', tags: ['Backtracking', 'Strings', 'Dynamic Programming'] },
  { id: 'letter-combinations-of-a-phone-number', title: 'Letter Combinations of a Phone Number', difficulty: 'Medium', tags: ['Backtracking', 'Strings', 'Hash Map'] },
  { id: 'n-queens',                      title: 'N-Queens',                                    difficulty: 'Hard',   tags: ['Backtracking', 'Arrays'] },

  // Graphs
  { id: 'number-of-islands',             title: 'Number of Islands',                           difficulty: 'Medium', tags: ['Graphs', 'Matrix', 'DFS', 'BFS'] },
  { id: 'clone-graph',                   title: 'Clone Graph',                                 difficulty: 'Medium', tags: ['Graphs', 'DFS', 'BFS', 'Hash Map'] },
  { id: 'max-area-of-island',            title: 'Max Area of Island',                          difficulty: 'Medium', tags: ['Graphs', 'Matrix', 'DFS', 'BFS'] },
  { id: 'pacific-atlantic-water-flow',   title: 'Pacific Atlantic Water Flow',                  difficulty: 'Medium', tags: ['Graphs', 'Matrix', 'DFS', 'BFS'] },
  { id: 'surrounded-regions',            title: 'Surrounded Regions',                          difficulty: 'Medium', tags: ['Graphs', 'Matrix', 'DFS', 'BFS'] },
  { id: 'rotting-oranges',               title: 'Rotting Oranges',                             difficulty: 'Medium', tags: ['Graphs', 'Matrix', 'BFS'] },
  { id: 'walls-and-gates',               title: 'Walls And Gates',                             difficulty: 'Medium', tags: ['Graphs', 'Matrix', 'BFS'] },
  { id: 'course-schedule',               title: 'Course Schedule',                             difficulty: 'Medium', tags: ['Graphs', 'Topological Sort', 'DFS'] },
  { id: 'course-schedule-ii',            title: 'Course Schedule II',                          difficulty: 'Medium', tags: ['Graphs', 'Topological Sort', 'DFS'] },
  { id: 'redundant-connection',          title: 'Redundant Connection',                        difficulty: 'Medium', tags: ['Graphs', 'Union Find'] },
  { id: 'number-of-connected-components-in-an-undirected-graph', title: 'Number of Connected Components in an Undirected Graph', difficulty: 'Medium', tags: ['Graphs', 'Union Find', 'DFS'] },
  { id: 'graph-valid-tree',              title: 'Graph Valid Tree',                            difficulty: 'Medium', tags: ['Graphs', 'Union Find', 'DFS'] },
  { id: 'word-ladder',                   title: 'Word Ladder',                                 difficulty: 'Hard',   tags: ['Graphs', 'BFS', 'Hash Map'] },

  // Advanced Graphs
  { id: 'reconstruct-itinerary',         title: 'Reconstruct Itinerary',                       difficulty: 'Hard',   tags: ['Advanced Graphs', 'DFS', 'Eulerian Path'] },
  { id: 'min-cost-to-connect-all-points', title: 'Min Cost to Connect All Points',            difficulty: 'Medium', tags: ['Advanced Graphs', 'Minimum Spanning Tree', 'Greedy'] },
  { id: 'network-delay-time',            title: 'Network Delay Time',                          difficulty: 'Medium', tags: ['Advanced Graphs', "Dijkstra's", 'Shortest Path'] },
  { id: 'swim-in-rising-water',          title: 'Swim in Rising Water',                        difficulty: 'Hard',   tags: ['Advanced Graphs', 'Binary Search', 'DFS'] },
  { id: 'alien-dictionary',              title: 'Alien Dictionary',                            difficulty: 'Hard',   tags: ['Advanced Graphs', 'Topological Sort', 'DFS'] },
  { id: 'cheapest-flights-within-k-stops', title: 'Cheapest Flights Within K Stops',          difficulty: 'Medium', tags: ['Advanced Graphs', 'Dynamic Programming', 'BFS'] },

  // 1-D Dynamic Programming
  { id: 'climbing-stairs',              title: 'Climbing Stairs',                             difficulty: 'Easy',   tags: ['Dynamic Programming', 'Math'] },
  { id: 'min-cost-climbing-stairs',     title: 'Min Cost Climbing Stairs',                    difficulty: 'Easy',   tags: ['Dynamic Programming', 'Arrays'] },
  { id: 'house-robber',                 title: 'House Robber',                                difficulty: 'Medium', tags: ['Dynamic Programming', 'Arrays'] },
  { id: 'house-robber-ii',              title: 'House Robber II',                             difficulty: 'Medium', tags: ['Dynamic Programming', 'Arrays'] },
  { id: 'longest-palindromic-substring', title: 'Longest Palindromic Substring',              difficulty: 'Medium', tags: ['Dynamic Programming', 'Strings', 'Two Pointers'] },
  { id: 'palindromic-substrings',       title: 'Palindromic Substrings',                      difficulty: 'Medium', tags: ['Dynamic Programming', 'Strings', 'Two Pointers'] },
  { id: 'decode-ways',                  title: 'Decode Ways',                                 difficulty: 'Medium', tags: ['Dynamic Programming', 'Strings'] },
  { id: 'coin-change',                  title: 'Coin Change',                                 difficulty: 'Medium', tags: ['Dynamic Programming', 'Arrays', 'BFS'] },
  { id: 'maximum-product-subarray',     title: 'Maximum Product Subarray',                    difficulty: 'Medium', tags: ['Dynamic Programming', 'Arrays'] },
  { id: 'word-break',                   title: 'Word Break',                                  difficulty: 'Medium', tags: ['Dynamic Programming', 'Strings', 'Hash Map'] },
  { id: 'longest-increasing-subsequence', title: 'Longest Increasing Subsequence',            difficulty: 'Medium', tags: ['Dynamic Programming', 'Arrays', 'Binary Search'] },
  { id: 'partition-equal-subset-sum',   title: 'Partition Equal Subset Sum',                  difficulty: 'Medium', tags: ['Dynamic Programming', 'Arrays'] },

  // 2-D Dynamic Programming
  { id: 'unique-paths',                 title: 'Unique Paths',                                difficulty: 'Medium', tags: ['Dynamic Programming', 'Math', 'Combinatorics'] },
  { id: 'longest-common-subsequence',   title: 'Longest Common Subsequence',                  difficulty: 'Medium', tags: ['Dynamic Programming', 'Strings'] },
  { id: 'best-time-to-buy-and-sell-stock-with-cooldown', title: 'Best Time to Buy and Sell Stock with Cooldown', difficulty: 'Medium', tags: ['Dynamic Programming', 'Arrays'] },
  { id: 'coin-change-ii',               title: 'Coin Change II',                              difficulty: 'Medium', tags: ['Dynamic Programming', 'Arrays'] },
  { id: 'target-sum',                   title: 'Target Sum',                                  difficulty: 'Medium', tags: ['Dynamic Programming', 'Arrays', 'Backtracking'] },
  { id: 'interleaving-string',          title: 'Interleaving String',                         difficulty: 'Hard',   tags: ['Dynamic Programming', 'Strings'] },
  { id: 'longest-increasing-path-in-a-matrix', title: 'Longest Increasing Path in a Matrix', difficulty: 'Hard',   tags: ['Dynamic Programming', 'Matrix', 'DFS', 'Memoization'] },
  { id: 'distinct-subsequences',        title: 'Distinct Subsequences',                       difficulty: 'Hard',   tags: ['Dynamic Programming', 'Strings'] },
  { id: 'edit-distance',                title: 'Edit Distance',                               difficulty: 'Medium', tags: ['Dynamic Programming', 'Strings'] },
  { id: 'burst-balloons',               title: 'Burst Balloons',                              difficulty: 'Hard',   tags: ['Dynamic Programming', 'Arrays', 'Divide and Conquer'] },
  { id: 'regular-expression-matching',  title: 'Regular Expression Matching',                 difficulty: 'Hard',   tags: ['Dynamic Programming', 'Strings', 'Recursion'] },

  // Greedy
  { id: 'maximum-subarray',             title: 'Maximum Subarray',                            difficulty: 'Medium', tags: ['Greedy', 'Dynamic Programming', 'Arrays'] },
  { id: 'jump-game',                    title: 'Jump Game',                                   difficulty: 'Medium', tags: ['Greedy', 'Arrays', 'Dynamic Programming'] },
  { id: 'jump-game-ii',                 title: 'Jump Game II',                                difficulty: 'Medium', tags: ['Greedy', 'Arrays', 'Dynamic Programming'] },
  { id: 'gas-station',                  title: 'Gas Station',                                 difficulty: 'Medium', tags: ['Greedy', 'Arrays'] },
  { id: 'hand-of-straights',            title: 'Hand of Straights',                           difficulty: 'Medium', tags: ['Greedy', 'Arrays', 'Hash Map', 'Sorting'] },
  { id: 'merge-triplets-to-form-target-triplet', title: 'Merge Triplets to Form Target Triplet', difficulty: 'Medium', tags: ['Greedy', 'Arrays'] },
  { id: 'partition-labels',             title: 'Partition Labels',                            difficulty: 'Medium', tags: ['Greedy', 'Strings', 'Two Pointers'] },
  { id: 'valid-parenthesis-string',     title: 'Valid Parenthesis String',                    difficulty: 'Medium', tags: ['Greedy', 'Strings', 'Dynamic Programming'] },

  // Intervals
  { id: 'insert-interval',              title: 'Insert Interval',                             difficulty: 'Medium', tags: ['Intervals', 'Arrays'] },
  { id: 'merge-intervals',              title: 'Merge Intervals',                             difficulty: 'Medium', tags: ['Intervals', 'Arrays', 'Sorting'] },
  { id: 'non-overlapping-intervals',    title: 'Non Overlapping Intervals',                   difficulty: 'Medium', tags: ['Intervals', 'Arrays', 'Greedy', 'Sorting'] },
  { id: 'meeting-rooms',                title: 'Meeting Rooms',                               difficulty: 'Easy',   tags: ['Intervals', 'Arrays', 'Sorting'] },
  { id: 'meeting-rooms-ii',             title: 'Meeting Rooms II',                            difficulty: 'Medium', tags: ['Intervals', 'Arrays', 'Heap', 'Sorting'] },
  { id: 'minimum-interval-to-include-each-query', title: 'Minimum Interval to Include Each Query', difficulty: 'Hard', tags: ['Intervals', 'Arrays', 'Heap', 'Sorting'] },

  // Math & Geometry
  { id: 'rotate-image',                 title: 'Rotate Image',                                difficulty: 'Medium', tags: ['Math', 'Matrix'] },
  { id: 'spiral-matrix',                title: 'Spiral Matrix',                               difficulty: 'Medium', tags: ['Math', 'Matrix'] },
  { id: 'set-matrix-zeroes',            title: 'Set Matrix Zeroes',                           difficulty: 'Medium', tags: ['Math', 'Matrix'] },
  { id: 'happy-number',                 title: 'Happy Number',                                difficulty: 'Easy',   tags: ['Math', 'Hash Map', 'Two Pointers'] },
  { id: 'plus-one',                     title: 'Plus One',                                    difficulty: 'Easy',   tags: ['Math', 'Arrays'] },
  { id: 'pow-x-n',                      title: 'Pow(x, n)',                                   difficulty: 'Medium', tags: ['Math', 'Recursion', 'Binary Search'] },
  { id: 'multiply-strings',             title: 'Multiply Strings',                            difficulty: 'Medium', tags: ['Math', 'Strings', 'Simulation'] },
  { id: 'detect-squares',               title: 'Detect Squares',                              difficulty: 'Medium', tags: ['Math', 'Hash Map', 'Design'] },

  // Bit Manipulation
  { id: 'single-number',                title: 'Single Number',                               difficulty: 'Easy',   tags: ['Bit Manipulation', 'Arrays'] },
  { id: 'number-of-1-bits',             title: 'Number of 1 Bits',                            difficulty: 'Easy',   tags: ['Bit Manipulation', 'Math'] },
  { id: 'counting-bits',                title: 'Counting Bits',                               difficulty: 'Easy',   tags: ['Bit Manipulation', 'Dynamic Programming'] },
  { id: 'reverse-bits',                 title: 'Reverse Bits',                                difficulty: 'Easy',   tags: ['Bit Manipulation', 'Math'] },
  { id: 'missing-number',               title: 'Missing Number',                              difficulty: 'Easy',   tags: ['Bit Manipulation', 'Arrays', 'Math'] },
  { id: 'sum-of-two-integers',          title: 'Sum of Two Integers',                         difficulty: 'Medium', tags: ['Bit Manipulation', 'Math'] },
  { id: 'reverse-integer',              title: 'Reverse Integer',                             difficulty: 'Medium', tags: ['Bit Manipulation', 'Math'] },
];

async function seed() {
  const existingIds = new Set(
    (await Problem.find({}).select('id').lean()).map(p => p.id)
  );

  let created = 0;
  let skipped = 0;

  for (const p of neetcode150) {
    if (existingIds.has(p.id)) {
      console.log(`  skip  ${p.id}`);
      skipped++;
      continue;
    }

    await Problem.create({
      id:          p.id,
      title:       p.title,
      difficulty:  p.difficulty,
      tags:        p.tags,
      description: ['This problem is coming soon. Full description, test cases, and solutions will be added shortly.'],
      constraints: [],
      example:     'Coming soon',
      boilerplate: STUB_BOILERPLATE,
      testCases:   [],
      runner:      null,
    });

    console.log(`  created ${p.id}`);
    created++;
  }

  console.log(`\nDone. Created: ${created}, Skipped (already exist): ${skipped}`);
}

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected\n');
    await seed();
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(err => {
    console.error('Failed:', err.message);
    process.exit(1);
  });
