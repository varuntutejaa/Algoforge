// frontend/src/api/problems.ts
import { API_BASE_URL } from '@/config/api';
// import type { Problem, ProblemDetail, SubmitResult } from '@/types/problem';
import type { Problem, ProblemDetail, SubmitResult } from '@/types/problem';

// fetch problems list and problem detail from the backend API
export async function fetchProblems(): Promise<Problem[]> {
  const res = await fetch(`${API_BASE_URL}/problems`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to load problems');
  return data.problems;
}

// fetch problem detail by id from the backend API
export async function fetchProblem(id: string): Promise<ProblemDetail> {
  const res = await fetch(`${API_BASE_URL}/problems/${encodeURIComponent(id)}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Problem not found');
  return data.problem;
}

// fetch solved problem ids for the current user from the backend API
export async function fetchSolvedIds(headers: HeadersInit): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/profile/solved`, { headers });
    const data = await res.json();
    return data.success ? data.solvedIds : [];
  } catch { return []; }
}

// submit code to the backend API for running or submitting
export async function submitCode(
  payload: {
    problemId: string;
    language: string;
    sourceCode: string;
    userId?: string;
    action: 'run' | 'submit';
  },
  headers: HeadersInit
): Promise<SubmitResult> {
  const res = await fetch(`${API_BASE_URL}/submit-code`, {
    method: 'POST',
    headers: { ...headers as Record<string, string>, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// fetch AI-generated hint from the backend API
export async function fetchAiHint(
  payload: { problemId: string; hintNumber: number; code: string; language: string; elapsedSeconds: number },
  headers: HeadersInit
): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/hint`, {
    method: 'POST',
    headers: { ...headers as Record<string, string>, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return data.hint || data.error || 'Could not generate hint.';
}

// fetch AI-generated code review from the backend API
export async function fetchCodeReview(
  payload: { problemId: string; code: string; language: string },
  headers: HeadersInit
): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/review`, {
    method: 'POST',
    headers: { ...headers as Record<string, string>, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return data.review || data.error || 'Could not generate review.';
}
