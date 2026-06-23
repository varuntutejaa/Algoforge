const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const User = require('./models/users');
const Problem = require('./models/Problem');
const Submission = require('./models/Submission');
const UserCode = require('./models/UserCode');
const {
    getVerdict,
    getSubmissionMetrics,
    updateStreak,
    formatProfile,
    ensureUserProfileFields,
    getUserIdFromRequest,
    loadRequestUser
} = require('./utils/profileHelpers');
const contestRoutes = require('./routes/contests');
const { verifyFirebaseToken, optionalAuth } = require('./middleware/auth');

require("dotenv").config();
const compression = require("compression");
const app = express();
app.use(compression());
app.use(cors());
app.use(express.json());

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

function formatBoilerplate(boilerplate) {
    if (!boilerplate) return {};
    if (boilerplate instanceof Map) {
        return Object.fromEntries(boilerplate);
    }
    return boilerplate;
}

function formatProblem(problem) {
    const doc = problem.toObject ? problem.toObject() : problem;

    return {
        id: doc.id,
        title: doc.title,
        difficulty: doc.difficulty,
        tags: doc.tags,
        description: doc.description,
        constraints: doc.constraints,
        example: doc.example,
        boilerplate: formatBoilerplate(doc.boilerplate),
        testCases: doc.testCases,
        runner: doc.runner || null
    };
}

// Add Python boilerplates to any problems missing them
async function migratePythonBoilerplates() {
    const pythonBoilerplates = {
        'two-sum': 'def twoSum(nums, target):\n    # Write your solution here\n    pass',
        'array-to-int': 'def solution(nums):\n    # Write your solution here\n    pass',
        'array-to-array': 'def solution(nums):\n    # Write your solution here\n    pass',
        'array-k-to-array': 'def solution(nums, k):\n    # Write your solution here\n    pass',
        'array-k-inplace': 'def solution(nums, k):\n    # Write your solution here\n    pass',
        'array-inplace': 'def solution(nums):\n    # Write your solution here\n    pass',
        'intervals': 'def solution(intervals):\n    # Write your solution here\n    pass',
        'words-k': 'def solution(words, k):\n    # Write your solution here\n    pass',
    };
    try {
        const problems = await Problem.find({}).lean();
        for (const p of problems) {
            if (p.boilerplate && !p.boilerplate.get ? !p.boilerplate['python'] : !(p.boilerplate instanceof Map ? p.boilerplate.get('python') : p.boilerplate['python'])) {
                const runnerKey = p.runner || 'array-to-int';
                const pyBoiler = pythonBoilerplates[runnerKey] || pythonBoilerplates['array-to-int'];
                await Problem.updateOne({ _id: p._id }, { $set: { 'boilerplate.python': pyBoiler } });
                console.log(`✅ Added Python boilerplate to: ${p.id}`);
            }
        }
    } catch (e) {
        console.error('Python boilerplate migration error:', e.message);
    }
}

//connect to MongoDB
// Improved mongoose connection with retries and better logging
const mongooseOptions = {
    // Short server selection timeout so failures are surfaced quickly
    serverSelectionTimeoutMS: 5000
};

async function connectWithRetry(retries = 5, delayMs = 3000) {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error('MONGO_URI is not set in environment. Set MONGO_URI to your MongoDB connection string.');
        process.exit(1);
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await mongoose.connect(uri, mongooseOptions);
            console.log('MongoDB Connected');
            migratePythonBoilerplates();
            return;
        } catch (err) {
            console.error(`MongoDB connection attempt ${attempt} failed: ${err.message}`);
            if (attempt < retries) {
                console.log(`Retrying in ${delayMs}ms...`);
                await new Promise((r) => setTimeout(r, delayMs));
            } else {
                console.error('All MongoDB connection attempts failed.');
                console.error(err);
                process.exit(1);
            }
        }
    }
}

