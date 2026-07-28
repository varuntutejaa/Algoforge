<div align="center">

<img src="frontend/public/assets/algoforge_favicon_themed.svg" width="120" alt="AlgoForge logo" />

# AlgoForge

**A competitive programming platform built for real contest experience.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-djpb60zs17m9t.cloudfront.net-4f8ef7?style=flat-square&logo=amazonaws&logoColor=white)](https://djpb60zs17m9t.cloudfront.net)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-RDS-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://aws.amazon.com/rds/postgresql/)

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
Auth                    — Email/password via AWS Cognito, email verification on signup
```

---

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | React 19 · TypeScript · Vite · Tailwind CSS     |
| Editor     | Monaco Editor                                   |
| Backend    | Node.js · Express                               |
| Database   | AWS RDS PostgreSQL (Prisma)                     |
| Auth       | AWS Cognito (User Pool + JWT verification)      |
| Judge      | Judge0 API (code execution)                     |
| AI         | Groq API (Llama 3.3 70B)                        |
| Deploy     | AWS — EC2 (API) · CloudFront + S3 (frontend)    |

---

## Project Structure

```
AlgoForge/
├── backend/
│   ├── config/           # Prisma client singleton, DB connectivity check
│   ├── prisma/            # schema.prisma (Postgres schema) + migrations
│   ├── routes/            # Express routers (auth, problems, contests, submissions, profile, ai, health)
│   ├── services/          # Judge0 runner glue, problem formatting
│   ├── middleware/        # Cognito token verification
│   ├── utils/             # Profile helpers
│   └── server.js          # Entry point
│
└── frontend/
    ├── public/            # Static assets (favicons, images)
    └── src/
        ├── api/           # fetch wrappers per resource
        ├── components/    # Layout + shared UI
        ├── config/        # API base URL
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

**Prerequisites:** Node.js 20+, a PostgreSQL database (e.g. AWS RDS) URI, an AWS Cognito User Pool (see `infra/setup/create-cognito-user-pool.sh`), Judge0 API key, Groq API key

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
npm run dev             # runs on :5173, calls http://localhost:8000 directly
```

### Required backend environment variables (`backend/.env`)

```env
DATABASE_URL=
COGNITO_USER_POOL_ID=
COGNITO_CLIENT_ID=
JUDGE0_URL=
JUDGE0_API_KEY=
GROQ_API_KEY=
ADMIN_API_KEY=
CORS_ORIGINS=
```

The API base URL (local vs. production) is in `frontend/src/config/api.ts`.

---

## Deployment

- **Frontend** — built with `vite build`, served from an S3 bucket behind a CloudFront distribution (HTTPS via CloudFront's default certificate; SPA routing handled via custom 403/404 → `index.html` responses).
- **Backend** — runs on a single EC2 instance under PM2, behind an nginx reverse proxy, fronted by a second CloudFront distribution for HTTPS termination.
- **Database** — AWS RDS PostgreSQL, in the same VPC as the backend EC2 instance (not publicly accessible).

---

## License

---

<div align="center">
  <sub>Built by Varun Tuteja</sub>
</div>
