import { API_BASE_URL } from '@/config/api';

export interface ProfileFields {
  firstName: string;
  lastName: string;
  username: string;
}

export interface UsernameCheck {
  username: string;
  available: boolean;
  message?: string;
}

/** Thrown for a rejected update; `errors` maps a field to its message. */
export class ProfileError extends Error {
  errors: Partial<Record<keyof ProfileFields, string>>;
  constructor(message: string, errors: Partial<Record<keyof ProfileFields, string>> = {}) {
    super(message);
    this.errors = errors;
  }
}

export async function checkUsername(username: string, headers: HeadersInit, signal?: AbortSignal): Promise<UsernameCheck> {
  const res = await fetch(`${API_BASE_URL}/api/users/username-available?username=${encodeURIComponent(username)}`, { headers, signal });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) throw new Error(data.message || 'Could not check that username.');
  return data;
}

/** Saves the given fields and returns the updated user record from the API. */
export async function updateProfile(fields: Partial<ProfileFields>, headers: HeadersInit): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE_URL}/api/users/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(headers as Record<string, string>) },
    body: JSON.stringify(fields),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) throw new ProfileError(data.message || 'Could not save your profile.', data.errors || {});
  return data.user;
}
