// Thin wrapper around the MailCraft backend. All server calls go through
// here so the base URL, headers and (later) the JWT live in one place.

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
