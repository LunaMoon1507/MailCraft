// Thin wrapper around the MailCraft backend. All server calls go through
// here so the base URL, headers and (later) the JWT live in one place.
import { storage } from '#imports';
import { tokenKey } from './auth';

export const API_URL: string = import.meta.env.WXT_API_URL ?? 'http://localhost:3000';

export interface HealthResponse {
  status: 'ok';
}

export async function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const res = await fetch(`${API_URL}/api/health`, { signal });
  if (!res.ok) {
    throw new Error(`Health check failed: HTTP ${res.status}`);
  }
  return (await res.json()) as HealthResponse;
}

// helper function for any api calls that need the user to be signed in
// automatically adds the authorization header
async function makeAuthRequest(url: string, options: RequestInit = {}) {
  const token = await storage.getItem<string>(tokenKey);
  if (!token) {
    throw new Error("Please log in");
  }
  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  })

  if (res.status === 401) {
    // if token expired, remove it
    await storage.removeItem(tokenKey);
    throw new Error("Session expired, please log in");
  }

  return res;
}

// update as needed, created for testing purposes
export interface ProfileResponse {
  username: string,
  userStats: {
    level: number;
    xp: number;
    highest_level: number;
    current_streak: number;
    longest_streak: number;
    last_active_date: Date;
    best_day_count: number;
    best_day_date: Date;
    user_id: bigint;
    } | null;
}

export async function getProfile() {
  try {
    const res = await makeAuthRequest(`${API_URL}/api/profile`, {
      method: "GET",
    })

    if (res.status === 500) {
      throw new Error("An unexpected error occurred, please try again.");
    }

    return (await res.json()) as ProfileResponse;
  }
  catch {
    throw new Error("Please log in to view your profile.");
  }
}