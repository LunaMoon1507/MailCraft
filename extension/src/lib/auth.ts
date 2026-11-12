import { storage } from '#imports';

export const authToken = storage.defineItem<string | null>(
  "local:token",
  {fallback: null}
);

// Long-lived token used only to get a new access token when the current one expires.
export const refreshTokenItem = storage.defineItem<string | null>(
  "local:refreshToken",
  {fallback: null}
);

async function saveTokens(data: { token: string, refreshToken?: string }) {
  await refreshTokenItem.setValue(data.refreshToken ?? null);
  await authToken.setValue(data.token);
}

export const API_URL: string = import.meta.env.WXT_API_URL ?? 'http://localhost:3000';

export async function login(username: string, password:string) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: username,
      password: password,
    }),
  })

  if (!res.ok) {
    const errorMessage = await res.json();
    throw new Error(errorMessage.message);
  }
  await saveTokens(await res.json());
  return;
}

export async function register(username: string, password:string) {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: username,
      password: password,
    }),
  })

  if (!res.ok) {
    const errorMessage = await res.json();
    throw new Error(errorMessage.message);
  }
  await saveTokens(await res.json());
  return;
}

export async function logout() {
  await refreshTokenItem.removeValue();
  await authToken.removeValue();
}

// Returns true if the access token expires within `marginSeconds` (or can't be read).
export function isTokenExpiring(token: string, marginSeconds = 30) {
  try {
    const base64 = (token.split(".")[1] ?? "").replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(base64));
    return typeof exp !== "number" || Date.now() >= (exp - marginSeconds) * 1000;
  }
  catch {
    return true;
  }
}

// If several requests fail at once they all wait on the same refresh call,
// instead of each one using (and invalidating) the refresh token.
let refreshInFlight: Promise<string | null> | null = null;

// Gets a new access token using the stored refresh token.
// Returns the new token, or null (and logs the user out) if the session is over.
export function refreshAccessToken(): Promise<string | null> {
  refreshInFlight ??= (async () => {
    try {
      const refreshToken = await refreshTokenItem.getValue();
      if (!refreshToken) {
        await logout();
        return null;
      }
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (res.status === 400 || res.status === 401) {
        await logout();
        return null;
      }
      if (!res.ok) {
        // Server hiccup: keep the tokens so a later retry can still work.
        return null;
      }
      const data = await res.json();
      await saveTokens(data);
      return data.token as string;
    }
    catch {
      // Network error (e.g. backend not running): don't log the user out.
      return null;
    }
    finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}