mongoose.connection.on('connected', () => console.log('Mongoose connection: connected'));
mongoose.connection.on('error', (err) => console.error('Mongoose connection error:', err));
mongoose.connection.on('disconnected', () => console.warn('Mongoose connection: disconnected'));

connectWithRetry();

// Mount contest routes (optionalAuth so Firebase token is verified when present)
app.use('/api/contests', optionalAuth, contestRoutes);

// Proxy: LeetCode upcoming contests via GraphQL (avoids browser CORS restriction)
let cfContestsCache = null;
let cfCacheTime = 0;
app.get('/api/codeforces-contests', async (req, res) => {
  try {
    const now = Date.now();
    if (cfContestsCache && now - cfCacheTime < 5 * 60 * 1000) {
      return res.json(cfContestsCache);
    }
    const apiRes = await fetch('https://codeforces.com/api/contest.list?gym=false', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AlgoForge/1.0)' }
    });
    const data = await apiRes.json();
    if (data.status !== 'OK') return res.status(502).json({ contests: [], error: 'CF API error' });
    const contests = data.result.filter(c => c.phase === 'BEFORE' || c.phase === 'CODING');
    cfContestsCache = { contests };
    cfCacheTime = now;
    res.json(cfContestsCache);
  } catch (err) {
    res.status(500).json({ contests: [], error: err.message });
  }
});

let ccContestsCache = null;
let ccCacheTime = 0;
app.get('/api/codechef-contests', async (req, res) => {
  try {
    const now = Date.now();
    if (ccContestsCache && now - ccCacheTime < 10 * 60 * 1000) {
      return res.json(ccContestsCache);
    }
    const apiRes = await fetch(
      'https://www.codechef.com/api/list/contests/all?sort_by=START&sorting_order=asc&offset=0&mode=all',
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AlgoForge/1.0)' } }
    );
    const data = await apiRes.json();
    const contests = (data.future_contests || []).map(c => ({
      code: c.contest_code,
      name: c.contest_name,
      startTime: c.contest_start_date_iso,
      endTime: c.contest_end_date_iso,
      durationMins: Number(c.contest_duration),
    }));
    ccContestsCache = { contests };
    ccCacheTime = now;
    res.json(ccContestsCache);
  } catch (err) {
    res.status(500).json({ contests: [], error: err.message });
  }
});

let lcContestsCache = null;
let lcCacheTime = 0;
app.get('/api/leetcode-contests', async (req, res) => {
  try {
    const now = Date.now();
    if (lcContestsCache && now - lcCacheTime < 10 * 60 * 1000) {
      return res.json(lcContestsCache);
    }
    const gqlRes = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com',
        'User-Agent': 'Mozilla/5.0 (compatible; AlgoForge/1.0)',
      },
      body: JSON.stringify({
        query: `{ allContests { title titleSlug startTime duration isVirtual containsPremium } }`
      }),
    });
    const data = await gqlRes.json();
    const allContests = (data.data?.allContests || []);
    const filtered = allContests.filter(c =>
      !c.isVirtual && !c.containsPremium && (c.startTime * 1000 + c.duration * 1000) > now
    );
    lcContestsCache = { contests: filtered };
    lcCacheTime = now;
    res.json(lcContestsCache);
  } catch (err) {
    res.status(500).json({ contests: [], error: err.message });
  }
});

