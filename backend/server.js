const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
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

require("dotenv").config();
const app = express();
app.use(cors({
    origin: true,
    credentials: true,
    exposedHeaders: ["x-user-id"]
}));
app.use(express.json());

const JUDGE0_URL = process.env.JUDGE0_URL || "https://ce.judge0.com";
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY;

const languageIds = {
    c: 50,
    cpp: 54,
    java: 62,
    js: 63
};

const demoUser = {
    email: "demo@algoforge.ai",
    password: "demo123",
    name: "Demo User"
};

function formatUserResponse(user) {
    return {
        id: user._id.toString(),
        name: user.name,
        email: user.email
    };
}

async function findOrCreateDemoUser() {
    let user = await User.findOne({ email: demoUser.email });

    if (!user) {
        const hashedPassword = await bcrypt.hash(demoUser.password, 10);
        user = await User.create({
            name: demoUser.name,
            email: demoUser.email,
            password: hashedPassword
        });
    }

    ensureUserProfileFields(user);
    return user;
}

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

// Mount contest routes
app.use('/api/contests', contestRoutes);

// signup
app.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.json({
                success: false,
                message: "User already exists"
            });
        }
        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // create user
        const user = new User({
            name,
            email,
            password: hashedPassword
        });
        await user.save();
        res.json({
            success: true,
            message: "Signup successful"
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: "Server error"
        });
    }
});

// login
app.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        if (email === demoUser.email && password === demoUser.password) {
            const user = await findOrCreateDemoUser();
            return res.json({
                success: true,
                message: "Demo login successful",
                user: formatUserResponse(user)
            });
        }

        // find user
        const user = await User.findOne({ email });

        if (!user) {
            return res.json({
                success: false,
                message: "User not found"
            });
        }

        // compare passwords
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.json({
                success: false,
                message: "Invalid password"
            });
        }

        ensureUserProfileFields(user);
        await user.save();

        res.json({
            success: true,
            message: "Login successful",
            user: formatUserResponse(user)
        });

    } catch (error) {

        console.log(error);

        res.json({
            success: false,
            message: "Server error"
        });

    }

});

app.get("/profile", async (req, res) => {
    try {
        const user = await loadRequestUser(req, res);
        if (!user) return;

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

app.get("/profile/solved", async (req, res) => {
    try {
        const user = await loadRequestUser(req, res);
        if (!user) return;

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

app.get("/profile/submissions", async (req, res) => {
    try {
        const user = await loadRequestUser(req, res);
        if (!user) return;

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

async function upsertUserCode(userId, problemId, language, sourceCode) {
    const saved = await UserCode.findOneAndUpdate(
        { userId, problemId, language },
        {
            userId,
            problemId,
            language,
            sourceCode,
            updatedAt: new Date()
        },
        { upsert: true, returnDocument: "after", runValidators: true }
    );

    return saved;
}

app.get("/code/:problemId/:language", async (req, res) => {
    try {
        const user = await loadRequestUser(req, res);
        if (!user) return;

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

app.post("/code/save", async (req, res) => {
    try {
        const user = await loadRequestUser(req, res);
        if (!user) return;

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

        const saved = await upsertUserCode(user._id, problemId, language, sourceCode);

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

app.get("/profile/activity", async (req, res) => {
    try {
        const user = await loadRequestUser(req, res);
        if (!user) return;

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

app.get("/problems", async (req, res) => {
    try {
        const problems = await Problem.find().sort({ createdAt: 1 }).lean();

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

app.post("/submit-code", async (req, res) => {
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
        const userId = getUserIdFromRequest(req);

        if (userId && isSubmit) {
            const user = await User.findById(userId);

            if (user) {
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
                    updateStreak(user);

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
                await upsertUserCode(user._id, problem.id, language, sourceCode);
            }
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
    console.log("Frontend: http://localhost:8000/index.html");
});