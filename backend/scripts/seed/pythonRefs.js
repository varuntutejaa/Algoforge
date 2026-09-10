// Python reference solutions — one per distinct runner shape.
//
// These exist purely to verify the cross-language harness contract: running
// these through the Python harness must produce byte-identical output to the
// JS reference run through the JS harness, over the same test inputs. That is
// what proves a contestant solving in Python is graded the same as one
// solving in JS.
//
// Keyed by problem id; verifyHarness.js picks these up automatically.
module.exports = {
    // --- arrays ---------------------------------------------------------
    'contains-duplicate': 'def solution(nums):\n    return len(set(nums)) != len(nums)',

    'longest-consecutive-sequence': `def solution(nums):
    s = set(nums)
    best = 0
    for x in s:
        if x - 1 not in s:
            y = x
            length = 1
            while y + 1 in s:
                y += 1
                length += 1
            best = max(best, length)
    return best`,

    'product-of-array-except-self': `def solution(nums):
    n = len(nums)
    res = [1] * n
    p = 1
    for i in range(n):
        res[i] = p
        p *= nums[i]
    s = 1
    for i in range(n - 1, -1, -1):
        res[i] *= s
        s *= nums[i]
    return res`,

    'top-k-frequent-elements': `def solution(nums, k):
    from collections import Counter
    return [v for v, _ in Counter(nums).most_common(k)]`,

    'two-sum': `def twoSum(nums, target):
    seen = {}
    for i, x in enumerate(nums):
        if target - x in seen:
            return [seen[target - x], i]
        seen[x] = i
    return []`,

    // --- two pointers ---------------------------------------------------
    'valid-palindrome': `def solution(s):
    t = ''.join(c.lower() for c in s if c.isalnum())
    return t == t[::-1]`,

    'two-sum-ii': `def solution(numbers, target):
    l, r = 0, len(numbers) - 1
    while l < r:
        total = numbers[l] + numbers[r]
        if total == target:
            return [l + 1, r + 1]
        if total < target:
            l += 1
        else:
            r -= 1
    return []`,

    '3sum': `def solution(nums):
    nums = sorted(nums)
    res = []
    for i in range(len(nums) - 2):
        if i > 0 and nums[i] == nums[i - 1]:
            continue
        l, r = i + 1, len(nums) - 1
        while l < r:
            total = nums[i] + nums[l] + nums[r]
            if total == 0:
                res.append([nums[i], nums[l], nums[r]])
                while l < r and nums[l] == nums[l + 1]:
                    l += 1
                while l < r and nums[r] == nums[r - 1]:
                    r -= 1
                l += 1
                r -= 1
            elif total < 0:
                l += 1
            else:
                r -= 1
    return res`,

    // --- sliding window -------------------------------------------------
    'longest-substring-without-repeating-characters': `def solution(s):
    last = {}
    start = 0
    best = 0
    for i, ch in enumerate(s):
        if ch in last and last[ch] >= start:
            start = last[ch] + 1
        last[ch] = i
        best = max(best, i - start + 1)
    return best`,

    'longest-repeating-character-replacement': `def solution(s, k):
    count = {}
    start = 0
    max_freq = 0
    best = 0
    for i, ch in enumerate(s):
        count[ch] = count.get(ch, 0) + 1
        max_freq = max(max_freq, count[ch])
        while i - start + 1 - max_freq > k:
            count[s[start]] -= 1
            start += 1
        best = max(best, i - start + 1)
    return best`,

    'sliding-window-maximum': `def solution(nums, k):
    from collections import deque
    dq = deque()
    res = []
    for i, x in enumerate(nums):
        while dq and nums[dq[-1]] <= x:
            dq.pop()
        dq.append(i)
        if dq[0] <= i - k:
            dq.popleft()
        if i >= k - 1:
            res.append(nums[dq[0]])
    return res`,

    // --- stack ----------------------------------------------------------
    'evaluate-reverse-polish-notation': `def solution(tokens):
    st = []
    for t in tokens:
        if t in ('+', '-', '*', '/'):
            b = st.pop()
            a = st.pop()
            if t == '+':
                st.append(a + b)
            elif t == '-':
                st.append(a - b)
            elif t == '*':
                st.append(a * b)
            else:
                st.append(int(a / b))
        else:
            st.append(int(t))
    return st[0]`,

    'generate-parentheses': `def solution(n):
    res = []
    def go(cur, open_n, close_n):
        if len(cur) == n * 2:
            res.append(cur)
            return
        if open_n < n:
            go(cur + '(', open_n + 1, close_n)
        if close_n < open_n:
            go(cur + ')', open_n, close_n + 1)
    go('', 0, 0)
    return res`,

    // --- binary search --------------------------------------------------
    'binary-search': `def solution(nums, target):
    l, r = 0, len(nums) - 1
    while l <= r:
        m = (l + r) // 2
        if nums[m] == target:
            return m
        if nums[m] < target:
            l = m + 1
        else:
            r = m - 1
    return -1`,

    'search-a-2d-matrix': `def solution(matrix, target):
    m, n = len(matrix), len(matrix[0])
    l, r = 0, m * n - 1
    while l <= r:
        mid = (l + r) // 2
        v = matrix[mid // n][mid % n]
        if v == target:
            return True
        if v < target:
            l = mid + 1
        else:
            r = mid - 1
    return False`,

    'median-of-two-sorted-arrays': `def solution(nums1, nums2):
    m = sorted(nums1 + nums2)
    n = len(m)
    if n % 2:
        return float(m[(n - 1) // 2])
    return (m[n // 2 - 1] + m[n // 2]) / 2`,

    // --- heap -----------------------------------------------------------
    'task-scheduler': `def solution(tasks, n):
    from collections import Counter
    freq = Counter(tasks)
    max_freq = max(freq.values())
    count_max = sum(1 for v in freq.values() if v == max_freq)
    return max(len(tasks), (max_freq - 1) * (n + 1) + count_max)`,

    // --- backtracking ---------------------------------------------------
    'permutations': `def solution(nums):
    res = []
    def go(cur, rest):
        if not rest:
            res.append(cur)
            return
        for i in range(len(rest)):
            go(cur + [rest[i]], rest[:i] + rest[i + 1:])
    go([], list(nums))
    return res`,

    'combination-sum': `def solution(candidates, target):
    res = []
    cur = []
    def go(start, remain):
        if remain == 0:
            res.append(list(cur))
            return
        if remain < 0:
            return
        for i in range(start, len(candidates)):
            cur.append(candidates[i])
            go(i, remain - candidates[i])
            cur.pop()
    go(0, target)
    return res`,

    'subsets': `def solution(nums):
    res = [[]]
    for x in nums:
        res += [cur + [x] for cur in res]
    return res`,

    'letter-combinations-of-a-phone-number': `def solution(digits):
    if not digits:
        return []
    mapping = {'2': 'abc', '3': 'def', '4': 'ghi', '5': 'jkl',
               '6': 'mno', '7': 'pqrs', '8': 'tuv', '9': 'wxyz'}
    res = ['']
    for d in digits:
        res = [p + c for p in res for c in mapping[d]]
    return res`,

    // --- graphs ---------------------------------------------------------
    'number-of-islands': `def solution(grid):
    import sys
    sys.setrecursionlimit(100000)
    r, c = len(grid), len(grid[0])
    def sink(i, j):
        if i < 0 or j < 0 or i >= r or j >= c or grid[i][j] != 1:
            return
        grid[i][j] = 0
        sink(i + 1, j); sink(i - 1, j); sink(i, j + 1); sink(i, j - 1)
    count = 0
    for i in range(r):
        for j in range(c):
            if grid[i][j] == 1:
                count += 1
                sink(i, j)
    return count`,

    'surrounded-regions': `def solution(board):
    import sys
    sys.setrecursionlimit(100000)
    r, c = len(board), len(board[0])
    def mark(i, j):
        if i < 0 or j < 0 or i >= r or j >= c or board[i][j] != 0:
            return
        board[i][j] = 2
        mark(i + 1, j); mark(i - 1, j); mark(i, j + 1); mark(i, j - 1)
    for i in range(r):
        mark(i, 0); mark(i, c - 1)
    for j in range(c):
        mark(0, j); mark(r - 1, j)
    for i in range(r):
        for j in range(c):
            if board[i][j] == 2:
                board[i][j] = 0
            elif board[i][j] == 0:
                board[i][j] = 1`,

    'course-schedule': `def solution(numCourses, prerequisites):
    from collections import deque
    adj = [[] for _ in range(numCourses)]
    indeg = [0] * numCourses
    for a, b in prerequisites:
        adj[b].append(a)
        indeg[a] += 1
    q = deque(i for i in range(numCourses) if indeg[i] == 0)
    seen = 0
    while q:
        u = q.popleft()
        seen += 1
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    return seen == numCourses`,

    'number-of-connected-components-in-an-undirected-graph': `def solution(n, edges):
    parent = list(range(n))
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    count = n
    for a, b in edges:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb
            count -= 1
    return count`,

    'redundant-connection': `def solution(n, edges):
    parent = list(range(n + 1))
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    for a, b in edges:
        ra, rb = find(a), find(b)
        if ra == rb:
            return [a, b]
        parent[ra] = rb
    return []`,

    // --- dp -------------------------------------------------------------
    'climbing-stairs': `def solution(n):
    a, b = 1, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b`,

    'counting-bits': `def solution(n):
    dp = [0] * (n + 1)
    for i in range(1, n + 1):
        dp[i] = dp[i >> 1] + (i & 1)
    return dp`,

    'happy-number': `def solution(n):
    seen = set()
    while n != 1 and n not in seen:
        seen.add(n)
        n = sum(int(d) ** 2 for d in str(n))
    return n == 1`,

    'word-break': `def solution(s, wordDict):
    words = set(wordDict)
    dp = [False] * (len(s) + 1)
    dp[0] = True
    for i in range(1, len(s) + 1):
        for j in range(i):
            if dp[j] and s[j:i] in words:
                dp[i] = True
                break
    return dp[len(s)]`,

    'longest-palindromic-substring': `def solution(s):
    best = ''
    def expand(l, r):
        nonlocal best
        while l >= 0 and r < len(s) and s[l] == s[r]:
            l -= 1
            r += 1
        cand = s[l + 1:r]
        if len(cand) > len(best):
            best = cand
    for i in range(len(s)):
        expand(i, i)
        expand(i, i + 1)
    return best`,

    'unique-paths': `def solution(m, n):
    dp = [1] * n
    for _ in range(1, m):
        for j in range(1, n):
            dp[j] += dp[j - 1]
    return dp[n - 1]`,

    'longest-common-subsequence': `def solution(text1, text2):
    m, n = len(text1), len(text2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if text1[i - 1] == text2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    return dp[m][n]`,

    'interleaving-string': `def solution(s1, s2, s3):
    m, n = len(s1), len(s2)
    if m + n != len(s3):
        return False
    dp = [[False] * (n + 1) for _ in range(m + 1)]
    dp[0][0] = True
    for i in range(m + 1):
        for j in range(n + 1):
            if i > 0 and dp[i - 1][j] and s1[i - 1] == s3[i + j - 1]:
                dp[i][j] = True
            if j > 0 and dp[i][j - 1] and s2[j - 1] == s3[i + j - 1]:
                dp[i][j] = True
    return dp[m][n]`,

    'longest-increasing-path-in-a-matrix': `def solution(matrix):
    r, c = len(matrix), len(matrix[0])
    memo = [[0] * c for _ in range(r)]
    dirs = ((1, 0), (-1, 0), (0, 1), (0, -1))
    def dfs(i, j):
        if memo[i][j]:
            return memo[i][j]
        best = 1
        for di, dj in dirs:
            ni, nj = i + di, j + dj
            if 0 <= ni < r and 0 <= nj < c and matrix[ni][nj] > matrix[i][j]:
                best = max(best, 1 + dfs(ni, nj))
        memo[i][j] = best
        return best
    return max(dfs(i, j) for i in range(r) for j in range(c))`,

    // --- greedy ---------------------------------------------------------
    'gas-station': `def solution(gas, cost):
    total = tank = start = 0
    for i in range(len(gas)):
        d = gas[i] - cost[i]
        total += d
        tank += d
        if tank < 0:
            start = i + 1
            tank = 0
    return -1 if total < 0 else start`,

    'hand-of-straights': `def solution(hand, groupSize):
    from collections import Counter
    if len(hand) % groupSize:
        return False
    count = Counter(hand)
    for k in sorted(count):
        need = count[k]
        if need <= 0:
            continue
        for v in range(k, k + groupSize):
            if count[v] < need:
                return False
            count[v] -= need
    return True`,

    'partition-labels': `def solution(s):
    last = {c: i for i, c in enumerate(s)}
    res = []
    start = end = 0
    for i, c in enumerate(s):
        end = max(end, last[c])
        if i == end:
            res.append(end - start + 1)
            start = i + 1
    return res`,

    'jump-game': `def solution(nums):
    reach = 0
    for i, x in enumerate(nums):
        if i > reach:
            return False
        reach = max(reach, i + x)
    return True`,

    // --- intervals ------------------------------------------------------
    'merge-intervals': `def solution(intervals):
    a = sorted(intervals, key=lambda iv: iv[0])
    res = [list(a[0])]
    for iv in a[1:]:
        if iv[0] <= res[-1][1]:
            res[-1][1] = max(res[-1][1], iv[1])
        else:
            res.append(list(iv))
    return res`,

    'insert-interval': `def solution(intervals, newInterval):
    res = []
    s, e = newInterval
    i, n = 0, len(intervals)
    while i < n and intervals[i][1] < s:
        res.append(intervals[i])
        i += 1
    while i < n and intervals[i][0] <= e:
        s = min(s, intervals[i][0])
        e = max(e, intervals[i][1])
        i += 1
    res.append([s, e])
    while i < n:
        res.append(intervals[i])
        i += 1
    return res`,

    'meeting-rooms': `def solution(intervals):
    a = sorted(intervals, key=lambda iv: iv[0])
    for i in range(1, len(a)):
        if a[i][0] < a[i - 1][1]:
            return False
    return True`,

    'non-overlapping-intervals': `def solution(intervals):
    a = sorted(intervals, key=lambda iv: iv[1])
    removed = 0
    end = float('-inf')
    for s, e in a:
        if s >= end:
            end = e
        else:
            removed += 1
    return removed`,

    // --- math / bits ----------------------------------------------------
    'spiral-matrix': `def solution(matrix):
    res = []
    top, bottom = 0, len(matrix) - 1
    left, right = 0, len(matrix[0]) - 1
    while top <= bottom and left <= right:
        for j in range(left, right + 1):
            res.append(matrix[top][j])
        top += 1
        for i in range(top, bottom + 1):
            res.append(matrix[i][right])
        right -= 1
        if top <= bottom:
            for j in range(right, left - 1, -1):
                res.append(matrix[bottom][j])
            bottom -= 1
        if left <= right:
            for i in range(bottom, top - 1, -1):
                res.append(matrix[i][left])
            left += 1
    return res`,

    'rotate-image': `def solution(matrix):
    n = len(matrix)
    for i in range(n):
        for j in range(i + 1, n):
            matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
    for row in matrix:
        row.reverse()`,

    'pow-x-n': `def solution(x, n):
    e = abs(n)
    base = x
    result = 1.0
    while e > 0:
        if e % 2 == 1:
            result *= base
        base *= base
        e //= 2
    return 1 / result if n < 0 else result`,

    'reverse-bits': `def solution(n):
    r = 0
    for _ in range(32):
        r = r * 2 + (n % 2)
        n //= 2
    return r`,

    'multiply-strings': `def solution(num1, num2):
    if num1 == '0' or num2 == '0':
        return '0'
    m, n = len(num1), len(num2)
    res = [0] * (m + n)
    for i in range(m - 1, -1, -1):
        for j in range(n - 1, -1, -1):
            mul = (ord(num1[i]) - 48) * (ord(num2[j]) - 48) + res[i + j + 1]
            res[i + j + 1] = mul % 10
            res[i + j] += mul // 10
    s = ''.join(map(str, res)).lstrip('0')
    return s if s else '0'`,

    'valid-anagram': `def solution(s, t):
    return sorted(s) == sorted(t)`,

    'minimum-window-substring': `def solution(s, t):
    from collections import Counter
    if len(t) > len(s):
        return ''
    need = Counter(t)
    required = len(need)
    win = {}
    formed = 0
    l = 0
    best = (float('inf'), 0, 0)
    for r, c in enumerate(s):
        win[c] = win.get(c, 0) + 1
        if c in need and win[c] == need[c]:
            formed += 1
        while formed == required:
            if r - l + 1 < best[0]:
                best = (r - l + 1, l, r)
            lc = s[l]
            win[lc] -= 1
            if lc in need and win[lc] < need[lc]:
                formed -= 1
            l += 1
    return '' if best[0] == float('inf') else s[best[1]:best[2] + 1]`
};
