// Seed-time library: per-shape boilerplate templates, stdin parsers and
// canonical output printers.
//
// The parsers/printers here mirror the Judge0 harnesses in
// services/judge0.js + services/runners.js EXACTLY. Expected outputs for
// every test case are computed at seed time by running the problem's JS
// reference solution through parse -> solve -> print, which guarantees the
// stored expectations agree with what a correct submission produces.

// ---------------------------------------------------------------------------
// Boilerplate templates. Each takes a params object (display names) and
// returns { c, cpp, java, js, python } starter stubs whose signatures match
// the corresponding harness calling convention.
// ---------------------------------------------------------------------------
const tpl = {
    'two-sum': () => ({
        c: 'int* twoSum(int* nums, int numsSize, int target, int* returnSize) {\n    // Write your code here\n    *returnSize = 0;\n    return NULL;\n}',
        cpp: 'class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your code here\n        return {};\n    }\n};',
        java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your code here\n        return new int[]{};\n    }\n}',
        js: 'function twoSum(nums, target) {\n    // Write your code here\n    return [];\n}',
        python: 'def twoSum(nums, target):\n    # Write your code here\n    return []'
    }),

    'two-ints-to-int': ({ a = 'a', b = 'b' } = {}) => ({
        c: `int solution(int ${a}, int ${b}) {\n    // Write your code here\n    return 0;\n}`,
        cpp: `class Solution {\npublic:\n    int solution(int ${a}, int ${b}) {\n        // Write your code here\n        return 0;\n    }\n};`,
        java: `class Solution {\n    public int solution(int ${a}, int ${b}) {\n        // Write your code here\n        return 0;\n    }\n}`,
        js: `function solution(${a}, ${b}) {\n    // Write your code here\n    return 0;\n}`,
        python: `def solution(${a}, ${b}):\n    # Write your code here\n    return 0`
    }),

    'int-to-int': ({ a = 'n' } = {}) => ({
        c: `int solution(int ${a}) {\n    // Write your code here\n    return 0;\n}`,
        cpp: `class Solution {\npublic:\n    int solution(int ${a}) {\n        // Write your code here\n        return 0;\n    }\n};`,
        java: `class Solution {\n    public int solution(int ${a}) {\n        // Write your code here\n        return 0;\n    }\n}`,
        js: `function solution(${a}) {\n    // Write your code here\n    return 0;\n}`,
        python: `def solution(${a}):\n    # Write your code here\n    return 0`
    }),

    'int-to-bool': ({ a = 'n' } = {}) => ({
        c: `bool solution(int ${a}) {\n    // Write your code here\n    return false;\n}`,
        cpp: `class Solution {\npublic:\n    bool solution(int ${a}) {\n        // Write your code here\n        return false;\n    }\n};`,
        java: `class Solution {\n    public boolean solution(int ${a}) {\n        // Write your code here\n        return false;\n    }\n}`,
        js: `function solution(${a}) {\n    // Write your code here\n    return false;\n}`,
        python: `def solution(${a}):\n    # Write your code here\n    return False`
    }),

    'int-to-array': ({ a = 'n' } = {}) => ({
        c: `int* solution(int ${a}, int* returnSize) {\n    // Write your code here\n    *returnSize = 0;\n    return NULL;\n}`,
        cpp: `class Solution {\npublic:\n    vector<int> solution(int ${a}) {\n        // Write your code here\n        return {};\n    }\n};`,
        java: `class Solution {\n    public int[] solution(int ${a}) {\n        // Write your code here\n        return new int[]{};\n    }\n}`,
        js: `function solution(${a}) {\n    // Write your code here\n    return [];\n}`,
        python: `def solution(${a}):\n    # Write your code here\n    return []`
    }),

    'long-to-long': ({ a = 'n' } = {}) => ({
        c: `long long solution(long long ${a}) {\n    // Write your code here\n    return 0;\n}`,
        cpp: `class Solution {\npublic:\n    long long solution(long long ${a}) {\n        // Write your code here\n        return 0;\n    }\n};`,
        java: `class Solution {\n    public long solution(long ${a}) {\n        // Write your code here\n        return 0;\n    }\n}`,
        js: `function solution(${a}) {\n    // Write your code here\n    return 0;\n}`,
        python: `def solution(${a}):\n    # Write your code here\n    return 0`
    }),

    'array-to-int': ({ a = 'nums' } = {}) => ({
        c: `int solution(int* ${a}, int ${a}Size) {\n    // Write your code here\n    return 0;\n}`,
        cpp: `class Solution {\npublic:\n    int solution(vector<int>& ${a}) {\n        // Write your code here\n        return 0;\n    }\n};`,
        java: `class Solution {\n    public int solution(int[] ${a}) {\n        // Write your code here\n        return 0;\n    }\n}`,
        js: `function solution(${a}) {\n    // Write your code here\n    return 0;\n}`,
        python: `def solution(${a}):\n    # Write your code here\n    return 0`
    }),

    'array-to-bool': ({ a = 'nums' } = {}) => ({
        c: `bool solution(int* ${a}, int ${a}Size) {\n    // Write your code here\n    return false;\n}`,
        cpp: `class Solution {\npublic:\n    bool solution(vector<int>& ${a}) {\n        // Write your code here\n        return false;\n    }\n};`,
        java: `class Solution {\n    public boolean solution(int[] ${a}) {\n        // Write your code here\n        return false;\n    }\n}`,
        js: `function solution(${a}) {\n    // Write your code here\n    return false;\n}`,
        python: `def solution(${a}):\n    # Write your code here\n    return False`
    }),

    'array-to-array': ({ a = 'nums' } = {}) => ({
        c: `int* solution(int* ${a}, int ${a}Size, int* returnSize) {\n    // Write your code here\n    *returnSize = 0;\n    return NULL;\n}`,
        cpp: `class Solution {\npublic:\n    vector<int> solution(vector<int>& ${a}) {\n        // Write your code here\n        return {};\n    }\n};`,
        java: `class Solution {\n    public int[] solution(int[] ${a}) {\n        // Write your code here\n        return new int[]{};\n    }\n}`,
        js: `function solution(${a}) {\n    // Write your code here\n    return [];\n}`,
        python: `def solution(${a}):\n    # Write your code here\n    return []`
    }),

    'array-target-to-int': ({ a = 'nums', b = 'target' } = {}) => ({
        c: `int solution(int* ${a}, int ${a}Size, int ${b}) {\n    // Write your code here\n    return 0;\n}`,
        cpp: `class Solution {\npublic:\n    int solution(vector<int>& ${a}, int ${b}) {\n        // Write your code here\n        return 0;\n    }\n};`,
        java: `class Solution {\n    public int solution(int[] ${a}, int ${b}) {\n        // Write your code here\n        return 0;\n    }\n}`,
        js: `function solution(${a}, ${b}) {\n    // Write your code here\n    return 0;\n}`,
        python: `def solution(${a}, ${b}):\n    # Write your code here\n    return 0`
    }),

    'array-target-to-bool': ({ a = 'nums', b = 'target' } = {}) => ({
        c: `bool solution(int* ${a}, int ${a}Size, int ${b}) {\n    // Write your code here\n    return false;\n}`,
        cpp: `class Solution {\npublic:\n    bool solution(vector<int>& ${a}, int ${b}) {\n        // Write your code here\n        return false;\n    }\n};`,
        java: `class Solution {\n    public boolean solution(int[] ${a}, int ${b}) {\n        // Write your code here\n        return false;\n    }\n}`,
        js: `function solution(${a}, ${b}) {\n    // Write your code here\n    return false;\n}`,
        python: `def solution(${a}, ${b}):\n    # Write your code here\n    return False`
    }),

    'array-target-to-array': ({ a = 'nums', b = 'target' } = {}) => ({
        c: `int* solution(int* ${a}, int ${a}Size, int ${b}, int* returnSize) {\n    // Write your code here\n    *returnSize = 0;\n    return NULL;\n}`,
        cpp: `class Solution {\npublic:\n    vector<int> solution(vector<int>& ${a}, int ${b}) {\n        // Write your code here\n        return {};\n    }\n};`,
        java: `class Solution {\n    public int[] solution(int[] ${a}, int ${b}) {\n        // Write your code here\n        return new int[]{};\n    }\n}`,
        js: `function solution(${a}, ${b}) {\n    // Write your code here\n    return [];\n}`,
        python: `def solution(${a}, ${b}):\n    # Write your code here\n    return []`
    }),

    'array-k-to-array': ({ a = 'nums', b = 'k' } = {}) => ({
        c: `int* solution(int* ${a}, int ${a}Size, int ${b}, int* returnSize) {\n    // Write your code here\n    *returnSize = 0;\n    return NULL;\n}`,
        cpp: `class Solution {\npublic:\n    vector<int> solution(vector<int>& ${a}, int ${b}) {\n        // Write your code here\n        return {};\n    }\n};`,
        java: `class Solution {\n    public int[] solution(int[] ${a}, int ${b}) {\n        // Write your code here\n        return new int[]{};\n    }\n}`,
        js: `function solution(${a}, ${b}) {\n    // Write your code here\n    return [];\n}`,
        python: `def solution(${a}, ${b}):\n    # Write your code here\n    return []`
    }),

    'array-k-to-sorted-array': ({ a = 'nums', b = 'k' } = {}) => ({
        c: `int* solution(int* ${a}, int ${a}Size, int ${b}, int* returnSize) {\n    // Write your code here\n    *returnSize = 0;\n    return NULL;\n}`,
        cpp: `class Solution {\npublic:\n    vector<int> solution(vector<int>& ${a}, int ${b}) {\n        // Write your code here\n        return {};\n    }\n};`,
        java: `class Solution {\n    public int[] solution(int[] ${a}, int ${b}) {\n        // Write your code here\n        return new int[]{};\n    }\n}`,
        js: `function solution(${a}, ${b}) {\n    // Write your code here\n    return [];\n}`,
        python: `def solution(${a}, ${b}):\n    # Write your code here\n    return []`
    }),

    'array-to-nested': ({ a = 'nums' } = {}) => ({
        c: `int** solution(int* ${a}, int ${a}Size, int* returnSize, int** returnColumnSizes) {\n    // Write your code here\n    *returnSize = 0;\n    *returnColumnSizes = NULL;\n    return NULL;\n}`,
        cpp: `class Solution {\npublic:\n    vector<vector<int>> solution(vector<int>& ${a}) {\n        // Write your code here\n        return {};\n    }\n};`,
        java: `class Solution {\n    public List<List<Integer>> solution(int[] ${a}) {\n        // Write your code here\n        return new ArrayList<>();\n    }\n}`,
        js: `function solution(${a}) {\n    // Write your code here\n    return [];\n}`,
        python: `def solution(${a}):\n    # Write your code here\n    return []`
    }),

    'array-target-to-nested': ({ a = 'candidates', b = 'target' } = {}) => ({
        c: `int** solution(int* ${a}, int ${a}Size, int ${b}, int* returnSize, int** returnColumnSizes) {\n    // Write your code here\n    *returnSize = 0;\n    *returnColumnSizes = NULL;\n    return NULL;\n}`,
        cpp: `class Solution {\npublic:\n    vector<vector<int>> solution(vector<int>& ${a}, int ${b}) {\n        // Write your code here\n        return {};\n    }\n};`,
        java: `class Solution {\n    public List<List<Integer>> solution(int[] ${a}, int ${b}) {\n        // Write your code here\n        return new ArrayList<>();\n    }\n}`,
        js: `function solution(${a}, ${b}) {\n    // Write your code here\n    return [];\n}`,
        python: `def solution(${a}, ${b}):\n    # Write your code here\n    return []`
    }),

    'array-to-perms': ({ a = 'nums' } = {}) => ({
        c: `int** solution(int* ${a}, int ${a}Size, int* returnSize, int** returnColumnSizes) {\n    // Write your code here\n    *returnSize = 0;\n    *returnColumnSizes = NULL;\n    return NULL;\n}`,
        cpp: `class Solution {\npublic:\n    vector<vector<int>> solution(vector<int>& ${a}) {\n        // Write your code here\n        return {};\n    }\n};`,
        java: `class Solution {\n    public List<List<Integer>> solution(int[] ${a}) {\n        // Write your code here\n        return new ArrayList<>();\n    }\n}`,
        js: `function solution(${a}) {\n    // Write your code here\n    return [];\n}`,
        python: `def solution(${a}):\n    # Write your code here\n    return []`
    }),

    'two-arrays-to-int': ({ a = 'a', b = 'b' } = {}) => ({
        c: `int solution(int* ${a}, int ${a}Size, int* ${b}, int ${b}Size) {\n    // Write your code here\n    return 0;\n}`,
        cpp: `class Solution {\npublic:\n    int solution(vector<int>& ${a}, vector<int>& ${b}) {\n        // Write your code here\n        return 0;\n    }\n};`,
        java: `class Solution {\n    public int solution(int[] ${a}, int[] ${b}) {\n        // Write your code here\n        return 0;\n    }\n}`,
        js: `function solution(${a}, ${b}) {\n    // Write your code here\n    return 0;\n}`,
        python: `def solution(${a}, ${b}):\n    # Write your code here\n    return 0`
    }),

    'two-arrays-to-double': ({ a = 'nums1', b = 'nums2' } = {}) => ({
        c: `double solution(int* ${a}, int ${a}Size, int* ${b}, int ${b}Size) {\n    // Write your code here\n    return 0.0;\n}`,
        cpp: `class Solution {\npublic:\n    double solution(vector<int>& ${a}, vector<int>& ${b}) {\n        // Write your code here\n        return 0.0;\n    }\n};`,
        java: `class Solution {\n    public double solution(int[] ${a}, int[] ${b}) {\n        // Write your code here\n        return 0.0;\n    }\n}`,
        js: `function solution(${a}, ${b}) {\n    // Write your code here\n    return 0;\n}`,
        python: `def solution(${a}, ${b}):\n    # Write your code here\n    return 0.0`
    }),

    'double-int-to-double': ({ a = 'x', b = 'n' } = {}) => ({
        c: `double solution(double ${a}, int ${b}) {\n    // Write your code here\n    return 0.0;\n}`,
        cpp: `class Solution {\npublic:\n    double solution(double ${a}, int ${b}) {\n        // Write your code here\n        return 0.0;\n    }\n};`,
        java: `class Solution {\n    public double solution(double ${a}, int ${b}) {\n        // Write your code here\n        return 0.0;\n    }\n}`,
        js: `function solution(${a}, ${b}) {\n    // Write your code here\n    return 0;\n}`,
        python: `def solution(${a}, ${b}):\n    # Write your code here\n    return 0.0`
    }),

    'string-to-bool': ({ a = 's' } = {}) => ({
        c: `bool solution(const char* ${a}) {\n    // Write your code here\n    return false;\n}`,
        cpp: `class Solution {\npublic:\n    bool solution(string ${a}) {\n        // Write your code here\n        return false;\n    }\n};`,
        java: `class Solution {\n    public boolean solution(String ${a}) {\n        // Write your code here\n        return false;\n    }\n}`,
        js: `function solution(${a}) {\n    // Write your code here\n    return false;\n}`,
        python: `def solution(${a}):\n    # Write your code here\n    return False`
    }),

    'string-to-int': ({ a = 's' } = {}) => ({
        c: `int solution(const char* ${a}) {\n    // Write your code here\n    return 0;\n}`,
        cpp: `class Solution {\npublic:\n    int solution(string ${a}) {\n        // Write your code here\n        return 0;\n    }\n};`,
        java: `class Solution {\n    public int solution(String ${a}) {\n        // Write your code here\n        return 0;\n    }\n}`,
        js: `function solution(${a}) {\n    // Write your code here\n    return 0;\n}`,
        python: `def solution(${a}):\n    # Write your code here\n    return 0`
    }),

    'string-to-string': ({ a = 's' } = {}) => ({
        c: `char* solution(const char* ${a}) {\n    // Write your code here (return a heap- or static-allocated string)\n    return "";\n}`,
        cpp: `class Solution {\npublic:\n    string solution(string ${a}) {\n        // Write your code here\n        return "";\n    }\n};`,
        java: `class Solution {\n    public String solution(String ${a}) {\n        // Write your code here\n        return "";\n    }\n}`,
        js: `function solution(${a}) {\n    // Write your code here\n    return '';\n}`,
        python: `def solution(${a}):\n    # Write your code here\n    return ''`
    }),

    'string-k-to-int': ({ a = 's', b = 'k' } = {}) => ({
        c: `int solution(const char* ${a}, int ${b}) {\n    // Write your code here\n    return 0;\n}`,
        cpp: `class Solution {\npublic:\n    int solution(string ${a}, int ${b}) {\n        // Write your code here\n        return 0;\n    }\n};`,
        java: `class Solution {\n    public int solution(String ${a}, int ${b}) {\n        // Write your code here\n        return 0;\n    }\n}`,
        js: `function solution(${a}, ${b}) {\n    // Write your code here\n    return 0;\n}`,
        python: `def solution(${a}, ${b}):\n    # Write your code here\n    return 0`
    }),

    'string-to-array': ({ a = 's' } = {}) => ({
        c: `int* solution(const char* ${a}, int* returnSize) {\n    // Write your code here\n    *returnSize = 0;\n    return NULL;\n}`,
        cpp: `class Solution {\npublic:\n    vector<int> solution(string ${a}) {\n        // Write your code here\n        return {};\n    }\n};`,
        java: `class Solution {\n    public List<Integer> solution(String ${a}) {\n        // Write your code here\n        return new ArrayList<>();\n    }\n}`,
        js: `function solution(${a}) {\n    // Write your code here\n    return [];\n}`,
        python: `def solution(${a}):\n    # Write your code here\n    return []`
    }),

    'string-to-sorted-strings': ({ a = 'digits' } = {}) => ({
        c: `char** solution(const char* ${a}, int* returnSize) {\n    // Write your code here\n    *returnSize = 0;\n    return NULL;\n}`,
        cpp: `class Solution {\npublic:\n    vector<string> solution(string ${a}) {\n        // Write your code here\n        return {};\n    }\n};`,
        java: `class Solution {\n    public List<String> solution(String ${a}) {\n        // Write your code here\n        return new ArrayList<>();\n    }\n}`,
        js: `function solution(${a}) {\n    // Write your code here\n    return [];\n}`,
        python: `def solution(${a}):\n    # Write your code here\n    return []`
    }),

    'string-words-to-bool': ({ a = 's', b = 'wordDict' } = {}) => ({
        c: `bool solution(const char* ${a}, char** ${b}, int ${b}Size) {\n    // Write your code here\n    return false;\n}`,
        cpp: `class Solution {\npublic:\n    bool solution(string ${a}, vector<string>& ${b}) {\n        // Write your code here\n        return false;\n    }\n};`,
        java: `class Solution {\n    public boolean solution(String ${a}, List<String> ${b}) {\n        // Write your code here\n        return false;\n    }\n}`,
        js: `function solution(${a}, ${b}) {\n    // Write your code here\n    return false;\n}`,
        python: `def solution(${a}, ${b}):\n    # Write your code here\n    return False`
    }),

    'two-strings-to-bool': ({ a = 's', b = 't' } = {}) => ({
        c: `bool solution(const char* ${a}, const char* ${b}) {\n    // Write your code here\n    return false;\n}`,
        cpp: `class Solution {\npublic:\n    bool solution(string ${a}, string ${b}) {\n        // Write your code here\n        return false;\n    }\n};`,
        java: `class Solution {\n    public boolean solution(String ${a}, String ${b}) {\n        // Write your code here\n        return false;\n    }\n}`,
        js: `function solution(${a}, ${b}) {\n    // Write your code here\n    return false;\n}`,
        python: `def solution(${a}, ${b}):\n    # Write your code here\n    return False`
    }),

    'two-strings-to-int': ({ a = 'text1', b = 'text2' } = {}) => ({
        c: `int solution(const char* ${a}, const char* ${b}) {\n    // Write your code here\n    return 0;\n}`,
        cpp: `class Solution {\npublic:\n    int solution(string ${a}, string ${b}) {\n        // Write your code here\n        return 0;\n    }\n};`,
        java: `class Solution {\n    public int solution(String ${a}, String ${b}) {\n        // Write your code here\n        return 0;\n    }\n}`,
        js: `function solution(${a}, ${b}) {\n    // Write your code here\n    return 0;\n}`,
        python: `def solution(${a}, ${b}):\n    # Write your code here\n    return 0`
    }),

    'two-strings-to-string': ({ a = 's', b = 't' } = {}) => ({
        c: `char* solution(const char* ${a}, const char* ${b}) {\n    // Write your code here (return a heap- or static-allocated string)\n    return "";\n}`,
        cpp: `class Solution {\npublic:\n    string solution(string ${a}, string ${b}) {\n        // Write your code here\n        return "";\n    }\n};`,
        java: `class Solution {\n    public String solution(String ${a}, String ${b}) {\n        // Write your code here\n        return "";\n    }\n}`,
        js: `function solution(${a}, ${b}) {\n    // Write your code here\n    return '';\n}`,
        python: `def solution(${a}, ${b}):\n    # Write your code here\n    return ''`
    }),

    'three-strings-to-bool': ({ a = 's1', b = 's2', c = 's3' } = {}) => ({
        c: `bool solution(const char* ${a}, const char* ${b}, const char* ${c}) {\n    // Write your code here\n    return false;\n}`,
        cpp: `class Solution {\npublic:\n    bool solution(string ${a}, string ${b}, string ${c}) {\n        // Write your code here\n        return false;\n    }\n};`,
        java: `class Solution {\n    public boolean solution(String ${a}, String ${b}, String ${c}) {\n        // Write your code here\n        return false;\n    }\n}`,
        js: `function solution(${a}, ${b}, ${c}) {\n    // Write your code here\n    return false;\n}`,
        python: `def solution(${a}, ${b}, ${c}):\n    # Write your code here\n    return False`
    }),

    'words-to-int': ({ a = 'tokens' } = {}) => ({
        c: `int solution(char** ${a}, int ${a}Size) {\n    // Write your code here\n    return 0;\n}`,
        cpp: `class Solution {\npublic:\n    int solution(vector<string>& ${a}) {\n        // Write your code here\n        return 0;\n    }\n};`,
        java: `class Solution {\n    public int solution(String[] ${a}) {\n        // Write your code here\n        return 0;\n    }\n}`,
        js: `function solution(${a}) {\n    // Write your code here\n    return 0;\n}`,
        python: `def solution(${a}):\n    # Write your code here\n    return 0`
    }),

    'words-k-to-int': ({ a = 'tasks', b = 'n' } = {}) => ({
        c: `int solution(char** ${a}, int ${a}Size, int ${b}) {\n    // Write your code here\n    return 0;\n}`,
        cpp: `class Solution {\npublic:\n    int solution(vector<string>& ${a}, int ${b}) {\n        // Write your code here\n        return 0;\n    }\n};`,
        java: `class Solution {\n    public int solution(String[] ${a}, int ${b}) {\n        // Write your code here\n        return 0;\n    }\n}`,
        js: `function solution(${a}, ${b}) {\n    // Write your code here\n    return 0;\n}`,
        python: `def solution(${a}, ${b}):\n    # Write your code here\n    return 0`
    }),

    'matrix-to-int': ({ a = 'grid' } = {}) => ({
        c: `int solution(int** ${a}, int rows, int cols) {\n    // Write your code here\n    return 0;\n}`,
        cpp: `class Solution {\npublic:\n    int solution(vector<vector<int>>& ${a}) {\n        // Write your code here\n        return 0;\n    }\n};`,
        java: `class Solution {\n    public int solution(int[][] ${a}) {\n        // Write your code here\n        return 0;\n    }\n}`,
        js: `function solution(${a}) {\n    // Write your code here\n    return 0;\n}`,
        python: `def solution(${a}):\n    # Write your code here\n    return 0`
    }),

    'matrix-to-array': ({ a = 'matrix' } = {}) => ({
        c: `int* solution(int** ${a}, int rows, int cols, int* returnSize) {\n    // Write your code here\n    *returnSize = 0;\n    return NULL;\n}`,
        cpp: `class Solution {\npublic:\n    vector<int> solution(vector<vector<int>>& ${a}) {\n        // Write your code here\n        return {};\n    }\n};`,
        java: `class Solution {\n    public List<Integer> solution(int[][] ${a}) {\n        // Write your code here\n        return new ArrayList<>();\n    }\n}`,
        js: `function solution(${a}) {\n    // Write your code here\n    return [];\n}`,
        python: `def solution(${a}):\n    # Write your code here\n    return []`
    }),

    'matrix-inplace': ({ a = 'matrix' } = {}) => ({
        c: `void solution(int** ${a}, int rows, int cols) {\n    // Modify ${a} in place\n}`,
        cpp: `class Solution {\npublic:\n    void solution(vector<vector<int>>& ${a}) {\n        // Modify ${a} in place\n    }\n};`,
        java: `class Solution {\n    public void solution(int[][] ${a}) {\n        // Modify ${a} in place\n    }\n}`,
        js: `function solution(${a}) {\n    // Modify ${a} in place\n}`,
        python: `def solution(${a}):\n    # Modify ${a} in place\n    pass`
    }),

    'matrix-target-to-bool': ({ a = 'matrix', b = 'target' } = {}) => ({
        c: `bool solution(int** ${a}, int rows, int cols, int ${b}) {\n    // Write your code here\n    return false;\n}`,
        cpp: `class Solution {\npublic:\n    bool solution(vector<vector<int>>& ${a}, int ${b}) {\n        // Write your code here\n        return false;\n    }\n};`,
        java: `class Solution {\n    public boolean solution(int[][] ${a}, int ${b}) {\n        // Write your code here\n        return false;\n    }\n}`,
        js: `function solution(${a}, ${b}) {\n    // Write your code here\n    return false;\n}`,
        python: `def solution(${a}, ${b}):\n    # Write your code here\n    return False`
    }),

    'intervals': ({ a = 'intervals' } = {}) => ({
        c: `int** solution(int ${a}[][2], int ${a}Size, int* returnSize) {\n    // Write your code here\n    *returnSize = 0;\n    return NULL;\n}`,
        cpp: `class Solution {\npublic:\n    vector<vector<int>> solution(vector<vector<int>>& ${a}) {\n        // Write your code here\n        return {};\n    }\n};`,
        java: `class Solution {\n    public int[][] solution(int[][] ${a}) {\n        // Write your code here\n        return new int[][]{};\n    }\n}`,
        js: `function solution(${a}) {\n    // Write your code here\n    return [];\n}`,
        python: `def solution(${a}):\n    # Write your code here\n    return []`
    }),

    'intervals-to-int': ({ a = 'intervals' } = {}) => ({
        c: `int solution(int ${a}[][2], int ${a}Size) {\n    // Write your code here\n    return 0;\n}`,
        cpp: `class Solution {\npublic:\n    int solution(vector<vector<int>>& ${a}) {\n        // Write your code here\n        return 0;\n    }\n};`,
        java: `class Solution {\n    public int solution(int[][] ${a}) {\n        // Write your code here\n        return 0;\n    }\n}`,
        js: `function solution(${a}) {\n    // Write your code here\n    return 0;\n}`,
        python: `def solution(${a}):\n    # Write your code here\n    return 0`
    }),

    'intervals-to-bool': ({ a = 'intervals' } = {}) => ({
        c: `bool solution(int ${a}[][2], int ${a}Size) {\n    // Write your code here\n    return false;\n}`,
        cpp: `class Solution {\npublic:\n    bool solution(vector<vector<int>>& ${a}) {\n        // Write your code here\n        return false;\n    }\n};`,
        java: `class Solution {\n    public boolean solution(int[][] ${a}) {\n        // Write your code here\n        return false;\n    }\n}`,
        js: `function solution(${a}) {\n    // Write your code here\n    return false;\n}`,
        python: `def solution(${a}):\n    # Write your code here\n    return False`
    }),

    'intervals-new-to-intervals': ({ a = 'intervals', b = 'newInterval' } = {}) => ({
        c: `int** solution(int ${a}[][2], int ${a}Size, int* ${b}, int* returnSize) {\n    // Write your code here\n    *returnSize = 0;\n    return NULL;\n}`,
        cpp: `class Solution {\npublic:\n    vector<vector<int>> solution(vector<vector<int>>& ${a}, vector<int>& ${b}) {\n        // Write your code here\n        return {};\n    }\n};`,
        java: `class Solution {\n    public int[][] solution(int[][] ${a}, int[] ${b}) {\n        // Write your code here\n        return new int[][]{};\n    }\n}`,
        js: `function solution(${a}, ${b}) {\n    // Write your code here\n    return [];\n}`,
        python: `def solution(${a}, ${b}):\n    # Write your code here\n    return []`
    }),

    'int-pairs-to-bool': ({ a = 'n', b = 'pairs' } = {}) => ({
        c: `bool solution(int ${a}, int ${b}[][2], int ${b}Size) {\n    // Write your code here\n    return false;\n}`,
        cpp: `class Solution {\npublic:\n    bool solution(int ${a}, vector<vector<int>>& ${b}) {\n        // Write your code here\n        return false;\n    }\n};`,
        java: `class Solution {\n    public boolean solution(int ${a}, int[][] ${b}) {\n        // Write your code here\n        return false;\n    }\n}`,
        js: `function solution(${a}, ${b}) {\n    // Write your code here\n    return false;\n}`,
        python: `def solution(${a}, ${b}):\n    # Write your code here\n    return False`
    }),

    'int-pairs-to-int': ({ a = 'n', b = 'edges' } = {}) => ({
        c: `int solution(int ${a}, int ${b}[][2], int ${b}Size) {\n    // Write your code here\n    return 0;\n}`,
        cpp: `class Solution {\npublic:\n    int solution(int ${a}, vector<vector<int>>& ${b}) {\n        // Write your code here\n        return 0;\n    }\n};`,
        java: `class Solution {\n    public int solution(int ${a}, int[][] ${b}) {\n        // Write your code here\n        return 0;\n    }\n}`,
        js: `function solution(${a}, ${b}) {\n    // Write your code here\n    return 0;\n}`,
        python: `def solution(${a}, ${b}):\n    # Write your code here\n    return 0`
    }),

    'int-pairs-to-array': ({ a = 'n', b = 'edges' } = {}) => ({
        c: `int* solution(int ${a}, int ${b}[][2], int ${b}Size, int* returnSize) {\n    // Write your code here\n    *returnSize = 0;\n    return NULL;\n}`,
        cpp: `class Solution {\npublic:\n    vector<int> solution(int ${a}, vector<vector<int>>& ${b}) {\n        // Write your code here\n        return {};\n    }\n};`,
        java: `class Solution {\n    public int[] solution(int ${a}, int[][] ${b}) {\n        // Write your code here\n        return new int[]{};\n    }\n}`,
        js: `function solution(${a}, ${b}) {\n    // Write your code here\n    return [];\n}`,
        python: `def solution(${a}, ${b}):\n    # Write your code here\n    return []`
    }),

    'n-to-sorted-strings': ({ a = 'n' } = {}) => ({
        c: `char** solution(int ${a}, int* returnSize) {\n    // Write your code here\n    *returnSize = 0;\n    return NULL;\n}`,
        cpp: `class Solution {\npublic:\n    vector<string> solution(int ${a}) {\n        // Write your code here\n        return {};\n    }\n};`,
        java: `class Solution {\n    public String[] solution(int ${a}) {\n        // Write your code here\n        return new String[]{};\n    }\n}`,
        js: `function solution(${a}) {\n    // Write your code here\n    return [];\n}`,
        python: `def solution(${a}):\n    # Write your code here\n    return []`
    })
};