let atContestsCache = null;
let atCacheTime = 0;
app.get('/api/atcoder-contests', async (req, res) => {
  try {
    const now = Date.now();
    if (atContestsCache && now - atCacheTime < 10 * 60 * 1000) {
      return res.json(atContestsCache);
    }
    const html = await fetch('https://atcoder.jp/contests/?lang=en', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      }
    }).then(r => r.text());

    // Extract upcoming contests table
    const tableMatch = html.match(/Upcoming Contests[\s\S]*?<\/table>/);
    if (!tableMatch) return res.json({ contests: [] });

    const rowRegex = /<tr>([\s\S]*?)<\/tr>/g;
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
    const contests = [];
    let rowMatch;

    while ((rowMatch = rowRegex.exec(tableMatch[0])) !== null) {
      const cells = [];
      let cellMatch;
      const cellRe = /<td[^>]*>([\s\S]*?)<\/td>/g;
      while ((cellMatch = cellRe.exec(rowMatch[1])) !== null) cells.push(cellMatch[1]);
      if (cells.length < 4) continue;

      const timeMatch = cells[0].match(/<time[^>]*>([^<]+)<\/time>/);
      const linkMatch = cells[1].match(/href="\/contests\/([^"]+)"[^>]*>([^<\n]+)/);
      const durMatch  = cells[2].match(/(\d+):(\d+)/);
      if (!timeMatch || !linkMatch || !durMatch) continue;

      // Parse "2026-06-27 21:00:00+0900" → ms
      const startStr = timeMatch[1].trim().replace(' ', 'T');
      const startMs  = new Date(startStr).getTime();
      if (isNaN(startMs)) continue;

      const durationMins = parseInt(durMatch[1]) * 60 + parseInt(durMatch[2]);
      const endMs = startMs + durationMins * 60 * 1000;
      if (endMs < now) continue; // already ended

      contests.push({
        id:           linkMatch[1].trim(),
        title:        linkMatch[2].trim(),
        startTime:    startMs,
        endTime:      endMs,
        durationMins,
        rateChange:   '',
      });
    }

    atContestsCache = { contests };
    atCacheTime = now;
    res.json(atContestsCache);
  } catch (err) {
    res.status(500).json({ contests: [], error: err.message });
  }
});

// Debug endpoint: check if Firebase env vars are set (remove in production)
app.get("/api/health", (req, res) => {
    const firebaseAdmin = require('./firebase-admin');
    const privateKey = process.env.FIREBASE_PRIVATE_KEY || "";

    res.json({
        success: true,
        firebaseConfigured: firebaseAdmin.isInitialized,
        initError: firebaseAdmin.initError,
        envVars: {
            FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
            FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
            FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
            privateKeyLength: privateKey.length,
            privateKeyHasBegin: privateKey.includes("-----BEGIN PRIVATE KEY-----"),
            privateKeyHasEnd: privateKey.includes("-----END PRIVATE KEY-----"),
            privateKeyHasLiteralNewlines: privateKey.includes("\\n"),
            privateKeyHasActualNewlines: privateKey.includes("\n"),
        }
    });
});

// Auth route: verify Firebase token and create/return user profile
app.post("/api/auth/login", verifyFirebaseToken, async (req, res) => {
    const user = req.user;
    res.json({
        success: true,
        message: "Login successful",
        user: {
            id: user._id.toString(),
            firebaseUid: user.firebaseUid,
            name: user.name,
            email: user.email,
            profilePicture: user.profilePicture,
            rating: user.rating
        }
    });
});

// Auth route: create user profile (called after Firebase signup)
app.post("/api/auth/signup", verifyFirebaseToken, async (req, res) => {
    const user = req.user;
    res.json({
        success: true,
        message: "Signup successful",
        user: {
            id: user._id.toString(),
            firebaseUid: user.firebaseUid,
            name: user.name,
            email: user.email,
            profilePicture: user.profilePicture
        }
    });
});

// Get profile
app.get("/profile", verifyFirebaseToken, async (req, res) => {
    try {
        const user = req.user;
        res.json({
            success: true,
            profile: formatProfile(user)
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch profile"
        });
    }
});

// Get current streak
app.get("/profile/streak", verifyFirebaseToken, async (req, res) => {
    try {
        const user = req.user;
        const { startOfDay } = require('./utils/profileHelpers');
        const today = startOfDay(new Date());
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
        const lastActivity = user.lastActivityDate ? startOfDay(user.lastActivityDate) : null;
        const isActive = lastActivity && (
            lastActivity.getTime() === today.getTime() ||
            lastActivity.getTime() === yesterday.getTime()
        );
        const solvedToday = !!(lastActivity && lastActivity.getTime() === today.getTime());
        // streak expired — reset DB value so it doesn't linger
        if (!isActive && user.currentStreak > 0) {
            user.currentStreak = 0;
            await user.save();
        }
        const currentStreak = isActive ? (user.currentStreak || 0) : 0;
        res.json({ currentStreak, longestStreak: user.longestStreak || 0, solvedToday });
    } catch (error) {
        res.status(500).json({ currentStreak: 0, longestStreak: 0, solvedToday: false });
    }
});

