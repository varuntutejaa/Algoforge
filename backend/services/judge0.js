// Judge0 code-execution service: builds language-specific runner glue around
// user-submitted solutions and submits them to Judge0 for grading.

const JUDGE0_URL = process.env.JUDGE0_URL || "https://ce.judge0.com";
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY;

const languageIds = {
    c: 50,
    cpp: 54,
    java: 62,
    js: 63,
    python: 71
};

function buildTwoSumJudgeSource(language, sourceCode) {
    if (language === "c") {
        return [
            '#include <stdio.h>',
            '#include <stdlib.h>',
            '',
            sourceCode,
            '',
            'int main() {',
            '    int n;',
            '    if (scanf("%d", &n) != 1) return 0;',
            '',
            '    int *nums = (int *)malloc(sizeof(int) * n);',
            '    for (int i = 0; i < n; i++) {',
            '        scanf("%d", &nums[i]);',
            '    }',
            '',
            '    int target;',
            '    scanf("%d", &target);',
            '',
            '    int returnSize = 0;',
            '    int *answer = twoSum(nums, n, target, &returnSize);',
            '',
            '    if (answer && returnSize >= 2) {',
            '        printf("%d %d\\n", answer[0], answer[1]);',
            '        free(answer);',
            '    } else {',
            '        printf("NO_ANSWER\\n");',
            '    }',
            '',
            '    free(nums);',
            '    return 0;',
            '}'
        ].join('\n');
    }

    if (language === "cpp") {
        return [
            '#include <bits/stdc++.h>',
            'using namespace std;',
            '',
            sourceCode,
            '',
            'int main() {',
            '    int n;',
            '    cin >> n;',
            '',
            '    vector<int> nums(n);',
            '    for (int i = 0; i < n; i++) {',
            '        cin >> nums[i];',
            '    }',
            '',
            '    int target;',
            '    cin >> target;',
            '',
            '    Solution solution;',
            '    vector<int> answer = solution.twoSum(nums, target);',
            '',
            '    if (answer.size() >= 2) {',
            '        cout << answer[0] << " " << answer[1] << endl;',
            '    } else {',
            '        cout << "NO_ANSWER" << endl;',
            '    }',
            '',
            '    return 0;',
            '}'
        ].join('\n');
    }

    if (language === "java") {
        return [
            'import java.util.*;',
            '',
            sourceCode,
            '',
            'public class Main {',
            '    public static void main(String[] args) {',
            '        Scanner scanner = new Scanner(System.in);',
            '        int n = scanner.nextInt();',
            '',
            '        int[] nums = new int[n];',
            '        for (int i = 0; i < n; i++) {',
            '            nums[i] = scanner.nextInt();',
            '        }',
            '',
            '        int target = scanner.nextInt();',
            '        int[] answer = new Solution().twoSum(nums, target);',
            '',
            '        if (answer.length >= 2) {',
            '            System.out.println(answer[0] + " " + answer[1]);',
            '        } else {',
            '            System.out.println("NO_ANSWER");',
            '        }',
            '    }',
            '}'
        ].join('\n');
    }

    if (language === "js") {
        return [
            sourceCode,
            '',
            "const input = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);",
            'let index = 0;',
            'const n = input[index++];',
            'const nums = input.slice(index, index + n);',
            'index += n;',
            'const target = input[index];',
            'const answer = twoSum(nums, target);',
            '',
            'if (Array.isArray(answer) && answer.length >= 2) {',
            "  console.log(answer[0] + ' ' + answer[1]);",
            '} else {',
            "  console.log('NO_ANSWER');",
            '}'
        ].join('\n');
    }

    if (language === "python") {
        return [
            sourceCode,
            '',
            'import sys',
            'data = sys.stdin.read().split()',
            'idx = 0',
            'n = int(data[idx]); idx += 1',
            'nums = [int(data[idx + i]) for i in range(n)]; idx += n',
            'target = int(data[idx])',
            'answer = twoSum(nums, target)',
            'if isinstance(answer, list) and len(answer) >= 2:',
            '    print(answer[0], answer[1])',
            'else:',
            '    print("NO_ANSWER")'
        ].join('\n');
    }

    return sourceCode;
}

