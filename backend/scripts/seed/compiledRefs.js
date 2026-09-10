// C / C++ / Java reference solutions for the trickiest harness shapes.
//
// These target the generated harnesses with the most intricate scaffolding —
// nested-result printers with qsort/malloc, matrix mutation, interval output,
// string returns, doubles, and sorted string lists — because that is where a
// harness bug would actually hide. Verified by verifyHarness.js, which
// compiles and runs each one and requires byte-identical output to the JS
// reference over the same inputs.
//
// Keyed by problem id, then language.
module.exports = {
    // nested output, rows sorted + sorted within (qsort on int rows, then strcmp on lines)
    '3sum': {
        cpp: `class Solution {
public:
    vector<vector<int>> solution(vector<int>& nums) {
        sort(nums.begin(), nums.end());
        vector<vector<int>> res;
        for (size_t i = 0; i + 2 < nums.size(); i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            size_t l = i + 1, r = nums.size() - 1;
            while (l < r) {
                int s = nums[i] + nums[l] + nums[r];
                if (s == 0) {
                    res.push_back({nums[i], nums[l], nums[r]});
                    while (l < r && nums[l] == nums[l + 1]) l++;
                    while (l < r && nums[r] == nums[r - 1]) r--;
                    l++; r--;
                } else if (s < 0) l++;
                else r--;
            }
        }
        return res;
    }
};`,
        java: `class Solution {
    public java.util.List<java.util.List<Integer>> solution(int[] nums) {
        java.util.Arrays.sort(nums);
        java.util.List<java.util.List<Integer>> res = new java.util.ArrayList<>();
        for (int i = 0; i + 2 < nums.length; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            int l = i + 1, r = nums.length - 1;
            while (l < r) {
                int s = nums[i] + nums[l] + nums[r];
                if (s == 0) {
                    res.add(new java.util.ArrayList<>(java.util.Arrays.asList(nums[i], nums[l], nums[r])));
                    while (l < r && nums[l] == nums[l + 1]) l++;
                    while (l < r && nums[r] == nums[r - 1]) r--;
                    l++; r--;
                } else if (s < 0) l++;
                else r--;
            }
        }
        return res;
    }
}`,
        c: `static int cmp_asc(const void *a, const void *b) { return *(const int*)a - *(const int*)b; }

int** solution(int* nums, int numsSize, int* returnSize, int** returnColumnSizes) {
    qsort(nums, numsSize, sizeof(int), cmp_asc);
    int cap = 256;
    int **res = malloc(sizeof(int*) * cap);
    int *cols = malloc(sizeof(int) * cap);
    int count = 0;
    for (int i = 0; i + 2 < numsSize; i++) {
        if (i > 0 && nums[i] == nums[i - 1]) continue;
        int l = i + 1, r = numsSize - 1;
        while (l < r) {
            int s = nums[i] + nums[l] + nums[r];
            if (s == 0) {
                res[count] = malloc(sizeof(int) * 3);
                res[count][0] = nums[i]; res[count][1] = nums[l]; res[count][2] = nums[r];
                cols[count] = 3;
                count++;
                while (l < r && nums[l] == nums[l + 1]) l++;
                while (l < r && nums[r] == nums[r - 1]) r--;
                l++; r--;
            } else if (s < 0) l++;
            else r--;
        }
    }
    *returnSize = count;
    *returnColumnSizes = cols;
    return res;
}`
    },

    // nested output, order-sensitive within rows
    permutations: {
        cpp: `class Solution {
public:
    vector<vector<int>> solution(vector<int>& nums) {
        vector<vector<int>> res;
        vector<int> a = nums;
        sort(a.begin(), a.end());
        do { res.push_back(a); } while (next_permutation(a.begin(), a.end()));
        return res;
    }
};`,
        java: `class Solution {
    public java.util.List<java.util.List<Integer>> solution(int[] nums) {
        java.util.List<java.util.List<Integer>> res = new java.util.ArrayList<>();
        go(new java.util.ArrayList<>(), new java.util.ArrayList<Integer>() {{
            for (int x : nums) add(x);
        }}, res);
        return res;
    }
    private void go(java.util.List<Integer> cur, java.util.List<Integer> rest,
                    java.util.List<java.util.List<Integer>> res) {
        if (rest.isEmpty()) { res.add(new java.util.ArrayList<>(cur)); return; }
        for (int i = 0; i < rest.size(); i++) {
            java.util.List<Integer> nextRest = new java.util.ArrayList<>(rest);
            int v = nextRest.remove(i);
            cur.add(v);
            go(cur, nextRest, res);
            cur.remove(cur.size() - 1);
        }
    }
}`
    },

    // in-place matrix mutation, printed row-major by the harness
    'rotate-image': {
        cpp: `class Solution {
public:
    void solution(vector<vector<int>>& matrix) {
        int n = matrix.size();
        for (int i = 0; i < n; i++)
            for (int j = i + 1; j < n; j++)
                swap(matrix[i][j], matrix[j][i]);
        for (auto &row : matrix) reverse(row.begin(), row.end());
    }
};`,
        java: `class Solution {
    public void solution(int[][] matrix) {
        int n = matrix.length;
        for (int i = 0; i < n; i++)
            for (int j = i + 1; j < n; j++) {
                int t = matrix[i][j]; matrix[i][j] = matrix[j][i]; matrix[j][i] = t;
            }
        for (int[] row : matrix)
            for (int l = 0, r = n - 1; l < r; l++, r--) {
                int t = row[l]; row[l] = row[r]; row[r] = t;
            }
    }
}`,
        c: `void solution(int** matrix, int rows, int cols) {
    for (int i = 0; i < rows; i++)
        for (int j = i + 1; j < cols; j++) {
            int t = matrix[i][j]; matrix[i][j] = matrix[j][i]; matrix[j][i] = t;
        }
    for (int i = 0; i < rows; i++)
        for (int l = 0, r = cols - 1; l < r; l++, r--) {
            int t = matrix[i][l]; matrix[i][l] = matrix[i][r]; matrix[i][r] = t;
        }
}`
    },

    // interval output, one "a b" per line
    'merge-intervals': {
        cpp: `class Solution {
public:
    vector<vector<int>> solution(vector<vector<int>>& intervals) {
        sort(intervals.begin(), intervals.end());
        vector<vector<int>> res;
        for (auto &iv : intervals) {
            if (!res.empty() && iv[0] <= res.back()[1]) res.back()[1] = max(res.back()[1], iv[1]);
            else res.push_back(iv);
        }
        return res;
    }
};`,
        java: `class Solution {
    public int[][] solution(int[][] intervals) {
        java.util.Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
        java.util.List<int[]> res = new java.util.ArrayList<>();
        for (int[] iv : intervals) {
            if (!res.isEmpty() && iv[0] <= res.get(res.size() - 1)[1])
                res.get(res.size() - 1)[1] = Math.max(res.get(res.size() - 1)[1], iv[1]);
            else res.add(new int[]{iv[0], iv[1]});
        }
        return res.toArray(new int[0][]);
    }
}`
    },

    // string return value
    'multiply-strings': {
        cpp: `class Solution {
public:
    string solution(string num1, string num2) {
        if (num1 == "0" || num2 == "0") return "0";
        int m = num1.size(), n = num2.size();
        vector<int> res(m + n, 0);
        for (int i = m - 1; i >= 0; i--)
            for (int j = n - 1; j >= 0; j--) {
                int mul = (num1[i] - '0') * (num2[j] - '0') + res[i + j + 1];
                res[i + j + 1] = mul % 10;
                res[i + j] += mul / 10;
            }
        string s;
        for (int v : res) s += char('0' + v);
        int k = 0;
        while (k + 1 < (int)s.size() && s[k] == '0') k++;
        return s.substr(k);
    }
};`,
        java: `class Solution {
    public String solution(String num1, String num2) {
        if (num1.equals("0") || num2.equals("0")) return "0";
        int m = num1.length(), n = num2.length();
        int[] res = new int[m + n];
        for (int i = m - 1; i >= 0; i--)
            for (int j = n - 1; j >= 0; j--) {
                int mul = (num1.charAt(i) - '0') * (num2.charAt(j) - '0') + res[i + j + 1];
                res[i + j + 1] = mul % 10;
                res[i + j] += mul / 10;
            }
        StringBuilder sb = new StringBuilder();
        for (int v : res) sb.append((char) ('0' + v));
        int k = 0;
        while (k + 1 < sb.length() && sb.charAt(k) == '0') k++;
        return sb.substring(k);
    }
}`
    },

    // double formatting to 5 decimals across languages
    'pow-x-n': {
        cpp: `class Solution {
public:
    double solution(double x, int n) {
        long long e = n < 0 ? -(long long)n : (long long)n;
        double base = x, result = 1.0;
        while (e > 0) {
            if (e % 2 == 1) result *= base;
            base *= base;
            e /= 2;
        }
        return n < 0 ? 1.0 / result : result;
    }
};`,
        java: `class Solution {
    public double solution(double x, int n) {
        long e = n < 0 ? -(long) n : (long) n;
        double base = x, result = 1.0;
        while (e > 0) {
            if (e % 2 == 1) result *= base;
            base *= base;
            e /= 2;
        }
        return n < 0 ? 1.0 / result : result;
    }
}`,
        c: `double solution(double x, int n) {
    long long e = n < 0 ? -(long long)n : (long long)n;
    double base = x, result = 1.0;
    while (e > 0) {
        if (e % 2 == 1) result *= base;
        base *= base;
        e /= 2;
    }
    return n < 0 ? 1.0 / result : result;
}`
    },

    // sorted list-of-strings output
    'generate-parentheses': {
        cpp: `class Solution {
public:
    vector<string> solution(int n) {
        vector<string> res;
        go("", 0, 0, n, res);
        return res;
    }
private:
    void go(string cur, int open, int close, int n, vector<string>& res) {
        if ((int)cur.size() == n * 2) { res.push_back(cur); return; }
        if (open < n) go(cur + "(", open + 1, close, n, res);
        if (close < open) go(cur + ")", open, close + 1, n, res);
    }
};`,
        java: `class Solution {
    public String[] solution(int n) {
        java.util.List<String> res = new java.util.ArrayList<>();
        go("", 0, 0, n, res);
        return res.toArray(new String[0]);
    }
    private void go(String cur, int open, int close, int n, java.util.List<String> res) {
        if (cur.length() == n * 2) { res.add(cur); return; }
        if (open < n) go(cur + "(", open + 1, close, n, res);
        if (close < open) go(cur + ")", open, close + 1, n, res);
    }
}`
    },

    // int-array return from a line-based string input
    'partition-labels': {
        cpp: `class Solution {
public:
    vector<int> solution(string s) {
        int last[128] = {0};
        for (int i = 0; i < (int)s.size(); i++) last[(int)s[i]] = i;
        vector<int> res;
        int start = 0, end = 0;
        for (int i = 0; i < (int)s.size(); i++) {
            end = max(end, last[(int)s[i]]);
            if (i == end) { res.push_back(end - start + 1); start = i + 1; }
        }
        return res;
    }
};`,
        java: `class Solution {
    public java.util.List<Integer> solution(String s) {
        int[] last = new int[128];
        for (int i = 0; i < s.length(); i++) last[s.charAt(i)] = i;
        java.util.List<Integer> res = new java.util.ArrayList<>();
        int start = 0, end = 0;
        for (int i = 0; i < s.length(); i++) {
            end = Math.max(end, last[s.charAt(i)]);
            if (i == end) { res.add(end - start + 1); start = i + 1; }
        }
        return res;
    }
}`
    },

    // words + count input, int output
    'evaluate-reverse-polish-notation': {
        cpp: `class Solution {
public:
    int solution(vector<string>& tokens) {
        vector<int> st;
        for (auto &t : tokens) {
            if (t == "+" || t == "-" || t == "*" || t == "/") {
                int b = st.back(); st.pop_back();
                int a = st.back(); st.pop_back();
                if (t == "+") st.push_back(a + b);
                else if (t == "-") st.push_back(a - b);
                else if (t == "*") st.push_back(a * b);
                else st.push_back(a / b);
            } else st.push_back(stoi(t));
        }
        return st.back();
    }
};`,
        java: `class Solution {
    public int solution(String[] tokens) {
        java.util.Deque<Integer> st = new java.util.ArrayDeque<>();
        for (String t : tokens) {
            if (t.equals("+") || t.equals("-") || t.equals("*") || t.equals("/")) {
                int b = st.pop(), a = st.pop();
                if (t.equals("+")) st.push(a + b);
                else if (t.equals("-")) st.push(a - b);
                else if (t.equals("*")) st.push(a * b);
                else st.push(a / b);
            } else st.push(Integer.parseInt(t));
        }
        return st.pop();
    }
}`
    },

    // graph edge-list input, int-array output
    'redundant-connection': {
        cpp: `class Solution {
public:
    vector<int> solution(int n, vector<vector<int>>& edges) {
        vector<int> parent(n + 1);
        for (int i = 0; i <= n; i++) parent[i] = i;
        function<int(int)> find = [&](int x) {
            while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
            return x;
        };
        for (auto &e : edges) {
            int ra = find(e[0]), rb = find(e[1]);
            if (ra == rb) return {e[0], e[1]};
            parent[ra] = rb;
        }
        return {};
    }
};`,
        java: `class Solution {
    private int[] parent;
    private int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }
    public int[] solution(int n, int[][] edges) {
        parent = new int[n + 1];
        for (int i = 0; i <= n; i++) parent[i] = i;
        for (int[] e : edges) {
            int ra = find(e[0]), rb = find(e[1]);
            if (ra == rb) return new int[]{e[0], e[1]};
            parent[ra] = rb;
        }
        return new int[]{};
    }
}`
    },

    // two separate arrays in, int out
    'gas-station': {
        cpp: `class Solution {
public:
    int solution(vector<int>& gas, vector<int>& cost) {
        int total = 0, tank = 0, start = 0;
        for (size_t i = 0; i < gas.size(); i++) {
            int d = gas[i] - cost[i];
            total += d; tank += d;
            if (tank < 0) { start = i + 1; tank = 0; }
        }
        return total < 0 ? -1 : start;
    }
};`,
        java: `class Solution {
    public int solution(int[] gas, int[] cost) {
        int total = 0, tank = 0, start = 0;
        for (int i = 0; i < gas.length; i++) {
            int d = gas[i] - cost[i];
            total += d; tank += d;
            if (tank < 0) { start = i + 1; tank = 0; }
        }
        return total < 0 ? -1 : start;
    }
}`,
        c: `int solution(int* gas, int gasSize, int* cost, int costSize) {
    int total = 0, tank = 0, start = 0;
    for (int i = 0; i < gasSize; i++) {
        int d = gas[i] - cost[i];
        total += d; tank += d;
        if (tank < 0) { start = i + 1; tank = 0; }
    }
    return total < 0 ? -1 : start;
}`
    },

    // string + word list input
    'word-break': {
        cpp: `class Solution {
public:
    bool solution(string s, vector<string>& wordDict) {
        set<string> words(wordDict.begin(), wordDict.end());
        vector<bool> dp(s.size() + 1, false);
        dp[0] = true;
        for (size_t i = 1; i <= s.size(); i++)
            for (size_t j = 0; j < i; j++)
                if (dp[j] && words.count(s.substr(j, i - j))) { dp[i] = true; break; }
        return dp[s.size()];
    }
};`,
        java: `class Solution {
    public boolean solution(String s, java.util.List<String> wordDict) {
        java.util.Set<String> words = new java.util.HashSet<>(wordDict);
        boolean[] dp = new boolean[s.length() + 1];
        dp[0] = true;
        for (int i = 1; i <= s.length(); i++)
            for (int j = 0; j < i; j++)
                if (dp[j] && words.contains(s.substring(j, i))) { dp[i] = true; break; }
        return dp[s.length()];
    }
}`
    },

    // sorted int array from (nums, k)
    'top-k-frequent-elements': {
        cpp: `class Solution {
public:
    vector<int> solution(vector<int>& nums, int k) {
        map<int, int> freq;
        for (int x : nums) freq[x]++;
        vector<pair<int, int>> v(freq.begin(), freq.end());
        sort(v.begin(), v.end(), [](auto &a, auto &b) { return a.second > b.second; });
        vector<int> res;
        for (int i = 0; i < k && i < (int)v.size(); i++) res.push_back(v[i].first);
        return res;
    }
};`,
        java: `class Solution {
    public int[] solution(int[] nums, int k) {
        java.util.Map<Integer, Integer> freq = new java.util.HashMap<>();
        for (int x : nums) freq.merge(x, 1, Integer::sum);
        return freq.entrySet().stream()
            .sorted((a, b) -> b.getValue() - a.getValue())
            .limit(k)
            .mapToInt(java.util.Map.Entry::getKey)
            .toArray();
    }
}`
    },

    // matrix + target
    'search-a-2d-matrix': {
        cpp: `class Solution {
public:
    bool solution(vector<vector<int>>& matrix, int target) {
        int m = matrix.size(), n = matrix[0].size();
        int l = 0, r = m * n - 1;
        while (l <= r) {
            int mid = (l + r) / 2;
            int v = matrix[mid / n][mid % n];
            if (v == target) return true;
            if (v < target) l = mid + 1;
            else r = mid - 1;
        }
        return false;
    }
};`,
        java: `class Solution {
    public boolean solution(int[][] matrix, int target) {
        int m = matrix.length, n = matrix[0].length;
        int l = 0, r = m * n - 1;
        while (l <= r) {
            int mid = (l + r) / 2;
            int v = matrix[mid / n][mid % n];
            if (v == target) return true;
            if (v < target) l = mid + 1;
            else r = mid - 1;
        }
        return false;
    }
}`
    },

    // merged intervals with an inserted interval
    'insert-interval': {
        cpp: `class Solution {
public:
    vector<vector<int>> solution(vector<vector<int>>& intervals, vector<int>& newInterval) {
        vector<vector<int>> res;
        int s = newInterval[0], e = newInterval[1];
        size_t i = 0, n = intervals.size();
        while (i < n && intervals[i][1] < s) res.push_back(intervals[i++]);
        while (i < n && intervals[i][0] <= e) {
            s = min(s, intervals[i][0]);
            e = max(e, intervals[i][1]);
            i++;
        }
        res.push_back({s, e});
        while (i < n) res.push_back(intervals[i++]);
        return res;
    }
};`,
        java: `class Solution {
    public int[][] solution(int[][] intervals, int[] newInterval) {
        java.util.List<int[]> res = new java.util.ArrayList<>();
        int s = newInterval[0], e = newInterval[1];
        int i = 0, n = intervals.length;
        while (i < n && intervals[i][1] < s) res.add(intervals[i++]);
        while (i < n && intervals[i][0] <= e) {
            s = Math.min(s, intervals[i][0]);
            e = Math.max(e, intervals[i][1]);
            i++;
        }
        res.add(new int[]{s, e});
        while (i < n) res.add(intervals[i++]);
        return res.toArray(new int[0][]);
    }
}`
    },

    // two sorted arrays -> double
    'median-of-two-sorted-arrays': {
        cpp: `class Solution {
public:
    double solution(vector<int>& nums1, vector<int>& nums2) {
        vector<int> m(nums1);
        m.insert(m.end(), nums2.begin(), nums2.end());
        sort(m.begin(), m.end());
        int n = m.size();
        if (n % 2) return m[(n - 1) / 2];
        return (m[n / 2 - 1] + m[n / 2]) / 2.0;
    }
};`,
        java: `class Solution {
    public double solution(int[] nums1, int[] nums2) {
        int[] m = new int[nums1.length + nums2.length];
        System.arraycopy(nums1, 0, m, 0, nums1.length);
        System.arraycopy(nums2, 0, m, nums1.length, nums2.length);
        java.util.Arrays.sort(m);
        int n = m.length;
        if (n % 2 == 1) return m[(n - 1) / 2];
        return (m[n / 2 - 1] + m[n / 2]) / 2.0;
    }
}`
    }
};
