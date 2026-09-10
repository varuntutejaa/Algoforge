// Trees (15). Seeded content-only for now — tree harness support lands later.

const TN = {
    c: '/**\n * struct TreeNode {\n *     int val;\n *     struct TreeNode *left;\n *     struct TreeNode *right;\n * };\n */\n',
    cpp: '/**\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n * };\n */\n',
    java: '/**\n * class TreeNode {\n *     int val;\n *     TreeNode left;\n *     TreeNode right;\n *     TreeNode(int val) { this.val = val; }\n * }\n */\n',
    js: '/**\n * function TreeNode(val, left, right) {\n *     this.val = val === undefined ? 0 : val;\n *     this.left = left === undefined ? null : left;\n *     this.right = right === undefined ? null : right;\n * }\n */\n',
    python: '# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\n'
};

function tn(sigs) {
    return {
        c: TN.c + sigs.c,
        cpp: TN.cpp + 'class Solution {\npublic:\n    ' + sigs.cpp + '\n};',
        java: TN.java + 'class Solution {\n    ' + sigs.java + '\n}',
        js: TN.js + sigs.js,
        python: TN.python + sigs.python
    };
}

const one = (ret, retC, retCpp, retJava, retJs, retPy, params = 'root') => ({
    c: `${retC} solution(struct TreeNode* ${params}) {\n    // Write your code here\n    return ${ret};\n}`,
    cpp: `${retCpp} solution(TreeNode* ${params}) {\n        // Write your code here\n        return ${retJs === 'null' ? 'nullptr' : ret};\n    }`,
    java: `public ${retJava} solution(TreeNode ${params}) {\n        // Write your code here\n        return ${retJs};\n    }`,
    js: `function solution(${params}) {\n    // Write your code here\n    return ${retJs};\n}`,
    python: `def solution(${params}):\n    # Write your code here\n    return ${retPy}`
});

