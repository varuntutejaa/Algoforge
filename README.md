<div align="center">

<img src="frontend/public/assets/algoforge_favicon_themed.svg" width="120" alt="AlgoForge logo" />

# AlgoForge

**A competitive programming platform built for real contest experience.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-djpb60zs17m9t.cloudfront.net-4f8ef7?style=flat-square&logo=amazonaws&logoColor=white)](https://djpb60zs17m9t.cloudfront.net)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com)

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
Auth                    — Email/password + Google OAuth via Firebase
```

---

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | React 19 · TypeScript · Vite · Tailwind CSS     |
| Editor     | Monaco Editor                                   |
| Backend    | Node.js · Express                               |
| Database   | MongoDB Atlas (Mongoose)                        |
| Auth       | Firebase Authentication (Admin SDK v14)         |
| Judge      | Judge0 API (code execution)                     |
| AI         | Groq API (Llama 3.3 70B)                        |
| Deploy     | AWS — EC2 (API) · CloudFront + S3 (frontend)    |

---

## Project Structure

```
AlgoForge/
├── backend/
│   ├── config/           # DB connection
│   ├── models/            # Mongoose schemas (User, Problem, Contest, Submission, UserCode)
│   ├── routes/            # Express routers (auth, problems, contests, code, submissions, profile, ai, health)
│   ├── services/          # Judge0 runner glue, problem formatting
│   ├── middleware/        # Firebase token verification
│   ├── utils/             # Profile helpers
│   ├── firebase-admin.js
│   └── server.js          # Entry point
│
└── frontend/
    ├── public/            # Static assets (favicons, images)
    └── src/
        ├── api/           # fetch wrappers per resource
        ├── components/    # Layout + shared UI
        ├── config/        # API base URL, Firebase web config
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

**Prerequisites:** Node.js 20+, MongoDB Atlas URI, Firebase project, Judge0 API key, Groq API key

```bash
# 1. Clone
git clone https://github.com/varuntutejaa/Algoforge.git
cd Algoforge

# 2. Backend
cd backend
npm install
cp .env.example .env   # fill in your keys
node server.js         # runs on :8000

# 3. Frontend
cd ../frontend
npm install
npm run dev             # runs on :5173, calls http://localhost:8000 directly
```

### Required backend environment variables (`backend/.env`)

```env
MONGO_URI=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
JUDGE0_URL=
JUDGE0_API_KEY=
GROQ_API_KEY=
```

The frontend's Firebase web config lives in `frontend/src/config/firebase.ts`, and the API base URL (local vs. production) is in `frontend/src/config/api.ts`.

---

## Deployment

- **Frontend** — built with `vite build`, served from an S3 bucket behind a CloudFront distribution (HTTPS via CloudFront's default certificate; SPA routing handled via custom 403/404 → `index.html` responses).
- **Backend** — runs on a single EC2 instance under PM2, behind an nginx reverse proxy, fronted by a second CloudFront distribution for HTTPS termination.
- **Database** — MongoDB Atlas, unchanged regardless of where the backend runs.

---

## License

---

<div align="center">
  <sub>Built by Varun Tuteja</sub>
</div>