// Get solved problems
app.get("/profile/solved", verifyFirebaseToken, async (req, res) => {
    try {
        const user = req.user;
        ensureUserProfileFields(user);
        const solvedIds = user.solvedProblems.map((entry) => entry.problemId);
        const problems = await Problem.find({ id: { $in: solvedIds } }).lean();
        const problemMap = new Map(problems.map((problem) => [problem.id, problem]));

        const solved = user.solvedProblems
            .slice()
            .sort((a, b) => new Date(b.solvedAt) - new Date(a.solvedAt))
            .map((entry) => {
                const problem = problemMap.get(entry.problemId);
                return {
                    problemId: entry.problemId,
                    solvedAt: entry.solvedAt,
                    title: problem?.title || entry.problemId,
                    difficulty: problem?.difficulty || "Unknown",
                    tags: problem?.tags || []
                };
            });

        res.json({
            success: true,
            solved,
            solvedIds
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch solved problems"
        });
    }
});

// Get submissions
app.get("/profile/submissions", verifyFirebaseToken, async (req, res) => {
    try {
        const user = req.user;
        const filter = { userId: user._id };
        const verdict = req.query.verdict;

        if (verdict && verdict !== "All") {
            filter.verdict = verdict;
        }

        const submissions = await Submission.find(filter)
            .sort({ submittedAt: -1 })
            .lean();

        res.json({
            success: true,
            submissions: submissions.map((submission) => ({
                id: submission._id.toString(),
                problemId: submission.problemId,
                problemTitle: submission.problemTitle,
                language: submission.language,
                verdict: submission.verdict,
                runtime: submission.runtime,
                memory: submission.memory,
                submittedAt: submission.submittedAt
            }))
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch submissions"
        });
    }
});

