import { API_BASE_URL } from '@/config/api';
import type { Contest, LeaderboardEntry } from '@/types/contest';

export async function fetchMyContests(headers: HeadersInit): Promise<Contest[]> {
  const res = await fetch(`${API_BASE_URL}/api/contests`, { headers });
  const data = await res.json();
  return data.success ? data.contests : [];
}

export async function fetchAvailableContests(headers: HeadersInit): Promise<Contest[]> {
  const res = await fetch(`${API_BASE_URL}/api/contests/available`, { headers });
  const data = await res.json();
  return data.success ? data.contests : [];
}

export async function fetchContest(code: string, headers: HeadersInit): Promise<Contest> {
  const res = await fetch(`${API_BASE_URL}/api/contests/${encodeURIComponent(code)}`, { headers });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Contest not found');
  return data.contest;
}

export async function fetchLeaderboard(code: string, headers: HeadersInit): Promise<LeaderboardEntry[]> {
  const res = await fetch(
    `${API_BASE_URL}/api/contests/${encodeURIComponent(code)}/leaderboard`,
    { headers }
  );
  const data = await res.json();
  return data.success ? data.leaderboard : [];
}

export async function createContest(
  payload: {
    title: string;
    description: string;
    problems: string[] | { count: number };
    startsAt: string;
    durationMinutes: number;
    isRandom: boolean;
  },
  headers: HeadersInit
): Promise<Contest> {
  const res = await fetch(`${API_BASE_URL}/api/contests/create`, {
    method: 'POST',
    headers: { ...headers as Record<string, string>, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to create contest');
  return data.contest;
}

export async function joinContest(code: string, headers: HeadersInit): Promise<Contest> {
  const res = await fetch(`${API_BASE_URL}/api/contests/join`, {
    method: 'POST',
    headers: { ...headers as Record<string, string>, 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to join contest');
  return data.contest;
}

export async function submitContestCode(
  payload: {
    contestCode: string;
    problemId: string;
    language: string;
    sourceCode: string;
    action: 'run' | 'submit';
  },
  headers: HeadersInit
) {
  const res = await fetch(`${API_BASE_URL}/api/contests/submit`, {
    method: 'POST',
    headers: { ...headers as Record<string, string>, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// Fetch external contests from calendar API
export async function fetchCalendarContests(): Promise<import('@/types/contest').Contest[]> {
  const res = await fetch(`${API_BASE_URL}/api/contests/calendar`);
  const data = await res.json();
  return data.success ? data.contests : [];
}
