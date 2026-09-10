// Graphs (13)
module.exports = [
    {
        id: 'number-of-islands',
        title: 'Number of Islands',
        difficulty: 'Medium',
        tags: ['Graphs', 'Matrix', 'DFS', 'BFS'],
        description: [
            'Given an m x n grid where 1 represents land and 0 represents water, return the number of islands.',
            'An island is a maximal group of land cells connected horizontally or vertically, surrounded by water. All four edges of the grid are assumed to be surrounded by water.'
        ],
        constraints: ['1 <= m, n <= 300', 'grid[i][j] is 0 or 1'],
        example: 'Input: grid = [[1,1,0,0,0],[1,1,0,0,0],[0,0,1,0,0],[0,0,0,1,1]]\nOutput: 3',
        runner: 'matrix-to-int',
        names: { a: 'grid' },
        solutionJs: 'function solution(grid) { const r = grid.length, c = grid[0].length; let count = 0; function sink(i, j) { if (i < 0 || j < 0 || i >= r || j >= c || grid[i][j] !== 1) return; grid[i][j] = 0; sink(i + 1, j); sink(i - 1, j); sink(i, j + 1); sink(i, j - 1); } for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) if (grid[i][j] === 1) { count++; sink(i, j); } return count; }',
        tests: [
            { name: 'One island', input: '4 5\n1 1 1 1 0 1 1 0 1 0 1 1 0 0 0 0 0 0 0 0', expect: '1' },
            { name: 'Three islands', input: '4 5\n1 1 0 0 0 1 1 0 0 0 0 0 1 0 0 0 0 0 1 1', expect: '3' },
            { name: 'All water', input: '2 4\n0 0 0 0 0 0 0 0', expect: '0' },
            { name: 'Single land cell', input: '1 1\n1', expect: '1' }
        ]
    },
    {
        id: 'clone-graph',
        title: 'Clone Graph',
        difficulty: 'Medium',
        tags: ['Graphs', 'DFS', 'BFS', 'Hash Map'],
        description: [
            'Given a reference to a node in a connected undirected graph, return a deep copy of the graph. Each node contains a value and a list of its neighbors.'
        ],
        constraints: ['0 <= number of nodes <= 100', '1 <= Node.val <= 100, all values unique', 'No self-loops or repeated edges'],
        example: 'Input: adjList = [[2,4],[1,3],[2,4],[1,3]]\nOutput: a deep copy with identical structure',
        boilerplate: {
            c: '/**\n * struct Node {\n *     int val;\n *     int numNeighbors;\n *     struct Node** neighbors;\n * };\n */\nstruct Node* solution(struct Node* node) {\n    // Write your code here\n    return NULL;\n}',
            cpp: '/**\n * class Node {\n * public:\n *     int val;\n *     vector<Node*> neighbors;\n * };\n */\nclass Solution {\npublic:\n    Node* solution(Node* node) {\n        // Write your code here\n        return nullptr;\n    }\n};',
            java: '/**\n * class Node {\n *     public int val;\n *     public List<Node> neighbors;\n * }\n */\nclass Solution {\n    public Node solution(Node node) {\n        // Write your code here\n        return null;\n    }\n}',
            js: '/**\n * function Node(val, neighbors) {\n *     this.val = val;\n *     this.neighbors = neighbors || [];\n * }\n */\nfunction solution(node) {\n    // Write your code here\n    return null;\n}',
            python: '# class Node:\n#     def __init__(self, val=0, neighbors=None):\n#         self.val = val\n#         self.neighbors = neighbors or []\ndef solution(node):\n    # Write your code here\n    return None'
        },
        tests: []
    },
    {
        id: 'max-area-of-island',
        title: 'Max Area of Island',
        difficulty: 'Medium',
        tags: ['Graphs', 'Matrix', 'DFS', 'BFS'],
        description: [
            'Given an m x n binary grid, return the area of the largest island (group of 1-cells connected horizontally or vertically). Return 0 if there is no island.'
        ],
        constraints: ['1 <= m, n <= 50', 'grid[i][j] is 0 or 1'],
        example: 'Input: grid = [[0,1,0],[1,1,0],[0,0,1]]\nOutput: 3',
        runner: 'matrix-to-int',
        names: { a: 'grid' },
        solutionJs: 'function solution(grid) { const r = grid.length, c = grid[0].length; function area(i, j) { if (i < 0 || j < 0 || i >= r || j >= c || grid[i][j] !== 1) return 0; grid[i][j] = 0; return 1 + area(i + 1, j) + area(i - 1, j) + area(i, j + 1) + area(i, j - 1); } let best = 0; for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) if (grid[i][j] === 1) best = Math.max(best, area(i, j)); return best; }',
        tests: [
            { name: 'Basic', input: '3 3\n0 1 0 1 1 0 0 0 1', expect: '3' },
            { name: 'No island', input: '2 2\n0 0 0 0', expect: '0' },
            { name: 'Whole grid', input: '2 3\n1 1 1 1 1 1', expect: '6' },
            { name: 'Diagonals do not connect', input: '3 3\n1 0 1 0 1 0 1 0 1', expect: '1' }
        ]
    },
    {
        id: 'pacific-atlantic-water-flow',
        title: 'Pacific Atlantic Water Flow',
        difficulty: 'Medium',
        tags: ['Graphs', 'Matrix', 'DFS', 'BFS'],
        description: [
            "There is an m x n island whose Pacific Ocean touches its top and left edges and whose Atlantic Ocean touches its bottom and right edges. heights[r][c] is the height above sea level of each cell.",
            'Rain water can flow from a cell to a neighboring cell whose height is less than or equal to the current height. Return the list of coordinates from which water can flow to both oceans.'
        ],
        constraints: ['1 <= m, n <= 200', '0 <= heights[r][c] <= 10^5'],
        example: 'Input: heights = [[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]\nOutput: [[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]',
        boilerplate: {
            c: 'int** solution(int** heights, int rows, int cols, int* returnSize, int** returnColumnSizes) {\n    // Write your code here\n    *returnSize = 0;\n    return NULL;\n}',
            cpp: 'class Solution {\npublic:\n    vector<vector<int>> solution(vector<vector<int>>& heights) {\n        // Write your code here\n        return {};\n    }\n};',
            java: 'class Solution {\n    public List<List<Integer>> solution(int[][] heights) {\n        // Write your code here\n        return new ArrayList<>();\n    }\n}',
            js: 'function solution(heights) {\n    // Write your code here\n    return [];\n}',
            python: 'def solution(heights):\n    # Write your code here\n    return []'
        },
        tests: []
    },
    {
        id: 'surrounded-regions',
        title: 'Surrounded Regions',
        difficulty: 'Medium',
        tags: ['Graphs', 'Matrix', 'DFS', 'BFS'],
        description: [
            'Given an m x n board where 1 is a wall cell and 0 is an open cell, capture every region of 0-cells that is fully surrounded by walls: flip all such 0s to 1s, in place.',
            'A region is surrounded unless it touches the border of the board (a 0-region connected to any border cell is never captured).'
        ],
        constraints: ['1 <= m, n <= 200', 'board[i][j] is 0 or 1'],
        example: 'Input: board = [[1,1,1,1],[1,0,0,1],[1,1,0,1],[1,0,1,1]]\nOutput: [[1,1,1,1],[1,1,1,1],[1,1,1,1],[1,0,1,1]]',
        runner: 'matrix-inplace',
        names: { a: 'board' },
        solutionJs: 'function solution(board) { const r = board.length, c = board[0].length; function mark(i, j) { if (i < 0 || j < 0 || i >= r || j >= c || board[i][j] !== 0) return; board[i][j] = 2; mark(i + 1, j); mark(i - 1, j); mark(i, j + 1); mark(i, j - 1); } for (let i = 0; i < r; i++) { mark(i, 0); mark(i, c - 1); } for (let j = 0; j < c; j++) { mark(0, j); mark(r - 1, j); } for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) { if (board[i][j] === 2) board[i][j] = 0; else if (board[i][j] === 0) board[i][j] = 1; } }',
        tests: [
            { name: 'Basic capture', input: '4 4\n1 1 1 1 1 0 0 1 1 1 0 1 1 0 1 1', expect: '1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1' },
            { name: 'Border region survives', input: '3 3\n0 1 1 1 1 1 1 1 1', expect: '0 1 1 1 1 1 1 1 1' },
            { name: 'Single cell', input: '1 1\n0', expect: '0' }
        ]
    },
    {
        id: 'rotting-oranges',
        title: 'Rotting Oranges',
        difficulty: 'Medium',
        tags: ['Graphs', 'Matrix', 'BFS'],
        description: [
            'You are given an m x n grid where 0 is an empty cell, 1 is a fresh orange, and 2 is a rotten orange. Every minute, any fresh orange adjacent (4-directionally) to a rotten orange becomes rotten.',
            'Return the minimum number of minutes until no cell has a fresh orange, or -1 if that is impossible.'
        ],
        constraints: ['1 <= m, n <= 10', 'grid[i][j] is 0, 1 or 2'],
        example: 'Input: grid = [[2,1,1],[1,1,0],[0,1,1]]\nOutput: 4',
        runner: 'matrix-to-int',
        names: { a: 'grid' },
        solutionJs: 'function solution(grid) { const r = grid.length, c = grid[0].length; let queue = []; let fresh = 0; for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) { if (grid[i][j] === 2) queue.push([i, j]); else if (grid[i][j] === 1) fresh++; } let minutes = 0; const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]; while (queue.length && fresh > 0) { const next = []; for (const [i, j] of queue) { for (const [di, dj] of dirs) { const ni = i + di, nj = j + dj; if (ni >= 0 && nj >= 0 && ni < r && nj < c && grid[ni][nj] === 1) { grid[ni][nj] = 2; fresh--; next.push([ni, nj]); } } } queue = next; minutes++; } return fresh === 0 ? (queue.length || minutes === 0 ? minutes : minutes) : -1; }',
        tests: [
            { name: 'Basic', input: '3 3\n2 1 1 1 1 0 0 1 1', expect: '4' },
            { name: 'Unreachable orange', input: '3 3\n2 1 1 0 1 1 1 0 1', expect: '-1' },
            { name: 'No fresh oranges', input: '1 2\n0 2', expect: '0' },
            { name: 'Two sources', input: '2 3\n2 1 2 1 1 1', expect: '2' }
        ]
    },
    {
        id: 'walls-and-gates',
        title: 'Walls And Gates',
        difficulty: 'Medium',
        tags: ['Graphs', 'Matrix', 'BFS'],
        description: [
            'You are given an m x n grid where -1 is a wall, 0 is a gate, and 2147483647 (INF) is an empty room. Fill each empty room, in place, with the distance to its nearest gate; leave it as INF if no gate is reachable.'
        ],
        constraints: ['1 <= m, n <= 250', 'grid[i][j] is -1, 0 or 2147483647'],
        example: 'Input: rooms = [[INF,-1,0,INF],[INF,INF,INF,-1],[INF,-1,INF,-1],[0,-1,INF,INF]]\nOutput: [[3,-1,0,1],[2,2,1,-1],[1,-1,2,-1],[0,-1,3,4]]',
        runner: 'matrix-inplace',
        names: { a: 'rooms' },
        solutionJs: 'function solution(rooms) { const r = rooms.length, c = rooms[0].length; const INF = 2147483647; let queue = []; for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) if (rooms[i][j] === 0) queue.push([i, j]); const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]; let dist = 0; while (queue.length) { const next = []; dist++; for (const [i, j] of queue) { for (const [di, dj] of dirs) { const ni = i + di, nj = j + dj; if (ni >= 0 && nj >= 0 && ni < r && nj < c && rooms[ni][nj] === INF) { rooms[ni][nj] = dist; next.push([ni, nj]); } } } queue = next; } }',
        tests: [
            { name: 'Basic', input: '4 4\n2147483647 -1 0 2147483647 2147483647 2147483647 2147483647 -1 2147483647 -1 2147483647 -1 0 -1 2147483647 2147483647', expect: '3 -1 0 1 2 2 1 -1 1 -1 2 -1 0 -1 3 4' },
            { name: 'Unreachable room', input: '1 3\n0 -1 2147483647', expect: '0 -1 2147483647' },
            { name: 'Single gate', input: '1 1\n0', expect: '0' }
        ]
    },
    {
        id: 'course-schedule',
        title: 'Course Schedule',
        difficulty: 'Medium',
        tags: ['Graphs', 'Topological Sort', 'DFS'],
        description: [
            'There are numCourses courses labeled from 0 to numCourses - 1. You are given prerequisites where prerequisites[i] = [a, b] means you must take course b before course a.',
            'Return true if you can finish all courses, or false if the prerequisites contain a cycle.'
        ],
        constraints: ['1 <= numCourses <= 2000', '0 <= prerequisites.length <= 5000', 'All prerequisite pairs are unique'],
        example: 'Input: numCourses = 2, prerequisites = [[1,0]]\nOutput: true',
        runner: 'int-pairs-to-bool',
        names: { a: 'numCourses', b: 'prerequisites' },
        solutionJs: 'function solution(numCourses, prerequisites) { const adj = Array.from({ length: numCourses }, () => []); const indeg = new Array(numCourses).fill(0); for (const [a, b] of prerequisites) { adj[b].push(a); indeg[a]++; } const queue = []; for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) queue.push(i); let seen = 0; while (queue.length) { const u = queue.shift(); seen++; for (const v of adj[u]) if (--indeg[v] === 0) queue.push(v); } return seen === numCourses; }',
        tests: [
            { name: 'Possible', input: '2 1\n1 0', expect: 'true' },
            { name: 'Cycle', input: '2 2\n1 0 0 1', expect: 'false' },
            { name: 'Chain', input: '5 4\n1 0 2 1 3 2 4 3', expect: 'true' },
            { name: 'No prerequisites', input: '1 0', expect: 'true' }
        ]
    },
    {
        id: 'course-schedule-ii',
        title: 'Course Schedule II',
        difficulty: 'Medium',
        tags: ['Graphs', 'Topological Sort', 'DFS'],
        description: [
            'There are numCourses courses labeled from 0 to numCourses - 1, with prerequisites[i] = [a, b] meaning course b must be taken before course a.',
            'Return any valid ordering of courses you can take to finish them all. If it is impossible, return an empty array.'
        ],
        constraints: ['1 <= numCourses <= 2000', '0 <= prerequisites.length <= numCourses * (numCourses - 1)'],
        example: 'Input: numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]\nOutput: [0,1,2,3] (or [0,2,1,3])',
        boilerplate: {
            c: 'int* solution(int numCourses, int prerequisites[][2], int prerequisitesSize, int* returnSize) {\n    // Write your code here\n    *returnSize = 0;\n    return NULL;\n}',
            cpp: 'class Solution {\npublic:\n    vector<int> solution(int numCourses, vector<vector<int>>& prerequisites) {\n        // Write your code here\n        return {};\n    }\n};',
            java: 'class Solution {\n    public int[] solution(int numCourses, int[][] prerequisites) {\n        // Write your code here\n        return new int[]{};\n    }\n}',
            js: 'function solution(numCourses, prerequisites) {\n    // Write your code here\n    return [];\n}',
            python: 'def solution(numCourses, prerequisites):\n    # Write your code here\n    return []'
        },
        tests: []
    },
    {
        id: 'redundant-connection',
        title: 'Redundant Connection',
        difficulty: 'Medium',
        tags: ['Graphs', 'Union Find'],
        description: [
            'You are given a graph that started as a tree with n nodes labeled 1 to n, with one additional edge added. Given the list of n edges, return the edge that can be removed so the remaining graph is a tree.',
            'If there are multiple answers, return the edge that occurs last in the input.'
        ],
        constraints: ['3 <= n <= 1000', 'edges[i] = [a, b] with 1 <= a < b <= n', 'No repeated edges'],
        example: 'Input: edges = [[1,2],[1,3],[2,3]]\nOutput: [2,3]',
        runner: 'int-pairs-to-array',
        names: { a: 'n', b: 'edges' },
        solutionJs: 'function solution(n, edges) { const parent = Array.from({ length: n + 1 }, (_, i) => i); function find(x) { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; } for (const [a, b] of edges) { const ra = find(a), rb = find(b); if (ra === rb) return [a, b]; parent[ra] = rb; } return []; }',
        tests: [
            { name: 'Triangle', input: '3 3\n1 2 1 3 2 3', expect: '2 3' },
            { name: 'Cycle in middle', input: '5 5\n1 2 2 3 3 4 1 4 1 5', expect: '1 4' },
            { name: 'Last edge closes cycle', input: '4 4\n1 2 2 3 3 4 1 4', expect: '1 4' }
        ]
    },
    {
        id: 'number-of-connected-components-in-an-undirected-graph',
        title: 'Number of Connected Components in an Undirected Graph',
        difficulty: 'Medium',
        tags: ['Graphs', 'Union Find', 'DFS'],
        description: [
            'You have a graph of n nodes labeled 0 to n - 1, and a list of undirected edges. Return the number of connected components in the graph.'
        ],
        constraints: ['1 <= n <= 2000', '0 <= edges.length <= 5000', 'No repeated edges or self-loops'],
        example: 'Input: n = 5, edges = [[0,1],[1,2],[3,4]]\nOutput: 2',
        runner: 'int-pairs-to-int',
        names: { a: 'n', b: 'edges' },
        solutionJs: 'function solution(n, edges) { const parent = Array.from({ length: n }, (_, i) => i); function find(x) { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; } let count = n; for (const [a, b] of edges) { const ra = find(a), rb = find(b); if (ra !== rb) { parent[ra] = rb; count--; } } return count; }',
        tests: [
            { name: 'Basic', input: '5 3\n0 1 1 2 3 4', expect: '2' },
            { name: 'Fully connected', input: '5 4\n0 1 1 2 2 3 3 4', expect: '1' },
            { name: 'No edges', input: '4 0', expect: '4' }
        ]
    },
    {
        id: 'graph-valid-tree',
        title: 'Graph Valid Tree',
        difficulty: 'Medium',
        tags: ['Graphs', 'Union Find', 'DFS'],
        description: [
            'You have a graph of n nodes labeled 0 to n - 1, and a list of undirected edges. Return true if the edges form a valid tree: connected and acyclic.'
        ],
        constraints: ['1 <= n <= 2000', '0 <= edges.length <= 5000', 'No repeated edges or self-loops'],
        example: 'Input: n = 5, edges = [[0,1],[0,2],[0,3],[1,4]]\nOutput: true',
        runner: 'int-pairs-to-bool',
        names: { a: 'n', b: 'edges' },
        solutionJs: 'function solution(n, edges) { if (edges.length !== n - 1) return false; const parent = Array.from({ length: n }, (_, i) => i); function find(x) { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; } for (const [a, b] of edges) { const ra = find(a), rb = find(b); if (ra === rb) return false; parent[ra] = rb; } return true; }',
        tests: [
            { name: 'Valid tree', input: '5 4\n0 1 0 2 0 3 1 4', expect: 'true' },
            { name: 'Contains cycle', input: '5 5\n0 1 1 2 2 3 1 3 1 4', expect: 'false' },
            { name: 'Disconnected', input: '4 2\n0 1 2 3', expect: 'false' },
            { name: 'Single node', input: '1 0', expect: 'true' }
        ]
    },
    {
        id: 'word-ladder',
        title: 'Word Ladder',
        difficulty: 'Hard',
        tags: ['Graphs', 'BFS', 'Hash Map'],
        description: [
            'Given beginWord, endWord and a dictionary wordList, return the number of words in the shortest transformation sequence from beginWord to endWord, where each step changes exactly one letter and every intermediate word must be in wordList.',
            'Return 0 if no such sequence exists. beginWord does not need to be in wordList; endWord does.'
        ],
        constraints: ['1 <= beginWord.length <= 10', 'All words have the same length and consist of lowercase letters', '1 <= wordList.length <= 5000'],
        example: 'Input: beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]\nOutput: 5\nExplanation: hit -> hot -> dot -> dog -> cog.',
        boilerplate: {
            c: 'int solution(char* beginWord, char* endWord, char** wordList, int wordListSize) {\n    // Write your code here\n    return 0;\n}',
            cpp: 'class Solution {\npublic:\n    int solution(string beginWord, string endWord, vector<string>& wordList) {\n        // Write your code here\n        return 0;\n    }\n};',
            java: 'class Solution {\n    public int solution(String beginWord, String endWord, List<String> wordList) {\n        // Write your code here\n        return 0;\n    }\n}',
            js: 'function solution(beginWord, endWord, wordList) {\n    // Write your code here\n    return 0;\n}',
            python: 'def solution(beginWord, endWord, wordList):\n    # Write your code here\n    return 0'
        },
        tests: []
    }
];