// Get activity heatmap data
app.get("/profile/activity", verifyFirebaseToken, async (req, res) => {
    try {
        const user = req.user;
        const days = Number(req.query.days) || 365;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (days - 1));
        startDate.setHours(0, 0, 0, 0);

        const activity = await Submission.aggregate([
            {
                $match: {
                    userId: user._id,
                    verdict: "Accepted",
                    submittedAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$submittedAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            success: true,
            activity: activity.map((entry) => ({
                date: entry._id,
                count: entry.count
            }))
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch activity"
        });
    }
});

// Save user code
app.post("/code/save", verifyFirebaseToken, async (req, res) => {
    try {
        const user = req.user;
        const { problemId, language, sourceCode } = req.body;

        if (!problemId || !language || typeof sourceCode !== "string") {
            return res.status(400).json({
                success: false,
                message: "problemId, language, and sourceCode are required"
            });
        }

        if (!languageIds[language]) {
            return res.status(400).json({
                success: false,
                message: "Unsupported language"
            });
        }

        const saved = await UserCode.findOneAndUpdate(
            { userId: user._id, problemId, language },
            {
                userId: user._id,
                problemId,
                language,
                sourceCode,
                updatedAt: new Date()
            },
            { upsert: true, returnDocument: "after", runValidators: true }
        );

        res.json({
            success: true,
            updatedAt: saved.updatedAt
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Failed to save code"
        });
    }
});

// Get saved code
app.get("/code/:problemId/:language", verifyFirebaseToken, async (req, res) => {
    try {
        const user = req.user;
        const { problemId, language } = req.params;

        if (!languageIds[language]) {
            return res.status(400).json({
                success: false,
                message: "Unsupported language"
            });
        }

        const savedCode = await UserCode.findOne({
            userId: user._id,
            problemId,
            language
        }).lean();

        if (!savedCode) {
            return res.status(404).json({
                success: false,
                message: "No saved code"
            });
        }

        res.json({
            success: true,
            sourceCode: savedCode.sourceCode,
            updatedAt: savedCode.updatedAt
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch saved code"
        });
    }
});

// Get all problems
app.get("/problems", async (req, res) => {
    try {
        const problems = await Problem.find()
            .select('id title difficulty tags description testCases')
            .sort({ createdAt: 1 })
            .lean();

        res.json({
            success: true,
            problems: problems.map((problem) => ({
                id: problem.id,
                title: problem.title,
                difficulty: problem.difficulty,
                tags: problem.tags,
                summary: problem.description[0] || "",
                testCaseCount: problem.testCases.length
            }))
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch problems"
        });
    }
});

// Get single problem by ID
app.get("/problems/:id", async (req, res) => {
    try {
        const problem = await Problem.findOne({ id: req.params.id });

        if (!problem) {
            return res.status(404).json({
                success: false,
                message: "Problem not found"
            });
        }

        res.json({
            success: true,
            problem: formatProblem(problem)
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch problem"
        });
    }
});

// Create a new problem (admin)
app.post("/problems", async (req, res) => {
    try {
        const {
            id,
            title,
            difficulty,
            tags = [],
            description,
            constraints = [],
            example,
            boilerplate,
            testCases,
            runner = null
        } = req.body;

        if (!id || !title || !difficulty || !description || !example || !boilerplate || !testCases) {
            return res.status(400).json({
                success: false,
                message: "Missing required problem fields"
            });
        }

        const existingProblem = await Problem.findOne({ id });
        if (existingProblem) {
            return res.status(409).json({
                success: false,
                message: "Problem with this id already exists"
            });
        }

        const problem = new Problem({
            id,
            title,
            difficulty,
            tags,
            description,
            constraints,
            example,
            boilerplate,
            testCases,
            runner
        });

        await problem.save();

        res.status(201).json({
            success: true,
            problem: formatProblem(problem)
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Failed to create problem"
        });
    }
});

// AI Code Review endpoint
app.post('/api/review', optionalAuth, async (req, res) => {
    const { problemId, code, language } = req.body;
    if (!problemId || !code) return res.status(400).json({ error: 'Missing problemId or code' });

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return res.status(503).json({ error: 'AI service not configured' });

    try {
        const problemDoc = await Problem.findOne({ id: problemId }).lean();
        if (!problemDoc) return res.status(404).json({ error: 'Problem not found' });

        const title       = problemDoc.title || '';
        const description = (problemDoc.description || []).join('\n');
        const constraints = (problemDoc.constraints || []).join('\n');

        const systemPrompt = `You are an expert code reviewer for competitive programming. The user has just solved a problem successfully (all test cases passed). Provide a structured review of their solution.

Your review MUST follow exactly this format with these exact section headers:
**Time Complexity**
[Analysis]

**Space Complexity**
[Analysis]

**What You Did Well**
[1-2 specific positives]

**How to Improve**
[2-3 concrete suggestions to optimize or clean up the code — mention specific lines or patterns if possible]

**Alternative Approaches**
[2-3 different ways to solve this problem with a one-line tradeoff for each — e.g. brute force, different data structure, mathematical insight. Mention their time/space complexity briefly.]

Be concise, precise, and educational. Do not re-explain the problem. Do not write full working code for any approach.`;

        const userMessage = `Problem: ${title}

Description:
${description}

Constraints:
${constraints}

My accepted ${language} solution:
\`\`\`${language}
${code.trim().slice(0, 2000)}
\`\`\`

Please review my solution.`;

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user',   content: userMessage }
                ],
                temperature: 0.4,
                max_tokens: 700
            })
        });

        if (!groqRes.ok) {
            const err = await groqRes.text();
            return res.status(502).json({ error: 'AI service error', detail: err });
        }

        const groqData = await groqRes.json();
        const review = groqData.choices?.[0]?.message?.content?.trim() || 'Review unavailable.';
        res.json({ review });
    } catch (err) {
        console.error('Review endpoint error:', err);
        res.status(500).json({ error: err.message });
    }
});