function buildGenericRunner(runnerType, language, sourceCode) {
    const runners = {
        "array-to-int": {
            c: (src) => [
                '#include <stdio.h>',
                '#include <stdlib.h>',
                '',
                src,
                '',
                'int main() {',
                '    int n;',
                '    if (scanf("%d", &n) != 1) return 0;',
                '    int *nums = malloc(sizeof(int) * n);',
                '    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);',
                '    printf("%d\\n", solution(nums, n));',
                '    free(nums);',
                '    return 0;',
                '}'
            ].join('\n'),
            cpp: (src) => [
                '#include <bits/stdc++.h>',
                'using namespace std;',
                '',
                src,
                '',
                'int main() {',
                '    int n; cin >> n;',
                '    vector<int> nums(n);',
                '    for (int i = 0; i < n; i++) cin >> nums[i];',
                '    cout << Solution().solution(nums) << endl;',
                '    return 0;',
                '}'
            ].join('\n'),
            java: (src) => [
                'import java.util.*;',
                '',
                src,
                '',
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
                src,
                '',
                "const input = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);",
                'let idx = 0;',
                'const n = input[idx++];',
                'const nums = input.slice(idx, idx + n);',
                'console.log(solution(nums));'
            ].join('\n'),
            python: (src) => [
                src,
                '',
                'import sys',
                'data = sys.stdin.read().split()',
                'n = int(data[0])',
                'nums = [int(data[i+1]) for i in range(n)]',
                'print(solution(nums))'
            ].join('\n')
        },
        "array-target-to-int": {
            c: (src) => [
                '#include <stdio.h>',
                '#include <stdlib.h>',
                '',
                src,
                '',
                'int main() {',
                '    int n;',
                '    if (scanf("%d", &n) != 1) return 0;',
                '    int *nums = malloc(sizeof(int) * n);',
                '    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);',
                '    int target;',
                '    scanf("%d", &target);',
                '    printf("%d\\n", solution(nums, n, target));',
                '    free(nums);',
                '    return 0;',
                '}'
            ].join('\n'),
            cpp: (src) => [
                '#include <bits/stdc++.h>',
                'using namespace std;',
                '',
                src,
                '',
                'int main() {',
                '    int n; cin >> n;',
                '    vector<int> nums(n);',
                '    for (int i = 0; i < n; i++) cin >> nums[i];',
                '    int target; cin >> target;',
                '    cout << Solution().solution(nums, target) << endl;',
                '    return 0;',
                '}'
            ].join('\n'),
            java: (src) => [
                'import java.util.*;',
                '',
                src,
                '',
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
                src,
                '',
                "const input = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);",
                'let idx = 0;',
                'const n = input[idx++];',
                'const nums = input.slice(idx, idx + n);',
                'idx += n;',
                'const target = input[idx];',
                'console.log(solution(nums, target));'
            ].join('\n'),
            python: (src) => [
                src,
                '',
                'import sys',
                'data = sys.stdin.read().split()',
                'n = int(data[0])',
                'nums = [int(data[i+1]) for i in range(n)]',
                'target = int(data[n+1])',
                'print(solution(nums, target))'
            ].join('\n')
        },
        "array-to-array": {
            c: (src) => [
                '#include <stdio.h>',
                '#include <stdlib.h>',
                '',
                src,
                '',
                'int main() {',
                '    int n;',
                '    if (scanf("%d", &n) != 1) return 0;',
                '    int *nums = malloc(sizeof(int) * n);',
                '    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);',
                '    int returnSize = 0;',
                '    int *result = solution(nums, n, &returnSize);',
                '    for (int i = 0; i < returnSize; i++) {',
                '        if (i) printf(" ");',
                '        printf("%d", result[i]);',
                '    }',
                '    printf("\\n");',
                '    free(nums);',
                '    free(result);',
                '    return 0;',
                '}'
            ].join('\n'),
            cpp: (src) => [
                '#include <bits/stdc++.h>',
                'using namespace std;',
                '',
                src,
                '',
                'int main() {',
                '    int n; cin >> n;',
                '    vector<int> nums(n);',
                '    for (int i = 0; i < n; i++) cin >> nums[i];',
                '    vector<int> result = Solution().solution(nums);',
                '    for (int i = 0; i < result.size(); i++) {',
                '        if (i) cout << " ";',
                '        cout << result[i];',
                '    }',
                '    cout << endl;',
                '    return 0;',
                '}'
            ].join('\n'),
            java: (src) => [
                'import java.util.*;',
                '',
                src,
                '',
                'public class Main {',
                '    public static void main(String[] args) {',
                '        Scanner sc = new Scanner(System.in);',
                '        int n = sc.nextInt();',
                '        int[] nums = new int[n];',
                '        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();',
                '        int[] result = new Solution().solution(nums);',
                '        StringBuilder sb = new StringBuilder();',
                '        for (int i = 0; i < result.length; i++) {',
                '            if (i > 0) sb.append(" ");',
                '            sb.append(result[i]);',
                '        }',
                '        System.out.println(sb);',
                '    }',
                '}'
            ].join('\n'),
            js: (src) => [
                src,
                '',
                "const input = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);",
                'let idx = 0;',
                'const n = input[idx++];',
                'const nums = input.slice(idx, idx + n);',
                'const result = solution(nums);',
                'console.log(result.join(" "));'
            ].join('\n'),
            python: (src) => [
                src,
                '',
                'import sys',
                'data = sys.stdin.read().split()',
                'n = int(data[0])',
                'nums = [int(data[i+1]) for i in range(n)]',
                'result = solution(nums)',
                "print(' '.join(map(str, result)))"
            ].join('\n')
        },
        "array-k-to-array": {
            cpp: (src) => [
                '#include <bits/stdc++.h>',
                'using namespace std;',
                '',
                src,
                '',
                'int main() {',
                '    int n, k; cin >> n >> k;',
                '    vector<int> nums(n);',
                '    for (int i = 0; i < n; i++) cin >> nums[i];',
                '    vector<int> result = Solution().solution(nums, k);',
                '    for (int i = 0; i < result.size(); i++) {',
                '        if (i) cout << " ";',
                '        cout << result[i];',
                '    }',
                '    cout << endl;',
                '    return 0;',
                '}'
            ].join('\n'),
            c: (src) => [
                '#include <stdio.h>',
                '#include <stdlib.h>',
                '',
                src,
                '',
                'int main() {',
                '    int n, k;',
                '    scanf("%d %d", &n, &k);',
                '    int *nums = malloc(sizeof(int) * n);',
                '    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);',
                '    int returnSize = 0;',
                '    int *result = solution(nums, n, k, &returnSize);',
                '    for (int i = 0; i < returnSize; i++) {',
                '        if (i) printf(" ");',
                '        printf("%d", result[i]);',
                '    }',
                '    printf("\\n");',
                '    free(nums);',
                '    free(result);',
                '    return 0;',
                '}'
            ].join('\n'),
            java: (src) => [
                'import java.util.*;',
                '',
                src,
                '',
                'public class Main {',
                '    public static void main(String[] args) {',
                '        Scanner sc = new Scanner(System.in);',
                '        int n = sc.nextInt(); int k = sc.nextInt();',
                '        int[] nums = new int[n];',
                '        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();',
                '        int[] result = new Solution().solution(nums, k);',
                '        StringBuilder sb = new StringBuilder();',
                '        for (int i = 0; i < result.length; i++) {',
                '            if (i > 0) sb.append(" ");',
                '            sb.append(result[i]);',
                '        }',
                '        System.out.println(sb);',
                '    }',
                '}'
            ].join('\n'),
            js: (src) => [
                src,
                '',
                "const input = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);",
                'let idx = 0;',
                'const n = input[idx++]; const k = input[idx++];',
                'const nums = input.slice(idx, idx + n);',
                'const result = solution(nums, k);',
                'console.log(result.join(" "));'
            ].join('\n'),
            python: (src) => [
                src,
                '',
                'import sys',
                'data = sys.stdin.read().split()',
                'n = int(data[0]); k = int(data[1])',
                'nums = [int(data[i+2]) for i in range(n)]',
                'result = solution(nums, k)',
                "print(' '.join(map(str, result)))"
            ].join('\n')
        },
        "array-k-inplace": {
            cpp: (src) => [
                '#include <bits/stdc++.h>',
                'using namespace std;',
                '',
                src,
                '',
                'int main() {',
                '    int n, k; cin >> n >> k;',
                '    vector<int> nums(n);',
                '    for (int i = 0; i < n; i++) cin >> nums[i];',
                '    Solution().solution(nums, k);',
                '    for (int i = 0; i < n; i++) {',
                '        if (i) cout << " ";',
                '        cout << nums[i];',
                '    }',
                '    cout << endl;',
                '    return 0;',
                '}'
            ].join('\n'),
            c: (src) => [
                '#include <stdio.h>',
                '#include <stdlib.h>',
                '',
                src,
                '',
                'int main() {',
                '    int n, k;',
                '    scanf("%d %d", &n, &k);',
                '    int *nums = malloc(sizeof(int) * n);',
                '    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);',
                '    solution(nums, n, k);',
                '    for (int i = 0; i < n; i++) {',
                '        if (i) printf(" ");',
                '        printf("%d", nums[i]);',
                '    }',
                '    printf("\\n");',
                '    free(nums);',
                '    return 0;',
                '}'
            ].join('\n'),
            java: (src) => [
                'import java.util.*;',
                '',
                src,
                '',
                'public class Main {',
                '    public static void main(String[] args) {',
                '        Scanner sc = new Scanner(System.in);',
                '        int n = sc.nextInt(); int k = sc.nextInt();',
                '        int[] nums = new int[n];',
                '        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();',
                '        new Solution().solution(nums, k);',
                '        StringBuilder sb = new StringBuilder();',
                '        for (int i = 0; i < n; i++) {',
                '            if (i > 0) sb.append(" ");',
                '            sb.append(nums[i]);',
                '        }',
                '        System.out.println(sb);',
                '    }',
                '}'
            ].join('\n'),
            js: (src) => [
                src,
                '',
                "const input = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);",
                'let idx = 0;',
                'const n = input[idx++]; const k = input[idx++];',
                'const nums = input.slice(idx, idx + n);',
                'solution(nums, k);',
                'console.log(nums.join(" "));'
            ].join('\n'),
            python: (src) => [
                src,
                '',
                'import sys',
                'data = sys.stdin.read().split()',
                'n = int(data[0]); k = int(data[1])',
                'nums = [int(data[i+2]) for i in range(n)]',
                'solution(nums, k)',
                "print(' '.join(map(str, nums)))"
            ].join('\n')
        },
        "array-inplace": {
            cpp: (src) => [
                '#include <bits/stdc++.h>',
                'using namespace std;',
                '',
                src,
                '',
                'int main() {',
                '    int n; cin >> n;',
                '    vector<int> nums(n);',
                '    for (int i = 0; i < n; i++) cin >> nums[i];',
                '    Solution().solution(nums);',
                '    for (int i = 0; i < n; i++) {',
                '        if (i) cout << " ";',
                '        cout << nums[i];',
                '    }',
                '    cout << endl;',
                '    return 0;',
                '}'
            ].join('\n'),
            c: (src) => [
                '#include <stdio.h>',
                '#include <stdlib.h>',
                '',
                src,
                '',
                'int main() {',
                '    int n;',
                '    scanf("%d", &n);',
                '    int *nums = malloc(sizeof(int) * n);',
                '    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);',
                '    solution(nums, n);',
                '    for (int i = 0; i < n; i++) {',
                '        if (i) printf(" ");',
                '        printf("%d", nums[i]);',
                '    }',
                '    printf("\\n");',
                '    free(nums);',
                '    return 0;',
                '}'
            ].join('\n'),
            java: (src) => [
                'import java.util.*;',
                '',
                src,
                '',
                'public class Main {',
                '    public static void main(String[] args) {',
                '        Scanner sc = new Scanner(System.in);',
                '        int n = sc.nextInt();',
                '        int[] nums = new int[n];',
                '        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();',
                '        new Solution().solution(nums);',
                '        StringBuilder sb = new StringBuilder();',
                '        for (int i = 0; i < n; i++) {',
                '            if (i > 0) sb.append(" ");',
                '            sb.append(nums[i]);',
                '        }',
                '        System.out.println(sb);',
                '    }',
                '}'
            ].join('\n'),
            js: (src) => [
                src,
                '',
                "const input = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);",
                'let idx = 0;',
                'const n = input[idx++];',
                'const nums = input.slice(idx, idx + n);',
                'solution(nums);',
                'console.log(nums.join(" "));'
            ].join('\n'),
            python: (src) => [
                src,
                '',
                'import sys',
                'data = sys.stdin.read().split()',
                'n = int(data[0])',
                'nums = [int(data[i+1]) for i in range(n)]',
                'solution(nums)',
                "print(' '.join(map(str, nums)))"
            ].join('\n')
        },
        "intervals": {
            cpp: (src) => [
                '#include <bits/stdc++.h>',
                'using namespace std;',
                '',
                src,
                '',
                'int main() {',
                '    int n; cin >> n;',
                '    vector<vector<int>> intervals(n, vector<int>(2));',
                '    for (int i = 0; i < n; i++) cin >> intervals[i][0] >> intervals[i][1];',
                '    vector<vector<int>> result = Solution().solution(intervals);',
                '    for (auto& iv : result) {',
                '        cout << iv[0] << " " << iv[1] << endl;',
                '    }',
                '    return 0;',
                '}'
            ].join('\n'),
            c: (src) => [
                '#include <stdio.h>',
                '#include <stdlib.h>',
                '',
                src,
                '',
                'int main() {',
                '    int n; scanf("%d", &n);',
                '    int intervals[n][2];',
                '    for (int i = 0; i < n; i++) scanf("%d %d", &intervals[i][0], &intervals[i][1]);',
                '    int returnSize = 0;',
                '    int **result = solution(intervals, n, &returnSize);',
                '    for (int i = 0; i < returnSize; i++) {',
                '        printf("%d %d\\n", result[i][0], result[i][1]);',
                '    }',
                '    return 0;',
                '}'
            ].join('\n'),
            java: (src) => [
                'import java.util.*;',
                '',
                src,
                '',
                'public class Main {',
                '    public static void main(String[] args) {',
                '        Scanner sc = new Scanner(System.in);',
                '        int n = sc.nextInt();',
                '        int[][] intervals = new int[n][2];',
                '        for (int i = 0; i < n; i++) { intervals[i][0] = sc.nextInt(); intervals[i][1] = sc.nextInt(); }',
                '        int[][] result = new Solution().solution(intervals);',
                '        for (int[] iv : result) {',
                '            System.out.println(iv[0] + " " + iv[1]);',
                '        }',
                '    }',
                '}'
            ].join('\n'),
            js: (src) => [
                src,
                '',
                "const input = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);",
                'let idx = 0;',
                'const n = input[idx++];',
                'const intervals = [];',
                'for (let i = 0; i < n; i++) intervals.push([input[idx++], input[idx++]]);',
                'const result = solution(intervals);',
                'result.forEach(iv => console.log(iv[0] + " " + iv[1]));'
            ].join('\n'),
            python: (src) => [
                src,
                '',
                'import sys',
                'data = sys.stdin.read().split()',
                'n = int(data[0])',
                'intervals = [[int(data[1+i*2]), int(data[1+i*2+1])] for i in range(n)]',
                'result = solution(intervals)',
                'for iv in result:',
                '    print(iv[0], iv[1])'
            ].join('\n')
        },
        "words-k": {
            cpp: (src) => [
                '#include <bits/stdc++.h>',
                'using namespace std;',
                '',
                src,
                '',
                'int main() {',
                '    int n, k; cin >> n >> k;',
                '    vector<string> words(n);',
                '    for (int i = 0; i < n; i++) cin >> words[i];',
                '    vector<string> result = solution(words, k);',
                '    for (int i = 0; i < result.size(); i++) {',
                '        if (i) cout << " ";',
                '        cout << result[i];',
                '    }',
                '    cout << endl;',
                '    return 0;',
                '}'
            ].join('\n'),
            c: (src) => [
                '#include <stdio.h>',
                '#include <string.h>',
                '',
                src,
                '',
                'int main() {',
                '    int n, k; scanf("%d %d", &n, &k);',
                '    char words[n][100];',
                '    for (int i = 0; i < n; i++) scanf("%s", words[i]);',
                '    int returnSize = 0;',
                '    char **result = solution(words, n, k, &returnSize);',
                '    for (int i = 0; i < returnSize; i++) {',
                '        if (i) printf(" ");',
                '        printf("%s", result[i]);',
                '    }',
                '    printf("\\n");',
                '    return 0;',
                '}'
            ].join('\n'),
            java: (src) => [
                'import java.util.*;',
                '',
                src,
                '',
                'public class Main {',
                '    public static void main(String[] args) {',
                '        Scanner sc = new Scanner(System.in);',
                '        int n = sc.nextInt(); int k = sc.nextInt();',
                '        String[] words = new String[n];',
                '        for (int i = 0; i < n; i++) words[i] = sc.next();',
                '        String[] result = new Solution().solution(words, k);',
                '        StringBuilder sb = new StringBuilder();',
                '        for (int i = 0; i < result.length; i++) {',
                '            if (i > 0) sb.append(" ");',
                '            sb.append(result[i]);',
                '        }',
                '        System.out.println(sb);',
                '    }',
                '}'
            ].join('\n'),
            js: (src) => [
                src,
                '',
                "const input = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/);",
                'let idx = 0;',
                'const n = parseInt(input[idx++]); const k = parseInt(input[idx++]);',
                'const words = input.slice(idx, idx + n);',
                'const result = solution(words, k);',
                'console.log(result.join(" "));'
            ].join('\n'),
            python: (src) => [
                src,
                '',
                'import sys',
                'data = sys.stdin.read().split()',
                'n = int(data[0]); k = int(data[1])',
                'words = data[2:2+n]',
                'result = solution(words, k)',
                "print(' '.join(result))"
            ].join('\n')
        },
        "n-to-sorted-strings": {
            cpp: (src) => [
                '#include <bits/stdc++.h>',
                'using namespace std;',
                '',
                src,
                '',
                'int main() {',
                '    int n; cin >> n;',
                '    vector<string> result = Solution().solution(n);',
                '    sort(result.begin(), result.end());',
                '    for (size_t i = 0; i < result.size(); i++) {',
                '        if (i) cout << " ";',
                '        cout << result[i];',
                '    }',
                '    cout << endl;',
                '    return 0;',
                '}'
            ].join('\n'),
            c: (src) => [
                '#include <stdio.h>',
                '#include <stdlib.h>',
                '#include <string.h>',
                '',
                src,
                '',
                'int af_cmpstr(const void* a, const void* b) {',
                '    return strcmp(*(const char**)a, *(const char**)b);',
                '}',
                '',
                'int main() {',
                '    int n; scanf("%d", &n);',
                '    int returnSize = 0;',
                '    char **result = solution(n, &returnSize);',
                '    qsort(result, returnSize, sizeof(char*), af_cmpstr);',
                '    for (int i = 0; i < returnSize; i++) {',
                '        if (i) printf(" ");',
                '        printf("%s", result[i]);',
                '    }',
                '    printf("\\n");',
                '    return 0;',
                '}'
            ].join('\n'),
            java: (src) => [
                'import java.util.*;',
                '',
                src,
                '',
                'public class Main {',
                '    public static void main(String[] args) {',
                '        Scanner sc = new Scanner(System.in);',
                '        int n = sc.nextInt();',
                '        String[] result = new Solution().solution(n);',
                '        Arrays.sort(result);',
                '        StringBuilder sb = new StringBuilder();',
                '        for (int i = 0; i < result.length; i++) {',
                '            if (i > 0) sb.append(" ");',
                '            sb.append(result[i]);',
                '        }',
                '        System.out.println(sb);',
                '    }',
                '}'
            ].join('\n'),
            js: (src) => [
                src,
                '',
                "const n = parseInt(require('fs').readFileSync(0, 'utf8').trim(), 10);",
                'const result = solution(n).slice().sort();',
                'console.log(result.join(" "));'
            ].join('\n'),
            python: (src) => [
                src,
                '',
                'import sys',
                'n = int(sys.stdin.read().strip())',
                'result = sorted(solution(n))',
                "print(' '.join(result))"
            ].join('\n')
        }
    };

    const langRunner = runners[runnerType];
    if (!langRunner || !langRunner[language]) return sourceCode;
    return langRunner[language](sourceCode);
}