// ---------------------------------------------------------------------------
// stdin parsers (mirror the harness wire formats exactly)
// ---------------------------------------------------------------------------
function toks(input) { return input.trim().split(/\s+/).filter(Boolean); }
function ints(input) { return toks(input).map(Number); }
function lines(input) { return input.split('\n'); }

const parsers = {
    'two-sum': (inp) => { const t = ints(inp); const n = t[0]; return [t.slice(1, 1 + n), t[1 + n]]; },
    'two-ints-to-int': (inp) => { const t = ints(inp); return [t[0], t[1]]; },
    'int-to-int': (inp) => [ints(inp)[0]],
    'int-to-bool': (inp) => [ints(inp)[0]],
    'int-to-array': (inp) => [ints(inp)[0]],
    'long-to-long': (inp) => [ints(inp)[0]],
    'array-to-int': (inp) => { const t = ints(inp); return [t.slice(1, 1 + t[0])]; },
    'array-to-bool': (inp) => { const t = ints(inp); return [t.slice(1, 1 + t[0])]; },
    'array-to-array': (inp) => { const t = ints(inp); return [t.slice(1, 1 + t[0])]; },
    'array-to-nested': (inp) => { const t = ints(inp); return [t.slice(1, 1 + t[0])]; },
    'array-to-perms': (inp) => { const t = ints(inp); return [t.slice(1, 1 + t[0])]; },
    'array-target-to-int': (inp) => { const t = ints(inp); const n = t[0]; return [t.slice(1, 1 + n), t[1 + n]]; },
    'array-target-to-bool': (inp) => { const t = ints(inp); const n = t[0]; return [t.slice(1, 1 + n), t[1 + n]]; },
    'array-target-to-array': (inp) => { const t = ints(inp); const n = t[0]; return [t.slice(1, 1 + n), t[1 + n]]; },
    'array-target-to-nested': (inp) => { const t = ints(inp); const n = t[0]; return [t.slice(1, 1 + n), t[1 + n]]; },
    'array-k-to-array': (inp) => { const t = ints(inp); return [t.slice(2, 2 + t[0]), t[1]]; },
    'array-k-to-sorted-array': (inp) => { const t = ints(inp); return [t.slice(2, 2 + t[0]), t[1]]; },
    'two-arrays-to-int': (inp) => { const t = ints(inp); let i = 0; const n = t[i++]; const a = t.slice(i, i + n); i += n; const m = t[i++]; const b = t.slice(i, i + m); return [a, b]; },
    'two-arrays-to-double': (inp) => { const t = ints(inp); let i = 0; const n = t[i++]; const a = t.slice(i, i + n); i += n; const m = t[i++]; const b = t.slice(i, i + m); return [a, b]; },
    'double-int-to-double': (inp) => { const t = toks(inp); return [parseFloat(t[0]), parseInt(t[1], 10)]; },
    'string-to-bool': (inp) => [lines(inp)[0] ?? ''],
    'string-to-int': (inp) => [lines(inp)[0] ?? ''],
    'string-to-string': (inp) => [lines(inp)[0] ?? ''],
    'string-to-array': (inp) => [lines(inp)[0] ?? ''],
    'string-to-sorted-strings': (inp) => [lines(inp)[0] ?? ''],
    'string-k-to-int': (inp) => { const l = lines(inp); return [l[0] ?? '', parseInt(l[1], 10)]; },
    'string-words-to-bool': (inp) => { const l = lines(inp); const n = parseInt(l[1], 10); return [l[0] ?? '', l[2].trim().split(/\s+/).slice(0, n)]; },
    'two-strings-to-bool': (inp) => { const l = lines(inp); return [l[0] ?? '', l[1] ?? '']; },
    'two-strings-to-int': (inp) => { const l = lines(inp); return [l[0] ?? '', l[1] ?? '']; },
    'two-strings-to-string': (inp) => { const l = lines(inp); return [l[0] ?? '', l[1] ?? '']; },
    'three-strings-to-bool': (inp) => { const l = lines(inp); return [l[0] ?? '', l[1] ?? '', l[2] ?? '']; },
    'words-to-int': (inp) => { const t = toks(inp); const n = parseInt(t[0], 10); return [t.slice(1, 1 + n)]; },
    'words-k-to-int': (inp) => { const t = toks(inp); const n = parseInt(t[0], 10); const k = parseInt(t[1], 10); return [t.slice(2, 2 + n), k]; },
    'matrix-to-int': (inp) => { const t = ints(inp); const [r, c] = [t[0], t[1]]; const g = []; for (let i = 0; i < r; i++) g.push(t.slice(2 + i * c, 2 + (i + 1) * c)); return [g]; },
    'matrix-to-array': (inp) => { const t = ints(inp); const [r, c] = [t[0], t[1]]; const g = []; for (let i = 0; i < r; i++) g.push(t.slice(2 + i * c, 2 + (i + 1) * c)); return [g]; },
    'matrix-inplace': (inp) => { const t = ints(inp); const [r, c] = [t[0], t[1]]; const g = []; for (let i = 0; i < r; i++) g.push(t.slice(2 + i * c, 2 + (i + 1) * c)); return [g]; },
    'matrix-target-to-bool': (inp) => { const t = ints(inp); const [r, c] = [t[0], t[1]]; const g = []; for (let i = 0; i < r; i++) g.push(t.slice(2 + i * c, 2 + (i + 1) * c)); return [g, t[2 + r * c]]; },
    'intervals': (inp) => { const t = ints(inp); const n = t[0]; const iv = []; for (let i = 0; i < n; i++) iv.push([t[1 + i * 2], t[2 + i * 2]]); return [iv]; },
    'intervals-to-int': (inp) => { const t = ints(inp); const n = t[0]; const iv = []; for (let i = 0; i < n; i++) iv.push([t[1 + i * 2], t[2 + i * 2]]); return [iv]; },
    'intervals-to-bool': (inp) => { const t = ints(inp); const n = t[0]; const iv = []; for (let i = 0; i < n; i++) iv.push([t[1 + i * 2], t[2 + i * 2]]); return [iv]; },
    'intervals-new-to-intervals': (inp) => { const t = ints(inp); const n = t[0]; const iv = []; for (let i = 0; i < n; i++) iv.push([t[1 + i * 2], t[2 + i * 2]]); return [iv, [t[1 + n * 2], t[2 + n * 2]]]; },
    'int-pairs-to-bool': (inp) => { const t = ints(inp); const [n, m] = [t[0], t[1]]; const p = []; for (let i = 0; i < m; i++) p.push([t[2 + i * 2], t[3 + i * 2]]); return [n, p]; },
    'int-pairs-to-int': (inp) => { const t = ints(inp); const [n, m] = [t[0], t[1]]; const p = []; for (let i = 0; i < m; i++) p.push([t[2 + i * 2], t[3 + i * 2]]); return [n, p]; },
    'int-pairs-to-array': (inp) => { const t = ints(inp); const [n, m] = [t[0], t[1]]; const p = []; for (let i = 0; i < m; i++) p.push([t[2 + i * 2], t[3 + i * 2]]); return [n, p]; },
    'n-to-sorted-strings': (inp) => [ints(inp)[0]]
};

