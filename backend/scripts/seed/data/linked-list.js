// Linked List (11). Structure-based problems are seeded content-only for now
// (no test harness yet); find-the-duplicate-number is fully judged.

const LN = {
    c: '/**\n * struct ListNode {\n *     int val;\n *     struct ListNode *next;\n * };\n */\n',
    cpp: '/**\n * struct ListNode {\n *     int val;\n *     ListNode *next;\n *     ListNode(int x) : val(x), next(nullptr) {}\n * };\n */\n',
    java: '/**\n * class ListNode {\n *     int val;\n *     ListNode next;\n *     ListNode(int val) { this.val = val; }\n * }\n */\n',
    js: '/**\n * function ListNode(val, next) {\n *     this.val = val === undefined ? 0 : val;\n *     this.next = next === undefined ? null : next;\n * }\n */\n',
    python: '# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\n'
};

function ll(sigs) {
    return {
        c: LN.c + sigs.c,
        cpp: LN.cpp + 'class Solution {\npublic:\n    ' + sigs.cpp + '\n};',
        java: LN.java + 'class Solution {\n    ' + sigs.java + '\n}',
        js: LN.js + sigs.js,
        python: LN.python + sigs.python
    };
}

module.exports = [
    {
        id: 'reverse-linked-list',
        title: 'Reverse Linked List',
        difficulty: 'Easy',
        tags: ['Linked List', 'Recursion'],
        description: ['Given the head of a singly linked list, reverse the list and return the new head.'],
        constraints: ['0 <= number of nodes <= 5000', '-5000 <= Node.val <= 5000'],
        example: 'Input: head = [1,2,3,4,5]\nOutput: [5,4,3,2,1]',
        boilerplate: ll({
            c: 'struct ListNode* solution(struct ListNode* head) {\n    // Write your code here\n    return NULL;\n}',
            cpp: 'ListNode* solution(ListNode* head) {\n        // Write your code here\n        return nullptr;\n    }',
            java: 'public ListNode solution(ListNode head) {\n        // Write your code here\n        return null;\n    }',
            js: 'function solution(head) {\n    // Write your code here\n    return null;\n}',
            python: 'def solution(head):\n    # Write your code here\n    return None'
        }),
        tests: []
    },
    {
        id: 'merge-two-sorted-lists',
        title: 'Merge Two Sorted Lists',
        difficulty: 'Easy',
        tags: ['Linked List', 'Recursion'],
        description: [
            'You are given the heads of two sorted linked lists list1 and list2. Merge the two lists into one sorted list by splicing together the nodes of the input lists, and return the head of the merged list.'
        ],
        constraints: ['0 <= number of nodes in each list <= 50', '-100 <= Node.val <= 100', 'Both lists are sorted in non-decreasing order'],
        example: 'Input: list1 = [1,2,4], list2 = [1,3,4]\nOutput: [1,1,2,3,4,4]',
        boilerplate: ll({
            c: 'struct ListNode* solution(struct ListNode* list1, struct ListNode* list2) {\n    // Write your code here\n    return NULL;\n}',
            cpp: 'ListNode* solution(ListNode* list1, ListNode* list2) {\n        // Write your code here\n        return nullptr;\n    }',
            java: 'public ListNode solution(ListNode list1, ListNode list2) {\n        // Write your code here\n        return null;\n    }',
            js: 'function solution(list1, list2) {\n    // Write your code here\n    return null;\n}',
            python: 'def solution(list1, list2):\n    # Write your code here\n    return None'
        }),
        tests: []
    },
    {
        id: 'reorder-list',
        title: 'Reorder List',
        difficulty: 'Medium',
        tags: ['Linked List', 'Two Pointers', 'Stack'],
        description: [
            'You are given the head of a singly linked list L0 -> L1 -> ... -> Ln. Reorder it in place to L0 -> Ln -> L1 -> Ln-1 -> L2 -> Ln-2 -> ...',
            'You may not modify the values in the nodes — only the links between nodes may be changed.'
        ],
        constraints: ['1 <= number of nodes <= 5 * 10^4', '1 <= Node.val <= 1000'],
        example: 'Input: head = [1,2,3,4]\nOutput: [1,4,2,3]',
        boilerplate: ll({
            c: 'void solution(struct ListNode* head) {\n    // Reorder the list in place\n}',
            cpp: 'void solution(ListNode* head) {\n        // Reorder the list in place\n    }',
            java: 'public void solution(ListNode head) {\n        // Reorder the list in place\n    }',
            js: 'function solution(head) {\n    // Reorder the list in place\n}',
            python: 'def solution(head):\n    # Reorder the list in place\n    pass'
        }),
        tests: []
    },
    {
        id: 'remove-nth-node-from-end-of-list',
        title: 'Remove Nth Node From End of List',
        difficulty: 'Medium',
        tags: ['Linked List', 'Two Pointers'],
        description: ['Given the head of a linked list, remove the n-th node from the end of the list and return its head.'],
        constraints: ['1 <= number of nodes <= 30', '0 <= Node.val <= 100', '1 <= n <= number of nodes'],
        example: 'Input: head = [1,2,3,4,5], n = 2\nOutput: [1,2,3,5]',
        boilerplate: ll({
            c: 'struct ListNode* solution(struct ListNode* head, int n) {\n    // Write your code here\n    return NULL;\n}',
            cpp: 'ListNode* solution(ListNode* head, int n) {\n        // Write your code here\n        return nullptr;\n    }',
            java: 'public ListNode solution(ListNode head, int n) {\n        // Write your code here\n        return null;\n    }',
            js: 'function solution(head, n) {\n    // Write your code here\n    return null;\n}',
            python: 'def solution(head, n):\n    # Write your code here\n    return None'
        }),
        tests: []
    },
    {
        id: 'copy-list-with-random-pointer',
        title: 'Copy List With Random Pointer',
        difficulty: 'Medium',
        tags: ['Linked List', 'Hash Map'],
        description: [
            'A linked list of length n is given where each node contains an additional random pointer, which could point to any node in the list or null.',
            'Construct and return a deep copy of the list: n brand-new nodes with the same val, next and random structure. No pointer in the copy may reference a node of the original list.'
        ],
        constraints: ['0 <= n <= 1000', '-10^4 <= Node.val <= 10^4', 'random is null or points to a node in the list'],
        example: 'Input: head = [[7,null],[13,0],[11,4],[10,2],[1,0]]\nOutput: a deep copy with identical structure',
        boilerplate: {
            c: '/**\n * struct Node {\n *     int val;\n *     struct Node *next;\n *     struct Node *random;\n * };\n */\nstruct Node* solution(struct Node* head) {\n    // Write your code here\n    return NULL;\n}',
            cpp: '/**\n * class Node {\n * public:\n *     int val;\n *     Node* next;\n *     Node* random;\n *     Node(int _val) : val(_val), next(nullptr), random(nullptr) {}\n * };\n */\nclass Solution {\npublic:\n    Node* solution(Node* head) {\n        // Write your code here\n        return nullptr;\n    }\n};',
            java: '/**\n * class Node {\n *     int val;\n *     Node next;\n *     Node random;\n *     Node(int val) { this.val = val; }\n * }\n */\nclass Solution {\n    public Node solution(Node head) {\n        // Write your code here\n        return null;\n    }\n}',
            js: '/**\n * function Node(val, next, random) {\n *     this.val = val;\n *     this.next = next || null;\n *     this.random = random || null;\n * }\n */\nfunction solution(head) {\n    // Write your code here\n    return null;\n}',
            python: '# class Node:\n#     def __init__(self, x, next=None, random=None):\n#         self.val = x\n#         self.next = next\n#         self.random = random\ndef solution(head):\n    # Write your code here\n    return None'
        },
        tests: []
    },
    {
        id: 'add-two-numbers-linked-list',
        title: 'Add Two Numbers (Linked List)',
        difficulty: 'Medium',
        tags: ['Linked List', 'Math', 'Recursion'],
        description: [
            'You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each node contains a single digit. Add the two numbers and return the sum as a linked list in the same reversed-digit form.',
            'You may assume the two numbers do not contain any leading zeros, except the number 0 itself.'
        ],
        constraints: ['1 <= number of nodes in each list <= 100', '0 <= Node.val <= 9'],
        example: 'Input: l1 = [2,4,3], l2 = [5,6,4]\nOutput: [7,0,8]\nExplanation: 342 + 465 = 807.',
        boilerplate: ll({
            c: 'struct ListNode* solution(struct ListNode* l1, struct ListNode* l2) {\n    // Write your code here\n    return NULL;\n}',
            cpp: 'ListNode* solution(ListNode* l1, ListNode* l2) {\n        // Write your code here\n        return nullptr;\n    }',
            java: 'public ListNode solution(ListNode l1, ListNode l2) {\n        // Write your code here\n        return null;\n    }',
            js: 'function solution(l1, l2) {\n    // Write your code here\n    return null;\n}',
            python: 'def solution(l1, l2):\n    # Write your code here\n    return None'
        }),
        tests: []
    },
    {
        id: 'linked-list-cycle',
        title: 'Linked List Cycle',
        difficulty: 'Easy',
        tags: ['Linked List', 'Two Pointers', 'Hash Map'],
        description: [
            'Given head, the head of a linked list, determine if the linked list has a cycle in it — that is, some node can be reached again by continuously following the next pointer.',
            'Return true if there is a cycle, false otherwise. Can you solve it using O(1) memory?'
        ],
        constraints: ['0 <= number of nodes <= 10^4', '-10^5 <= Node.val <= 10^5'],
        example: 'Input: head = [3,2,0,-4], tail connects back to node index 1\nOutput: true',
        boilerplate: ll({
            c: 'bool solution(struct ListNode* head) {\n    // Write your code here\n    return false;\n}',
            cpp: 'bool solution(ListNode* head) {\n        // Write your code here\n        return false;\n    }',
            java: 'public boolean solution(ListNode head) {\n        // Write your code here\n        return false;\n    }',
            js: 'function solution(head) {\n    // Write your code here\n    return false;\n}',
            python: 'def solution(head):\n    # Write your code here\n    return False'
        }),
        tests: []
    },
    {
        id: 'find-the-duplicate-number',
        title: 'Find the Duplicate Number',
        difficulty: 'Medium',
        tags: ['Linked List', 'Arrays', 'Two Pointers', 'Binary Search'],
        description: [
            'Given an array of integers nums containing n + 1 integers where each integer is in the range [1, n] inclusive, there is exactly one repeated number (it may repeat more than once). Return the repeated number.',
            'You must solve the problem without modifying the array and using only constant extra space.'
        ],
        constraints: ['1 <= n <= 10^5', 'nums.length == n + 1', '1 <= nums[i] <= n', 'Exactly one value is repeated'],
        example: 'Input: nums = [1,3,4,2,2]\nOutput: 2',
        runner: 'array-to-int',
        names: { a: 'nums' },
        solutionJs: 'function solution(nums) { let slow = nums[0], fast = nums[0]; do { slow = nums[slow]; fast = nums[nums[fast]]; } while (slow !== fast); slow = nums[0]; while (slow !== fast) { slow = nums[slow]; fast = nums[fast]; } return slow; }',
        tests: [
            { name: 'Basic', input: '5\n1 3 4 2 2', expect: '2' },
            { name: 'Duplicate of 3', input: '5\n3 1 3 4 2', expect: '3' },
            { name: 'Smallest case', input: '2\n1 1', expect: '1' },
            { name: 'Repeated many times', input: '5\n2 2 2 2 2', expect: '2' }
        ]
    },
    {
        id: 'lru-cache',
        title: 'LRU Cache',
        difficulty: 'Medium',
        tags: ['Linked List', 'Hash Map', 'Design'],
        description: [
            'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.',
            'Implement LRUCache(capacity), get(key) (return the value or -1), and put(key, value) (insert or update; evict the least recently used key when over capacity). Both operations must run in O(1) average time.'
        ],
        constraints: ['1 <= capacity <= 3000', '0 <= key, value <= 10^4', 'At most 2 * 10^5 calls to get and put'],
        example: 'LRUCache cache = new LRUCache(2);\ncache.put(1,1); cache.put(2,2); cache.get(1) -> 1;\ncache.put(3,3); cache.get(2) -> -1 (evicted)',
        boilerplate: {
            c: 'typedef struct {\n    // Define your fields here\n} LRUCache;\n\nLRUCache* lRUCacheCreate(int capacity) {\n    return NULL;\n}\n\nint lRUCacheGet(LRUCache* obj, int key) {\n    return -1;\n}\n\nvoid lRUCachePut(LRUCache* obj, int key, int value) {\n}',
            cpp: 'class LRUCache {\npublic:\n    LRUCache(int capacity) {\n    }\n\n    int get(int key) {\n        return -1;\n    }\n\n    void put(int key, int value) {\n    }\n};',
            java: 'class LRUCache {\n    public LRUCache(int capacity) {\n    }\n\n    public int get(int key) {\n        return -1;\n    }\n\n    public void put(int key, int value) {\n    }\n}',
            js: 'class LRUCache {\n    constructor(capacity) {\n    }\n\n    get(key) {\n        return -1;\n    }\n\n    put(key, value) {\n    }\n}',
            python: 'class LRUCache:\n    def __init__(self, capacity):\n        pass\n\n    def get(self, key):\n        return -1\n\n    def put(self, key, value):\n        pass'
        },
        tests: []
    },
    {
        id: 'merge-k-sorted-lists',
        title: 'Merge K Sorted Lists',
        difficulty: 'Hard',
        tags: ['Linked List', 'Heap', 'Divide and Conquer'],
        description: [
            'You are given an array of k linked lists, each sorted in ascending order. Merge all the linked lists into one sorted linked list and return it.'
        ],
        constraints: ['0 <= k <= 10^4', '0 <= lists[i].length <= 500', '-10^4 <= lists[i][j] <= 10^4', 'The sum of all list lengths does not exceed 10^4'],
        example: 'Input: lists = [[1,4,5],[1,3,4],[2,6]]\nOutput: [1,1,2,3,4,4,5,6]',
        boilerplate: ll({
            c: 'struct ListNode* solution(struct ListNode** lists, int listsSize) {\n    // Write your code here\n    return NULL;\n}',
            cpp: 'ListNode* solution(vector<ListNode*>& lists) {\n        // Write your code here\n        return nullptr;\n    }',
            java: 'public ListNode solution(ListNode[] lists) {\n        // Write your code here\n        return null;\n    }',
            js: 'function solution(lists) {\n    // Write your code here\n    return null;\n}',
            python: 'def solution(lists):\n    # Write your code here\n    return None'
        }),
        tests: []
    },
    {
        id: 'reverse-nodes-in-k-group',
        title: 'Reverse Nodes in K-Group',
        difficulty: 'Hard',
        tags: ['Linked List', 'Recursion'],
        description: [
            'Given the head of a linked list, reverse the nodes of the list k at a time, and return the modified list. Nodes in a final group of fewer than k stay in their original order.',
            'You may not alter the values in the nodes — only the node links themselves may be changed.'
        ],
        constraints: ['1 <= number of nodes <= 5000', '0 <= Node.val <= 1000', '1 <= k <= number of nodes'],
        example: 'Input: head = [1,2,3,4,5], k = 2\nOutput: [2,1,4,3,5]',
        boilerplate: ll({
            c: 'struct ListNode* solution(struct ListNode* head, int k) {\n    // Write your code here\n    return NULL;\n}',
            cpp: 'ListNode* solution(ListNode* head, int k) {\n        // Write your code here\n        return nullptr;\n    }',
            java: 'public ListNode solution(ListNode head, int k) {\n        // Write your code here\n        return null;\n    }',
            js: 'function solution(head, k) {\n    // Write your code here\n    return null;\n}',
            python: 'def solution(head, k):\n    # Write your code here\n    return None'
        }),
        tests: []
    }
];
