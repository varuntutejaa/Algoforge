// Tries (3) — design-style problems, seeded content-only for now.
module.exports = [
    {
        id: 'implement-trie-prefix-tree',
        title: 'Implement Trie (Prefix Tree)',
        difficulty: 'Medium',
        tags: ['Tries', 'Design', 'Hash Map'],
        description: [
            'A trie (prefix tree) is a tree data structure used to efficiently store and retrieve keys in a dataset of strings.',
            'Implement the Trie class: insert(word) inserts a word, search(word) returns true if the exact word is present, and startsWith(prefix) returns true if any inserted word has the given prefix.'
        ],
        constraints: ['1 <= word.length, prefix.length <= 2000', 'All inputs consist of lowercase English letters', 'At most 3 * 10^4 calls in total'],
        example: 'insert("apple"); search("apple") -> true; search("app") -> false; startsWith("app") -> true; insert("app"); search("app") -> true',
        boilerplate: {
            c: 'typedef struct Trie {\n    // Define your fields here\n} Trie;\n\nTrie* trieCreate() {\n    return NULL;\n}\n\nvoid trieInsert(Trie* obj, char* word) {\n}\n\nbool trieSearch(Trie* obj, char* word) {\n    return false;\n}\n\nbool trieStartsWith(Trie* obj, char* prefix) {\n    return false;\n}',
            cpp: 'class Trie {\npublic:\n    Trie() {\n    }\n\n    void insert(string word) {\n    }\n\n    bool search(string word) {\n        return false;\n    }\n\n    bool startsWith(string prefix) {\n        return false;\n    }\n};',
            java: 'class Trie {\n    public Trie() {\n    }\n\n    public void insert(String word) {\n    }\n\n    public boolean search(String word) {\n        return false;\n    }\n\n    public boolean startsWith(String prefix) {\n        return false;\n    }\n}',
            js: 'class Trie {\n    constructor() {\n    }\n\n    insert(word) {\n    }\n\n    search(word) {\n        return false;\n    }\n\n    startsWith(prefix) {\n        return false;\n    }\n}',
            python: 'class Trie:\n    def __init__(self):\n        pass\n\n    def insert(self, word):\n        pass\n\n    def search(self, word):\n        return False\n\n    def startsWith(self, prefix):\n        return False'
        },
        tests: []
    },
    {
        id: 'design-add-and-search-words-data-structure',
        title: 'Design Add and Search Words Data Structure',
        difficulty: 'Medium',
        tags: ['Tries', 'Design', 'DFS'],
        description: [
            'Design a data structure that supports adding new words and searching for a string that may contain wildcard dots.',
            "Implement WordDictionary: addWord(word) adds a word; search(word) returns true if any previously added word matches, where '.' in the query matches any single letter."
        ],
        constraints: ['1 <= word.length <= 25', "Search queries contain at most 2 dots", 'At most 10^4 calls to addWord and search'],
        example: 'addWord("bad"); addWord("dad"); search("pad") -> false; search("bad") -> true; search(".ad") -> true; search("b..") -> true',
        boilerplate: {
            c: 'typedef struct {\n    // Define your fields here\n} WordDictionary;\n\nWordDictionary* wordDictionaryCreate() {\n    return NULL;\n}\n\nvoid wordDictionaryAddWord(WordDictionary* obj, char* word) {\n}\n\nbool wordDictionarySearch(WordDictionary* obj, char* word) {\n    return false;\n}',
            cpp: 'class WordDictionary {\npublic:\n    WordDictionary() {\n    }\n\n    void addWord(string word) {\n    }\n\n    bool search(string word) {\n        return false;\n    }\n};',
            java: 'class WordDictionary {\n    public WordDictionary() {\n    }\n\n    public void addWord(String word) {\n    }\n\n    public boolean search(String word) {\n        return false;\n    }\n}',
            js: 'class WordDictionary {\n    constructor() {\n    }\n\n    addWord(word) {\n    }\n\n    search(word) {\n        return false;\n    }\n}',
            python: 'class WordDictionary:\n    def __init__(self):\n        pass\n\n    def addWord(self, word):\n        pass\n\n    def search(self, word):\n        return False'
        },
        tests: []
    },
    {
        id: 'word-search-ii',
        title: 'Word Search II',
        difficulty: 'Hard',
        tags: ['Tries', 'Backtracking', 'Matrix'],
        description: [
            'Given an m x n board of characters and a list of strings words, return all words on the board.',
            'Each word must be constructed from letters of sequentially adjacent cells (horizontally or vertically neighboring); the same cell may not be used more than once per word.'
        ],
        constraints: ['1 <= m, n <= 12', '1 <= words.length <= 3 * 10^4', '1 <= words[i].length <= 10', 'All words are unique lowercase strings'],
        example: 'Input: board = [["o","a","a","n"],["e","t","a","e"],["i","h","k","r"],["i","f","l","v"]], words = ["oath","pea","eat","rain"]\nOutput: ["eat","oath"]',
        boilerplate: {
            c: 'char** solution(char** board, int boardSize, int* boardColSize, char** words, int wordsSize, int* returnSize) {\n    // Write your code here\n    *returnSize = 0;\n    return NULL;\n}',
            cpp: 'class Solution {\npublic:\n    vector<string> solution(vector<vector<char>>& board, vector<string>& words) {\n        // Write your code here\n        return {};\n    }\n};',
            java: 'class Solution {\n    public List<String> solution(char[][] board, String[] words) {\n        // Write your code here\n        return new ArrayList<>();\n    }\n}',
            js: 'function solution(board, words) {\n    // Write your code here\n    return [];\n}',
            python: 'def solution(board, words):\n    # Write your code here\n    return []'
        },
        tests: []
    }
];
