// Judging definitions for the binary-tree problems.
//
// Trees arrive as level-order tokens with "null" for absent children, so the
// test inputs read the same way LeetCode displays them. See judged-linked-list.js
// for how these merge onto the existing content entries.

module.exports = [
    {
        id: 'invert-binary-tree',
        runner: 'tree-to-tree',
        solutionJs: `function solution(root) {
  if (!root) return null;
  const left = solution(root.left);
  root.left = solution(root.right);
  root.right = left;
  return root;
}`,
        tests: [
            { name: 'Full tree', input: '7\n4 2 7 1 3 6 9' },
            { name: 'Sparse tree', input: '5\n2 1 3 null null' },
            { name: 'Single node', input: '1\n1' },
            { name: 'Empty tree', input: '0\n' },
            { name: 'Left-skewed', input: '5\n1 2 null 3 null' }
        ]
    },

    {
        id: 'maximum-depth-of-binary-tree',
        runner: 'tree-to-int',
        solutionJs: `function solution(root) {
  if (!root) return 0;
  return 1 + Math.max(solution(root.left), solution(root.right));
}`,
        tests: [
            { name: 'Balanced tree', input: '7\n3 9 20 null null 15 7' },
            { name: 'Right-leaning', input: '4\n1 null 2 null' },
            { name: 'Empty tree', input: '0\n' },
            { name: 'Single node', input: '1\n0' },
            { name: 'Deep left chain', input: '7\n1 2 null 3 null 4 null' }
        ]
    },

    {
        id: 'diameter-of-binary-tree',
        runner: 'tree-to-int',
        solutionJs: `function solution(root) {
  let best = 0;
  function depth(n) {
    if (!n) return 0;
    const l = depth(n.left), r = depth(n.right);
    best = Math.max(best, l + r);
    return 1 + Math.max(l, r);
  }
  depth(root);
  return best;
}`,
        tests: [
            { name: 'Diameter through root', input: '5\n1 2 3 4 5' },
            { name: 'Two nodes', input: '2\n1 2' },
            { name: 'Single node', input: '1\n1' },
            { name: 'Empty tree', input: '0\n' },
            { name: 'Path avoiding root', input: '7\n1 2 3 4 5 null null' }
        ]
    },

    {
        id: 'balanced-binary-tree',
        runner: 'tree-to-bool',
        solutionJs: `function solution(root) {
  let ok = true;
  function depth(n) {
    if (!n) return 0;
    const l = depth(n.left), r = depth(n.right);
    if (Math.abs(l - r) > 1) ok = false;
    return 1 + Math.max(l, r);
  }
  depth(root);
  return ok;
}`,
        tests: [
            { name: 'Balanced', input: '7\n3 9 20 null null 15 7' },
            { name: 'Unbalanced', input: '7\n1 2 2 3 3 null null' },
            { name: 'Empty tree', input: '0\n' },
            { name: 'Single node', input: '1\n1' },
            { name: 'Long left chain', input: '5\n1 2 null 3 null' }
        ]
    },

    {
        id: 'same-tree',
        runner: 'two-trees-to-bool',
        solutionJs: `function solution(p, q) {
  if (!p && !q) return true;
  if (!p || !q || p.val !== q.val) return false;
  return solution(p.left, q.left) && solution(p.right, q.right);
}`,
        tests: [
            { name: 'Identical', input: '3\n1 2 3\n3\n1 2 3' },
            { name: 'Different shape', input: '3\n1 2 null\n3\n1 null 2' },
            { name: 'Different values', input: '3\n1 2 1\n3\n1 1 2' },
            { name: 'Both empty', input: '0\n\n0\n' },
            { name: 'One empty', input: '1\n1\n0\n' }
        ]
    },

    {
        id: 'subtree-of-another-tree',
        runner: 'two-trees-to-bool',
        solutionJs: `function solution(root, sub) {
  function same(a, b) {
    if (!a && !b) return true;
    if (!a || !b || a.val !== b.val) return false;
    return same(a.left, b.left) && same(a.right, b.right);
  }
  if (!sub) return true;
  if (!root) return false;
  if (same(root, sub)) return true;
  return solution(root.left, sub) || solution(root.right, sub);
}`,
        tests: [
            { name: 'Subtree present', input: '5\n3 4 5 1 2\n3\n4 1 2' },
            { name: 'Subtree absent', input: '7\n3 4 5 1 2 null null\n3\n4 1 3' },
            { name: 'Identical trees', input: '1\n1\n1\n1' },
            { name: 'Empty subtree', input: '3\n1 2 3\n0\n' },
            { name: 'Empty root', input: '0\n\n1\n1' }
        ]
    },

    {
        id: 'lowest-common-ancestor-of-a-bst',
        runner: 'tree-two-vals-to-int',
        solutionJs: `function solution(root, p, q) {
  let cur = root;
  while (cur) {
    if (p < cur.val && q < cur.val) cur = cur.left;
    else if (p > cur.val && q > cur.val) cur = cur.right;
    else return cur.val;
  }
  return -1;
}`,
        tests: [
            { name: 'Split at root', input: '9\n6 2 8 0 4 7 9 null null\n2 8' },
            { name: 'Ancestor is one of them', input: '9\n6 2 8 0 4 7 9 null null\n2 4' },
            { name: 'Both in left subtree', input: '9\n6 2 8 0 4 7 9 null null\n0 4' },
            { name: 'Same node twice', input: '3\n2 1 3\n1 1' },
            { name: 'Root is the answer', input: '3\n2 1 3\n1 3' }
        ]
    },

    {
        id: 'binary-tree-level-order-traversal',
        runner: 'tree-to-levels',
        solutionJs: `function solution(root) {
  const res = [];
  if (!root) return res;
  let level = [root];
  while (level.length) {
    res.push(level.map((n) => n.val));
    const next = [];
    for (const n of level) { if (n.left) next.push(n.left); if (n.right) next.push(n.right); }
    level = next;
  }
  return res;
}`,
        tests: [
            { name: 'Three levels', input: '7\n3 9 20 null null 15 7' },
            { name: 'Single node', input: '1\n1' },
            { name: 'Empty tree', input: '0\n' },
            { name: 'Left chain', input: '5\n1 2 null 3 null' },
            { name: 'Full two levels', input: '3\n1 2 3' }
        ]
    },

    {
        id: 'binary-tree-right-side-view',
        runner: 'tree-to-array',
        solutionJs: `function solution(root) {
  const res = [];
  if (!root) return res;
  let level = [root];
  while (level.length) {
    res.push(level[level.length - 1].val);
    const next = [];
    for (const n of level) { if (n.left) next.push(n.left); if (n.right) next.push(n.right); }
    level = next;
  }
  return res;
}`,
        tests: [
            { name: 'Typical tree', input: '6\n1 2 3 null 5 null 4' },
            { name: 'Left-only chain', input: '5\n1 2 null 3 null' },
            { name: 'Empty tree', input: '0\n' },
            { name: 'Single node', input: '1\n1' },
            { name: 'Deeper left than right', input: '7\n1 2 3 4 null null null' }
        ]
    },

    {
        id: 'count-good-nodes-in-binary-tree',
        runner: 'tree-to-int',
        solutionJs: `function solution(root) {
  let count = 0;
  function go(n, best) {
    if (!n) return;
    if (n.val >= best) count++;
    const nb = Math.max(best, n.val);
    go(n.left, nb);
    go(n.right, nb);
  }
  go(root, -Infinity);
  return count;
}`,
        tests: [
            { name: 'Mixed good nodes', input: '7\n3 1 4 3 null 1 5' },
            { name: 'Descending path', input: '5\n3 3 null 4 2' },
            { name: 'Single node', input: '1\n1' },
            { name: 'Empty tree', input: '0\n' },
            { name: 'All equal values', input: '3\n2 2 2' }
        ]
    },

    {
        id: 'validate-binary-search-tree',
        runner: 'tree-to-bool',
        solutionJs: `function solution(root) {
  function ok(n, lo, hi) {
    if (!n) return true;
    if (n.val <= lo || n.val >= hi) return false;
    return ok(n.left, lo, n.val) && ok(n.right, n.val, hi);
  }
  return ok(root, -Infinity, Infinity);
}`,
        tests: [
            { name: 'Valid BST', input: '3\n2 1 3' },
            { name: 'Invalid: right subtree violation', input: '7\n5 1 4 null null 3 6' },
            { name: 'Empty tree', input: '0\n' },
            { name: 'Single node', input: '1\n1' },
            { name: 'Equal values are invalid', input: '3\n2 2 null' }
        ]
    },

    {
        id: 'kth-smallest-element-in-a-bst',
        runner: 'tree-k-to-int',
        solutionJs: `function solution(root, k) {
  const vals = [];
  function go(n) { if (!n) return; go(n.left); vals.push(n.val); go(n.right); }
  go(root);
  return vals[k - 1];
}`,
        tests: [
            { name: 'k = 1', input: '5\n3 1 4 null 2\n1' },
            { name: 'k = 3', input: '7\n5 3 6 2 4 null null\n3' },
            { name: 'k equals size', input: '3\n2 1 3\n3' },
            { name: 'Single node', input: '1\n1\n1' },
            { name: 'Left-skewed tree', input: '5\n5 3 null 1 null\n2' }
        ]
    },

    {
        id: 'construct-binary-tree-from-preorder-and-inorder-traversal',
        runner: 'two-arrays-to-tree',
        solutionJs: `function solution(preorder, inorder) {
  const idx = new Map();
  inorder.forEach((v, i) => idx.set(v, i));
  let p = 0;
  function build(lo, hi) {
    if (lo > hi) return null;
    const val = preorder[p++];
    const node = new TreeNode(val);
    const mid = idx.get(val);
    node.left = build(lo, mid - 1);
    node.right = build(mid + 1, hi);
    return node;
  }
  return build(0, inorder.length - 1);
}`,
        tests: [
            { name: 'Typical tree', input: '5\n3 9 20 15 7\n5\n9 3 15 20 7' },
            { name: 'Single node', input: '1\n-1\n1\n-1' },
            { name: 'Empty', input: '0\n\n0\n' },
            { name: 'Left chain', input: '3\n3 2 1\n3\n1 2 3' },
            { name: 'Right chain', input: '3\n1 2 3\n3\n1 2 3' }
        ]
    },

    {
        id: 'binary-tree-maximum-path-sum',
        runner: 'tree-to-int',
        solutionJs: `function solution(root) {
  let best = -Infinity;
  function gain(n) {
    if (!n) return 0;
    const l = Math.max(gain(n.left), 0);
    const r = Math.max(gain(n.right), 0);
    best = Math.max(best, n.val + l + r);
    return n.val + Math.max(l, r);
  }
  gain(root);
  return best;
}`,
        tests: [
            { name: 'Path through root', input: '3\n1 2 3' },
            { name: 'Negative root', input: '5\n-10 9 20 null null' },
            { name: 'All negative', input: '3\n-3 -2 -1' },
            { name: 'Single node', input: '1\n5' },
            { name: 'Skip negative child', input: '3\n2 -1 -2' }
        ]
    }
];
