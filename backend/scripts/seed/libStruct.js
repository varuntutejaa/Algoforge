// Seed-side mirror of the linked-list / tree wire formats in
// services/runnersStruct.js.
//
// Parses a test case's stdin into the same structures the harness builds,
// runs the JS reference solution against them, and serializes the result the
// same way the harness prints it. Expected outputs are therefore *computed*
// from a reference implementation rather than typed by hand — the harness and
// this file agreeing across five languages is what verifyHarness proves.

// --- structures -------------------------------------------------------------
function ListNode(val, next) {
    this.val = val === undefined ? 0 : val;
    this.next = next === undefined ? null : next;
}

function TreeNode(val, left, right) {
    this.val = val === undefined ? 0 : val;
    this.left = left === undefined ? null : left;
    this.right = right === undefined ? null : right;
}

function buildList(values) {
    let head = null, tail = null;
    for (const x of values) {
        const n = new ListNode(x);
        if (!head) { head = tail = n; } else { tail.next = n; tail = n; }
    }
    return head;
}

function printList(head) {
    const out = [];
    for (let h = head; h; h = h.next) out.push(h.val);
    return out.join(' ');
}

function buildTree(tokens) {
    if (!tokens.length || tokens[0] === 'null') return null;
    const root = new TreeNode(parseInt(tokens[0], 10));
    const q = [root];
    let i = 1, h = 0;
    while (h < q.length && i < tokens.length) {
        const cur = q[h++];
        if (i < tokens.length) {
            if (tokens[i] !== 'null') { cur.left = new TreeNode(parseInt(tokens[i], 10)); q.push(cur.left); }
            i++;
        }
        if (i < tokens.length) {
            if (tokens[i] !== 'null') { cur.right = new TreeNode(parseInt(tokens[i], 10)); q.push(cur.right); }
            i++;
        }
    }
    return root;
}

function printTree(root) {
    const out = [];
    if (root) {
        const q = [root];
        let h = 0;
        while (h < q.length) {
            const cur = q[h++];
            if (cur) { out.push(String(cur.val)); q.push(cur.left || null); q.push(cur.right || null); }
            else out.push('null');
        }
        while (out.length && out[out.length - 1] === 'null') out.pop();
    }
    return out.join(' ');
}

// --- token helpers ----------------------------------------------------------
function tokens(input) {
    return String(input).trim().split(/\s+/).filter(Boolean);
}

function boolOut(v) { return v ? 'true' : 'false'; }

// --- per-shape parse -> solve -> print --------------------------------------
// Each entry receives the raw stdin string and the reference `solution`.
const structShapes = {
    'list-to-list': (t, fn) => {
        const n = parseInt(t[0], 10) || 0;
        return printList(fn(buildList(t.slice(1, 1 + n).map(Number))));
    },
    'list-k-to-list': (t, fn) => {
        const n = parseInt(t[0], 10) || 0;
        const k = parseInt(t[1 + n], 10);
        return printList(fn(buildList(t.slice(1, 1 + n).map(Number)), k));
    },
    'two-lists-to-list': (t, fn) => {
        let i = 0;
        const n = parseInt(t[i++], 10); const a = t.slice(i, i + n).map(Number); i += n;
        const m = parseInt(t[i++], 10); const b = t.slice(i, i + m).map(Number); i += m;
        return printList(fn(buildList(a), buildList(b)));
    },
    'lists-to-list': (t, fn) => {
        let i = 0;
        const k = parseInt(t[i++], 10);
        const lists = [];
        for (let j = 0; j < k; j++) {
            const n = parseInt(t[i++], 10);
            lists.push(buildList(t.slice(i, i + n).map(Number)));
            i += n;
        }
        return printList(fn(lists));
    },
    'list-cycle-to-bool': (t, fn) => {
        const n = parseInt(t[0], 10) || 0;
        const head = buildList(t.slice(1, 1 + n).map(Number));
        const pos = parseInt(t[1 + n], 10);
        if (pos >= 0 && head) {
            let tail = head;
            while (tail.next) tail = tail.next;
            let target = head;
            for (let i = 0; i < pos; i++) target = target.next;
            tail.next = target;
        }
        return boolOut(fn(head));
    },
    'tree-to-int': (t, fn) => {
        const n = parseInt(t[0], 10) || 0;
        return String(fn(buildTree(t.slice(1, 1 + n))));
    },
    'tree-to-bool': (t, fn) => {
        const n = parseInt(t[0], 10) || 0;
        return boolOut(fn(buildTree(t.slice(1, 1 + n))));
    },
    'tree-to-tree': (t, fn) => {
        const n = parseInt(t[0], 10) || 0;
        return printTree(fn(buildTree(t.slice(1, 1 + n))));
    },
    'two-trees-to-bool': (t, fn) => {
        let i = 0;
        const n = parseInt(t[i++], 10); const a = t.slice(i, i + n); i += n;
        const m = parseInt(t[i++], 10); const b = t.slice(i, i + m); i += m;
        return boolOut(fn(buildTree(a), buildTree(b)));
    },
    'tree-k-to-int': (t, fn) => {
        const n = parseInt(t[0], 10) || 0;
        return String(fn(buildTree(t.slice(1, 1 + n)), parseInt(t[1 + n], 10)));
    },
    'tree-two-vals-to-int': (t, fn) => {
        const n = parseInt(t[0], 10) || 0;
        return String(fn(buildTree(t.slice(1, 1 + n)), parseInt(t[1 + n], 10), parseInt(t[2 + n], 10)));
    },
    'tree-to-array': (t, fn) => {
        const n = parseInt(t[0], 10) || 0;
        return fn(buildTree(t.slice(1, 1 + n))).join(' ');
    },
    'tree-to-levels': (t, fn) => {
        const n = parseInt(t[0], 10) || 0;
        return fn(buildTree(t.slice(1, 1 + n))).map((r) => r.join(' ')).join('\n');
    },
    'two-arrays-to-tree': (t, fn) => {
        let i = 0;
        const n = parseInt(t[i++], 10); const a = t.slice(i, i + n).map(Number); i += n;
        const m = parseInt(t[i++], 10); const b = t.slice(i, i + m).map(Number); i += m;
        return printTree(fn(a, b));
    }
};

function computeStructExpected(runner, solutionSource, input) {
    const shape = structShapes[runner];
    if (!shape) throw new Error(`no struct shape for runner "${runner}"`);
    // The reference is stored as source so the same text can be shipped as a
    // language-agnostic starting point; evaluate it with the node constructors
    // in scope so it sees exactly what the harness would pass it.
    const fn = new Function('ListNode', 'TreeNode', `${solutionSource}\nreturn solution;`)(ListNode, TreeNode);
    return shape(tokens(input), fn);
}

module.exports = {
    ListNode, TreeNode, buildList, printList, buildTree, printTree,
    structShapes, computeStructExpected, tokens
};