module.exports = [
    {
        id: 'invert-binary-tree',
        title: 'Invert Binary Tree',
        difficulty: 'Easy',
        tags: ['Trees', 'Recursion', 'BFS'],
        description: ['Given the root of a binary tree, invert the tree (swap every left and right child) and return its root.'],
        constraints: ['0 <= number of nodes <= 100', '-100 <= Node.val <= 100'],
        example: 'Input: root = [4,2,7,1,3,6,9]\nOutput: [4,7,2,9,6,3,1]',
        boilerplate: tn(one('NULL', 'struct TreeNode*', 'TreeNode*', 'TreeNode', 'null', 'None')),
        tests: []
    },
    {
        id: 'maximum-depth-of-binary-tree',
        title: 'Maximum Depth of Binary Tree',
        difficulty: 'Easy',
        tags: ['Trees', 'Recursion', 'BFS'],
        description: ['Given the root of a binary tree, return its maximum depth — the number of nodes along the longest path from the root down to the farthest leaf.'],
        constraints: ['0 <= number of nodes <= 10^4', '-100 <= Node.val <= 100'],
        example: 'Input: root = [3,9,20,null,null,15,7]\nOutput: 3',
        boilerplate: tn(one('0', 'int', 'int', 'int', '0', '0')),
        tests: []
    },
    {
        id: 'diameter-of-binary-tree',
        title: 'Diameter of Binary Tree',
        difficulty: 'Easy',
        tags: ['Trees', 'Recursion'],
        description: [
            'Given the root of a binary tree, return the length of the diameter of the tree — the number of edges on the longest path between any two nodes. The path may or may not pass through the root.'
        ],
        constraints: ['1 <= number of nodes <= 10^4', '-100 <= Node.val <= 100'],
        example: 'Input: root = [1,2,3,4,5]\nOutput: 3\nExplanation: The path [4,2,1,3] (or [5,2,1,3]) has 3 edges.',
        boilerplate: tn(one('0', 'int', 'int', 'int', '0', '0')),
        tests: []
    },
    {
        id: 'balanced-binary-tree',
        title: 'Balanced Binary Tree',
        difficulty: 'Easy',
        tags: ['Trees', 'Recursion'],
        description: ['Given a binary tree, determine if it is height-balanced: for every node, the heights of its two subtrees differ by at most one.'],
        constraints: ['0 <= number of nodes <= 5000', '-10^4 <= Node.val <= 10^4'],
        example: 'Input: root = [3,9,20,null,null,15,7]\nOutput: true',
        boilerplate: tn(one('false', 'bool', 'bool', 'boolean', 'false', 'False')),
        tests: []
    },
    {
        id: 'same-tree',
        title: 'Same Tree',
        difficulty: 'Easy',
        tags: ['Trees', 'Recursion', 'BFS'],
        description: ['Given the roots of two binary trees p and q, return true if the trees are structurally identical and the corresponding nodes have the same values.'],
        constraints: ['0 <= number of nodes in each tree <= 100', '-10^4 <= Node.val <= 10^4'],
        example: 'Input: p = [1,2,3], q = [1,2,3]\nOutput: true',
        boilerplate: tn({
            c: 'bool solution(struct TreeNode* p, struct TreeNode* q) {\n    // Write your code here\n    return false;\n}',
            cpp: 'bool solution(TreeNode* p, TreeNode* q) {\n        // Write your code here\n        return false;\n    }',
            java: 'public boolean solution(TreeNode p, TreeNode q) {\n        // Write your code here\n        return false;\n    }',
            js: 'function solution(p, q) {\n    // Write your code here\n    return false;\n}',
            python: 'def solution(p, q):\n    # Write your code here\n    return False'
        }),
        tests: []
    },
    {
        id: 'subtree-of-another-tree',
        title: 'Subtree of Another Tree',
        difficulty: 'Easy',
        tags: ['Trees', 'Recursion', 'Hash Map'],
        description: ['Given the roots of two binary trees root and subRoot, return true if there is a subtree of root that is identical to subRoot.'],
        constraints: ['1 <= nodes in root <= 2000', '1 <= nodes in subRoot <= 1000', '-10^4 <= Node.val <= 10^4'],
        example: 'Input: root = [3,4,5,1,2], subRoot = [4,1,2]\nOutput: true',
        boilerplate: tn({
            c: 'bool solution(struct TreeNode* root, struct TreeNode* subRoot) {\n    // Write your code here\n    return false;\n}',
            cpp: 'bool solution(TreeNode* root, TreeNode* subRoot) {\n        // Write your code here\n        return false;\n    }',
            java: 'public boolean solution(TreeNode root, TreeNode subRoot) {\n        // Write your code here\n        return false;\n    }',
            js: 'function solution(root, subRoot) {\n    // Write your code here\n    return false;\n}',
            python: 'def solution(root, subRoot):\n    # Write your code here\n    return False'
        }),
        tests: []
    },
    {
        id: 'lowest-common-ancestor-of-a-bst',
        title: 'Lowest Common Ancestor of a BST',
        difficulty: 'Medium',
        tags: ['Trees', 'BST', 'Recursion'],
        description: [
            'Given a binary search tree, find the lowest common ancestor of two given nodes p and q — the lowest node that has both p and q as descendants (a node may be a descendant of itself).'
        ],
        constraints: ['2 <= number of nodes <= 10^5', 'All Node.val are unique', 'p != q, and both exist in the tree'],
        example: 'Input: root = [6,2,8,0,4,7,9], p = 2, q = 8\nOutput: 6',
        boilerplate: tn({
            c: 'struct TreeNode* solution(struct TreeNode* root, struct TreeNode* p, struct TreeNode* q) {\n    // Write your code here\n    return NULL;\n}',
            cpp: 'TreeNode* solution(TreeNode* root, TreeNode* p, TreeNode* q) {\n        // Write your code here\n        return nullptr;\n    }',
            java: 'public TreeNode solution(TreeNode root, TreeNode p, TreeNode q) {\n        // Write your code here\n        return null;\n    }',
            js: 'function solution(root, p, q) {\n    // Write your code here\n    return null;\n}',
            python: 'def solution(root, p, q):\n    # Write your code here\n    return None'
        }),
        tests: []
    },
    {
        id: 'binary-tree-level-order-traversal',
        title: 'Binary Tree Level Order Traversal',
        difficulty: 'Medium',
        tags: ['Trees', 'BFS'],
        description: ["Given the root of a binary tree, return the level order traversal of its nodes' values — level by level, from left to right."],
        constraints: ['0 <= number of nodes <= 2000', '-1000 <= Node.val <= 1000'],
        example: 'Input: root = [3,9,20,null,null,15,7]\nOutput: [[3],[9,20],[15,7]]',
        boilerplate: tn({
            c: 'int** solution(struct TreeNode* root, int* returnSize, int** returnColumnSizes) {\n    // Write your code here\n    *returnSize = 0;\n    return NULL;\n}',
            cpp: 'vector<vector<int>> solution(TreeNode* root) {\n        // Write your code here\n        return {};\n    }',
            java: 'public List<List<Integer>> solution(TreeNode root) {\n        // Write your code here\n        return new ArrayList<>();\n    }',
            js: 'function solution(root) {\n    // Write your code here\n    return [];\n}',
            python: 'def solution(root):\n    # Write your code here\n    return []'
        }),
        tests: []
    },
    {
        id: 'binary-tree-right-side-view',
        title: 'Binary Tree Right Side View',
        difficulty: 'Medium',
        tags: ['Trees', 'BFS', 'DFS'],
        description: ['Given the root of a binary tree, imagine standing on its right side. Return the values of the nodes you can see, ordered from top to bottom.'],
        constraints: ['0 <= number of nodes <= 100', '-100 <= Node.val <= 100'],
        example: 'Input: root = [1,2,3,null,5,null,4]\nOutput: [1,3,4]',
        boilerplate: tn({
            c: 'int* solution(struct TreeNode* root, int* returnSize) {\n    // Write your code here\n    *returnSize = 0;\n    return NULL;\n}',
            cpp: 'vector<int> solution(TreeNode* root) {\n        // Write your code here\n        return {};\n    }',
            java: 'public List<Integer> solution(TreeNode root) {\n        // Write your code here\n        return new ArrayList<>();\n    }',
            js: 'function solution(root) {\n    // Write your code here\n    return [];\n}',
            python: 'def solution(root):\n    # Write your code here\n    return []'
        }),
        tests: []
    },
    {
        id: 'count-good-nodes-in-binary-tree',
        title: 'Count Good Nodes in Binary Tree',
        difficulty: 'Medium',
        tags: ['Trees', 'DFS', 'BFS'],
        description: [
            'Given the root of a binary tree, a node X is good if the path from the root to X contains no node with a value greater than X. Return the number of good nodes in the tree.'
        ],
        constraints: ['1 <= number of nodes <= 10^5', '-10^4 <= Node.val <= 10^4'],
        example: 'Input: root = [3,1,4,3,null,1,5]\nOutput: 4',
        boilerplate: tn(one('0', 'int', 'int', 'int', '0', '0')),
        tests: []
    },
    {
        id: 'validate-binary-search-tree',
        title: 'Validate Binary Search Tree',
        difficulty: 'Medium',
        tags: ['Trees', 'BST', 'DFS'],
        description: [
            'Given the root of a binary tree, determine if it is a valid binary search tree: every value in the left subtree is strictly less than the node, every value in the right subtree is strictly greater, and both subtrees are themselves BSTs.'
        ],
        constraints: ['1 <= number of nodes <= 10^4', '-2^31 <= Node.val <= 2^31 - 1'],
        example: 'Input: root = [5,1,4,null,null,3,6]\nOutput: false\nExplanation: The value 3 sits in the right subtree of 5.',
        boilerplate: tn(one('false', 'bool', 'bool', 'boolean', 'false', 'False')),
        tests: []
    },
    {
        id: 'kth-smallest-element-in-a-bst',
        title: 'Kth Smallest Element in a BST',
        difficulty: 'Medium',
        tags: ['Trees', 'BST', 'DFS'],
        description: ['Given the root of a binary search tree and an integer k, return the k-th smallest value (1-indexed) of all the values in the tree.'],
        constraints: ['1 <= k <= number of nodes <= 10^4', '0 <= Node.val <= 10^4'],
        example: 'Input: root = [3,1,4,null,2], k = 1\nOutput: 1',
        boilerplate: tn({
            c: 'int solution(struct TreeNode* root, int k) {\n    // Write your code here\n    return 0;\n}',
            cpp: 'int solution(TreeNode* root, int k) {\n        // Write your code here\n        return 0;\n    }',
            java: 'public int solution(TreeNode root, int k) {\n        // Write your code here\n        return 0;\n    }',
            js: 'function solution(root, k) {\n    // Write your code here\n    return 0;\n}',
            python: 'def solution(root, k):\n    # Write your code here\n    return 0'
        }),
        tests: []
    },
    {
        id: 'construct-binary-tree-from-preorder-and-inorder-traversal',
        title: 'Construct Binary Tree from Preorder and Inorder Traversal',
        difficulty: 'Medium',
        tags: ['Trees', 'Arrays', 'Divide and Conquer'],
        description: ['Given two integer arrays preorder and inorder representing the preorder and inorder traversal of the same binary tree, construct and return the tree.'],
        constraints: ['1 <= preorder.length <= 3000', 'inorder.length == preorder.length', 'All values are unique'],
        example: 'Input: preorder = [3,9,20,15,7], inorder = [9,3,15,20,7]\nOutput: [3,9,20,null,null,15,7]',
        boilerplate: tn({
            c: 'struct TreeNode* solution(int* preorder, int preorderSize, int* inorder, int inorderSize) {\n    // Write your code here\n    return NULL;\n}',
            cpp: 'TreeNode* solution(vector<int>& preorder, vector<int>& inorder) {\n        // Write your code here\n        return nullptr;\n    }',
            java: 'public TreeNode solution(int[] preorder, int[] inorder) {\n        // Write your code here\n        return null;\n    }',
            js: 'function solution(preorder, inorder) {\n    // Write your code here\n    return null;\n}',
            python: 'def solution(preorder, inorder):\n    # Write your code here\n    return None'
        }),
        tests: []
    },
    {
        id: 'binary-tree-maximum-path-sum',
        title: 'Binary Tree Maximum Path Sum',
        difficulty: 'Hard',
        tags: ['Trees', 'DFS', 'Dynamic Programming'],
        description: [
            'A path in a binary tree is any sequence of nodes where each adjacent pair is connected by an edge; a node may appear at most once, and the path does not need to pass through the root.',
            'Given the root of a binary tree, return the maximum sum of values over any non-empty path.'
        ],
        constraints: ['1 <= number of nodes <= 3 * 10^4', '-1000 <= Node.val <= 1000'],
        example: 'Input: root = [-10,9,20,null,null,15,7]\nOutput: 42\nExplanation: The path 15 -> 20 -> 7 sums to 42.',
        boilerplate: tn(one('0', 'int', 'int', 'int', '0', '0')),
        tests: []
    },
    {
        id: 'serialize-and-deserialize-binary-tree',
        title: 'Serialize and Deserialize Binary Tree',
        difficulty: 'Hard',
        tags: ['Trees', 'BFS', 'DFS', 'Design'],
        description: [
            'Design an algorithm to serialize a binary tree to a string and deserialize that string back to the original tree structure.',
            'There is no restriction on how the serialization works — only that serialize followed by deserialize reconstructs the original tree.'
        ],
        constraints: ['0 <= number of nodes <= 10^4', '-1000 <= Node.val <= 1000'],
        example: 'Input: root = [1,2,3,null,null,4,5]\nserialize -> "1,2,3,null,null,4,5"\ndeserialize -> the original tree',
        boilerplate: {
            c: '/**\n * struct TreeNode {\n *     int val;\n *     struct TreeNode *left;\n *     struct TreeNode *right;\n * };\n */\nchar* serialize(struct TreeNode* root) {\n    // Write your code here\n    return "";\n}\n\nstruct TreeNode* deserialize(char* data) {\n    // Write your code here\n    return NULL;\n}',
            cpp: '/**\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n * };\n */\nclass Codec {\npublic:\n    string serialize(TreeNode* root) {\n        // Write your code here\n        return "";\n    }\n\n    TreeNode* deserialize(string data) {\n        // Write your code here\n        return nullptr;\n    }\n};',
            java: '/**\n * class TreeNode {\n *     int val;\n *     TreeNode left;\n *     TreeNode right;\n *     TreeNode(int val) { this.val = val; }\n * }\n */\nclass Codec {\n    public String serialize(TreeNode root) {\n        // Write your code here\n        return "";\n    }\n\n    public TreeNode deserialize(String data) {\n        // Write your code here\n        return null;\n    }\n}',
            js: '/**\n * function TreeNode(val, left, right) { ... }\n */\nfunction serialize(root) {\n    // Write your code here\n    return \'\';\n}\n\nfunction deserialize(data) {\n    // Write your code here\n    return null;\n}',
            python: "# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None): ...\ndef serialize(root):\n    # Write your code here\n    return ''\n\ndef deserialize(data):\n    # Write your code here\n    return None"
        },
        tests: []
    }
];
