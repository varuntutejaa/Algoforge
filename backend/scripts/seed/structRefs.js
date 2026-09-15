// Cross-language references for the linked-list / tree shapes.
//
// One problem per shape, implemented in every language, so verifyHarness can
// prove each shape's five harnesses agree byte-for-byte on the same inputs.
// These exercise the parts most likely to break: manual node construction and
// level-order serialization in C, and the null-trimming rule shared by all.

module.exports = {
    // ---- linked list -------------------------------------------------------
    'reverse-linked-list': { // list-to-list
        python: `def solution(head):
    prev = None
    while head:
        nxt = head.next
        head.next = prev
        prev = head
        head = nxt
    return prev`,
        cpp: `class Solution {
public:
    ListNode* solution(ListNode* head) {
        ListNode *prev = nullptr;
        while (head) { ListNode *n = head->next; head->next = prev; prev = head; head = n; }
        return prev;
    }
};`,
        java: `class Solution {
    public ListNode solution(ListNode head) {
        ListNode prev = null;
        while (head != null) { ListNode n = head.next; head.next = prev; prev = head; head = n; }
        return prev;
    }
}`,
        c: `struct ListNode* solution(struct ListNode* head) {
    struct ListNode *prev = NULL;
    while (head) { struct ListNode *n = head->next; head->next = prev; prev = head; head = n; }
    return prev;
}`
    },

    'merge-two-sorted-lists': { // two-lists-to-list
        python: `def solution(a, b):
    dummy = ListNode(0)
    tail = dummy
    while a and b:
        if a.val <= b.val:
            tail.next = a; a = a.next
        else:
            tail.next = b; b = b.next
        tail = tail.next
    tail.next = a if a else b
    return dummy.next`,
        cpp: `class Solution {
public:
    ListNode* solution(ListNode* a, ListNode* b) {
        ListNode dummy(0); ListNode *tail = &dummy;
        while (a && b) {
            if (a->val <= b->val) { tail->next = a; a = a->next; }
            else { tail->next = b; b = b->next; }
            tail = tail->next;
        }
        tail->next = a ? a : b;
        return dummy.next;
    }
};`,
        java: `class Solution {
    public ListNode solution(ListNode a, ListNode b) {
        ListNode dummy = new ListNode(0), tail = dummy;
        while (a != null && b != null) {
            if (a.val <= b.val) { tail.next = a; a = a.next; }
            else { tail.next = b; b = b.next; }
            tail = tail.next;
        }
        tail.next = a != null ? a : b;
        return dummy.next;
    }
}`,
        c: `struct ListNode* solution(struct ListNode* a, struct ListNode* b) {
    struct ListNode dummy; dummy.next = NULL;
    struct ListNode *tail = &dummy;
    while (a && b) {
        if (a->val <= b->val) { tail->next = a; a = a->next; }
        else { tail->next = b; b = b->next; }
        tail = tail->next;
    }
    tail->next = a ? a : b;
    return dummy.next;
}`
    },

    'remove-nth-node-from-end-of-list': { // list-k-to-list
        python: `def solution(head, k):
    dummy = ListNode(0)
    dummy.next = head
    fast = slow = dummy
    for _ in range(k):
        fast = fast.next
    while fast.next:
        fast = fast.next
        slow = slow.next
    slow.next = slow.next.next
    return dummy.next`,
        cpp: `class Solution {
public:
    ListNode* solution(ListNode* head, int k) {
        ListNode dummy(0); dummy.next = head;
        ListNode *fast = &dummy, *slow = &dummy;
        for (int i = 0; i < k; i++) fast = fast->next;
        while (fast->next) { fast = fast->next; slow = slow->next; }
        slow->next = slow->next->next;
        return dummy.next;
    }
};`,
        java: `class Solution {
    public ListNode solution(ListNode head, int k) {
        ListNode dummy = new ListNode(0); dummy.next = head;
        ListNode fast = dummy, slow = dummy;
        for (int i = 0; i < k; i++) fast = fast.next;
        while (fast.next != null) { fast = fast.next; slow = slow.next; }
        slow.next = slow.next.next;
        return dummy.next;
    }
}`
    },

    'merge-k-sorted-lists': { // lists-to-list
        python: `def solution(lists):
    vals = []
    for l in lists:
        while l:
            vals.append(l.val); l = l.next
    vals.sort()
    dummy = ListNode(0); tail = dummy
    for v in vals:
        tail.next = ListNode(v); tail = tail.next
    return dummy.next`,
        cpp: `class Solution {
public:
    ListNode* solution(vector<ListNode*>& lists) {
        vector<int> vals;
        for (auto l : lists) for (ListNode *n = l; n; n = n->next) vals.push_back(n->val);
        sort(vals.begin(), vals.end());
        ListNode dummy(0); ListNode *tail = &dummy;
        for (int v : vals) { tail->next = new ListNode(v); tail = tail->next; }
        return dummy.next;
    }
};`,
        java: `class Solution {
    public ListNode solution(ListNode[] lists) {
        java.util.List<Integer> vals = new java.util.ArrayList<>();
        for (ListNode l : lists) for (ListNode n = l; n != null; n = n.next) vals.add(n.val);
        java.util.Collections.sort(vals);
        ListNode dummy = new ListNode(0), tail = dummy;
        for (int v : vals) { tail.next = new ListNode(v); tail = tail.next; }
        return dummy.next;
    }
}`
    },

    'linked-list-cycle': { // list-cycle-to-bool
        python: `def solution(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            return True
    return False`,
        cpp: `class Solution {
public:
    bool solution(ListNode* head) {
        ListNode *slow = head, *fast = head;
        while (fast && fast->next) {
            slow = slow->next; fast = fast->next->next;
            if (slow == fast) return true;
        }
        return false;
    }
};`,
        java: `class Solution {
    public boolean solution(ListNode head) {
        ListNode slow = head, fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next; fast = fast.next.next;
            if (slow == fast) return true;
        }
        return false;
    }
}`,
        c: `bool solution(struct ListNode* head) {
    struct ListNode *slow = head, *fast = head;
    while (fast && fast->next) {
        slow = slow->next; fast = fast->next->next;
        if (slow == fast) return true;
    }
    return false;
}`
    },

    // ---- trees -------------------------------------------------------------
    'maximum-depth-of-binary-tree': { // tree-to-int
        python: `def solution(root):
    if not root:
        return 0
    return 1 + max(solution(root.left), solution(root.right))`,
        cpp: `class Solution {
public:
    int solution(TreeNode* root) {
        if (!root) return 0;
        return 1 + max(solution(root->left), solution(root->right));
    }
};`,
        java: `class Solution {
    public int solution(TreeNode root) {
        if (root == null) return 0;
        return 1 + Math.max(solution(root.left), solution(root.right));
    }
}`,
        c: `int solution(struct TreeNode* root) {
    if (!root) return 0;
    int l = solution(root->left), r = solution(root->right);
    return 1 + (l > r ? l : r);
}`
    },

    'validate-binary-search-tree': { // tree-to-bool
        python: `def solution(root):
    def ok(n, lo, hi):
        if not n:
            return True
        if n.val <= lo or n.val >= hi:
            return False
        return ok(n.left, lo, n.val) and ok(n.right, n.val, hi)
    return ok(root, float('-inf'), float('inf'))`,
        cpp: `class Solution {
public:
    bool ok(TreeNode* n, long lo, long hi) {
        if (!n) return true;
        if (n->val <= lo || n->val >= hi) return false;
        return ok(n->left, lo, n->val) && ok(n->right, n->val, hi);
    }
    bool solution(TreeNode* root) { return ok(root, LONG_MIN, LONG_MAX); }
};`,
        java: `class Solution {
    boolean ok(TreeNode n, long lo, long hi) {
        if (n == null) return true;
        if (n.val <= lo || n.val >= hi) return false;
        return ok(n.left, lo, n.val) && ok(n.right, n.val, hi);
    }
    public boolean solution(TreeNode root) { return ok(root, Long.MIN_VALUE, Long.MAX_VALUE); }
}`
    },

    'invert-binary-tree': { // tree-to-tree
        python: `def solution(root):
    if not root:
        return None
    left = solution(root.left)
    root.left = solution(root.right)
    root.right = left
    return root`,
        cpp: `class Solution {
public:
    TreeNode* solution(TreeNode* root) {
        if (!root) return nullptr;
        TreeNode *left = solution(root->left);
        root->left = solution(root->right);
        root->right = left;
        return root;
    }
};`,
        java: `class Solution {
    public TreeNode solution(TreeNode root) {
        if (root == null) return null;
        TreeNode left = solution(root.left);
        root.left = solution(root.right);
        root.right = left;
        return root;
    }
}`,
        c: `struct TreeNode* solution(struct TreeNode* root) {
    if (!root) return NULL;
    struct TreeNode *left = solution(root->left);
    root->left = solution(root->right);
    root->right = left;
    return root;
}`
    },

    'same-tree': { // two-trees-to-bool
        python: `def solution(p, q):
    if not p and not q:
        return True
    if not p or not q or p.val != q.val:
        return False
    return solution(p.left, q.left) and solution(p.right, q.right)`,
        cpp: `class Solution {
public:
    bool solution(TreeNode* p, TreeNode* q) {
        if (!p && !q) return true;
        if (!p || !q || p->val != q->val) return false;
        return solution(p->left, q->left) && solution(p->right, q->right);
    }
};`,
        java: `class Solution {
    public boolean solution(TreeNode p, TreeNode q) {
        if (p == null && q == null) return true;
        if (p == null || q == null || p.val != q.val) return false;
        return solution(p.left, q.left) && solution(p.right, q.right);
    }
}`
    },

    'kth-smallest-element-in-a-bst': { // tree-k-to-int
        python: `def solution(root, k):
    vals = []
    def go(n):
        if not n:
            return
        go(n.left); vals.append(n.val); go(n.right)
    go(root)
    return vals[k-1]`,
        cpp: `class Solution {
public:
    void go(TreeNode* n, vector<int>& v) { if (!n) return; go(n->left, v); v.push_back(n->val); go(n->right, v); }
    int solution(TreeNode* root, int k) { vector<int> v; go(root, v); return v[k-1]; }
};`,
        java: `class Solution {
    void go(TreeNode n, java.util.List<Integer> v) { if (n == null) return; go(n.left, v); v.add(n.val); go(n.right, v); }
    public int solution(TreeNode root, int k) { java.util.List<Integer> v = new java.util.ArrayList<>(); go(root, v); return v.get(k-1); }
}`
    },

    'lowest-common-ancestor-of-a-bst': { // tree-two-vals-to-int
        python: `def solution(root, p, q):
    cur = root
    while cur:
        if p < cur.val and q < cur.val:
            cur = cur.left
        elif p > cur.val and q > cur.val:
            cur = cur.right
        else:
            return cur.val
    return -1`,
        cpp: `class Solution {
public:
    int solution(TreeNode* root, int p, int q) {
        TreeNode *cur = root;
        while (cur) {
            if (p < cur->val && q < cur->val) cur = cur->left;
            else if (p > cur->val && q > cur->val) cur = cur->right;
            else return cur->val;
        }
        return -1;
    }
};`,
        java: `class Solution {
    public int solution(TreeNode root, int p, int q) {
        TreeNode cur = root;
        while (cur != null) {
            if (p < cur.val && q < cur.val) cur = cur.left;
            else if (p > cur.val && q > cur.val) cur = cur.right;
            else return cur.val;
        }
        return -1;
    }
}`
    },

    'binary-tree-right-side-view': { // tree-to-array
        python: `def solution(root):
    res = []
    if not root:
        return res
    level = [root]
    while level:
        res.append(level[-1].val)
        nxt = []
        for n in level:
            if n.left: nxt.append(n.left)
            if n.right: nxt.append(n.right)
        level = nxt
    return res`,
        cpp: `class Solution {
public:
    vector<int> solution(TreeNode* root) {
        vector<int> res;
        if (!root) return res;
        vector<TreeNode*> level{root};
        while (!level.empty()) {
            res.push_back(level.back()->val);
            vector<TreeNode*> nxt;
            for (auto n : level) { if (n->left) nxt.push_back(n->left); if (n->right) nxt.push_back(n->right); }
            level = nxt;
        }
        return res;
    }
};`,
        java: `class Solution {
    public java.util.List<Integer> solution(TreeNode root) {
        java.util.List<Integer> res = new java.util.ArrayList<>();
        if (root == null) return res;
        java.util.List<TreeNode> level = new java.util.ArrayList<>();
        level.add(root);
        while (!level.isEmpty()) {
            res.add(level.get(level.size()-1).val);
            java.util.List<TreeNode> nxt = new java.util.ArrayList<>();
            for (TreeNode n : level) { if (n.left != null) nxt.add(n.left); if (n.right != null) nxt.add(n.right); }
            level = nxt;
        }
        return res;
    }
}`
    },

    'binary-tree-level-order-traversal': { // tree-to-levels
        python: `def solution(root):
    res = []
    if not root:
        return res
    level = [root]
    while level:
        res.append([n.val for n in level])
        nxt = []
        for n in level:
            if n.left: nxt.append(n.left)
            if n.right: nxt.append(n.right)
        level = nxt
    return res`,
        cpp: `class Solution {
public:
    vector<vector<int>> solution(TreeNode* root) {
        vector<vector<int>> res;
        if (!root) return res;
        vector<TreeNode*> level{root};
        while (!level.empty()) {
            vector<int> vals;
            vector<TreeNode*> nxt;
            for (auto n : level) { vals.push_back(n->val); if (n->left) nxt.push_back(n->left); if (n->right) nxt.push_back(n->right); }
            res.push_back(vals);
            level = nxt;
        }
        return res;
    }
};`,
        java: `class Solution {
    public java.util.List<java.util.List<Integer>> solution(TreeNode root) {
        java.util.List<java.util.List<Integer>> res = new java.util.ArrayList<>();
        if (root == null) return res;
        java.util.List<TreeNode> level = new java.util.ArrayList<>();
        level.add(root);
        while (!level.isEmpty()) {
            java.util.List<Integer> vals = new java.util.ArrayList<>();
            java.util.List<TreeNode> nxt = new java.util.ArrayList<>();
            for (TreeNode n : level) { vals.add(n.val); if (n.left != null) nxt.add(n.left); if (n.right != null) nxt.add(n.right); }
            res.add(vals);
            level = nxt;
        }
        return res;
    }
}`
    },

    'construct-binary-tree-from-preorder-and-inorder-traversal': { // two-arrays-to-tree
        python: `def solution(preorder, inorder):
    idx = {v: i for i, v in enumerate(inorder)}
    state = {'p': 0}
    def build(lo, hi):
        if lo > hi:
            return None
        val = preorder[state['p']]; state['p'] += 1
        node = TreeNode(val)
        mid = idx[val]
        node.left = build(lo, mid-1)
        node.right = build(mid+1, hi)
        return node
    return build(0, len(inorder)-1)`,
        cpp: `class Solution {
public:
    map<int,int> idx; int p = 0; vector<int> pre;
    TreeNode* build(int lo, int hi) {
        if (lo > hi) return nullptr;
        int val = pre[p++];
        TreeNode *node = new TreeNode(val);
        int mid = idx[val];
        node->left = build(lo, mid-1);
        node->right = build(mid+1, hi);
        return node;
    }
    TreeNode* solution(vector<int>& preorder, vector<int>& inorder) {
        pre = preorder; p = 0; idx.clear();
        for (size_t i = 0; i < inorder.size(); i++) idx[inorder[i]] = i;
        return build(0, (int)inorder.size()-1);
    }
};`,
        java: `class Solution {
    java.util.Map<Integer,Integer> idx = new java.util.HashMap<>();
    int p = 0; int[] pre;
    TreeNode build(int lo, int hi) {
        if (lo > hi) return null;
        int val = pre[p++];
        TreeNode node = new TreeNode(val);
        int mid = idx.get(val);
        node.left = build(lo, mid-1);
        node.right = build(mid+1, hi);
        return node;
    }
    public TreeNode solution(int[] preorder, int[] inorder) {
        pre = preorder; p = 0; idx.clear();
        for (int i = 0; i < inorder.length; i++) idx.put(inorder[i], i);
        return build(0, inorder.length-1);
    }
}`
    }
};
