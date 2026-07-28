import { API_BASE_URL } from '@/config/api';
import type { ProfileStats, SolvedItem, ActivityEntry } from '@/types/user';

// fetch user profile stats from the backend API
export async function fetchProfile(headers: HeadersInit, userId?: string): Promise<ProfileStats> {
  const q = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  const res = await fetch(`${API_BASE_URL}/profile${q}`, { headers });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to load profile');
  return data.profile;
}
// fetch solved problems list for the current user from the backend API
export async function fetchSolvedList(headers: HeadersInit, userId?: string): Promise<SolvedItem[]> {
  const q = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  const res = await fetch(`${API_BASE_URL}/profile/solved${q}`, { headers });
  const data = await res.json();
  return data.success ? data.solved : [];
}
// fetch user activity log from the backend API
export async function fetchActivity(headers: HeadersInit, userId?: string): Promise<ActivityEntry[]> {
  const q = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  const res = await fetch(`${API_BASE_URL}/profile/activity${q}`, { headers });
  const data = await res.json();
  return data.success ? data.activity : [];
}
// fetch user leaderboard rank from the backend API
export async function fetchSubmissions(
  headers: HeadersInit,
  verdict = 'All'
): Promise<Array<{
  problemTitle: string;
  language: string;
  verdict: string;
  runtime: number | null;
  memory: number | null;
  submittedAt: string;
}>> {
  const q = verdict !== 'All' ? `?verdict=${encodeURIComponent(verdict)}` : '';
  const res = await fetch(`${API_BASE_URL}/profile/submissions${q}`, { headers });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to load submissions');
  return data.submissions;
}

//
export async function fetchStreak(headers: HeadersInit): Promise<{ currentStreak: number; solvedToday: boolean }> {
  try {
    const res = await fetch(`${API_BASE_URL}/profile/streak`, { headers });
    if (!res.ok) return { currentStreak: 0, solvedToday: false };
    return res.json();
  } catch { return { currentStreak: 0, solvedToday: false }; }
}
