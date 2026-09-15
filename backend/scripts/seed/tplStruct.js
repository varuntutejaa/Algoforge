// Editor boilerplate for the linked-list / tree shapes.
//
// Signatures here must match exactly what services/runnersStruct.js calls,
// per language: C takes raw pointers, C++/Java wrap in a Solution class, JS
// and Python use bare functions. The node types are supplied by the harness,
// so the starter code references them without defining them.

const NOTE = {
    c: '// struct ListNode { int val; struct ListNode *next; }; is provided.',
    cTree: '// struct TreeNode { int val; struct TreeNode *left, *right; }; is provided.',
    cpp: '// struct ListNode { int val; ListNode *next; }; is provided.',
    cppTree: '// struct TreeNode { int val; TreeNode *left, *right; }; is provided.',
    java: '// class ListNode { int val; ListNode next; } is provided.',
    javaTree: '// class TreeNode { int val; TreeNode left, right; } is provided.',
    js: '// ListNode(val, next) is provided.',
    jsTree: '// TreeNode(val, left, right) is provided.',
    py: '# class ListNode: val, next  — provided.',
    pyTree: '# class TreeNode: val, left, right  — provided.'
};

const tplStruct = {
    'list-to-list': () => ({
        c: `${NOTE.c}\nstruct ListNode* solution(struct ListNode* head) {\n    // Write your code here\n    return head;\n}`,
        cpp: `${NOTE.cpp}\nclass Solution {\npublic:\n    ListNode* solution(ListNode* head) {\n        // Write your code here\n        return head;\n    }\n};`,
        java: `${NOTE.java}\nclass Solution {\n    public ListNode solution(ListNode head) {\n        // Write your code here\n        return head;\n    }\n}`,
        js: `${NOTE.js}\nfunction solution(head) {\n  // Write your code here\n  return head;\n}`,
        python: `${NOTE.py}\ndef solution(head):\n    # Write your code here\n    return head`
    }),

    'list-k-to-list': () => ({
        c: `${NOTE.c}\nstruct ListNode* solution(struct ListNode* head, int k) {\n    // Write your code here\n    return head;\n}`,
        cpp: `${NOTE.cpp}\nclass Solution {\npublic:\n    ListNode* solution(ListNode* head, int k) {\n        // Write your code here\n        return head;\n    }\n};`,
        java: `${NOTE.java}\nclass Solution {\n    public ListNode solution(ListNode head, int k) {\n        // Write your code here\n        return head;\n    }\n}`,
        js: `${NOTE.js}\nfunction solution(head, k) {\n  // Write your code here\n  return head;\n}`,
        python: `${NOTE.py}\ndef solution(head, k):\n    # Write your code here\n    return head`
    }),

    'two-lists-to-list': () => ({
        c: `${NOTE.c}\nstruct ListNode* solution(struct ListNode* a, struct ListNode* b) {\n    // Write your code here\n    return a;\n}`,
        cpp: `${NOTE.cpp}\nclass Solution {\npublic:\n    ListNode* solution(ListNode* a, ListNode* b) {\n        // Write your code here\n        return a;\n    }\n};`,
        java: `${NOTE.java}\nclass Solution {\n    public ListNode solution(ListNode a, ListNode b) {\n        // Write your code here\n        return a;\n    }\n}`,
        js: `${NOTE.js}\nfunction solution(a, b) {\n  // Write your code here\n  return a;\n}`,
        python: `${NOTE.py}\ndef solution(a, b):\n    # Write your code here\n    return a`
    }),

    'lists-to-list': () => ({
        c: `${NOTE.c}\nstruct ListNode* solution(struct ListNode** lists, int listsSize) {\n    // Write your code here\n    return NULL;\n}`,
        cpp: `${NOTE.cpp}\nclass Solution {\npublic:\n    ListNode* solution(vector<ListNode*>& lists) {\n        // Write your code here\n        return nullptr;\n    }\n};`,
        java: `${NOTE.java}\nclass Solution {\n    public ListNode solution(ListNode[] lists) {\n        // Write your code here\n        return null;\n    }\n}`,
        js: `${NOTE.js}\nfunction solution(lists) {\n  // Write your code here\n  return null;\n}`,
        python: `${NOTE.py}\ndef solution(lists):\n    # Write your code here\n    return None`
    }),

    'list-cycle-to-bool': () => ({
        c: `${NOTE.c}\nbool solution(struct ListNode* head) {\n    // Write your code here\n    return false;\n}`,
        cpp: `${NOTE.cpp}\nclass Solution {\npublic:\n    bool solution(ListNode* head) {\n        // Write your code here\n        return false;\n    }\n};`,
        java: `${NOTE.java}\nclass Solution {\n    public boolean solution(ListNode head) {\n        // Write your code here\n        return false;\n    }\n}`,
        js: `${NOTE.js}\nfunction solution(head) {\n  // Write your code here\n  return false;\n}`,
        python: `${NOTE.py}\ndef solution(head):\n    # Write your code here\n    return False`
    }),

    'tree-to-int': () => ({
        c: `${NOTE.cTree}\nint solution(struct TreeNode* root) {\n    // Write your code here\n    return 0;\n}`,
        cpp: `${NOTE.cppTree}\nclass Solution {\npublic:\n    int solution(TreeNode* root) {\n        // Write your code here\n        return 0;\n    }\n};`,
        java: `${NOTE.javaTree}\nclass Solution {\n    public int solution(TreeNode root) {\n        // Write your code here\n        return 0;\n    }\n}`,
        js: `${NOTE.jsTree}\nfunction solution(root) {\n  // Write your code here\n  return 0;\n}`,
        python: `${NOTE.pyTree}\ndef solution(root):\n    # Write your code here\n    return 0`
    }),

    'tree-to-bool': () => ({
        c: `${NOTE.cTree}\nbool solution(struct TreeNode* root) {\n    // Write your code here\n    return false;\n}`,
        cpp: `${NOTE.cppTree}\nclass Solution {\npublic:\n    bool solution(TreeNode* root) {\n        // Write your code here\n        return false;\n    }\n};`,
        java: `${NOTE.javaTree}\nclass Solution {\n    public boolean solution(TreeNode root) {\n        // Write your code here\n        return false;\n    }\n}`,
        js: `${NOTE.jsTree}\nfunction solution(root) {\n  // Write your code here\n  return false;\n}`,
        python: `${NOTE.pyTree}\ndef solution(root):\n    # Write your code here\n    return False`
    }),

    'tree-to-tree': () => ({
        c: `${NOTE.cTree}\nstruct TreeNode* solution(struct TreeNode* root) {\n    // Write your code here\n    return root;\n}`,
        cpp: `${NOTE.cppTree}\nclass Solution {\npublic:\n    TreeNode* solution(TreeNode* root) {\n        // Write your code here\n        return root;\n    }\n};`,
        java: `${NOTE.javaTree}\nclass Solution {\n    public TreeNode solution(TreeNode root) {\n        // Write your code here\n        return root;\n    }\n}`,
        js: `${NOTE.jsTree}\nfunction solution(root) {\n  // Write your code here\n  return root;\n}`,
        python: `${NOTE.pyTree}\ndef solution(root):\n    # Write your code here\n    return root`
    }),

    'two-trees-to-bool': () => ({
        c: `${NOTE.cTree}\nbool solution(struct TreeNode* p, struct TreeNode* q) {\n    // Write your code here\n    return false;\n}`,
        cpp: `${NOTE.cppTree}\nclass Solution {\npublic:\n    bool solution(TreeNode* p, TreeNode* q) {\n        // Write your code here\n        return false;\n    }\n};`,
        java: `${NOTE.javaTree}\nclass Solution {\n    public boolean solution(TreeNode p, TreeNode q) {\n        // Write your code here\n        return false;\n    }\n}`,
        js: `${NOTE.jsTree}\nfunction solution(p, q) {\n  // Write your code here\n  return false;\n}`,
        python: `${NOTE.pyTree}\ndef solution(p, q):\n    # Write your code here\n    return False`
    }),

    'tree-k-to-int': () => ({
        c: `${NOTE.cTree}\nint solution(struct TreeNode* root, int k) {\n    // Write your code here\n    return 0;\n}`,
        cpp: `${NOTE.cppTree}\nclass Solution {\npublic:\n    int solution(TreeNode* root, int k) {\n        // Write your code here\n        return 0;\n    }\n};`,
        java: `${NOTE.javaTree}\nclass Solution {\n    public int solution(TreeNode root, int k) {\n        // Write your code here\n        return 0;\n    }\n}`,
        js: `${NOTE.jsTree}\nfunction solution(root, k) {\n  // Write your code here\n  return 0;\n}`,
        python: `${NOTE.pyTree}\ndef solution(root, k):\n    # Write your code here\n    return 0`
    }),

    'tree-two-vals-to-int': () => ({
        c: `${NOTE.cTree}\nint solution(struct TreeNode* root, int p, int q) {\n    // Write your code here\n    return 0;\n}`,
        cpp: `${NOTE.cppTree}\nclass Solution {\npublic:\n    int solution(TreeNode* root, int p, int q) {\n        // Write your code here\n        return 0;\n    }\n};`,
        java: `${NOTE.javaTree}\nclass Solution {\n    public int solution(TreeNode root, int p, int q) {\n        // Write your code here\n        return 0;\n    }\n}`,
        js: `${NOTE.jsTree}\nfunction solution(root, p, q) {\n  // Write your code here\n  return 0;\n}`,
        python: `${NOTE.pyTree}\ndef solution(root, p, q):\n    # Write your code here\n    return 0`
    }),

    'tree-to-array': () => ({
        c: `${NOTE.cTree}\nint* solution(struct TreeNode* root, int* returnSize) {\n    // Write your code here\n    *returnSize = 0;\n    return NULL;\n}`,
        cpp: `${NOTE.cppTree}\nclass Solution {\npublic:\n    vector<int> solution(TreeNode* root) {\n        // Write your code here\n        return {};\n    }\n};`,
        java: `${NOTE.javaTree}\nclass Solution {\n    public List<Integer> solution(TreeNode root) {\n        // Write your code here\n        return new ArrayList<>();\n    }\n}`,
        js: `${NOTE.jsTree}\nfunction solution(root) {\n  // Write your code here\n  return [];\n}`,
        python: `${NOTE.pyTree}\ndef solution(root):\n    # Write your code here\n    return []`
    }),

    'tree-to-levels': () => ({
        c: `${NOTE.cTree}\nint** solution(struct TreeNode* root, int* returnSize, int** returnColumnSizes) {\n    // Write your code here\n    *returnSize = 0;\n    return NULL;\n}`,
        cpp: `${NOTE.cppTree}\nclass Solution {\npublic:\n    vector<vector<int>> solution(TreeNode* root) {\n        // Write your code here\n        return {};\n    }\n};`,
        java: `${NOTE.javaTree}\nclass Solution {\n    public List<List<Integer>> solution(TreeNode root) {\n        // Write your code here\n        return new ArrayList<>();\n    }\n}`,
        js: `${NOTE.jsTree}\nfunction solution(root) {\n  // Write your code here\n  return [];\n}`,
        python: `${NOTE.pyTree}\ndef solution(root):\n    # Write your code here\n    return []`
    }),

    'two-arrays-to-tree': () => ({
        c: `${NOTE.cTree}\nstruct TreeNode* solution(int* preorder, int preorderSize, int* inorder, int inorderSize) {\n    // Write your code here\n    return NULL;\n}`,
        cpp: `${NOTE.cppTree}\nclass Solution {\npublic:\n    TreeNode* solution(vector<int>& preorder, vector<int>& inorder) {\n        // Write your code here\n        return nullptr;\n    }\n};`,
        java: `${NOTE.javaTree}\nclass Solution {\n    public TreeNode solution(int[] preorder, int[] inorder) {\n        // Write your code here\n        return null;\n    }\n}`,
        js: `${NOTE.jsTree}\nfunction solution(preorder, inorder) {\n  // Write your code here\n  return null;\n}`,
        python: `${NOTE.pyTree}\ndef solution(preorder, inorder):\n    # Write your code here\n    return None`
    })
};

module.exports = { tplStruct };
