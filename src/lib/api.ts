/// <reference types="vite/client" />
import { auth } from '../firebase/config';

const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function getToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in");
  return await user.getIdToken();
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = await getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "API error" }));
    throw new Error(err.error || "API error");
  }

  return res.json();
}
