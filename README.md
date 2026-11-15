<div align="center">

<img src="frontend/public/assets/algoforge_favicon_themed.svg" width="110" alt="AlgoForge logo" />

# AlgoForge

**Solve, compete, and ship — a competitive programming platform with a real judge behind it.**

[![Live](https://img.shields.io/badge/Live-frontend--xi--orpin--21.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://frontend-xi-orpin-21.vercel.app)
[![API](https://img.shields.io/badge/API-algoforge--api.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://algoforge-api.vercel.app/health)

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Postgres](https://img.shields.io/badge/Postgres-Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Firebase Auth](https://img.shields.io/badge/Auth-Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Tests](https://img.shields.io/badge/tests-98%20passing-22c55e?style=flat-square)](#testing)

<br />

**150 problems** · **120 judged against real test cases** · **39 topics** · **5 languages**

</div>

---

## Contents

- [What it does](#what-it-does) · [Try it](#try-it-in-60-seconds) · [Architecture](#architecture)
- [The judge](#the-judge) · [Contests](#contests) · [GitHub sync](#github-sync) · [AI assist](#ai-assist)
- [Accounts & settings](#accounts--settings)
- [Tech stack](#tech-stack) · [Running locally](#running-locally) · [Environment](#environment)
- [Testing](#testing) · [Deployment](#deployment) · [Project layout](#project-layout)

---

## What it does

AlgoForge is a LeetCode-style platform built around a real judge: your code is compiled and
executed against hidden test cases in a sandbox, not string-matched in the browser.

| | |
|---|---|
| **Solve** | Monaco editor, 5 languages, per-problem/per-language autosave, time-locked AI hints |
| **Compete** | Public or private timed contests, a live leaderboard with avatars, penalty scoring |
| **Track** | Submission history, streaks, a contribution heatmap, and difficulty/topic breakdowns |
| **Ship** | Accepted solutions push straight to a GitHub repo on your account |
| **Make it yours** | A unique username, light, dark or system theme, and your own editor defaults |

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
2  Browse problems, public contests and the calendar — no account needed
3  Sign in (Google or email) when you Run, Submit, join or create a contest
4  Pick your name and a username on the welcome step, and you're in
```

Auth is deliberately deferred: reading is open, and you're only asked to sign in at the point
where code runs on the judge or something gets recorded against an account.

---

## Architecture

```
                 ┌──────────────────────────────┐
  Browser ──────▶│  React 18 + TS  (Vercel)     │
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

Create a contest, share the join code, and compete on a live board. Contests are **public**
(listed for everyone, including visitors who aren't signed in) or **private** (reachable only
with the join code).

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
- **Creator controls.** The creator can end a contest at any time, after a confirmation. Every
  open arena notices within one poll and stops its clock.
- **Only gradeable problems.** Contests draw from the 120 judged problems, whether hand-picked
  or random, so nobody loses points on a problem that can't be graded.
- **Private codes resist guessing.** Joining is rate-limited per user, since the code is the
  only key to a private contest.

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

Set it up from **GitHub** in the profile menu. Auto-push can be left off, in which case an
accepted submission offers a one-off **Push to GitHub** button instead.

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
| Hint 1 · 2 · 3 | At 4, 9 and 14 minutes on the problem |
| Code review | After an accepted submission |

---

## Accounts & settings

**Usernames.** After signing up, everyone picks a first name, an optional last name and a
username on a short welcome step. Google sign-ups arrive with their name filled in and a
suggested username. Availability is checked as you type.

- Usernames are 3–20 characters (letters, numbers and underscores, starting with a letter),
  stored lowercase. A unique index enforces them, so `Ada` and `ada` can't both exist, and
  of two people racing for the same name only one save succeeds.
- Accounts created before usernames existed are sent to the welcome step once, then back to
  where they were going.
- A name you choose is never overwritten by the one your sign-in provider reports.

**Settings** holds your profile (names and username, changeable later), the theme, and code
editor defaults: starting language, font size and tab width.

**Light and dark themes.** Choose Dark, Light, or System to follow your device. The choice is
stored per device and applied before the first paint, so there's no flash of the wrong theme.
Every colour in the stylesheets reads a token from `styles/theme-tokens.css`. Each token is
named after its dark-mode value, which keeps dark mode exactly as designed, and the light
theme gives each one a counterpart.

---

## Tech stack

| Layer | Choice |
|---|---|
| **Frontend** | React 18 · TypeScript · Vite 5 · Tailwind v4 · Monaco Editor |
| **Backend** | Node.js 22 · Express 5 · Prisma 7 (`@prisma/adapter-pg`) |
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

> The API base URL is set in `frontend/src/config/api.ts`: `localhost:8000` when the page is
> served from localhost, the production API otherwise. Set `VITE_API_URL` to point a build at
> any other backend.

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
| `APP_VERSION` | | Version string reported by `/health` (default `dev`) |
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

# Optional: point the app at a different API (see Running locally)
VITE_API_URL=
```

> Add every domain you serve from to **Firebase Console → Authentication → Authorized domains**,
> or Google sign-in fails with `auth/unauthorized-domain`.

---

## Testing

```bash
cd backend && npm run lint && npm test              # 59 tests (node:test)
cd frontend && npm run lint && npm test && npm run build   # 39 tests (Vitest) + type-check
```

CI runs the same jobs on every push and pull request, plus a dependency audit and a secret scan.

The suite guards the things that are expensive to get wrong:

| Suite | Guards |
|---|---|
| `githubSync` | A GitHub failure is reported, never thrown — a solve can't become an error |
| `crypto` | Round-trip encryption, tamper detection, key handling |
| `problemExposure` | Expected outputs never reach the public problem payload |
| `routeMounting` | A path-less `router.use()` can't silently gate sibling routes |
| `contestLeaderboard` | Verdicts stay server-side; the board ships with the verdict |
| `contestControls` | Private contests stay unlisted, only the creator can end one, joins are rate-limited |
| `contestProblems` | Contests only use problems the judge can grade |
| `userProfile` | Username and name rules, case-insensitive uniqueness, a taken name is a 409 not a 500, sign-in never overwrites a chosen name |
| `profilePicture` | Avatars refresh on login without a token being able to blank one |
| `dbSupervisor` | A database blip can't take the whole process down |
| `OnboardingGate` *(frontend)* | Accounts without a username reach the welcome step, but not before their profile has loaded |
| `preferences` *(frontend)* | A malformed stored theme or editor setting is repaired, not trusted |
| `ConfirmDialog` *(frontend)* | Ending a contest can't be confirmed by a reflexive Enter |

Each regression test was checked by reintroducing the bug it describes and confirming it fails.
A test that passes against the bug it's meant to catch is worth nothing.

---

## Deployment

| Piece | Where | How |
|---|---|---|
| Frontend | Vercel | `vite build`; `frontend/vercel.json` rewrites all paths to `index.html` |
| API | Vercel | Express as a serverless function |
| Database | Supabase | Postgres via the pooler; `prisma migrate deploy` runs in the API's production build (`backend/scripts/migrate-on-deploy.sh`), so a failed migration stops the deploy. Migrations use the session pooler (port 5432), because they hang on the transaction pooler the API itself uses |
| Auth | Firebase | Google + email/password |
| CI | GitHub Actions | `ci-cd.yml` — security scan, backend and frontend jobs on every push and PR |
| Keepalive | GitHub Actions | `keepalive.yml` pings `/health` every 10 minutes |

> **Order matters:** deploy before seeding. Seeding problems whose runners aren't live yet puts
> ungradeable problems in front of users. Learned the hard way.

CI doesn't deploy, and neither Vercel project is connected to GitHub: pushing ships nothing. Deploy with `vercel --prod` in `backend/` first (it applies pending migrations), then in `frontend/`.

---

## Project layout

```
AlgoForge/
├── backend/
│   ├── config/         # Prisma singleton, DB supervisor with capped backoff
│   ├── middleware/      # Firebase ID-token verification (jose + Google JWKS)
│   ├── prisma/          # schema.prisma + migrations
│   ├── routes/          # auth · users · problems · submissions · contests · github · ai · profile · health
│   ├── services/        # judge0 · runners · crypto · github · githubSync · problems
│   ├── scripts/         # migrate-on-deploy.sh · seed/ (problem data, harnesses, verifyHarness.js)
│   ├── utils/           # Profile rules (usernames, names), submission helpers
│   ├── tests/           # node:test suites
│   └── server.js
│
├── frontend/src/
│   ├── api/            # One fetch wrapper per resource
│   ├── components/      # Layout, shared UI, the sign-in showcase
│   ├── config/          # API base URL, Firebase init
│   ├── context/         # AuthContext
│   ├── hooks/           # Sign-in prompts, toasts, live username checks
│   ├── lib/             # Theme and editor preferences, profile rules
│   ├── pages/           # Home · Problems · Editor · Contests · Welcome · Settings · GithubSync · …
│   ├── styles/          # Per-page CSS + theme tokens
│   └── types/           # Shared TS types
│
└── .github/workflows/     # ci-cd.yml · keepalive.yml
```

---

<div align="center">
<sub>Built by <a href="https://github.com/varuntutejaa">Varun Tuteja</a></sub>
</div>
