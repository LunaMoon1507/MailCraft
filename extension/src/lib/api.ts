// Thin wrapper around the MailCraft backend. All server calls go through
// here so the base URL, headers and (later) the JWT live in one place.
import { storage } from '#imports';
import { authToken, isTokenExpiring, refreshAccessToken } from './auth';

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
// automatically adds the authorization header, and renews an expired
// access token with the refresh token so the user stays logged in
async function makeAuthRequest(url: string, options: RequestInit = {}) {
  let token = await authToken.getValue();
  if (!token) {
    throw new Error("Please log in");
  }

  // Renew ahead of time if the token is about to expire (saves a failed request).
  if (isTokenExpiring(token)) {
    token = (await refreshAccessToken()) ?? token;
  }

  const send = (accessToken: string) => fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  let res = await send(token);

  if (res.status === 401) {
    // Access token rejected: try once to renew it, then retry the request.
    const newToken = await refreshAccessToken();
    if (!newToken) {
      throw new Error("Session expired, please log in");
    }
    res = await send(newToken);
    if (res.status === 401) {
      throw new Error("Session expired, please log in");
    }
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