// ---------------------------------------------------------------------------
// canonical printers (mirror harness stdout exactly)
// ---------------------------------------------------------------------------
const bool = (v) => (v ? 'true' : 'false');
const joined = (arr) => arr.join(' ');
const nested = (rows, sortWithin) =>
    rows
        .map((r) => (sortWithin ? r.slice().sort((x, y) => x - y) : r).join(' '))
        .sort()
        .join('\n');
const intervalLines = (rows) => rows.map((iv) => `${iv[0]} ${iv[1]}`).join('\n');

const printers = {
    'two-sum': (ret) => (ret && ret.length >= 2 ? `${ret[0]} ${ret[1]}` : 'NO_ANSWER'),
    'two-ints-to-int': (ret) => String(ret),
    'int-to-int': (ret) => String(ret),
    'int-to-bool': (ret) => bool(ret),
    'int-to-array': (ret) => joined(ret),
    'long-to-long': (ret) => String(ret),
    'array-to-int': (ret) => String(ret),
    'array-to-bool': (ret) => bool(ret),
    'array-to-array': (ret) => joined(ret),
    'array-to-nested': (ret) => nested(ret, true),
    'array-to-perms': (ret) => nested(ret, false),
    'array-target-to-int': (ret) => String(ret),
    'array-target-to-bool': (ret) => bool(ret),
    'array-target-to-array': (ret) => joined(ret),
    'array-target-to-nested': (ret) => nested(ret, true),
    'array-k-to-array': (ret) => joined(ret),
    'array-k-to-sorted-array': (ret) => joined(ret.slice().sort((a, b) => a - b)),
    'two-arrays-to-int': (ret) => String(ret),
    'two-arrays-to-double': (ret) => ret.toFixed(5),
    'double-int-to-double': (ret) => ret.toFixed(5),
    'string-to-bool': (ret) => bool(ret),
    'string-to-int': (ret) => String(ret),
    'string-to-string': (ret) => String(ret),
    'string-to-array': (ret) => joined(ret),
    'string-to-sorted-strings': (ret) => ret.slice().sort().join(' '),
    'string-k-to-int': (ret) => String(ret),
    'string-words-to-bool': (ret) => bool(ret),
    'two-strings-to-bool': (ret) => bool(ret),
    'two-strings-to-int': (ret) => String(ret),
    'two-strings-to-string': (ret) => String(ret),
    'three-strings-to-bool': (ret) => bool(ret),
    'words-to-int': (ret) => String(ret),
    'words-k-to-int': (ret) => String(ret),
    'matrix-to-int': (ret) => String(ret),
    'matrix-to-array': (ret) => joined(ret),
    'matrix-inplace': (_ret, args) => joined(args[0].flat()),
    'matrix-target-to-bool': (ret) => bool(ret),
    'intervals': (ret) => intervalLines(ret),
    'intervals-to-int': (ret) => String(ret),
    'intervals-to-bool': (ret) => bool(ret),
    'intervals-new-to-intervals': (ret) => intervalLines(ret),
    'int-pairs-to-bool': (ret) => bool(ret),
    'int-pairs-to-int': (ret) => String(ret),
    'int-pairs-to-array': (ret) => joined(ret),
    'n-to-sorted-strings': (ret) => ret.slice().sort().join(' ')
};

// ---------------------------------------------------------------------------
// Expected-output computation from the JS reference solution
// ---------------------------------------------------------------------------
function computeExpected(runner, solutionJs, input) {
    const parse = parsers[runner];
    const print = printers[runner];
    if (!parse || !print) throw new Error(`No parser/printer for runner: ${runner}`);
    // eslint-disable-next-line no-new-func
    const fn = new Function(`return (${solutionJs})`)();
    const args = parse(input);
    const ret = fn(...args);
    return print(ret, args);
}

module.exports = { tpl, parsers, printers, computeExpected };
