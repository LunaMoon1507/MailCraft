import { storage } from '#imports';

const tokenKey = 'local:token';

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
  const { token } = await res.json();
  await storage.setItem(tokenKey, token);
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
  const { token } = await res.json();
  await storage.setItem(tokenKey, token);
  return;
}

export async function logout() {
  await storage.removeItem(tokenKey);
}