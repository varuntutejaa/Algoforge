import { API_BASE_URL } from '@/config/api';

export interface GithubStatus {
  configured: boolean;
  connected: boolean;
  username: string | null;
  repo: string | null;
  syncEnabled: boolean;
  connectedAt: string | null;
}

/** Result of an auto-push, returned alongside an accepted verdict. */
export interface GithubSyncResult {
  /** `disabled` means connected but auto-push is off — a manual push is offered. */
  status: 'created' | 'updated' | 'failed' | 'reconnect' | 'missing_repo' | 'unavailable' | 'disabled';
  path?: string;
  url?: string | null;
  commitUrl?: string | null;
  repo?: string;
  message?: string;
}

async function json<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { message?: string }).message || `Request failed (${res.status})`);
  return body as T;
}

export async function fetchGithubStatus(headers: HeadersInit): Promise<GithubStatus> {
  return json<GithubStatus>(await fetch(`${API_BASE_URL}/api/github/status`, { headers }));
}

/** Returns the GitHub authorize URL to send the browser to. */
export async function startGithubConnect(headers: HeadersInit): Promise<string> {
  const data = await json<{ url: string }>(await fetch(`${API_BASE_URL}/api/github/connect`, { headers }));
  return data.url;
}

export async function updateGithubSettings(
  body: { syncEnabled?: boolean; repo?: string },
  headers: HeadersInit,
): Promise<{ syncEnabled: boolean; repo: string }> {
  return json(await fetch(`${API_BASE_URL}/api/github/settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(headers as Record<string, string>) },
    body: JSON.stringify(body),
  }));
}

/** One-off push of the stored accepted solution for a problem. */
export async function pushSolutionToGithub(
  problemId: string,
  headers: HeadersInit,
): Promise<{ status: string; repo?: string; url?: string | null; commitUrl?: string | null }> {
  return json(await fetch(`${API_BASE_URL}/api/github/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(headers as Record<string, string>) },
    body: JSON.stringify({ problemId }),
  }));
}

export async function disconnectGithub(headers: HeadersInit): Promise<void> {
  await json(await fetch(`${API_BASE_URL}/api/github/disconnect`, {
    method: 'POST',
    headers: headers as Record<string, string>,
  }));
}
