// Advanced Graphs (6)
module.exports = [
    {
        id: 'reconstruct-itinerary',
        title: 'Reconstruct Itinerary',
        difficulty: 'Hard',
        tags: ['Advanced Graphs', 'DFS', 'Eulerian Path'],
        description: [
            'You are given a list of airline tickets [from, to]. Reconstruct the itinerary in order, starting from "JFK", using every ticket exactly once.',
            'If multiple valid itineraries exist, return the one with the smallest lexical order when read as a single string.'
        ],
        constraints: ['1 <= tickets.length <= 300', 'Both airports are strings of 3 uppercase letters', 'At least one valid itinerary exists'],
        example: 'Input: tickets = [["MUC","LHR"],["JFK","MUC"],["SFO","SJC"],["LHR","SFO"]]\nOutput: ["JFK","MUC","LHR","SFO","SJC"]',
        boilerplate: {
            c: 'char** solution(char*** tickets, int ticketsSize, int* returnSize) {\n    // Write your code here\n    *returnSize = 0;\n    return NULL;\n}',
            cpp: 'class Solution {\npublic:\n    vector<string> solution(vector<vector<string>>& tickets) {\n        // Write your code here\n        return {};\n    }\n};',
            java: 'class Solution {\n    public List<String> solution(List<List<String>> tickets) {\n        // Write your code here\n        return new ArrayList<>();\n    }\n}',
            js: 'function solution(tickets) {\n    // Write your code here\n    return [];\n}',
            python: 'def solution(tickets):\n    # Write your code here\n    return []'
        },
        tests: []
    },
    {
        id: 'min-cost-to-connect-all-points',
        title: 'Min Cost to Connect All Points',
        difficulty: 'Medium',
        tags: ['Advanced Graphs', 'Minimum Spanning Tree', 'Greedy'],
        description: [
            'You are given an array points where points[i] = [xi, yi] is a point on the plane. The cost of connecting two points is the Manhattan distance |xi - xj| + |yi - yj|.',
            'Return the minimum total cost to connect all points such that exactly one simple path exists between any two points.'
        ],
        constraints: ['1 <= points.length <= 1000', '-10^6 <= xi, yi <= 10^6', 'All points are distinct'],
        example: 'Input: points = [[0,0],[2,2],[3,10],[5,2],[7,0]]\nOutput: 20',
        runner: 'matrix-to-int',
        names: { a: 'points' },
        solutionJs: 'function solution(points) { const n = points.length; const dist = new Array(n).fill(Infinity); const used = new Array(n).fill(false); dist[0] = 0; let total = 0; for (let it = 0; it < n; it++) { let u = -1; for (let i = 0; i < n; i++) if (!used[i] && (u === -1 || dist[i] < dist[u])) u = i; used[u] = true; total += dist[u]; for (let v = 0; v < n; v++) if (!used[v]) { const d = Math.abs(points[u][0] - points[v][0]) + Math.abs(points[u][1] - points[v][1]); if (d < dist[v]) dist[v] = d; } } return total; }',
        tests: [
            { name: 'Basic', input: '5 2\n0 0 2 2 3 10 5 2 7 0', expect: '20' },
            { name: 'Single point', input: '1 2\n0 0', expect: '0' },
            { name: 'Two points', input: '2 2\n1 1 3 4', expect: '5' },
            { name: 'Collinear', input: '3 2\n0 0 0 5 0 9', expect: '9' }
        ]
    },
    {
        id: 'network-delay-time',
        title: 'Network Delay Time',
        difficulty: 'Medium',
        tags: ['Advanced Graphs', "Dijkstra's", 'Shortest Path'],
        description: [
            'You are given a network of n nodes labeled 1 to n, and travel times as directed edges times[i] = [u, v, w] (a signal takes w to travel from u to v).',
            'A signal is sent from node k. Return the minimum time for all n nodes to receive it, or -1 if that is impossible.'
        ],
        constraints: ['1 <= k <= n <= 100', '1 <= times.length <= 6000', '1 <= w <= 100'],
        example: 'Input: times = [[2,1,1],[2,3,1],[3,4,1]], n = 4, k = 2\nOutput: 2',
        boilerplate: {
            c: 'int solution(int times[][3], int timesSize, int n, int k) {\n    // Write your code here\n    return -1;\n}',
            cpp: 'class Solution {\npublic:\n    int solution(vector<vector<int>>& times, int n, int k) {\n        // Write your code here\n        return -1;\n    }\n};',
            java: 'class Solution {\n    public int solution(int[][] times, int n, int k) {\n        // Write your code here\n        return -1;\n    }\n}',
            js: 'function solution(times, n, k) {\n    // Write your code here\n    return -1;\n}',
            python: 'def solution(times, n, k):\n    # Write your code here\n    return -1'
        },
        tests: []
    },
    {
        id: 'swim-in-rising-water',
        title: 'Swim in Rising Water',
        difficulty: 'Hard',
        tags: ['Advanced Graphs', 'Binary Search', 'DFS'],
        description: [
            'You are given an n x n grid where grid[i][j] is the elevation at that cell. Rain starts falling and at time t the water depth is t: you can swim between 4-directionally adjacent cells only if both elevations are at most t.',
            'Starting at (0, 0), return the least time until you can reach the bottom-right cell (n-1, n-1).'
        ],
        constraints: ['1 <= n <= 50', '0 <= grid[i][j] < n^2, all values distinct'],
        example: 'Input: grid = [[0,2],[1,3]]\nOutput: 3',
        runner: 'matrix-to-int',
        names: { a: 'grid' },
        solutionJs: 'function solution(grid) { const n = grid.length, m = grid[0].length; const seen = Array.from({ length: n }, () => new Array(m).fill(false)); const pq = [[grid[0][0], 0, 0]]; const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]; while (pq.length) { pq.sort((a, b) => a[0] - b[0]); const [t, i, j] = pq.shift(); if (seen[i][j]) continue; seen[i][j] = true; if (i === n - 1 && j === m - 1) return t; for (const [di, dj] of dirs) { const ni = i + di, nj = j + dj; if (ni >= 0 && nj >= 0 && ni < n && nj < m && !seen[ni][nj]) pq.push([Math.max(t, grid[ni][nj]), ni, nj]); } } return -1; }',
        tests: [
            { name: 'Basic', input: '2 2\n0 2 1 3', expect: '3' },
            { name: 'Spiral', input: '5 5\n0 1 2 3 4 24 23 22 21 5 12 13 14 15 16 11 17 18 19 20 10 9 8 7 6', expect: '16' },
            { name: 'Single cell', input: '1 1\n0', expect: '0' }
        ]
    },
    {
        id: 'alien-dictionary',
        title: 'Alien Dictionary',
        difficulty: 'Hard',
        tags: ['Advanced Graphs', 'Topological Sort', 'DFS'],
        description: [
            'There is a foreign language that uses the English alphabet with an unknown letter order. You are given a list of words sorted lexicographically by the rules of this language.',
            'Return a string of the unique letters sorted by the alien order. Return "" if the ordering is invalid; if multiple valid orderings exist, return any of them.'
        ],
        constraints: ['1 <= words.length <= 100', '1 <= words[i].length <= 100', 'words[i] consists of lowercase English letters'],
        example: 'Input: words = ["wrt","wrf","er","ett","rftt"]\nOutput: "wertf"',
        boilerplate: {
            c: 'char* solution(char** words, int wordsSize) {\n    // Write your code here\n    return "";\n}',
            cpp: 'class Solution {\npublic:\n    string solution(vector<string>& words) {\n        // Write your code here\n        return "";\n    }\n};',
            java: 'class Solution {\n    public String solution(String[] words) {\n        // Write your code here\n        return "";\n    }\n}',
            js: "function solution(words) {\n    // Write your code here\n    return '';\n}",
            python: "def solution(words):\n    # Write your code here\n    return ''"
        },
        tests: []
    },
    {
        id: 'cheapest-flights-within-k-stops',
        title: 'Cheapest Flights Within K Stops',
        difficulty: 'Medium',
        tags: ['Advanced Graphs', 'Dynamic Programming', 'BFS'],
        description: [
            'There are n cities connected by flights, where flights[i] = [from, to, price]. Given src, dst and k, return the cheapest price to travel from src to dst using at most k stops, or -1 if no such route exists.'
        ],
        constraints: ['1 <= n <= 100', '0 <= flights.length <= n * (n - 1) / 2', '0 <= k < n', '1 <= price <= 10^4'],
        example: 'Input: n = 4, flights = [[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]], src = 0, dst = 3, k = 1\nOutput: 700',
        boilerplate: {
            c: 'int solution(int n, int flights[][3], int flightsSize, int src, int dst, int k) {\n    // Write your code here\n    return -1;\n}',
            cpp: 'class Solution {\npublic:\n    int solution(int n, vector<vector<int>>& flights, int src, int dst, int k) {\n        // Write your code here\n        return -1;\n    }\n};',
            java: 'class Solution {\n    public int solution(int n, int[][] flights, int src, int dst, int k) {\n        // Write your code here\n        return -1;\n    }\n}',
            js: 'function solution(n, flights, src, dst, k) {\n    // Write your code here\n    return -1;\n}',
            python: 'def solution(n, flights, src, dst, k):\n    # Write your code here\n    return -1'
        },
        tests: []
    }
];
