<div align="center">

<img src="frontend/public/assets/algoforge_favicon_themed.svg" width="120" alt="AlgoForge logo" />

# AlgoForge

**A competitive programming platform built for real contest experience.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-frontend--xi--orpin--21.vercel.app-000000?style=flat-square&logo=vercel&logoColor=white)](https://frontend-xi-orpin-21.vercel.app)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Postgres-Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)

</div>

---

## What is AlgoForge?

AlgoForge is a LeetCode-style platform where you can solve algorithmic problems, compete in timed contests, and track your growth over time. Problems run against real test cases via the Judge0 API. Contests have live leaderboards, penalty scoring, and a countdown timer.

---

## Features

```
Problem solving       — Monaco editor, C / C++ / Java / JavaScript / Python
Contest arena          — Live timer + progress bar, real-time leaderboard
Scoring system         — +100 per accepted, −10 per wrong attempt
AI Assist              — Time-locked hints + code review (Groq / Llama 3.3 70B)
Auto-save              — Code persisted per problem per language
Dashboard               — Heatmap, streaks, difficulty & topic breakdown
Auth                    — Email/password + Google OAuth via Supabase Auth
```

---

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | React 19 · TypeScript · Vite · Tailwind CSS     |
| Editor     | Monaco Editor                                   |
| Backend    | Node.js · Express                               |
| Database   | Supabase PostgreSQL (Prisma)                    |
| Auth       | Supabase Auth (email/password + Google OAuth, JWKS-verified) |
| Judge      | Judge0 API (code execution, parallel per-test-case grading) |
| AI         | Groq API (Llama 3.3 70B)                        |
| Deploy     | Vercel (frontend) · Render (backend)            |

---

## Project Structure

```
AlgoForge/
├── backend/
│   ├── config/           # Prisma client singleton, DB connectivity check
│   ├── prisma/            # schema.prisma (Postgres schema) + migrations
│   ├── routes/            # Express routers (auth, problems, contests, submissions, profile, ai, health)
│   ├── services/          # Judge0 runner glue, problem formatting
│   ├── middleware/        # Supabase JWT verification (public JWKS, no shared secret)
│   ├── utils/             # Profile helpers
│   └── server.js          # Entry point
│
└── frontend/
    ├── public/            # Static assets (favicons, images)
    └── src/
        ├── api/           # fetch wrappers per resource
        ├── components/    # Layout + shared UI
        ├── config/        # API base URL, Supabase client
        ├── context/       # AuthContext
        ├── hooks/         # useToast, etc.
        ├── pages/         # Route-level views (Dashboard, Editor, Contests, ...)
        ├── styles/        # Per-page CSS
        └── types/         # Shared TS types
```

---

## Scoring

| Event                          | Points   |
|--------------------------------|----------|
| Problem accepted               | **+100** |
| Wrong answer / compile error   | **−10**  |

Leaderboard is sorted by **total score** descending. Tiebreaker: fewer wrong attempts → faster finish time.

---

## Running Locally

**Prerequisites:** Node.js 22+, a [Supabase](https://supabase.com) project (Postgres + Auth), Judge0 API key (optional — defaults to the public CE instance), Groq API key

```bash
# 1. Clone
git clone https://github.com/varuntutejaa/Algoforge.git
cd Algoforge

# 2. Backend
cd backend
npm install
cp .env.example .env   # fill in your keys
npx prisma generate
npx prisma migrate deploy
node server.js         # runs on :8000

# 3. Frontend
cd ../frontend
npm install
cp .env.example .env   # fill in your Supabase project URL + anon key
npm run dev             # runs on :5173, calls http://localhost:8000 directly
```

### Required backend environment variables (`backend/.env`)

```env
DATABASE_URL=
SUPABASE_URL=
JUDGE0_URL=
JUDGE0_API_KEY=
GROQ_API_KEY=
ADMIN_API_KEY=
CORS_ORIGINS=
```

### Required frontend environment variables (`frontend/.env`)

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

The API base URL (local vs. production) is in `frontend/src/config/api.ts`.

---

## Deployment

- **Frontend** — deployed to [Vercel](https://vercel.com) (`vercel --prod`), built with `vite build`. `frontend/vercel.json` handles SPA routing (all paths rewrite to `index.html`).
- **Backend** — deployed to [Render](https://render.com) as a Blueprint service, driven by `render.yaml` at the repo root; auto-deploys on push to `main`.
- **Database & Auth** — [Supabase](https://supabase.com) Postgres (accessed via the connection pooler — the direct endpoint is IPv6-only) and Supabase Auth (email/password + Google OAuth, verified backend-side against Supabase's public JWKS).
- **CI** — GitHub Actions (`.github/workflows/ci-cd.yml`) runs lint/test/audit/build on every push and PR; it doesn't deploy anything itself, since Render and Vercel each deploy independently.

---

## License

---

<div align="center">
  <sub>Built by Varun Tuteja</sub>
</div>