// AI Hint endpoint
app.post('/api/hint', optionalAuth, async (req, res) => {
    const { problemId, hintNumber, code, language, elapsedSeconds } = req.body;
    if (!problemId || !hintNumber) return res.status(400).json({ error: 'Missing problemId or hintNumber' });

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return res.status(503).json({ error: 'AI service not configured' });

    try {
        const problemDoc = await Problem.findOne({ id: problemId }).lean();
        if (!problemDoc) return res.status(404).json({ error: 'Problem not found' });

        const title       = problemDoc.title || '';
        const description = (problemDoc.description || []).join('\n');
        const constraints = (problemDoc.constraints || []).join('\n');
        const examples    = (problemDoc.examples || []).map((ex, i) =>
            `Example ${i + 1}:\n  Input: ${ex.input}\n  Output: ${ex.output}${ex.explanation ? '\n  Explanation: ' + ex.explanation : ''}`
        ).join('\n');
        const testCases   = (problemDoc.testCases || []).slice(0, 3).map((tc, i) =>
            `Test ${i + 1}: input=${JSON.stringify(tc.input)} expected=${JSON.stringify(tc.output)}`
        ).join('\n');

        const elapsedMin  = Math.floor((elapsedSeconds || 0) / 60);
        const hasCode     = code && code.trim().length > 10;
        const codeSnippet = hasCode ? code.trim().slice(0, 1200) : null;

        const hintPersonality = [
            `You are giving Hint 1 of 3. The user has spent ~${elapsedMin} minutes on this problem. Give a very gentle conceptual nudge — point them toward the right problem-solving pattern or ask a guiding question. Do NOT name the algorithm or data structure directly. Do NOT reveal any implementation step. 2-3 sentences max.`,
            `You are giving Hint 2 of 3. The user has spent ~${elapsedMin} minutes. Look at their current code approach if provided. If they are on the wrong track, gently redirect them. If on the right track, hint at the key insight they are missing without revealing the solution. Mention time/space complexity to think about if relevant. 3-4 sentences max.`,
            `You are giving Hint 3 of 3. The user has spent ~${elapsedMin} minutes. Examine their code closely. Identify the specific step or logic gap that is blocking them. Give a concrete implementation hint — describe what to do next without writing the code for them. You may reference a specific line or concept in their code. 4-5 sentences max.`
        ][hintNumber - 1];

        const systemPrompt = `You are a helpful coding mentor giving progressive hints for a LeetCode-style problem.
${hintPersonality}
Rules:
- Never provide a complete solution or full algorithm
- Never write out the final working code
- Be encouraging and Socratic
- Keep the hint tight and focused on ONE thing
- If the user has no code yet, focus on the problem pattern only`;

        const userMessage = `Problem: ${title}

Description:
${description}

Constraints:
${constraints}

Examples:
${examples}

Test Cases:
${testCases}

${codeSnippet ? `User's current ${language || 'code'} (${elapsedMin} min in):\n\`\`\`\n${codeSnippet}\n\`\`\`` : `The user has not written any code yet (${elapsedMin} min in).`}

Give Hint ${hintNumber}.`;

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user',   content: userMessage }
                ],
                temperature: 0.5,
                max_tokens: 300
            })
        });

        if (!groqRes.ok) {
            const err = await groqRes.text();
            return res.status(502).json({ error: 'AI service error', detail: err });
        }

        const groqData = await groqRes.json();
        const hint = groqData.choices?.[0]?.message?.content?.trim() || 'No hint available.';
        res.json({ hint });
    } catch (err) {
        console.error('Hint endpoint error:', err);
        res.status(500).json({ error: err.message });
    }
});

async function getDailyProblemId() {
    const problems = await Problem.find().select('id').sort({ createdAt: 1 }).lean();
    if (!problems.length) return null;
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return problems[dayOfYear % problems.length].id;
}

// Submit code for evaluation
app.post("/submit-code", optionalAuth, async (req, res) => {
    try {
        const { problemId = "two-sum", language, sourceCode, action = "submit" } = req.body;
        const isSubmit = action === "submit";
        const problemDoc = await Problem.findOne({ id: problemId });

        if (!problemDoc) {
            return res.status(404).json({
                success: false,
                message: "Problem not found"
            });
        }

        if (!languageIds[language]) {
            return res.status(400).json({
                success: false,
                message: "Unsupported language"
            });
        }

        if (!sourceCode || typeof sourceCode !== "string") {
            return res.status(400).json({
                success: false,
                message: "Source code is required"
            });
        }

        const problem = formatProblem(problemDoc);
        const results = [];

        for (const testCase of problem.testCases) {
            const result = await runJudge0Submission(problem, language, sourceCode, testCase);
            results.push(result);
        }

        const passed = results.every((result) => result.passed);
        const verdict = getVerdict(results, passed);
        const { runtime, memory } = getSubmissionMetrics(results);
        const user = req.user;

        if (user && isSubmit) {
            await Submission.create({
                userId: user._id,
                problemId: problem.id,
                problemTitle: problemDoc.title,
                language,
                verdict,
                runtime,
                memory,
                sourceCode,
                submittedAt: new Date()
            });

            user.totalSubmissions += 1;

            if (passed && verdict === "Accepted") {
                user.acceptedSubmissions += 1;
                user.problemsSolved = (user.problemsSolved || 0) + 1;

                const dailyId = await getDailyProblemId();
                if (dailyId && problem.id === dailyId) {
                    updateStreak(user);
                }

                const alreadySolved = user.solvedProblems.some(
                    (entry) => entry.problemId === problem.id
                );

                if (!alreadySolved) {
                    user.solvedProblems.push({
                        problemId: problem.id,
                        solvedAt: new Date()
                    });
                }
            }

            await user.save();

            await UserCode.findOneAndUpdate(
                { userId: user._id, problemId: problem.id, language },
                {
                    userId: user._id,
                    problemId: problem.id,
                    language,
                    sourceCode,
                    updatedAt: new Date()
                },
                { upsert: true }
            );
        }

        res.json({
            success: true,
            passed,
            action: isSubmit ? "submit" : "run",
            totalTests: results.length,
            passedTests: results.filter((result) => result.passed).length,
            results,
            verdict
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Code submission failed",
            error: error.message
        });
    }
});

const frontendRoot = path.join(__dirname, "..", "frontend");
const assetsRoot = path.join(__dirname, "..", "assets");

app.use("/css", express.static(path.join(frontendRoot, "css")));
app.use("/scripts", express.static(path.join(frontendRoot, "scripts")));
app.use("/assets", express.static(assetsRoot));
app.use(express.static(path.join(frontendRoot, "pages")));

app.listen(8000, () => {
    console.log("Server running on 8000");
    console.log("Frontend: https://algoforge-1-mbk5.onrender.com/index.html");

    // Pre-warm external contest caches so first user doesn't wait
    setTimeout(async () => {
        try {
            await fetch('http://localhost:8000/api/codeforces-contests');
            console.log('✅ Codeforces cache warmed');
        } catch {}
        try {
            await fetch('http://localhost:8000/api/leetcode-contests');
            console.log('✅ LeetCode cache warmed');
        } catch {}
        try {
            await fetch('http://localhost:8000/api/codechef-contests');
            console.log('✅ CodeChef cache warmed');
        } catch {}
        try {
            await fetch('http://localhost:8000/api/atcoder-contests');
            console.log('✅ AtCoder cache warmed');
        } catch {}
    }, 100);
});