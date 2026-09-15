// Judging definitions for the linked-list problems.
//
// These carry only the fields that make a problem judgeable: the runner shape,
// a reference solution, and test cases. seedAll merges them onto the existing
// content entries (description/constraints/example stay where they are), so a
// problem's prose lives in one place and its judging in another.
//
// `expect` values are computed from solutionJs by the seeder, never typed by
// hand — see lib.js/libStruct.js.

module.exports = [
    {
        id: 'reverse-linked-list',
        runner: 'list-to-list',
        solutionJs: `function solution(head) {
  let prev = null;
  while (head) { const next = head.next; head.next = prev; prev = head; head = next; }
  return prev;
}`,
        tests: [
            { name: 'Typical list', input: '5\n1 2 3 4 5' },
            { name: 'Two nodes', input: '2\n1 2' },
            { name: 'Single node', input: '1\n7' },
            { name: 'Empty list', input: '0\n' },
            { name: 'Negative values', input: '4\n-1 -2 3 0' }
        ]
    },

    {
        id: 'merge-two-sorted-lists',
        runner: 'two-lists-to-list',
        solutionJs: `function solution(a, b) {
  const dummy = new ListNode(0);
  let tail = dummy;
  while (a && b) {
    if (a.val <= b.val) { tail.next = a; a = a.next; }
    else { tail.next = b; b = b.next; }
    tail = tail.next;
  }
  tail.next = a || b;
  return dummy.next;
}`,
        tests: [
            { name: 'Interleaved', input: '3\n1 2 4\n3\n1 3 4' },
            { name: 'One empty', input: '0\n\n1\n0' },
            { name: 'Both empty', input: '0\n\n0\n' },
            { name: 'Disjoint ranges', input: '2\n1 2\n2\n8 9' },
            { name: 'Duplicates across lists', input: '3\n2 2 2\n3\n2 2 2' }
        ]
    },

    {
        id: 'reorder-list',
        runner: 'list-to-list',
        solutionJs: `function solution(head) {
  if (!head || !head.next) return head;
  let slow = head, fast = head;
  while (fast.next && fast.next.next) { slow = slow.next; fast = fast.next.next; }
  let second = slow.next;
  slow.next = null;
  let prev = null;
  while (second) { const n = second.next; second.next = prev; prev = second; second = n; }
  let first = head;
  while (prev) {
    const t1 = first.next, t2 = prev.next;
    first.next = prev; prev.next = t1;
    first = t1; prev = t2;
  }
  return head;
}`,
        tests: [
            { name: 'Even length', input: '4\n1 2 3 4' },
            { name: 'Odd length', input: '5\n1 2 3 4 5' },
            { name: 'Two nodes', input: '2\n1 2' },
            { name: 'Single node', input: '1\n1' },
            { name: 'Empty list', input: '0\n' }
        ]
    },

    {
        id: 'remove-nth-node-from-end-of-list',
        runner: 'list-k-to-list',
        solutionJs: `function solution(head, k) {
  const dummy = new ListNode(0);
  dummy.next = head;
  let fast = dummy, slow = dummy;
  for (let i = 0; i < k; i++) fast = fast.next;
  while (fast.next) { fast = fast.next; slow = slow.next; }
  slow.next = slow.next.next;
  return dummy.next;
}`,
        tests: [
            { name: 'Remove from middle', input: '5\n1 2 3 4 5\n2' },
            { name: 'Remove only node', input: '1\n1\n1' },
            { name: 'Remove head', input: '3\n1 2 3\n3' },
            { name: 'Remove tail', input: '3\n1 2 3\n1' },
            { name: 'Two nodes remove first', input: '2\n1 2\n2' }
        ]
    },

    {
        id: 'add-two-numbers-linked-list',
        runner: 'two-lists-to-list',
        solutionJs: `function solution(a, b) {
  const dummy = new ListNode(0);
  let cur = dummy, carry = 0;
  while (a || b || carry) {
    const sum = (a ? a.val : 0) + (b ? b.val : 0) + carry;
    carry = Math.floor(sum / 10);
    cur.next = new ListNode(sum % 10);
    cur = cur.next;
    if (a) a = a.next;
    if (b) b = b.next;
  }
  return dummy.next;
}`,
        tests: [
            { name: 'No carry', input: '3\n2 4 3\n3\n5 6 4' },
            { name: 'Carry propagates', input: '1\n9\n3\n9 9 9' },
            { name: 'Both zero', input: '1\n0\n1\n0' },
            { name: 'Different lengths', input: '1\n5\n2\n5 5' },
            { name: 'Final carry creates a digit', input: '2\n9 9\n1\n1' }
        ]
    },

    {
        id: 'linked-list-cycle',
        runner: 'list-cycle-to-bool',
        solutionJs: `function solution(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}`,
        tests: [
            { name: 'Cycle at index 1', input: '4\n3 2 0 -4\n1' },
            { name: 'Cycle at head', input: '2\n1 2\n0' },
            { name: 'No cycle', input: '3\n1 2 3\n-1' },
            { name: 'Single node, no cycle', input: '1\n1\n-1' },
            { name: 'Single node self-cycle', input: '1\n1\n0' },
            { name: 'Empty list', input: '0\n\n-1' }
        ]
    },

    {
        id: 'merge-k-sorted-lists',
        runner: 'lists-to-list',
        solutionJs: `function solution(lists) {
  const vals = [];
  for (const l of lists) for (let n = l; n; n = n.next) vals.push(n.val);
  vals.sort((x, y) => x - y);
  const dummy = new ListNode(0);
  let tail = dummy;
  for (const v of vals) { tail.next = new ListNode(v); tail = tail.next; }
  return dummy.next;
}`,
        tests: [
            { name: 'Three lists', input: '3\n3\n1 4 5\n3\n1 3 4\n2\n2 6' },
            { name: 'No lists', input: '0\n' },
            { name: 'Single empty list', input: '1\n0\n' },
            { name: 'Mixed empty and non-empty', input: '3\n0\n\n2\n1 2\n0\n' },
            { name: 'Negatives', input: '2\n2\n-3 -1\n2\n-2 0' }
        ]
    },

    {
        id: 'reverse-nodes-in-k-group',
        runner: 'list-k-to-list',
        solutionJs: `function solution(head, k) {
  let node = head, count = 0;
  while (node && count < k) { node = node.next; count++; }
  if (count < k) return head;
  let prev = solution(node, k);
  let cur = head;
  for (let i = 0; i < k; i++) {
    const next = cur.next;
    cur.next = prev;
    prev = cur;
    cur = next;
  }
  return prev;
}`,
        tests: [
            { name: 'k = 2 exact groups', input: '4\n1 2 3 4\n2' },
            { name: 'k = 3 with remainder', input: '5\n1 2 3 4 5\n3' },
            { name: 'k = 1 leaves list unchanged', input: '3\n1 2 3\n1' },
            { name: 'k larger than list', input: '2\n1 2\n5' },
            { name: 'k equals length', input: '3\n1 2 3\n3' }
        ]
    }
];
