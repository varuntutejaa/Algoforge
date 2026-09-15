<div align="center">

<img src="frontend/public/assets/algoforge_favicon_themed.svg" width="110" alt="AlgoForge logo" />

# AlgoForge

**Solve, compete, and ship — a competitive programming platform with a real judge behind it.**

[![Live](https://img.shields.io/badge/Live-frontend--xi--orpin--21.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://frontend-xi-orpin-21.vercel.app)
[![API](https://img.shields.io/badge/API-algoforge--api.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://algoforge-api.vercel.app/health)

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Postgres](https://img.shields.io/badge/Postgres-Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Firebase Auth](https://img.shields.io/badge/Auth-Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Tests](https://img.shields.io/badge/tests-41%20passing-22c55e?style=flat-square)](#testing)

<br />

**150 problems** · **120 judged against real test cases** · **39 topics** · **5 languages**

</div>

---

## Contents

- [What it does](#what-it-does) · [Try it](#try-it-in-60-seconds) · [Architecture](#architecture)
- [The judge](#the-judge) · [Contests](#contests) · [GitHub sync](#github-sync) · [AI assist](#ai-assist)
- [Tech stack](#tech-stack) · [Running locally](#running-locally) · [Environment](#environment)
- [Testing](#testing) · [Deployment](#deployment) · [Project layout](#project-layout)

---

## What it does

AlgoForge is a LeetCode-style platform built around a real judge: your code is compiled and
executed against hidden test cases in a sandbox, not string-matched in the browser.

| | |
|---|---|
| **Solve** | Monaco editor, 5 languages, per-problem/per-language autosave, time-locked AI hints |
| **Compete** | Timed contests with a live leaderboard, penalty scoring, and a countdown that ends the round |
| **Track** | Submission history, streaks, a contribution heatmap, and difficulty/topic breakdowns |
| **Ship** | Accepted solutions push straight to a GitHub repo on your account |

### Content at a glance

| Difficulty | Problems | | Judged | Content-only |
|---|---:|---|---:|---:|
| Easy | 28 | | 120 | 30 |
| Medium | 100 | | *run against real tests* | *design & open-ended* |
| Hard | 22 | | | |
| **Total** | **150** | | | |

The 30 content-only problems are the design and open-ended ones (LRU cache, alien dictionary
and similar) where a single expected output isn't a fair verdict. They're readable and
browsable, and the UI says so rather than pretending to grade them.

---

## Try it in 60 seconds

```
1  Open   https://frontend-xi-orpin-21.vercel.app
2  Browse problems — no account needed
3  Hit Run — still no account needed
4  Sign in (Google or email) only when you Submit, join, or create a contest
```

Auth is deliberately deferred: reading and running are open, and you're only asked to sign in
at the point where something gets recorded against an account.

---

## Architecture

```
                 ┌──────────────────────────────┐
  Browser ──────▶│  React 19 + TS  (Vercel)     │
                 │  Monaco · SPA routing        │
                 └───────────────┬──────────────┘
                                 │  Firebase ID token (RS256)
                                 ▼
                 ┌──────────────────────────────┐
                 │  Express API  (Vercel λ)     │
                 │  JWKS verify · rate limits   │
                 └───┬─────────┬─────────┬──────┘
                     │         │         │
        ┌────────────▼──┐  ┌───▼──────┐  ┌▼──────────────┐
        │ Supabase      │  │ Judge0   │  │ Groq · GitHub │
        │ Postgres      │  │ sandbox  │  │ (AI · sync)   │
        │ (pooler)      │  │ exec     │  │               │
        └───────────────┘  └──────────┘  └───────────────┘
```

**Why it's shaped this way**

- **Serverless-aware pooling.** Postgres is reached through Supabase's connection pooler; the
  direct `db.<ref>.supabase.co` endpoint is IPv6-only and unreachable from most hosts. The pool
  is capped per instance (`DB_POOL_MAX`, default 2 on serverless) because dozens of cold lambdas
  each opening 10 connections exhausts the pooler.
- **No `firebase-admin` on the server.** ID tokens are verified with `jose` against Google's
  public JWKS. One dependency instead of a heavyweight SDK, and nothing secret to store.
- **Test data never reaches the browser.** The public problem payload carries only a test-case
  *count*; expected outputs stay server-side. Otherwise a lookup table beats the judge.

---

## The judge

Submitted code is wrapped in a generated, per-language harness that reads the test input,
calls your function, and serialises the result in a canonical form so C++, Java, JavaScript,
Python and C all produce comparable output.

```
your function  ──▶  generated harness  ──▶  Judge0 sandbox  ──▶  normalised output
                     (per language)          (compile + run)      compared to expected
```

Structured shapes — linked lists, binary trees, N-ary trees, graphs — are serialised with a
shared convention, so `[1,2,null,3]` means the same tree in every language.

**Harnesses are verified by execution, not by inspection.** `scripts/seed/verifyHarness.js`
generates and actually runs every judged problem's harness in all five languages, then checks
the output against the seeded expected values — over a thousand executions, and it fails loudly
on any mismatch. A seeder that merely *looks* right ships ungradeable problems.

---

## Contests

Create a contest, share the join code, and compete on a live board.

| Event | Score |
|---|---:|
| Problem accepted | **+100** |
| Wrong answer or compile error | **−10** |

Ranking is by score, then fewer wrong attempts, then faster finish.

- **Live leaderboard.** Your own score updates in the same response as your verdict — no
  follow-up request, no refresh. Other players' solves poll in every 5 seconds.
- **Self-healing registration.** Submitting without a participant row registers you instead of
  dropping the solve, so a failed join or a direct URL can't cost you points.
- **Server-authoritative verdicts.** The contest route judges the code itself. A client-supplied
  verdict is never trusted — that would let anyone award themselves 100 points with `curl`.
- **Auto-finish.** When every participant has solved everything, the contest ends early rather
  than running out the clock.

The calendar also aggregates upcoming rounds from Codeforces, LeetCode, CodeChef, AtCoder and
HackerRank, and is readable without an account.

---

## GitHub sync

Connect a GitHub account and accepted solutions land in a repo of your choosing, organised by
difficulty:

```
algoforge-solutions/
├── easy/two-sum/solution.py
├── medium/longest-substring-without-repeating-characters/solution.java
└── hard/median-of-two-sorted-arrays/solution.cpp
```

Auto-push can be left off, in which case an accepted submission offers a one-off **Push to
GitHub** button instead.

**How it's kept safe**

- Requests the narrow **`public_repo`** scope — not `repo`, which would reach private code.
- Access tokens are encrypted at rest with **AES-256-GCM** before they touch the database.
- The OAuth `state` is **HMAC-signed** with a 10-minute TTL, so nobody can attach their GitHub
  account to someone else's AlgoForge account.
- The push endpoint takes only a **problem id** and pushes the stored *accepted* submission —
  never file contents from the request. Otherwise it would be a general-purpose GitHub writer.
- A revoked token is detected and cleared rather than failing silently forever.

Pushing is best-effort by design: a GitHub outage reports a status, it never turns a solve into
an error.

---

## AI assist

Powered by Groq. Hints unlock on a timer so they supplement thinking instead of replacing it,
and the code review only unlocks once you've actually solved the problem.

| Feature | Unlocks |
|---|---|
| Hint 1 · 2 · 3 | Progressively, as time on the problem passes |
| Code review | After an accepted submission |

---

## Tech stack

| Layer | Choice |
|---|---|
| **Frontend** | React 19 · TypeScript · Vite · Tailwind v4 · Monaco Editor |
| **Backend** | Node.js 22 · Express · Prisma (`@prisma/adapter-pg`) |
| **Database** | Supabase Postgres, via the connection pooler |
| **Auth** | Firebase Auth — Google OAuth + email/password; RS256 ID tokens verified against Google's JWKS |
| **Execution** | Judge0 — per-test-case parallel grading in a sandbox |
| **AI** | Groq |
| **Integrations** | GitHub OAuth + Contents API |
| **Hosting** | Vercel (frontend and API) · GitHub Actions (CI + keepalive) |

---

## Running locally

**Prerequisites** — Node.js 22+, a Supabase project (Postgres), a Firebase project (Auth),
and a Groq API key. Judge0 defaults to the public CE instance if you don't supply one.

```bash
git clone https://github.com/varuntutejaa/Algoforge.git
cd Algoforge
```

**Backend** — runs on `:8000`

```bash
cd backend
npm install
cp .env.example .env          # fill in the values below
npx prisma generate
npx prisma migrate deploy
npm run seed                  # optional: load the 150 problems
node server.js
```

**Frontend** — runs on `:5173`, calls `localhost:8000` automatically

```bash
cd frontend
npm install
cp .env.example .env          # Firebase web config
npm run dev
```

> The API base URL switches on hostname in `frontend/src/config/api.ts` — no env var needed.

---

## Environment

### `backend/.env`

| Variable | Required | Purpose |
|---|:--:|---|
| `DATABASE_URL` | ● | Postgres. Use the **pooler** host — the direct endpoint is IPv6-only |
| `FIREBASE_PROJECT_ID` | ● | Verifies the issuer and audience of incoming ID tokens |
| `GROQ_API_KEY` | ● | AI hints and code review |
| `CORS_ORIGINS` | ● | Comma-separated allowed origins |
| `JUDGE0_URL` | | Defaults to the public CE instance |
| `JUDGE0_API_KEY` | | Needed for rate-limited or self-hosted Judge0 |
| `GROQ_MODEL` | | Override the default model |
| `ADMIN_API_KEY` | | Required in `X-Admin-Key` to create problems via the API |
| `DB_POOL_MAX` | | Pool cap per instance (default: 2 serverless, 10 otherwise) |
| `TOKEN_ENCRYPTION_KEY` | ◐ | 32 bytes, base64 or hex. **Required for GitHub sync** |
| `GITHUB_CLIENT_ID` | ◐ | GitHub OAuth app |
| `GITHUB_CLIENT_SECRET` | ◐ | GitHub OAuth app |
| `GITHUB_CALLBACK_URL` | ◐ | Must match the OAuth app exactly |

● required ◐ required only for GitHub sync

```bash
# Generate a token encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### `frontend/.env`

All `VITE_FIREBASE_*` values are **public by design** — they ship in the browser bundle.
Access is controlled by Firebase authorized domains, not by hiding these.

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

> Add every domain you serve from to **Firebase Console → Authentication → Authorized domains**,
> or Google sign-in fails with `auth/unauthorized-domain`.

---

## Testing

```bash
cd backend && node --test tests/*.test.js     # 41 tests
cd frontend && npx tsc --noEmit && npm run build
```

The suite guards the things that are expensive to get wrong:

| Suite | Guards |
|---|---|
| `githubSync` | A GitHub failure is reported, never thrown — a solve can't become an error |
| `crypto` | Round-trip encryption, tamper detection, key handling |
| `problemExposure` | Expected outputs never reach the public problem payload |
| `routeMounting` | A path-less `router.use()` can't silently gate sibling routes |
| `contestLeaderboard` | Verdicts stay server-side; the board ships with the verdict |
| `profilePicture` | Avatars refresh on login without a token being able to blank one |
| `dbSupervisor` | A database blip can't take the whole process down |

Each regression test was checked by reintroducing the bug it describes and confirming it fails.
A test that passes against the bug it's meant to catch is worth nothing.

---

## Deployment

| Piece | Where | How |
|---|---|---|
| Frontend | Vercel | `vite build`; `frontend/vercel.json` rewrites all paths to `index.html` |
| API | Vercel | Express as a serverless function |
| Database | Supabase | Postgres via the pooler; migrations with `prisma migrate deploy` |
| Auth | Firebase | Google + email/password |
| CI | GitHub Actions | `ci-cd.yml` — security scan, backend and frontend jobs on every push and PR |
| Keepalive | GitHub Actions | `keepalive.yml` pings `/health` every 10 minutes |

> **Order matters:** deploy before seeding. Seeding problems whose runners aren't live yet puts
> ungradeable problems in front of users. Learned the hard way.

CI doesn't deploy — Vercel does that on its own.

---

## Project layout

```
AlgoForge/
├── backend/
│   ├── config/         # Prisma singleton, DB supervisor with capped backoff
│   ├── middleware/      # Firebase ID-token verification (jose + Google JWKS)
│   ├── prisma/          # schema.prisma + migrations
│   ├── routes/          # auth · problems · submissions · contests · github · ai · profile · health
│   ├── services/        # judge0 · runners · crypto · github · githubSync · problems
│   ├── scripts/seed/    # Problem data, harness templates, verifyHarness.js
│   ├── tests/           # node:test suites
│   └── server.js
│
├── frontend/src/
│   ├── api/            # One fetch wrapper per resource
│   ├── components/      # Layout + shared UI
│   ├── config/          # API base URL, Firebase init
│   ├── context/         # AuthContext
│   ├── pages/           # Home · Problems · Editor · Contests · ContestEditor · Dashboard · Settings · …
│   ├── styles/          # Per-page CSS
│   └── types/           # Shared TS types
│
├── docs/DEPLOYMENT.md
└── .github/workflows/
```

---

<div align="center">
<sub>Built by <a href="https://github.com/varuntutejaa">Varun Tuteja</a></sub>
</div>