function buildJudgeSource(problem, language, sourceCode) {
    if (problem.runner === "two-sum") {
        return buildTwoSumJudgeSource(language, sourceCode);
    }

    if (problem.runner && problem.runner !== "two-sum") {
        return buildGenericRunner(problem.runner, language, sourceCode);
    }

    return sourceCode;
}

async function runJudge0Submission(problem, language, sourceCode, testCase) {
    const headers = {
        "Content-Type": "application/json"
    };

    if (JUDGE0_API_KEY) {
        headers["X-Auth-Token"] = JUDGE0_API_KEY;
    }

    // Helper to base64 encode strings
    const b64encode = (str) => Buffer.from(str).toString('base64');

    const builtSource = buildJudgeSource(problem, language, sourceCode);
    const stdin = testCase.input == null ? "" : String(testCase.input);
    const expectedOutput = testCase.expected == null ? "" : String(testCase.expected);

    const response = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=true&wait=true`, {
        method: "POST",
        headers,
        body: JSON.stringify({
            language_id: languageIds[language],
            source_code: b64encode(builtSource),
            stdin: b64encode(stdin),
            expected_output: b64encode(expectedOutput),
            cpu_time_limit: 2
        })
    });

    if (!response.ok) {
        let details = '';
        try {
            const txt = await response.text();
            details = ` - ${txt}`;
        } catch (e) {
            details = '';
        }
        throw new Error(`Judge0 request failed with status ${response.status}${details}`);
    }

    const result = await response.json();
    
    // Decode base64 responses from Judge0
    const b64decode = (str) => {
        try {
            return str ? Buffer.from(str, 'base64').toString('utf8') : '';
        } catch (e) {
            return str || '';
        }
    };
    
    const stdout = b64decode(result.stdout) || "";
    const expected = testCase.expected;

    return {
        name: testCase.name,
        passed: result.status && result.status.id === 3 && stdout.trim() === expected.trim(),
        input: testCase.input.trim(),
        expected: expected.trim(),
        output: stdout.trim(),
        status: result.status ? result.status.description : "Unknown",
        time: result.time,
        memory: result.memory,
        stderr: b64decode(result.stderr) || "",
        compileOutput: b64decode(result.compile_output) || ""
    };
}

module.exports = { languageIds, buildJudgeSource, runJudge0Submission };
