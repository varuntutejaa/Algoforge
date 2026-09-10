// Extended generic runner shapes for the Judge0 pipeline.
//
// Each shape defines, per language, how to wrap a user-submitted `solution`
// implementation with stdin parsing + canonical stdout printing. The wire
// formats here are mirrored exactly by the seed tooling in scripts/seed/
// (which computes expected outputs from reference solutions), so a correct
// solution in any language produces byte-identical canonical output.
//
// Canonicalization rules shared across languages:
//   - booleans print as lowercase "true"/"false"
//   - doubles print with exactly 5 decimal places
//   - nested int results: rows joined by single spaces, one row per line;
//     rows sorted as plain byte-wise strings; rows themselves sorted
//     ascending first unless the shape is order-sensitive (perms)
//
// Input wire formats follow the conventions of the original shapes in
// judge0.js: counts first, then values, whitespace separated — except
// line-based string inputs, which occupy whole lines (they may contain
// spaces and punctuation).

// ---------------------------------------------------------------------------
// Shared C snippets
// ---------------------------------------------------------------------------
const C_READ_LINE = [
    'static void read_line(char *buf, int cap) {',
    '    if (!fgets(buf, cap, stdin)) { buf[0] = 0; return; }',
    '    buf[strcspn(buf, "\\r\\n")] = 0;',
    '}'
].join('\n');

// C harness for shapes returning int** (LeetCode-style nested results).
// sortWithin: sort each row ascending before joining.
function cNestedPrinter(sortWithin) {
    return [
        'static int cmp_int(const void *a, const void *b) { return *(const int*)a - *(const int*)b; }',
        'static int cmp_str(const void *a, const void *b) { return strcmp(*(const char* const*)a, *(const char* const*)b); }',
        'static void print_nested(int **rows, int returnSize, int *colSizes) {',
        '    char **lines = malloc(sizeof(char*) * (returnSize > 0 ? returnSize : 1));',
        '    for (int i = 0; i < returnSize; i++) {',
        sortWithin ? '        qsort(rows[i], colSizes[i], sizeof(int), cmp_int);' : '',
        '        int cap = colSizes[i] * 13 + 2;',
        '        lines[i] = malloc(cap);',
        '        lines[i][0] = 0;',
        '        int off = 0;',
        '        for (int j = 0; j < colSizes[i]; j++) {',
        '            off += snprintf(lines[i] + off, cap - off, j ? " %d" : "%d", rows[i][j]);',
        '        }',
        '    }',
        '    qsort(lines, returnSize, sizeof(char*), cmp_str);',
        '    for (int i = 0; i < returnSize; i++) printf("%s\\n", lines[i]);',
        '}'
    ].filter(Boolean).join('\n');
}

// C++ nested printer.
function cppNestedPrinter(sortWithin) {
    return [
        'static void printNested(vector<vector<int>> rows) {',
        '    vector<string> lines;',
        '    for (auto &row : rows) {',
        sortWithin ? '        sort(row.begin(), row.end());' : '',
        '        string s;',
        '        for (size_t j = 0; j < row.size(); j++) { if (j) s += " "; s += to_string(row[j]); }',
        '        lines.push_back(s);',
        '    }',
        '    sort(lines.begin(), lines.end());',
        '    for (auto &s : lines) cout << s << "\\n";',
        '}'
    ].filter(Boolean).join('\n');
}

// Java nested printer.
function javaNestedPrinter(sortWithin) {
    return [
        '    static void printNested(java.util.List<java.util.List<Integer>> rows) {',
        '        java.util.List<String> lines = new java.util.ArrayList<>();',
        '        for (java.util.List<Integer> row : rows) {',
        sortWithin ? '            java.util.Collections.sort(row);' : '',
        '            StringBuilder sb = new StringBuilder();',
        '            for (int j = 0; j < row.size(); j++) { if (j > 0) sb.append(" "); sb.append(row.get(j)); }',
        '            lines.add(sb.toString());',
        '        }',
        '        java.util.Collections.sort(lines);',
        '        StringBuilder out = new StringBuilder();',
        '        for (String s : lines) out.append(s).append("\\n");',
        '        System.out.print(out);',
        '    }'
    ].filter(Boolean).join('\n');
}

const JS_NESTED = (sortWithin) => [
    'function __printNested(rows) {',
    '  const lines = rows.map((row) => {',
    sortWithin ? '    row = row.slice().sort((a, b) => a - b);' : '',
    "    return row.join(' ');",
    '  });',
    '  lines.sort();',
    "  console.log(lines.join('\\n'));",
    '}'
].filter(Boolean).join('\n');

const PY_NESTED = (sortWithin) => [
    'def __print_nested(rows):',
    sortWithin
        ? "    lines = sorted(' '.join(map(str, sorted(row))) for row in rows)"
        : "    lines = sorted(' '.join(map(str, row)) for row in rows)",
    "    print('\\n'.join(lines))"
].join('\n');

