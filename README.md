<div align="center">

<img src="frontend/assets/algoforge_favicon_themed.svg" width="120" alt="AlgoForge logo" />

# AlgoForge

**A competitive programming platform built for real contest experience.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-algoforge--1--mbk5.onrender.com-4f8ef7?style=flat-square&logo=render&logoColor=white)](https://algoforge-lwo9.vercel.app/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com)

</div>

---

## What is AlgoForge?

AlgoForge is a LeetCode-style platform where you can solve algorithmic problems, compete in timed contests, and track your growth over time. Problems run against real test cases via the Judge0 API. Contests have live leaderboards, penalty scoring, and a countdown timer.

---

## Features

```
Problem solving       — Monaco editor, C / C++ / Java / JavaScript
Contest arena         — Live timer + progress bar, real-time leaderboard
Scoring system        — +100 per accepted, −10 per wrong attempt
AI Assist             — Time-locked hints + code review (GPT-powered)
Auto-save             — Code persisted per problem per language
Dashboard             — Heatmap, streaks, difficulty & topic breakdown
Auth                  — Email/password + Google OAuth via Firebase
```

---

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | Vanilla HTML · CSS · JavaScript                 |
| Editor     | Monaco Editor 0.52                              |
| Backend    | Node.js · Express                               |
| Database   | MongoDB (Mongoose)                              |
| Auth       | Firebase Authentication (Admin SDK v14)         |
| Judge      | Judge0 API (code execution)                     |
| AI         | Anthropic Claude API                            |
| Deploy     | Render                                          |

---

## Project Structure

```
AlgoForge/
├── backend/
│   ├── models/          # Mongoose schemas (User, Problem, Contest, Submission)
│   ├── routes/          # Express routers (auth, problems, contests, profile)
│   ├── middleware/       # Firebase token verification
│   ├── utils/           # Profile helpers
│   ├── firebase-admin.js
│   └── server.js        # Entry point
│
└── frontend/
    ├── css/             # Per-page stylesheets
    ├── scripts/
    │   ├── auth/        # login.js, signup.js, fpass.js
    │   ├── contests/    # contest-editor.js, contests.js, contest-results.js
    │   ├── dashboard/   # dashboard.js, submissions.js
    │   ├── design/      # nav.js, toast.js, script.js
    │   └── problem/     # editor.js, problems.js
    └── *.html           # index, login, signup, problems, editor, contests, dashboard
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

**Prerequisites:** Node.js 18+, MongoDB Atlas URI, Firebase project, Judge0 API key

```bash
# 1. Clone
git clone https://github.com/varuntutejaa/Algoforge.git
cd Algoforge

# 2. Backend
cd backend
npm install
cp .env.example .env   # fill in your keys
node server.js

# 3. Frontend
# Open frontend/index.html in a browser, or serve with any static server:
npx serve frontend
```

### Required environment variables

```env
MONGODB_URI=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
JUDGE0_API_KEY=
ANTHROPIC_API_KEY=
PORT=3000
```

Update `frontend/scripts/auth/firebase-config.js` with your Firebase web app config and `frontend/scripts/config.js` with your backend URL.

---

## License

---

<div align="center">
  <sub>Built by Varun Tuteja</sub>
</div>