// ---------------------------------------------------------------------------
// The shapes
// ---------------------------------------------------------------------------
const extraRunners = {

    // ------------------------------------------------------------------
    // "n" -> int
    // ------------------------------------------------------------------
    'int-to-int': {
        c: (src) => [
            '#include <stdio.h>', '#include <stdlib.h>', '#include <string.h>', '#include <stdbool.h>', '',
            src, '',
            'int main() {',
            '    int n; if (scanf("%d", &n) != 1) return 0;',
            '    printf("%d\\n", solution(n));',
            '    return 0;',
            '}'
        ].join('\n'),
        cpp: (src) => [
            '#include <bits/stdc++.h>', 'using namespace std;', '', src, '',
            'int main() {',
            '    int n; cin >> n;',
            '    cout << Solution().solution(n) << endl;',
            '    return 0;',
            '}'
        ].join('\n'),
        java: (src) => [
            'import java.util.*;', '', src, '',
            'public class Main {',
            '    public static void main(String[] args) {',
            '        Scanner sc = new Scanner(System.in);',
            '        int n = sc.nextInt();',
            '        System.out.println(new Solution().solution(n));',
            '    }',
            '}'
        ].join('\n'),
        js: (src) => [
            src, '',
            "const n = parseInt(require('fs').readFileSync(0, 'utf8').trim(), 10);",
            'console.log(solution(n));'
        ].join('\n'),
        python: (src) => [
            src, '',
            'import sys',
            'n = int(sys.stdin.read().strip())',
            'print(solution(n))'
        ].join('\n')
    },

    // ------------------------------------------------------------------
    // "n" -> bool
    // ------------------------------------------------------------------
    'int-to-bool': {
        c: (src) => [
            '#include <stdio.h>', '#include <stdlib.h>', '#include <string.h>', '#include <stdbool.h>', '',
            src, '',
            'int main() {',
            '    int n; if (scanf("%d", &n) != 1) return 0;',
            '    puts(solution(n) ? "true" : "false");',
            '    return 0;',
            '}'
        ].join('\n'),
        cpp: (src) => [
            '#include <bits/stdc++.h>', 'using namespace std;', '', src, '',
            'int main() {',
            '    int n; cin >> n;',
            '    cout << (Solution().solution(n) ? "true" : "false") << endl;',
            '    return 0;',
            '}'
        ].join('\n'),
        java: (src) => [
            'import java.util.*;', '', src, '',
            'public class Main {',
            '    public static void main(String[] args) {',
            '        Scanner sc = new Scanner(System.in);',
            '        System.out.println(new Solution().solution(sc.nextInt()));',
            '    }',
            '}'
        ].join('\n'),
        js: (src) => [
            src, '',
            "const n = parseInt(require('fs').readFileSync(0, 'utf8').trim(), 10);",
            "console.log(solution(n) ? 'true' : 'false');"
        ].join('\n'),
        python: (src) => [
            src, '',
            'import sys',
            'n = int(sys.stdin.read().strip())',
            "print('true' if solution(n) else 'false')"
        ].join('\n')
    },

    // ------------------------------------------------------------------
    // "n" -> int array (space-joined, in order)
    // ------------------------------------------------------------------
    'int-to-array': {
        c: (src) => [
            '#include <stdio.h>', '#include <stdlib.h>', '#include <string.h>', '#include <stdbool.h>', '',
            src, '',
            'int main() {',
            '    int n; if (scanf("%d", &n) != 1) return 0;',
            '    int returnSize = 0;',
            '    int *result = solution(n, &returnSize);',
            '    for (int i = 0; i < returnSize; i++) { if (i) printf(" "); printf("%d", result[i]); }',
            '    printf("\\n");',
            '    free(result);',
            '    return 0;',
            '}'
        ].join('\n'),
        cpp: (src) => [
            '#include <bits/stdc++.h>', 'using namespace std;', '', src, '',
            'int main() {',
            '    int n; cin >> n;',
            '    vector<int> result = Solution().solution(n);',
            '    for (size_t i = 0; i < result.size(); i++) { if (i) cout << " "; cout << result[i]; }',
            '    cout << endl;',
            '    return 0;',
            '}'
        ].join('\n'),
        java: (src) => [
            'import java.util.*;', '', src, '',
            'public class Main {',
            '    public static void main(String[] args) {',
            '        Scanner sc = new Scanner(System.in);',
            '        int[] result = new Solution().solution(sc.nextInt());',
            '        StringBuilder sb = new StringBuilder();',
            '        for (int i = 0; i < result.length; i++) { if (i > 0) sb.append(" "); sb.append(result[i]); }',
            '        System.out.println(sb);',
            '    }',
            '}'
        ].join('\n'),
        js: (src) => [
            src, '',
            "const n = parseInt(require('fs').readFileSync(0, 'utf8').trim(), 10);",
            "console.log(solution(n).join(' '));"
        ].join('\n'),
        python: (src) => [
            src, '',
            'import sys',
            'n = int(sys.stdin.read().strip())',
            "print(' '.join(map(str, solution(n))))"
        ].join('\n')
    },

    // ------------------------------------------------------------------
    // "x" (long) -> long   (reverse-bits style, values up to 2^32-1)
    // ------------------------------------------------------------------
    'long-to-long': {
        c: (src) => [
            '#include <stdio.h>', '#include <stdlib.h>', '#include <string.h>', '#include <stdbool.h>', '',
            src, '',
            'int main() {',
            '    long long x; if (scanf("%lld", &x) != 1) return 0;',
            '    printf("%lld\\n", solution(x));',
            '    return 0;',
            '}'
        ].join('\n'),
        cpp: (src) => [
            '#include <bits/stdc++.h>', 'using namespace std;', '', src, '',
            'int main() {',
            '    long long x; cin >> x;',
            '    cout << Solution().solution(x) << endl;',
            '    return 0;',
            '}'
        ].join('\n'),
        java: (src) => [
            'import java.util.*;', '', src, '',
            'public class Main {',
            '    public static void main(String[] args) {',
            '        Scanner sc = new Scanner(System.in);',
            '        System.out.println(new Solution().solution(sc.nextLong()));',
            '    }',
            '}'
        ].join('\n'),
        js: (src) => [
            src, '',
            "const x = parseInt(require('fs').readFileSync(0, 'utf8').trim(), 10);",
            'console.log(solution(x));'
        ].join('\n'),
        python: (src) => [
            src, '',
            'import sys',
            'x = int(sys.stdin.read().strip())',
            'print(solution(x))'
        ].join('\n')
    },

    // ------------------------------------------------------------------
    // "n\nnums" -> bool
    // ------------------------------------------------------------------
    'array-to-bool': {
        c: (src) => [
            '#include <stdio.h>', '#include <stdlib.h>', '#include <string.h>', '#include <stdbool.h>', '',
            src, '',
            'int main() {',
            '    int n; if (scanf("%d", &n) != 1) return 0;',
            '    int *nums = malloc(sizeof(int) * (n > 0 ? n : 1));',
            '    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);',
            '    puts(solution(nums, n) ? "true" : "false");',
            '    free(nums);',
            '    return 0;',
            '}'
        ].join('\n'),
        cpp: (src) => [
            '#include <bits/stdc++.h>', 'using namespace std;', '', src, '',
            'int main() {',
            '    int n; cin >> n;',
            '    vector<int> nums(n);',
            '    for (int i = 0; i < n; i++) cin >> nums[i];',
            '    cout << (Solution().solution(nums) ? "true" : "false") << endl;',
            '    return 0;',
            '}'
        ].join('\n'),
        java: (src) => [
            'import java.util.*;', '', src, '',
            'public class Main {',
            '    public static void main(String[] args) {',
            '        Scanner sc = new Scanner(System.in);',
            '        int n = sc.nextInt();',
            '        int[] nums = new int[n];',
            '        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();',
            '        System.out.println(new Solution().solution(nums));',
            '    }',
            '}'
        ].join('\n'),
        js: (src) => [
            src, '',
            "const _tok = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);",
            'const n = _tok[0];',
            'const nums = _tok.slice(1, 1 + n);',
            "console.log(solution(nums) ? 'true' : 'false');"
        ].join('\n'),
        python: (src) => [
            src, '',
            'import sys',
            'data = sys.stdin.read().split()',
            'n = int(data[0])',
            'nums = [int(data[i + 1]) for i in range(n)]',
            "print('true' if solution(nums) else 'false')"
        ].join('\n')
    },

    // ------------------------------------------------------------------
    // "n\nnums\nk" -> bool  (hand-of-straights style)
    // ------------------------------------------------------------------
    'array-target-to-bool': {
        c: (src) => [
            '#include <stdio.h>', '#include <stdlib.h>', '#include <string.h>', '#include <stdbool.h>', '',
            src, '',
            'int main() {',
            '    int n; if (scanf("%d", &n) != 1) return 0;',
            '    int *nums = malloc(sizeof(int) * (n > 0 ? n : 1));',
            '    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);',
            '    int target; scanf("%d", &target);',
            '    puts(solution(nums, n, target) ? "true" : "false");',
            '    free(nums);',
            '    return 0;',
            '}'
        ].join('\n'),
        cpp: (src) => [
            '#include <bits/stdc++.h>', 'using namespace std;', '', src, '',
            'int main() {',
            '    int n; cin >> n;',
            '    vector<int> nums(n);',
            '    for (int i = 0; i < n; i++) cin >> nums[i];',
            '    int target; cin >> target;',
            '    cout << (Solution().solution(nums, target) ? "true" : "false") << endl;',
            '    return 0;',
            '}'
        ].join('\n'),
        java: (src) => [
            'import java.util.*;', '', src, '',
            'public class Main {',
            '    public static void main(String[] args) {',
            '        Scanner sc = new Scanner(System.in);',
            '        int n = sc.nextInt();',
            '        int[] nums = new int[n];',
            '        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();',
            '        int target = sc.nextInt();',
            '        System.out.println(new Solution().solution(nums, target));',
            '    }',
            '}'
        ].join('\n'),
        js: (src) => [
            src, '',
            "const _tok = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);",
            'const n = _tok[0];',
            'const nums = _tok.slice(1, 1 + n);',
            'const target = _tok[1 + n];',
            "console.log(solution(nums, target) ? 'true' : 'false');"
        ].join('\n'),
        python: (src) => [
            src, '',
            'import sys',
            'data = sys.stdin.read().split()',
            'n = int(data[0])',
            'nums = [int(data[i + 1]) for i in range(n)]',
            'target = int(data[n + 1])',
            "print('true' if solution(nums, target) else 'false')"
        ].join('\n')
    },

    // ------------------------------------------------------------------
    // "n\nnums\ntarget" -> int array (ordered; two-sum-ii style)
    // ------------------------------------------------------------------
    'array-target-to-array': {
        c: (src) => [
            '#include <stdio.h>', '#include <stdlib.h>', '#include <string.h>', '#include <stdbool.h>', '',
            src, '',
            'int main() {',
            '    int n; if (scanf("%d", &n) != 1) return 0;',
            '    int *nums = malloc(sizeof(int) * (n > 0 ? n : 1));',
            '    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);',
            '    int target; scanf("%d", &target);',
            '    int returnSize = 0;',
            '    int *result = solution(nums, n, target, &returnSize);',
            '    for (int i = 0; i < returnSize; i++) { if (i) printf(" "); printf("%d", result[i]); }',
            '    printf("\\n");',
            '    free(nums); free(result);',
            '    return 0;',
            '}'
        ].join('\n'),
        cpp: (src) => [
            '#include <bits/stdc++.h>', 'using namespace std;', '', src, '',
            'int main() {',
            '    int n; cin >> n;',
            '    vector<int> nums(n);',
            '    for (int i = 0; i < n; i++) cin >> nums[i];',
            '    int target; cin >> target;',
            '    vector<int> result = Solution().solution(nums, target);',
            '    for (size_t i = 0; i < result.size(); i++) { if (i) cout << " "; cout << result[i]; }',
            '    cout << endl;',
            '    return 0;',
            '}'
        ].join('\n'),
        java: (src) => [
            'import java.util.*;', '', src, '',
            'public class Main {',
            '    public static void main(String[] args) {',
            '        Scanner sc = new Scanner(System.in);',
            '        int n = sc.nextInt();',
            '        int[] nums = new int[n];',
            '        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();',
            '        int target = sc.nextInt();',
            '        int[] result = new Solution().solution(nums, target);',
            '        StringBuilder sb = new StringBuilder();',
            '        for (int i = 0; i < result.length; i++) { if (i > 0) sb.append(" "); sb.append(result[i]); }',
            '        System.out.println(sb);',
            '    }',
            '}'
        ].join('\n'),
        js: (src) => [
            src, '',
            "const _tok = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);",
            'const n = _tok[0];',
            'const nums = _tok.slice(1, 1 + n);',
            'const target = _tok[1 + n];',
            "console.log(solution(nums, target).join(' '));"
        ].join('\n'),
        python: (src) => [
            src, '',
            'import sys',
            'data = sys.stdin.read().split()',
            'n = int(data[0])',
            'nums = [int(data[i + 1]) for i in range(n)]',
            'target = int(data[n + 1])',
            "print(' '.join(map(str, solution(nums, target))))"
        ].join('\n')
    },

    // ------------------------------------------------------------------
    // "n k\nnums" -> int array sorted ascending (top-k style,
    // order-insensitive results)
    // ------------------------------------------------------------------
    'array-k-to-sorted-array': {
        c: (src) => [
            '#include <stdio.h>', '#include <stdlib.h>', '#include <string.h>', '#include <stdbool.h>', '',
            'static int __cmp_int(const void *a, const void *b) { return *(const int*)a - *(const int*)b; }', '',
            src, '',
            'int main() {',
            '    int n, k; if (scanf("%d %d", &n, &k) != 2) return 0;',
            '    int *nums = malloc(sizeof(int) * (n > 0 ? n : 1));',
            '    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);',
            '    int returnSize = 0;',
            '    int *result = solution(nums, n, k, &returnSize);',
            '    qsort(result, returnSize, sizeof(int), __cmp_int);',
            '    for (int i = 0; i < returnSize; i++) { if (i) printf(" "); printf("%d", result[i]); }',
            '    printf("\\n");',
            '    free(nums); free(result);',
            '    return 0;',
            '}'
        ].join('\n'),
        cpp: (src) => [
            '#include <bits/stdc++.h>', 'using namespace std;', '', src, '',
            'int main() {',
            '    int n, k; cin >> n >> k;',
            '    vector<int> nums(n);',
            '    for (int i = 0; i < n; i++) cin >> nums[i];',
            '    vector<int> result = Solution().solution(nums, k);',
            '    sort(result.begin(), result.end());',
            '    for (size_t i = 0; i < result.size(); i++) { if (i) cout << " "; cout << result[i]; }',
            '    cout << endl;',
            '    return 0;',
            '}'
        ].join('\n'),
        java: (src) => [
            'import java.util.*;', '', src, '',
            'public class Main {',
            '    public static void main(String[] args) {',
            '        Scanner sc = new Scanner(System.in);',
            '        int n = sc.nextInt(), k = sc.nextInt();',
            '        int[] nums = new int[n];',
            '        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();',
            '        int[] result = new Solution().solution(nums, k);',
            '        Arrays.sort(result);',
            '        StringBuilder sb = new StringBuilder();',
            '        for (int i = 0; i < result.length; i++) { if (i > 0) sb.append(" "); sb.append(result[i]); }',
            '        System.out.println(sb);',
            '    }',
            '}'
        ].join('\n'),
        js: (src) => [
            src, '',
            "const _tok = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);",
            'const n = _tok[0], k = _tok[1];',
            'const nums = _tok.slice(2, 2 + n);',
            'const result = solution(nums, k).slice().sort((a, b) => a - b);',
            "console.log(result.join(' '));"
        ].join('\n'),
        python: (src) => [
            src, '',
            'import sys',
            'data = sys.stdin.read().split()',
            'n = int(data[0]); k = int(data[1])',
            'nums = [int(data[i + 2]) for i in range(n)]',
            "print(' '.join(map(str, sorted(solution(nums, k)))))"
        ].join('\n')
    },

    // ------------------------------------------------------------------
    // "n\nnums" -> nested rows (sorted within + rows sorted)
    // 3sum / subsets / subsets-ii
    // ------------------------------------------------------------------
    'array-to-nested': {
        c: (src) => [
            '#include <stdio.h>', '#include <stdlib.h>', '#include <string.h>', '#include <stdbool.h>', '',
            cNestedPrinter(true), '',
            src, '',
            'int main() {',
            '    int n; if (scanf("%d", &n) != 1) return 0;',
            '    int *nums = malloc(sizeof(int) * (n > 0 ? n : 1));',
            '    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);',
            '    int returnSize = 0;',
            '    int *colSizes = NULL;',
            '    int **rows = solution(nums, n, &returnSize, &colSizes);',
            '    print_nested(rows, returnSize, colSizes);',
            '    return 0;',
            '}'
        ].join('\n'),
        cpp: (src) => [
            '#include <bits/stdc++.h>', 'using namespace std;', '',
            cppNestedPrinter(true), '',
            src, '',
            'int main() {',
            '    int n; cin >> n;',
            '    vector<int> nums(n);',
            '    for (int i = 0; i < n; i++) cin >> nums[i];',
            '    printNested(Solution().solution(nums));',
            '    return 0;',
            '}'
        ].join('\n'),
        java: (src) => [
            'import java.util.*;', '', src, '',
            'public class Main {',
            javaNestedPrinter(true),
            '    public static void main(String[] args) {',
            '        Scanner sc = new Scanner(System.in);',
            '        int n = sc.nextInt();',
            '        int[] nums = new int[n];',
            '        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();',
            '        printNested(new Solution().solution(nums));',
            '    }',
            '}'
        ].join('\n'),
        js: (src) => [
            JS_NESTED(true), '',
            src, '',
            "const _tok = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);",
            'const n = _tok[0];',
            'const nums = _tok.slice(1, 1 + n);',
            '__printNested(solution(nums));'
        ].join('\n'),
        python: (src) => [
            PY_NESTED(true), '',
            src, '',
            'import sys',
            'data = sys.stdin.read().split()',
            'n = int(data[0])',
            'nums = [int(data[i + 1]) for i in range(n)]',
            '__print_nested(solution(nums))'
        ].join('\n')
    },

    // ------------------------------------------------------------------
    // "n\nnums\ntarget" -> nested rows (sorted within + rows sorted)
    // combination-sum / combination-sum-ii
    // ------------------------------------------------------------------
    'array-target-to-nested': {
        c: (src) => [
            '#include <stdio.h>', '#include <stdlib.h>', '#include <string.h>', '#include <stdbool.h>', '',
            cNestedPrinter(true), '',
            src, '',
            'int main() {',
            '    int n; if (scanf("%d", &n) != 1) return 0;',
            '    int *nums = malloc(sizeof(int) * (n > 0 ? n : 1));',
            '    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);',
            '    int target; scanf("%d", &target);',
            '    int returnSize = 0;',
            '    int *colSizes = NULL;',
            '    int **rows = solution(nums, n, target, &returnSize, &colSizes);',
            '    print_nested(rows, returnSize, colSizes);',
            '    return 0;',
            '}'
        ].join('\n'),
        cpp: (src) => [
            '#include <bits/stdc++.h>', 'using namespace std;', '',
            cppNestedPrinter(true), '',
            src, '',
            'int main() {',
            '    int n; cin >> n;',
            '    vector<int> nums(n);',
            '    for (int i = 0; i < n; i++) cin >> nums[i];',
            '    int target; cin >> target;',
            '    printNested(Solution().solution(nums, target));',
            '    return 0;',
            '}'
        ].join('\n'),
        java: (src) => [
            'import java.util.*;', '', src, '',
            'public class Main {',
            javaNestedPrinter(true),
            '    public static void main(String[] args) {',
            '        Scanner sc = new Scanner(System.in);',
            '        int n = sc.nextInt();',
            '        int[] nums = new int[n];',
            '        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();',
            '        int target = sc.nextInt();',
            '        printNested(new Solution().solution(nums, target));',
            '    }',
            '}'
        ].join('\n'),
        js: (src) => [
            JS_NESTED(true), '',
            src, '',
            "const _tok = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);",
            'const n = _tok[0];',
            'const nums = _tok.slice(1, 1 + n);',
            'const target = _tok[1 + n];',
            '__printNested(solution(nums, target));'
        ].join('\n'),
        python: (src) => [
            PY_NESTED(true), '',
            src, '',
            'import sys',
            'data = sys.stdin.read().split()',
            'n = int(data[0])',
            'nums = [int(data[i + 1]) for i in range(n)]',
            'target = int(data[n + 1])',
            '__print_nested(solution(nums, target))'
        ].join('\n')
    },

    // ------------------------------------------------------------------
    // "n\nnums" -> nested rows, order-sensitive within rows (permutations)
    // ------------------------------------------------------------------
    'array-to-perms': {
        c: (src) => [
            '#include <stdio.h>', '#include <stdlib.h>', '#include <string.h>', '#include <stdbool.h>', '',
            cNestedPrinter(false), '',
            src, '',
            'int main() {',
            '    int n; if (scanf("%d", &n) != 1) return 0;',
            '    int *nums = malloc(sizeof(int) * (n > 0 ? n : 1));',
            '    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);',
            '    int returnSize = 0;',
            '    int *colSizes = NULL;',
            '    int **rows = solution(nums, n, &returnSize, &colSizes);',
            '    print_nested(rows, returnSize, colSizes);',
            '    return 0;',
            '}'
        ].join('\n'),
        cpp: (src) => [
            '#include <bits/stdc++.h>', 'using namespace std;', '',
            cppNestedPrinter(false), '',
            src, '',
            'int main() {',
            '    int n; cin >> n;',
            '    vector<int> nums(n);',
            '    for (int i = 0; i < n; i++) cin >> nums[i];',
            '    printNested(Solution().solution(nums));',
            '    return 0;',
            '}'
        ].join('\n'),
        java: (src) => [
            'import java.util.*;', '', src, '',
            'public class Main {',
            javaNestedPrinter(false),
            '    public static void main(String[] args) {',
            '        Scanner sc = new Scanner(System.in);',
            '        int n = sc.nextInt();',
            '        int[] nums = new int[n];',
            '        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();',
            '        printNested(new Solution().solution(nums));',
            '    }',
            '}'
        ].join('\n'),
        js: (src) => [
            JS_NESTED(false), '',
            src, '',
            "const _tok = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);",
            'const n = _tok[0];',
            'const nums = _tok.slice(1, 1 + n);',
            '__printNested(solution(nums));'
        ].join('\n'),
        python: (src) => [
            PY_NESTED(false), '',
            src, '',
            'import sys',
            'data = sys.stdin.read().split()',
            'n = int(data[0])',
            'nums = [int(data[i + 1]) for i in range(n)]',
            '__print_nested(solution(nums))'
        ].join('\n')
    },

    // ------------------------------------------------------------------
    // "n\narr1\nm\narr2" -> int (gas-station style)
    // ------------------------------------------------------------------
    'two-arrays-to-int': {
        c: (src) => [
            '#include <stdio.h>', '#include <stdlib.h>', '#include <string.h>', '#include <stdbool.h>', '',
            src, '',
            'int main() {',
            '    int n; if (scanf("%d", &n) != 1) return 0;',
            '    int *a = malloc(sizeof(int) * (n > 0 ? n : 1));',
            '    for (int i = 0; i < n; i++) scanf("%d", &a[i]);',
            '    int m; scanf("%d", &m);',
            '    int *b = malloc(sizeof(int) * (m > 0 ? m : 1));',
            '    for (int i = 0; i < m; i++) scanf("%d", &b[i]);',
            '    printf("%d\\n", solution(a, n, b, m));',
            '    free(a); free(b);',
            '    return 0;',
            '}'
        ].join('\n'),
        cpp: (src) => [
            '#include <bits/stdc++.h>', 'using namespace std;', '', src, '',
            'int main() {',
            '    int n; cin >> n;',
            '    vector<int> a(n);',
            '    for (int i = 0; i < n; i++) cin >> a[i];',
            '    int m; cin >> m;',
            '    vector<int> b(m);',
            '    for (int i = 0; i < m; i++) cin >> b[i];',
            '    cout << Solution().solution(a, b) << endl;',
            '    return 0;',
            '}'
        ].join('\n'),
        java: (src) => [
            'import java.util.*;', '', src, '',
            'public class Main {',
            '    public static void main(String[] args) {',
            '        Scanner sc = new Scanner(System.in);',
            '        int n = sc.nextInt();',
            '        int[] a = new int[n];',
            '        for (int i = 0; i < n; i++) a[i] = sc.nextInt();',
            '        int m = sc.nextInt();',
            '        int[] b = new int[m];',
            '        for (int i = 0; i < m; i++) b[i] = sc.nextInt();',
            '        System.out.println(new Solution().solution(a, b));',
            '    }',
            '}'
        ].join('\n'),
        js: (src) => [
            src, '',
            "const _tok = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);",
            'let _i = 0;',
            'const n = _tok[_i++];',
            'const a = _tok.slice(_i, _i + n); _i += n;',
            'const m = _tok[_i++];',
            'const b = _tok.slice(_i, _i + m); _i += m;',
            'console.log(solution(a, b));'
        ].join('\n'),
        python: (src) => [
            src, '',
            'import sys',
            'data = sys.stdin.read().split()',
            'i = 0',
            'n = int(data[i]); i += 1',
            'a = [int(data[i + j]) for j in range(n)]; i += n',
            'm = int(data[i]); i += 1',
            'b = [int(data[i + j]) for j in range(m)]; i += m',
            'print(solution(a, b))'
        ].join('\n')
    },

    // ------------------------------------------------------------------
    // "n\narr1\nm\narr2" -> double printed with 5 decimals (median style)
    // ------------------------------------------------------------------
    'two-arrays-to-double': {
        c: (src) => [
            '#include <stdio.h>', '#include <stdlib.h>', '#include <string.h>', '#include <stdbool.h>', '',
            src, '',
            'int main() {',
            '    int n; if (scanf("%d", &n) != 1) return 0;',
            '    int *a = malloc(sizeof(int) * (n > 0 ? n : 1));',
            '    for (int i = 0; i < n; i++) scanf("%d", &a[i]);',
            '    int m; scanf("%d", &m);',
            '    int *b = malloc(sizeof(int) * (m > 0 ? m : 1));',
            '    for (int i = 0; i < m; i++) scanf("%d", &b[i]);',
            '    printf("%.5f\\n", solution(a, n, b, m));',
            '    free(a); free(b);',
            '    return 0;',
            '}'
        ].join('\n'),
        cpp: (src) => [
            '#include <bits/stdc++.h>', 'using namespace std;', '', src, '',
            'int main() {',
            '    int n; cin >> n;',
            '    vector<int> a(n);',
            '    for (int i = 0; i < n; i++) cin >> a[i];',
            '    int m; cin >> m;',
            '    vector<int> b(m);',
            '    for (int i = 0; i < m; i++) cin >> b[i];',
            '    printf("%.5f\\n", Solution().solution(a, b));',
            '    return 0;',
            '}'
        ].join('\n'),
        java: (src) => [
            'import java.util.*;', '', src, '',
            'public class Main {',
            '    public static void main(String[] args) {',
            '        Scanner sc = new Scanner(System.in);',
            '        int n = sc.nextInt();',
            '        int[] a = new int[n];',
            '        for (int i = 0; i < n; i++) a[i] = sc.nextInt();',
            '        int m = sc.nextInt();',
            '        int[] b = new int[m];',
            '        for (int i = 0; i < m; i++) b[i] = sc.nextInt();',
            '        System.out.println(String.format(java.util.Locale.US, "%.5f", new Solution().solution(a, b)));',
            '    }',
            '}'
        ].join('\n'),
        js: (src) => [
            src, '',
            "const _tok = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);",
            'let _i = 0;',
            'const n = _tok[_i++];',
            'const a = _tok.slice(_i, _i + n); _i += n;',
            'const m = _tok[_i++];',
            'const b = _tok.slice(_i, _i + m); _i += m;',
            'console.log(solution(a, b).toFixed(5));'
        ].join('\n'),
        python: (src) => [
            src, '',
            'import sys',
            'data = sys.stdin.read().split()',
            'i = 0',
            'n = int(data[i]); i += 1',
            'a = [int(data[i + j]) for j in range(n)]; i += n',
            'm = int(data[i]); i += 1',
            'b = [int(data[i + j]) for j in range(m)]; i += m',
            "print(f'{solution(a, b):.5f}')"
        ].join('\n')
    },

    // ------------------------------------------------------------------
    // "x n" -> double with 5 decimals (pow)
    // ------------------------------------------------------------------
    'double-int-to-double': {
        c: (src) => [
            '#include <stdio.h>', '#include <stdlib.h>', '#include <string.h>', '#include <stdbool.h>', '',
            src, '',
            'int main() {',
            '    double x; int n;',
            '    if (scanf("%lf %d", &x, &n) != 2) return 0;',
            '    printf("%.5f\\n", solution(x, n));',
            '    return 0;',
            '}'
        ].join('\n'),
        cpp: (src) => [
            '#include <bits/stdc++.h>', 'using namespace std;', '', src, '',
            'int main() {',
            '    double x; int n; cin >> x >> n;',
            '    printf("%.5f\\n", Solution().solution(x, n));',
            '    return 0;',
            '}'
        ].join('\n'),
        java: (src) => [
            'import java.util.*;', 'import java.io.*;', '', src, '',
            'public class Main {',
            '    public static void main(String[] args) throws IOException {',
            '        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));',
            '        String[] parts = br.readLine().trim().split("\\\\s+");',
            '        double x = Double.parseDouble(parts[0]);',
            '        int n = Integer.parseInt(parts[1]);',
            '        System.out.println(String.format(java.util.Locale.US, "%.5f", new Solution().solution(x, n)));',
            '    }',
            '}'
        ].join('\n'),
        js: (src) => [
            src, '',
            "const _tok = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/);",
            'const x = parseFloat(_tok[0]);',
            'const n = parseInt(_tok[1], 10);',
            'console.log(solution(x, n).toFixed(5));'
        ].join('\n'),
        python: (src) => [
            src, '',
            'import sys',
            'data = sys.stdin.read().split()',
            'x = float(data[0]); n = int(data[1])',
            "print(f'{solution(x, n):.5f}')"
        ].join('\n')
    },

    // ------------------------------------------------------------------
    // line s -> bool
    // ------------------------------------------------------------------
    'string-to-bool': {
        c: (src) => [
            '#include <stdio.h>', '#include <stdlib.h>', '#include <string.h>', '#include <stdbool.h>', '',
            C_READ_LINE, '',
            src, '',
            'int main() {',
            '    static char s[200005];',
            '    read_line(s, sizeof(s));',
            '    puts(solution(s) ? "true" : "false");',
            '    return 0;',
            '}'
        ].join('\n'),
        cpp: (src) => [
            '#include <bits/stdc++.h>', 'using namespace std;', '', src, '',
            'int main() {',
            '    string s;',
            '    getline(cin, s);',
            '    cout << (Solution().solution(s) ? "true" : "false") << endl;',
            '    return 0;',
            '}'
        ].join('\n'),
        java: (src) => [
            'import java.util.*;', 'import java.io.*;', '', src, '',
            'public class Main {',
            '    public static void main(String[] args) throws IOException {',
            '        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));',
            '        String s = br.readLine();',
            '        if (s == null) s = "";',
            '        System.out.println(new Solution().solution(s));',
            '    }',
            '}'
        ].join('\n'),
        js: (src) => [
            src, '',
            "const _lines = require('fs').readFileSync(0, 'utf8').split('\\n');",
            "const s = _lines[0] !== undefined ? _lines[0].replace(/\\r$/, '') : '';",
            "console.log(solution(s) ? 'true' : 'false');"
        ].join('\n'),
        python: (src) => [
            src, '',
            'import sys',
            "lines = sys.stdin.read().split('\\n')",
            "s = lines[0] if lines else ''",
            "print('true' if solution(s) else 'false')"
        ].join('\n')
    },

    // ------------------------------------------------------------------
    // line s -> int
    // ------------------------------------------------------------------
    'string-to-int': {
        c: (src) => [
            '#include <stdio.h>', '#include <stdlib.h>', '#include <string.h>', '#include <stdbool.h>', '',
            C_READ_LINE, '',
            src, '',
            'int main() {',
            '    static char s[200005];',
            '    read_line(s, sizeof(s));',
            '    printf("%d\\n", solution(s));',
            '    return 0;',
            '}'
        ].join('\n'),
        cpp: (src) => [
            '#include <bits/stdc++.h>', 'using namespace std;', '', src, '',
            'int main() {',
            '    string s;',
            '    getline(cin, s);',
            '    cout << Solution().solution(s) << endl;',
            '    return 0;',
            '}'
        ].join('\n'),
        java: (src) => [
            'import java.util.*;', 'import java.io.*;', '', src, '',
            'public class Main {',
            '    public static void main(String[] args) throws IOException {',
            '        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));',
            '        String s = br.readLine();',
            '        if (s == null) s = "";',
            '        System.out.println(new Solution().solution(s));',
            '    }',
            '}'
        ].join('\n'),
        js: (src) => [
            src, '',
            "const _lines = require('fs').readFileSync(0, 'utf8').split('\\n');",
            "const s = _lines[0] !== undefined ? _lines[0].replace(/\\r$/, '') : '';",
            'console.log(solution(s));'
        ].join('\n'),
        python: (src) => [
            src, '',
            'import sys',
            "lines = sys.stdin.read().split('\\n')",
            "s = lines[0] if lines else ''",
            'print(solution(s))'
        ].join('\n')
    },

    // ------------------------------------------------------------------
    // line s -> string
    // ------------------------------------------------------------------
    'string-to-string': {
        c: (src) => [
            '#include <stdio.h>', '#include <stdlib.h>', '#include <string.h>', '#include <stdbool.h>', '',
            C_READ_LINE, '',
            src, '',
            'int main() {',
            '    static char s[200005];',
            '    read_line(s, sizeof(s));',
            '    printf("%s\\n", solution(s));',
            '    return 0;',
            '}'
        ].join('\n'),
        cpp: (src) => [
            '#include <bits/stdc++.h>', 'using namespace std;', '', src, '',
            'int main() {',
            '    string s;',
            '    getline(cin, s);',
            '    cout << Solution().solution(s) << endl;',
            '    return 0;',
            '}'
        ].join('\n'),
        java: (src) => [
            'import java.util.*;', 'import java.io.*;', '', src, '',
            'public class Main {',
            '    public static void main(String[] args) throws IOException {',
            '        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));',
            '        String s = br.readLine();',
            '        if (s == null) s = "";',
            '        System.out.println(new Solution().solution(s));',
            '    }',
            '}'
        ].join('\n'),
        js: (src) => [
            src, '',
            "const _lines = require('fs').readFileSync(0, 'utf8').split('\\n');",
            "const s = _lines[0] !== undefined ? _lines[0].replace(/\\r$/, '') : '';",
            'console.log(solution(s));'
        ].join('\n'),
        python: (src) => [
            src, '',
            'import sys',
            "lines = sys.stdin.read().split('\\n')",
            "s = lines[0] if lines else ''",
            'print(solution(s))'
        ].join('\n')
    },

    // ------------------------------------------------------------------
    // line s, line k -> int
    // ------------------------------------------------------------------
    'string-k-to-int': {
        c: (src) => [
            '#include <stdio.h>', '#include <stdlib.h>', '#include <string.h>', '#include <stdbool.h>', '',
            C_READ_LINE, '',
            src, '',
            'int main() {',
            '    static char s[200005];',
            '    static char kbuf[64];',
            '    read_line(s, sizeof(s));',
            '    read_line(kbuf, sizeof(kbuf));',
            '    printf("%d\\n", solution(s, atoi(kbuf)));',
            '    return 0;',
            '}'
        ].join('\n'),
        cpp: (src) => [
            '#include <bits/stdc++.h>', 'using namespace std;', '', src, '',
            'int main() {',
            '    string s, kline;',
            '    getline(cin, s);',
            '    getline(cin, kline);',
            '    cout << Solution().solution(s, stoi(kline)) << endl;',
            '    return 0;',
            '}'
        ].join('\n'),
        java: (src) => [
            'import java.util.*;', 'import java.io.*;', '', src, '',
            'public class Main {',
            '    public static void main(String[] args) throws IOException {',
            '        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));',
            '        String s = br.readLine();',
            '        if (s == null) s = "";',
            '        int k = Integer.parseInt(br.readLine().trim());',
            '        System.out.println(new Solution().solution(s, k));',
            '    }',
            '}'
        ].join('\n'),
        js: (src) => [
            src, '',
            "const _lines = require('fs').readFileSync(0, 'utf8').split('\\n');",
            "const s = _lines[0] !== undefined ? _lines[0].replace(/\\r$/, '') : '';",
            'const k = parseInt(_lines[1], 10);',
            'console.log(solution(s, k));'
        ].join('\n'),
        python: (src) => [
            src, '',
            'import sys',
            "lines = sys.stdin.read().split('\\n')",
            "s = lines[0] if lines else ''",
            'k = int(lines[1])',
            'print(solution(s, k))'
        ].join('\n')
    },

    // ------------------------------------------------------------------
    // line s -> int array (ordered; partition-labels style)
    // ------------------------------------------------------------------
    'string-to-array': {
        c: (src) => [
            '#include <stdio.h>', '#include <stdlib.h>', '#include <string.h>', '#include <stdbool.h>', '',
            C_READ_LINE, '',
            src, '',
            'int main() {',
            '    static char s[200005];',
            '    read_line(s, sizeof(s));',
            '    int returnSize = 0;',
            '    int *result = solution(s, &returnSize);',
            '    for (int i = 0; i < returnSize; i++) { if (i) printf(" "); printf("%d", result[i]); }',
            '    printf("\\n");',
            '    free(result);',
            '    return 0;',
            '}'
        ].join('\n'),
        cpp: (src) => [
            '#include <bits/stdc++.h>', 'using namespace std;', '', src, '',
            'int main() {',
            '    string s;',
            '    getline(cin, s);',
            '    vector<int> result = Solution().solution(s);',
            '    for (size_t i = 0; i < result.size(); i++) { if (i) cout << " "; cout << result[i]; }',
            '    cout << endl;',
            '    return 0;',
            '}'
        ].join('\n'),
        java: (src) => [
            'import java.util.*;', 'import java.io.*;', '', src, '',
            'public class Main {',
            '    public static void main(String[] args) throws IOException {',
            '        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));',
            '        String s = br.readLine();',
            '        if (s == null) s = "";',
            '        java.util.List<Integer> result = new Solution().solution(s);',
            '        StringBuilder sb = new StringBuilder();',
            '        for (int i = 0; i < result.size(); i++) { if (i > 0) sb.append(" "); sb.append(result.get(i)); }',
            '        System.out.println(sb);',
            '    }',
            '}'
        ].join('\n'),
        js: (src) => [
            src, '',
            "const _lines = require('fs').readFileSync(0, 'utf8').split('\\n');",
            "const s = _lines[0] !== undefined ? _lines[0].replace(/\\r$/, '') : '';",
            "console.log(solution(s).join(' '));"
        ].join('\n'),
        python: (src) => [
            src, '',
            'import sys',
            "lines = sys.stdin.read().split('\\n')",
            "s = lines[0] if lines else ''",
            "print(' '.join(map(str, solution(s))))"
        ].join('\n')
    },

    // ------------------------------------------------------------------
    // line s -> sorted strings joined by space (letter-combinations)
    // ------------------------------------------------------------------
    'string-to-sorted-strings': {
        c: (src) => [
            '#include <stdio.h>', '#include <stdlib.h>', '#include <string.h>', '#include <stdbool.h>', '',
            C_READ_LINE,
            'static int __cmp_str(const void *a, const void *b) { return strcmp(*(const char* const*)a, *(const char* const*)b); }', '',
            src, '',
            'int main() {',
            '    static char s[200005];',
            '    read_line(s, sizeof(s));',
            '    int returnSize = 0;',
            '    char **result = solution(s, &returnSize);',
            '    qsort(result, returnSize, sizeof(char*), __cmp_str);',
            '    for (int i = 0; i < returnSize; i++) { if (i) printf(" "); printf("%s", result[i]); }',
            '    printf("\\n");',
            '    return 0;',
            '}'
        ].join('\n'),
        cpp: (src) => [
            '#include <bits/stdc++.h>', 'using namespace std;', '', src, '',
            'int main() {',
            '    string s;',
            '    getline(cin, s);',
            '    vector<string> result = Solution().solution(s);',
            '    sort(result.begin(), result.end());',
            '    for (size_t i = 0; i < result.size(); i++) { if (i) cout << " "; cout << result[i]; }',
            '    cout << endl;',
            '    return 0;',
            '}'
        ].join('\n'),
        java: (src) => [
            'import java.util.*;', 'import java.io.*;', '', src, '',
            'public class Main {',
            '    public static void main(String[] args) throws IOException {',
            '        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));',
            '        String s = br.readLine();',
            '        if (s == null) s = "";',
            '        java.util.List<String> result = new Solution().solution(s);',
            '        java.util.Collections.sort(result);',
            '        System.out.println(String.join(" ", result));',
            '    }',
            '}'
        ].join('\n'),
        js: (src) => [
            src, '',
            "const _lines = require('fs').readFileSync(0, 'utf8').split('\\n');",
            "const s = _lines[0] !== undefined ? _lines[0].replace(/\\r$/, '') : '';",
            'const result = solution(s).slice().sort();',
            "console.log(result.join(' '));"
        ].join('\n'),
        python: (src) => [
            src, '',
            'import sys',
            "lines = sys.stdin.read().split('\\n')",
            "s = lines[0] if lines else ''",
            "print(' '.join(sorted(solution(s))))"
        ].join('\n')
    },

    // ------------------------------------------------------------------
    // line s, line n, then n words -> bool (word-break)
    // ------------------------------------------------------------------
    'string-words-to-bool': {
        c: (src) => [
            '#include <stdio.h>', '#include <stdlib.h>', '#include <string.h>', '#include <stdbool.h>', '',
            C_READ_LINE, '',
            src, '',
            'int main() {',
            '    static char s[200005];',
            '    read_line(s, sizeof(s));',
            '    int n; if (scanf("%d", &n) != 1) n = 0;',
            '    char **words = malloc(sizeof(char*) * (n > 0 ? n : 1));',
            '    for (int i = 0; i < n; i++) {',
            '        words[i] = malloc(64);',
            '        scanf("%63s", words[i]);',
            '    }',
            '    puts(solution(s, words, n) ? "true" : "false");',
            '    return 0;',
            '}'
        ].join('\n'),
        cpp: (src) => [
            '#include <bits/stdc++.h>', 'using namespace std;', '', src, '',
            'int main() {',
            '    string s;',
            '    getline(cin, s);',
            '    int n; cin >> n;',
            '    vector<string> words(n);',
            '    for (int i = 0; i < n; i++) cin >> words[i];',
            '    cout << (Solution().solution(s, words) ? "true" : "false") << endl;',
            '    return 0;',
            '}'
        ].join('\n'),
        java: (src) => [
            'import java.util.*;', 'import java.io.*;', '', src, '',
            'public class Main {',
            '    public static void main(String[] args) throws IOException {',
            '        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));',
            '        String s = br.readLine();',
            '        if (s == null) s = "";',
            '        int n = Integer.parseInt(br.readLine().trim());',
            '        String[] words = br.readLine().trim().split("\\\\s+");',
            '        java.util.List<String> wordList = new java.util.ArrayList<>(java.util.Arrays.asList(words));',
            '        System.out.println(new Solution().solution(s, wordList));',
            '    }',
            '}'
        ].join('\n'),
        js: (src) => [
            src, '',
            "const _lines = require('fs').readFileSync(0, 'utf8').split('\\n');",
            "const s = _lines[0] !== undefined ? _lines[0].replace(/\\r$/, '') : '';",
            'const n = parseInt(_lines[1], 10);',
            'const words = _lines[2].trim().split(/\\s+/).slice(0, n);',
            "console.log(solution(s, words) ? 'true' : 'false');"
        ].join('\n'),
        python: (src) => [
            src, '',
            'import sys',
            "lines = sys.stdin.read().split('\\n')",
            "s = lines[0] if lines else ''",
            'n = int(lines[1])',
            'words = lines[2].split()[:n]',
            "print('true' if solution(s, words) else 'false')"
        ].join('\n')
    },

    // ------------------------------------------------------------------
    // line s, line t -> bool
    // ------------------------------------------------------------------
    'two-strings-to-bool': {
        c: (src) => [
            '#include <stdio.h>', '#include <stdlib.h>', '#include <string.h>', '#include <stdbool.h>', '',
            C_READ_LINE, '',
            src, '',
            'int main() {',
            '    static char s[200005], t[200005];',
            '    read_line(s, sizeof(s));',
            '    read_line(t, sizeof(t));',
            '    puts(solution(s, t) ? "true" : "false");',
            '    return 0;',
            '}'
        ].join('\n'),
        cpp: (src) => [
            '#include <bits/stdc++.h>', 'using namespace std;', '', src, '',
            'int main() {',
            '    string s, t;',
            '    getline(cin, s);',
            '    getline(cin, t);',
            '    cout << (Solution().solution(s, t) ? "true" : "false") << endl;',
            '    return 0;',
            '}'
        ].join('\n'),
        java: (src) => [
            'import java.util.*;', 'import java.io.*;', '', src, '',
            'public class Main {',
            '    public static void main(String[] args) throws IOException {',
            '        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));',
            '        String s = br.readLine(); if (s == null) s = "";',
            '        String t = br.readLine(); if (t == null) t = "";',
            '        System.out.println(new Solution().solution(s, t));',
            '    }',
            '}'
        ].join('\n'),
        js: (src) => [
            src, '',
            "const _lines = require('fs').readFileSync(0, 'utf8').split('\\n');",
            "const s = (_lines[0] || '').replace(/\\r$/, '');",
            "const t = (_lines[1] || '').replace(/\\r$/, '');",
            "console.log(solution(s, t) ? 'true' : 'false');"
        ].join('\n'),
        python: (src) => [
            src, '',
            'import sys',
            "lines = sys.stdin.read().split('\\n')",
            "s = lines[0] if len(lines) > 0 else ''",
            "t = lines[1] if len(lines) > 1 else ''",
            "print('true' if solution(s, t) else 'false')"
        ].join('\n')
    },

    // ------------------------------------------------------------------
    // line s, line t -> int
    // ------------------------------------------------------------------
    'two-strings-to-int': {
        c: (src) => [
            '#include <stdio.h>', '#include <stdlib.h>', '#include <string.h>', '#include <stdbool.h>', '',
            C_READ_LINE, '',
            src, '',
            'int main() {',
            '    static char s[200005], t[200005];',
            '    read_line(s, sizeof(s));',
            '    read_line(t, sizeof(t));',
            '    printf("%d\\n", solution(s, t));',
            '    return 0;',
            '}'
        ].join('\n'),
        cpp: (src) => [
            '#include <bits/stdc++.h>', 'using namespace std;', '', src, '',
            'int main() {',
            '    string s, t;',
            '    getline(cin, s);',
            '    getline(cin, t);',
            '    cout << Solution().solution(s, t) << endl;',
            '    return 0;',
            '}'
        ].join('\n'),
        java: (src) => [
            'import java.util.*;', 'import java.io.*;', '', src, '',
            'public class Main {',
            '    public static void main(String[] args) throws IOException {',
            '        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));',
            '        String s = br.readLine(); if (s == null) s = "";',
            '        String t = br.readLine(); if (t == null) t = "";',
            '        System.out.println(new Solution().solution(s, t));',
            '    }',
            '}'
        ].join('\n'),
        js: (src) => [
            src, '',
            "const _lines = require('fs').readFileSync(0, 'utf8').split('\\n');",
            "const s = (_lines[0] || '').replace(/\\r$/, '');",
            "const t = (_lines[1] || '').replace(/\\r$/, '');",
            'console.log(solution(s, t));'
        ].join('\n'),
        python: (src) => [
            src, '',
            'import sys',
            "lines = sys.stdin.read().split('\\n')",
            "s = lines[0] if len(lines) > 0 else ''",
            "t = lines[1] if len(lines) > 1 else ''",
            'print(solution(s, t))'
        ].join('\n')
    },

    // ------------------------------------------------------------------
    // line s, line t -> string (min-window / multiply-strings)
    // ------------------------------------------------------------------
    'two-strings-to-string': {
        c: (src) => [
            '#include <stdio.h>', '#include <stdlib.h>', '#include <string.h>', '#include <stdbool.h>', '',
            C_READ_LINE, '',
            src, '',
            'int main() {',
            '    static char s[200005], t[200005];',
            '    read_line(s, sizeof(s));',
            '    read_line(t, sizeof(t));',
            '    printf("%s\\n", solution(s, t));',
            '    return 0;',
            '}'
        ].join('\n'),
        cpp: (src) => [
            '#include <bits/stdc++.h>', 'using namespace std;', '', src, '',
            'int main() {',
            '    string s, t;',
            '    getline(cin, s);',
            '    getline(cin, t);',
            '    cout << Solution().solution(s, t) << endl;',
            '    return 0;',
            '}'
        ].join('\n'),
        java: (src) => [
            'import java.util.*;', 'import java.io.*;', '', src, '',
            'public class Main {',
            '    public static void main(String[] args) throws IOException {',
            '        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));',
            '        String s = br.readLine(); if (s == null) s = "";',
            '        String t = br.readLine(); if (t == null) t = "";',
            '        System.out.println(new Solution().solution(s, t));',
            '    }',
            '}'
        ].join('\n'),
        js: (src) => [
            src, '',
            "const _lines = require('fs').readFileSync(0, 'utf8').split('\\n');",
            "const s = (_lines[0] || '').replace(/\\r$/, '');",
            "const t = (_lines[1] || '').replace(/\\r$/, '');",
            'console.log(solution(s, t));'
        ].join('\n'),
        python: (src) => [
            src, '',
            'import sys',
            "lines = sys.stdin.read().split('\\n')",
            "s = lines[0] if len(lines) > 0 else ''",
            "t = lines[1] if len(lines) > 1 else ''",
            'print(solution(s, t))'
        ].join('\n')
    },

    // ------------------------------------------------------------------
    // three lines -> bool (interleaving-string)
    // ------------------------------------------------------------------
    'three-strings-to-bool': {
        c: (src) => [
            '#include <stdio.h>', '#include <stdlib.h>', '#include <string.h>', '#include <stdbool.h>', '',
            C_READ_LINE, '',
            src, '',
            'int main() {',
            '    static char a[100005], b[100005], c[200005];',
            '    read_line(a, sizeof(a));',
            '    read_line(b, sizeof(b));',
            '    read_line(c, sizeof(c));',
            '    puts(solution(a, b, c) ? "true" : "false");',
            '    return 0;',
            '}'
        ].join('\n'),
        cpp: (src) => [
            '#include <bits/stdc++.h>', 'using namespace std;', '', src, '',
            'int main() {',
            '    string a, b, c;',
            '    getline(cin, a);',
            '    getline(cin, b);',
            '    getline(cin, c);',
            '    cout << (Solution().solution(a, b, c) ? "true" : "false") << endl;',
            '    return 0;',
            '}'
        ].join('\n'),
        java: (src) => [
            'import java.util.*;', 'import java.io.*;', '', src, '',
            'public class Main {',
            '    public static void main(String[] args) throws IOException {',
            '        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));',
            '        String a = br.readLine(); if (a == null) a = "";',
            '        String b = br.readLine(); if (b == null) b = "";',
            '        String c = br.readLine(); if (c == null) c = "";',
            '        System.out.println(new Solution().solution(a, b, c));',
            '    }',
            '}'
        ].join('\n'),
        js: (src) => [
            src, '',
            "const _lines = require('fs').readFileSync(0, 'utf8').split('\\n');",
            "const a = (_lines[0] || '').replace(/\\r$/, '');",
            "const b = (_lines[1] || '').replace(/\\r$/, '');",
            "const c = (_lines[2] || '').replace(/\\r$/, '');",
            "console.log(solution(a, b, c) ? 'true' : 'false');"
        ].join('\n'),
        python: (src) => [
            src, '',
            'import sys',
            "lines = sys.stdin.read().split('\\n')",
            "a = lines[0] if len(lines) > 0 else ''",
            "b = lines[1] if len(lines) > 1 else ''",
            "c = lines[2] if len(lines) > 2 else ''",
            "print('true' if solution(a, b, c) else 'false')"
        ].join('\n')
    },

    // ------------------------------------------------------------------
    // "n\ntokens" -> int (evaluate RPN; tokens can be operators or ints)
    // ------------------------------------------------------------------
    'words-to-int': {
        c: (src) => [
            '#include <stdio.h>', '#include <stdlib.h>', '#include <string.h>', '#include <stdbool.h>', '',
            src, '',
            'int main() {',
            '    int n; if (scanf("%d", &n) != 1) return 0;',
            '    char **tokens = malloc(sizeof(char*) * (n > 0 ? n : 1));',
            '    for (int i = 0; i < n; i++) {',
            '        tokens[i] = malloc(16);',
            '        scanf("%15s", tokens[i]);',
            '    }',
            '    printf("%d\\n", solution(tokens, n));',
            '    return 0;',
            '}'
        ].join('\n'),
        cpp: (src) => [
            '#include <bits/stdc++.h>', 'using namespace std;', '', src, '',
            'int main() {',
            '    int n; cin >> n;',
            '    vector<string> tokens(n);',
            '    for (int i = 0; i < n; i++) cin >> tokens[i];',
            '    cout << Solution().solution(tokens) << endl;',
            '    return 0;',
            '}'
        ].join('\n'),
        java: (src) => [
            'import java.util.*;', '', src, '',
            'public class Main {',
            '    public static void main(String[] args) {',
            '        Scanner sc = new Scanner(System.in);',
            '        int n = sc.nextInt();',
            '        String[] tokens = new String[n];',
            '        for (int i = 0; i < n; i++) tokens[i] = sc.next();',
            '        System.out.println(new Solution().solution(tokens));',
            '    }',
            '}'
        ].join('\n'),
        js: (src) => [
            src, '',
            "const _tok = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/);",
            'const n = parseInt(_tok[0], 10);',
            'const tokens = _tok.slice(1, 1 + n);',
            'console.log(solution(tokens));'
        ].join('\n'),
        python: (src) => [
            src, '',
            'import sys',
            'data = sys.stdin.read().split()',
            'n = int(data[0])',
            'tokens = data[1:1 + n]',
            'print(solution(tokens))'
        ].join('\n')
    },

    // ------------------------------------------------------------------
    // "n k\nwords" -> int (task-scheduler: tasks + cooldown)
    // ------------------------------------------------------------------
    'words-k-to-int': {
        c: (src) => [
            '#include <stdio.h>', '#include <stdlib.h>', '#include <string.h>', '#include <stdbool.h>', '',
            src, '',
            'int main() {',
            '    int n, k; if (scanf("%d %d", &n, &k) != 2) return 0;',
            '    char **words = malloc(sizeof(char*) * (n > 0 ? n : 1));',
            '    for (int i = 0; i < n; i++) {',
            '        words[i] = malloc(64);',
            '        scanf("%63s", words[i]);',
            '    }',
            '    printf("%d\\n", solution(words, n, k));',
            '    return 0;',
            '}'
        ].join('\n'),
        cpp: (src) => [
            '#include <bits/stdc++.h>', 'using namespace std;', '', src, '',
            'int main() {',
            '    int n, k; cin >> n >> k;',
            '    vector<string> words(n);',
            '    for (int i = 0; i < n; i++) cin >> words[i];',
            '    cout << Solution().solution(words, k) << endl;',
            '    return 0;',
            '}'
        ].join('\n'),
        java: (src) => [
            'import java.util.*;', '', src, '',
            'public class Main {',
            '    public static void main(String[] args) {',
            '        Scanner sc = new Scanner(System.in);',
            '        int n = sc.nextInt(), k = sc.nextInt();',
            '        String[] words = new String[n];',
            '        for (int i = 0; i < n; i++) words[i] = sc.next();',
            '        System.out.println(new Solution().solution(words, k));',
            '    }',
            '}'
        ].join('\n'),
        js: (src) => [
            src, '',
            "const _tok = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/);",
            'const n = parseInt(_tok[0], 10), k = parseInt(_tok[1], 10);',
            'const words = _tok.slice(2, 2 + n);',
            'console.log(solution(words, k));'
        ].join('\n'),
        python: (src) => [
            src, '',
            'import sys',
            'data = sys.stdin.read().split()',
            'n = int(data[0]); k = int(data[1])',
            'words = data[2:2 + n]',
            'print(solution(words, k))'
        ].join('\n')
    },

    // ------------------------------------------------------------------
    // "r c\nvalues row-major" -> int
    // ------------------------------------------------------------------
    'matrix-to-int': {
        c: (src) => [
            '#include <stdio.h>', '#include <stdlib.h>', '#include <string.h>', '#include <stdbool.h>', '',
            src, '',
            'int main() {',
            '    int r, c; if (scanf("%d %d", &r, &c) != 2) return 0;',
            '    int **grid = malloc(sizeof(int*) * (r > 0 ? r : 1));',
            '    for (int i = 0; i < r; i++) {',
            '        grid[i] = malloc(sizeof(int) * (c > 0 ? c : 1));',
            '        for (int j = 0; j < c; j++) scanf("%d", &grid[i][j]);',
            '    }',
            '    printf("%d\\n", solution(grid, r, c));',
            '    return 0;',
            '}'
        ].join('\n'),
        cpp: (src) => [
            '#include <bits/stdc++.h>', 'using namespace std;', '', src, '',
            'int main() {',
            '    int r, c; cin >> r >> c;',
            '    vector<vector<int>> grid(r, vector<int>(c));',
            '    for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) cin >> grid[i][j];',
            '    cout << Solution().solution(grid) << endl;',
            '    return 0;',
            '}'
        ].join('\n'),
        java: (src) => [
            'import java.util.*;', '', src, '',
            'public class Main {',
            '    public static void main(String[] args) {',
            '        Scanner sc = new Scanner(System.in);',
            '        int r = sc.nextInt(), c = sc.nextInt();',
            '        int[][] grid = new int[r][c];',
            '        for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) grid[i][j] = sc.nextInt();',
            '        System.out.println(new Solution().solution(grid));',
            '    }',
            '}'
        ].join('\n'),
        js: (src) => [
            src, '',
            "const _tok = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);",
            'const r = _tok[0], c = _tok[1];',
            'const grid = [];',
            'for (let i = 0; i < r; i++) grid.push(_tok.slice(2 + i * c, 2 + (i + 1) * c));',
            'console.log(solution(grid));'
        ].join('\n'),
        python: (src) => [
            src, '',
            'import sys',
            'data = sys.stdin.read().split()',
            'r = int(data[0]); c = int(data[1])',
            'grid = [[int(data[2 + i * c + j]) for j in range(c)] for i in range(r)]',
            'print(solution(grid))'
        ].join('\n')
    },

    // ------------------------------------------------------------------
    // "r c\nvalues" -> int array (ordered; spiral traversal)
    // ------------------------------------------------------------------
    'matrix-to-array': {
        c: (src) => [
            '#include <stdio.h>', '#include <stdlib.h>', '#include <string.h>', '#include <stdbool.h>', '',
            src, '',
            'int main() {',
            '    int r, c; if (scanf("%d %d", &r, &c) != 2) return 0;',
            '    int **grid = malloc(sizeof(int*) * (r > 0 ? r : 1));',
            '    for (int i = 0; i < r; i++) {',
            '        grid[i] = malloc(sizeof(int) * (c > 0 ? c : 1));',
            '        for (int j = 0; j < c; j++) scanf("%d", &grid[i][j]);',
            '    }',
            '    int returnSize = 0;',
            '    int *result = solution(grid, r, c, &returnSize);',
            '    for (int i = 0; i < returnSize; i++) { if (i) printf(" "); printf("%d", result[i]); }',
            '    printf("\\n");',
            '    return 0;',
            '}'
        ].join('\n'),
        cpp: (src) => [
            '#include <bits/stdc++.h>', 'using namespace std;', '', src, '',
            'int main() {',
            '    int r, c; cin >> r >> c;',
            '    vector<vector<int>> grid(r, vector<int>(c));',
            '    for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) cin >> grid[i][j];',
            '    vector<int> result = Solution().solution(grid);',
            '    for (size_t i = 0; i < result.size(); i++) { if (i) cout << " "; cout << result[i]; }',
            '    cout << endl;',
            '    return 0;',
            '}'
        ].join('\n'),
        java: (src) => [
            'import java.util.*;', '', src, '',
            'public class Main {',
            '    public static void main(String[] args) {',
            '        Scanner sc = new Scanner(System.in);',
            '        int r = sc.nextInt(), c = sc.nextInt();',
            '        int[][] grid = new int[r][c];',
            '        for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) grid[i][j] = sc.nextInt();',
            '        java.util.List<Integer> result = new Solution().solution(grid);',
            '        StringBuilder sb = new StringBuilder();',
            '        for (int i = 0; i < result.size(); i++) { if (i > 0) sb.append(" "); sb.append(result.get(i)); }',
            '        System.out.println(sb);',
            '    }',
            '}'
        ].join('\n'),
        js: (src) => [
            src, '',
            "const _tok = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);",
            'const r = _tok[0], c = _tok[1];',
            'const grid = [];',
            'for (let i = 0; i < r; i++) grid.push(_tok.slice(2 + i * c, 2 + (i + 1) * c));',
            "console.log(solution(grid).join(' '));"
        ].join('\n'),
        python: (src) => [
            src, '',
            'import sys',
            'data = sys.stdin.read().split()',
            'r = int(data[0]); c = int(data[1])',
            'grid = [[int(data[2 + i * c + j]) for j in range(c)] for i in range(r)]',
            "print(' '.join(map(str, solution(grid))))"
        ].join('\n')
    },

    // ------------------------------------------------------------------
    // "r c\nvalues" -> mutate grid in place -> print row-major one line
    // ------------------------------------------------------------------
    'matrix-inplace': {
        c: (src) => [
            '#include <stdio.h>', '#include <stdlib.h>', '#include <string.h>', '#include <stdbool.h>', '',
            src, '',
            'int main() {',
            '    int r, c; if (scanf("%d %d", &r, &c) != 2) return 0;',
            '    int **grid = malloc(sizeof(int*) * (r > 0 ? r : 1));',
            '    for (int i = 0; i < r; i++) {',
            '        grid[i] = malloc(sizeof(int) * (c > 0 ? c : 1));',
            '        for (int j = 0; j < c; j++) scanf("%d", &grid[i][j]);',
            '    }',
            '    solution(grid, r, c);',
            '    int first = 1;',
            '    for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) {',
            '        if (!first) printf(" ");',
            '        printf("%d", grid[i][j]);',
            '        first = 0;',
            '    }',
            '    printf("\\n");',
            '    return 0;',
            '}'
        ].join('\n'),
        cpp: (src) => [
            '#include <bits/stdc++.h>', 'using namespace std;', '', src, '',
            'int main() {',
            '    int r, c; cin >> r >> c;',
            '    vector<vector<int>> grid(r, vector<int>(c));',
            '    for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) cin >> grid[i][j];',
            '    Solution().solution(grid);',
            '    bool first = true;',
            '    for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) {',
            '        if (!first) cout << " ";',
            '        cout << grid[i][j];',
            '        first = false;',
            '    }',
            '    cout << endl;',
            '    return 0;',
            '}'
        ].join('\n'),
        java: (src) => [
            'import java.util.*;', '', src, '',
            'public class Main {',
            '    public static void main(String[] args) {',
            '        Scanner sc = new Scanner(System.in);',
            '        int r = sc.nextInt(), c = sc.nextInt();',
            '        int[][] grid = new int[r][c];',
            '        for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) grid[i][j] = sc.nextInt();',
            '        new Solution().solution(grid);',
            '        StringBuilder sb = new StringBuilder();',
            '        boolean first = true;',
            '        for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) {',
            '            if (!first) sb.append(" ");',
            '            sb.append(grid[i][j]);',
            '            first = false;',
            '        }',
            '        System.out.println(sb);',
            '    }',
            '}'
        ].join('\n'),
        js: (src) => [
            src, '',
            "const _tok = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);",
            'const r = _tok[0], c = _tok[1];',
            'const grid = [];',
            'for (let i = 0; i < r; i++) grid.push(_tok.slice(2 + i * c, 2 + (i + 1) * c));',
            'solution(grid);',
            "console.log(grid.map((row) => row.join(' ')).join(' '));"
        ].join('\n'),
        python: (src) => [
            src, '',
            'import sys',
            'data = sys.stdin.read().split()',
            'r = int(data[0]); c = int(data[1])',
            'grid = [[int(data[2 + i * c + j]) for j in range(c)] for i in range(r)]',
            'solution(grid)',
            "print(' '.join(str(v) for row in grid for v in row))"
        ].join('\n')
    },

    // ------------------------------------------------------------------
    // "r c\nvalues\ntarget" -> bool (search-a-2d-matrix)
    // ------------------------------------------------------------------
    'matrix-target-to-bool': {
        c: (src) => [
            '#include <stdio.h>', '#include <stdlib.h>', '#include <string.h>', '#include <stdbool.h>', '',
            src, '',
            'int main() {',
            '    int r, c; if (scanf("%d %d", &r, &c) != 2) return 0;',
            '    int **grid = malloc(sizeof(int*) * (r > 0 ? r : 1));',
            '    for (int i = 0; i < r; i++) {',
            '        grid[i] = malloc(sizeof(int) * (c > 0 ? c : 1));',
            '        for (int j = 0; j < c; j++) scanf("%d", &grid[i][j]);',
            '    }',
            '    int target; scanf("%d", &target);',
            '    puts(solution(grid, r, c, target) ? "true" : "false");',
            '    return 0;',
            '}'
        ].join('\n'),
        cpp: (src) => [
            '#include <bits/stdc++.h>', 'using namespace std;', '', src, '',
            'int main() {',
            '    int r, c; cin >> r >> c;',
            '    vector<vector<int>> grid(r, vector<int>(c));',
            '    for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) cin >> grid[i][j];',
            '    int target; cin >> target;',
            '    cout << (Solution().solution(grid, target) ? "true" : "false") << endl;',
            '    return 0;',
            '}'
        ].join('\n'),
        java: (src) => [
            'import java.util.*;', '', src, '',
            'public class Main {',
            '    public static void main(String[] args) {',
            '        Scanner sc = new Scanner(System.in);',
            '        int r = sc.nextInt(), c = sc.nextInt();',
            '        int[][] grid = new int[r][c];',
            '        for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) grid[i][j] = sc.nextInt();',
            '        int target = sc.nextInt();',
            '        System.out.println(new Solution().solution(grid, target));',
            '    }',
            '}'
        ].join('\n'),
        js: (src) => [
            src, '',
            "const _tok = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);",
            'const r = _tok[0], c = _tok[1];',
            'const grid = [];',
            'for (let i = 0; i < r; i++) grid.push(_tok.slice(2 + i * c, 2 + (i + 1) * c));',
            'const target = _tok[2 + r * c];',
            "console.log(solution(grid, target) ? 'true' : 'false');"
        ].join('\n'),
        python: (src) => [
            src, '',
            'import sys',
            'data = sys.stdin.read().split()',
            'r = int(data[0]); c = int(data[1])',
            'grid = [[int(data[2 + i * c + j]) for j in range(c)] for i in range(r)]',
            'target = int(data[2 + r * c])',
            "print('true' if solution(grid, target) else 'false')"
        ].join('\n')
    },

    // ------------------------------------------------------------------
    // "n\npairs" -> int (non-overlapping-intervals / meeting-rooms-ii)
    // ------------------------------------------------------------------
    'intervals-to-int': {
        c: (src) => [
            '#include <stdio.h>', '#include <stdlib.h>', '#include <string.h>', '#include <stdbool.h>', '',
            src, '',
            'int main() {',
            '    int n; if (scanf("%d", &n) != 1) return 0;',
            '    int (*intervals)[2] = malloc(sizeof(int[2]) * (n > 0 ? n : 1));',
            '    for (int i = 0; i < n; i++) scanf("%d %d", &intervals[i][0], &intervals[i][1]);',
            '    printf("%d\\n", solution(intervals, n));',
            '    free(intervals);',
            '    return 0;',
            '}'
        ].join('\n'),
        cpp: (src) => [
            '#include <bits/stdc++.h>', 'using namespace std;', '', src, '',
            'int main() {',
            '    int n; cin >> n;',
            '    vector<vector<int>> intervals(n, vector<int>(2));',
            '    for (int i = 0; i < n; i++) cin >> intervals[i][0] >> intervals[i][1];',
            '    cout << Solution().solution(intervals) << endl;',
            '    return 0;',
            '}'
        ].join('\n'),
        java: (src) => [
            'import java.util.*;', '', src, '',
            'public class Main {',
            '    public static void main(String[] args) {',
            '        Scanner sc = new Scanner(System.in);',
            '        int n = sc.nextInt();',
            '        int[][] intervals = new int[n][2];',
            '        for (int i = 0; i < n; i++) { intervals[i][0] = sc.nextInt(); intervals[i][1] = sc.nextInt(); }',
            '        System.out.println(new Solution().solution(intervals));',
            '    }',
            '}'
        ].join('\n'),
        js: (src) => [
            src, '',
            "const _tok = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);",
            'const n = _tok[0];',
            'const intervals = [];',
            'for (let i = 0; i < n; i++) intervals.push([_tok[1 + i * 2], _tok[2 + i * 2]]);',
            'console.log(solution(intervals));'
        ].join('\n'),
        python: (src) => [
            src, '',
            'import sys',
            'data = sys.stdin.read().split()',
            'n = int(data[0])',
            'intervals = [[int(data[1 + i * 2]), int(data[2 + i * 2])] for i in range(n)]',
            'print(solution(intervals))'
        ].join('\n')
    },

    // ------------------------------------------------------------------
    // "n\npairs" -> bool (meeting-rooms)
    // ------------------------------------------------------------------
    'intervals-to-bool': {
        c: (src) => [
            '#include <stdio.h>', '#include <stdlib.h>', '#include <string.h>', '#include <stdbool.h>', '',
            src, '',
            'int main() {',
            '    int n; if (scanf("%d", &n) != 1) return 0;',
            '    int (*intervals)[2] = malloc(sizeof(int[2]) * (n > 0 ? n : 1));',
            '    for (int i = 0; i < n; i++) scanf("%d %d", &intervals[i][0], &intervals[i][1]);',
            '    puts(solution(intervals, n) ? "true" : "false");',
            '    free(intervals);',
            '    return 0;',
            '}'
        ].join('\n'),
        cpp: (src) => [
            '#include <bits/stdc++.h>', 'using namespace std;', '', src, '',
            'int main() {',
            '    int n; cin >> n;',
            '    vector<vector<int>> intervals(n, vector<int>(2));',
            '    for (int i = 0; i < n; i++) cin >> intervals[i][0] >> intervals[i][1];',
            '    cout << (Solution().solution(intervals) ? "true" : "false") << endl;',
            '    return 0;',
            '}'
        ].join('\n'),
        java: (src) => [
            'import java.util.*;', '', src, '',
            'public class Main {',
            '    public static void main(String[] args) {',
            '        Scanner sc = new Scanner(System.in);',
            '        int n = sc.nextInt();',
            '        int[][] intervals = new int[n][2];',
            '        for (int i = 0; i < n; i++) { intervals[i][0] = sc.nextInt(); intervals[i][1] = sc.nextInt(); }',
            '        System.out.println(new Solution().solution(intervals));',
            '    }',
            '}'
        ].join('\n'),
        js: (src) => [
            src, '',
            "const _tok = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);",
            'const n = _tok[0];',
            'const intervals = [];',
            'for (let i = 0; i < n; i++) intervals.push([_tok[1 + i * 2], _tok[2 + i * 2]]);',
            "console.log(solution(intervals) ? 'true' : 'false');"
        ].join('\n'),
        python: (src) => [
            src, '',
            'import sys',
            'data = sys.stdin.read().split()',
            'n = int(data[0])',
            'intervals = [[int(data[1 + i * 2]), int(data[2 + i * 2])] for i in range(n)]',
            "print('true' if solution(intervals) else 'false')"
        ].join('\n')
    },

    // ------------------------------------------------------------------
    // "n\npairs\na b" -> merged intervals, one "a b" per line
    // (insert-interval; matches the print style of the legacy `intervals`)
    // ------------------------------------------------------------------
    'intervals-new-to-intervals': {
        c: (src) => [
            '#include <stdio.h>', '#include <stdlib.h>', '#include <string.h>', '#include <stdbool.h>', '',
            src, '',
            'int main() {',
            '    int n; if (scanf("%d", &n) != 1) return 0;',
            '    int (*intervals)[2] = malloc(sizeof(int[2]) * (n > 0 ? n : 1));',
            '    for (int i = 0; i < n; i++) scanf("%d %d", &intervals[i][0], &intervals[i][1]);',
            '    int newInterval[2];',
            '    scanf("%d %d", &newInterval[0], &newInterval[1]);',
            '    int returnSize = 0;',
            '    int **result = solution(intervals, n, newInterval, &returnSize);',
            '    for (int i = 0; i < returnSize; i++) printf("%d %d\\n", result[i][0], result[i][1]);',
            '    return 0;',
            '}'
        ].join('\n'),
        cpp: (src) => [
            '#include <bits/stdc++.h>', 'using namespace std;', '', src, '',
            'int main() {',
            '    int n; cin >> n;',
            '    vector<vector<int>> intervals(n, vector<int>(2));',
            '    for (int i = 0; i < n; i++) cin >> intervals[i][0] >> intervals[i][1];',
            '    vector<int> newInterval(2);',
            '    cin >> newInterval[0] >> newInterval[1];',
            '    vector<vector<int>> result = Solution().solution(intervals, newInterval);',
            '    for (auto &iv : result) cout << iv[0] << " " << iv[1] << "\\n";',
            '    return 0;',
            '}'
        ].join('\n'),
        java: (src) => [
            'import java.util.*;', '', src, '',
            'public class Main {',
            '    public static void main(String[] args) {',
            '        Scanner sc = new Scanner(System.in);',
            '        int n = sc.nextInt();',
            '        int[][] intervals = new int[n][2];',
            '        for (int i = 0; i < n; i++) { intervals[i][0] = sc.nextInt(); intervals[i][1] = sc.nextInt(); }',
            '        int[] newInterval = { sc.nextInt(), sc.nextInt() };',
            '        int[][] result = new Solution().solution(intervals, newInterval);',
            '        StringBuilder sb = new StringBuilder();',
            '        for (int[] iv : result) sb.append(iv[0]).append(" ").append(iv[1]).append("\\n");',
            '        System.out.print(sb);',
            '    }',
            '}'
        ].join('\n'),
        js: (src) => [
            src, '',
            "const _tok = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);",
            'const n = _tok[0];',
            'const intervals = [];',
            'for (let i = 0; i < n; i++) intervals.push([_tok[1 + i * 2], _tok[2 + i * 2]]);',
            'const newInterval = [_tok[1 + n * 2], _tok[2 + n * 2]];',
            'const result = solution(intervals, newInterval);',
            "console.log(result.map((iv) => iv[0] + ' ' + iv[1]).join('\\n'));"
        ].join('\n'),
        python: (src) => [
            src, '',
            'import sys',
            'data = sys.stdin.read().split()',
            'n = int(data[0])',
            'intervals = [[int(data[1 + i * 2]), int(data[2 + i * 2])] for i in range(n)]',
            'newInterval = [int(data[1 + n * 2]), int(data[2 + n * 2])]',
            'result = solution(intervals, newInterval)',
            'for iv in result:',
            '    print(iv[0], iv[1])'
        ].join('\n')
    },

    // ------------------------------------------------------------------
    // "n m\npairs(m)" -> bool (course-schedule / graph-valid-tree)
    // ------------------------------------------------------------------
    'int-pairs-to-bool': {
        c: (src) => [
            '#include <stdio.h>', '#include <stdlib.h>', '#include <string.h>', '#include <stdbool.h>', '',
            src, '',
            'int main() {',
            '    int n, m; if (scanf("%d %d", &n, &m) != 2) return 0;',
            '    int (*pairs)[2] = malloc(sizeof(int[2]) * (m > 0 ? m : 1));',
            '    for (int i = 0; i < m; i++) scanf("%d %d", &pairs[i][0], &pairs[i][1]);',
            '    puts(solution(n, pairs, m) ? "true" : "false");',
            '    free(pairs);',
            '    return 0;',
            '}'
        ].join('\n'),
        cpp: (src) => [
            '#include <bits/stdc++.h>', 'using namespace std;', '', src, '',
            'int main() {',
            '    int n, m; cin >> n >> m;',
            '    vector<vector<int>> pairs(m, vector<int>(2));',
            '    for (int i = 0; i < m; i++) cin >> pairs[i][0] >> pairs[i][1];',
            '    cout << (Solution().solution(n, pairs) ? "true" : "false") << endl;',
            '    return 0;',
            '}'
        ].join('\n'),
        java: (src) => [
            'import java.util.*;', '', src, '',
            'public class Main {',
            '    public static void main(String[] args) {',
            '        Scanner sc = new Scanner(System.in);',
            '        int n = sc.nextInt(), m = sc.nextInt();',
            '        int[][] pairs = new int[m][2];',
            '        for (int i = 0; i < m; i++) { pairs[i][0] = sc.nextInt(); pairs[i][1] = sc.nextInt(); }',
            '        System.out.println(new Solution().solution(n, pairs));',
            '    }',
            '}'
        ].join('\n'),
        js: (src) => [
            src, '',
            "const _tok = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);",
            'const n = _tok[0], m = _tok[1];',
            'const pairs = [];',
            'for (let i = 0; i < m; i++) pairs.push([_tok[2 + i * 2], _tok[3 + i * 2]]);',
            "console.log(solution(n, pairs) ? 'true' : 'false');"
        ].join('\n'),
        python: (src) => [
            src, '',
            'import sys',
            'data = sys.stdin.read().split()',
            'n = int(data[0]); m = int(data[1])',
            'pairs = [[int(data[2 + i * 2]), int(data[3 + i * 2])] for i in range(m)]',
            "print('true' if solution(n, pairs) else 'false')"
        ].join('\n')
    },

    // ------------------------------------------------------------------
    // "n m\npairs(m)" -> int (count connected components)
    // ------------------------------------------------------------------
    'int-pairs-to-int': {
        c: (src) => [
            '#include <stdio.h>', '#include <stdlib.h>', '#include <string.h>', '#include <stdbool.h>', '',
            src, '',
            'int main() {',
            '    int n, m; if (scanf("%d %d", &n, &m) != 2) return 0;',
            '    int (*pairs)[2] = malloc(sizeof(int[2]) * (m > 0 ? m : 1));',
            '    for (int i = 0; i < m; i++) scanf("%d %d", &pairs[i][0], &pairs[i][1]);',
            '    printf("%d\\n", solution(n, pairs, m));',
            '    free(pairs);',
            '    return 0;',
            '}'
        ].join('\n'),
        cpp: (src) => [
            '#include <bits/stdc++.h>', 'using namespace std;', '', src, '',
            'int main() {',
            '    int n, m; cin >> n >> m;',
            '    vector<vector<int>> pairs(m, vector<int>(2));',
            '    for (int i = 0; i < m; i++) cin >> pairs[i][0] >> pairs[i][1];',
            '    cout << Solution().solution(n, pairs) << endl;',
            '    return 0;',
            '}'
        ].join('\n'),
        java: (src) => [
            'import java.util.*;', '', src, '',
            'public class Main {',
            '    public static void main(String[] args) {',
            '        Scanner sc = new Scanner(System.in);',
            '        int n = sc.nextInt(), m = sc.nextInt();',
            '        int[][] pairs = new int[m][2];',
            '        for (int i = 0; i < m; i++) { pairs[i][0] = sc.nextInt(); pairs[i][1] = sc.nextInt(); }',
            '        System.out.println(new Solution().solution(n, pairs));',
            '    }',
            '}'
        ].join('\n'),
        js: (src) => [
            src, '',
            "const _tok = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);",
            'const n = _tok[0], m = _tok[1];',
            'const pairs = [];',
            'for (let i = 0; i < m; i++) pairs.push([_tok[2 + i * 2], _tok[3 + i * 2]]);',
            'console.log(solution(n, pairs));'
        ].join('\n'),
        python: (src) => [
            src, '',
            'import sys',
            'data = sys.stdin.read().split()',
            'n = int(data[0]); m = int(data[1])',
            'pairs = [[int(data[2 + i * 2]), int(data[3 + i * 2])] for i in range(m)]',
            'print(solution(n, pairs))'
        ].join('\n')
    },

    // ------------------------------------------------------------------
    // "n m\npairs(m)" -> int array (redundant-connection -> [u, v])
    // ------------------------------------------------------------------
    'int-pairs-to-array': {
        c: (src) => [
            '#include <stdio.h>', '#include <stdlib.h>', '#include <string.h>', '#include <stdbool.h>', '',
            src, '',
            'int main() {',
            '    int n, m; if (scanf("%d %d", &n, &m) != 2) return 0;',
            '    int (*pairs)[2] = malloc(sizeof(int[2]) * (m > 0 ? m : 1));',
            '    for (int i = 0; i < m; i++) scanf("%d %d", &pairs[i][0], &pairs[i][1]);',
            '    int returnSize = 0;',
            '    int *result = solution(n, pairs, m, &returnSize);',
            '    for (int i = 0; i < returnSize; i++) { if (i) printf(" "); printf("%d", result[i]); }',
            '    printf("\\n");',
            '    free(pairs);',
            '    return 0;',
            '}'
        ].join('\n'),
        cpp: (src) => [
            '#include <bits/stdc++.h>', 'using namespace std;', '', src, '',
            'int main() {',
            '    int n, m; cin >> n >> m;',
            '    vector<vector<int>> pairs(m, vector<int>(2));',
            '    for (int i = 0; i < m; i++) cin >> pairs[i][0] >> pairs[i][1];',
            '    vector<int> result = Solution().solution(n, pairs);',
            '    for (size_t i = 0; i < result.size(); i++) { if (i) cout << " "; cout << result[i]; }',
            '    cout << endl;',
            '    return 0;',
            '}'
        ].join('\n'),
        java: (src) => [
            'import java.util.*;', '', src, '',
            'public class Main {',
            '    public static void main(String[] args) {',
            '        Scanner sc = new Scanner(System.in);',
            '        int n = sc.nextInt(), m = sc.nextInt();',
            '        int[][] pairs = new int[m][2];',
            '        for (int i = 0; i < m; i++) { pairs[i][0] = sc.nextInt(); pairs[i][1] = sc.nextInt(); }',
            '        int[] result = new Solution().solution(n, pairs);',
            '        StringBuilder sb = new StringBuilder();',
            '        for (int i = 0; i < result.length; i++) { if (i > 0) sb.append(" "); sb.append(result[i]); }',
            '        System.out.println(sb);',
            '    }',
            '}'
        ].join('\n'),
        js: (src) => [
            src, '',
            "const _tok = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);",
            'const n = _tok[0], m = _tok[1];',
            'const pairs = [];',
            'for (let i = 0; i < m; i++) pairs.push([_tok[2 + i * 2], _tok[3 + i * 2]]);',
            "console.log(solution(n, pairs).join(' '));"
        ].join('\n'),
        python: (src) => [
            src, '',
            'import sys',
            'data = sys.stdin.read().split()',
            'n = int(data[0]); m = int(data[1])',
            'pairs = [[int(data[2 + i * 2]), int(data[3 + i * 2])] for i in range(m)]',
            "print(' '.join(map(str, solution(n, pairs))))"
        ].join('\n')
    }
};

module.exports = { extraRunners };
