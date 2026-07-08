// lib/api.ts - Base API client with token rotation

import { AUTH } from "@/constants";

export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem(AUTH.TOKEN_KEY);

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (res.status === 401) {
    // Try token refresh
    const refreshToken = localStorage.getItem(AUTH.REFRESH_TOKEN_KEY);
    const refreshRes = await fetch("/api/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
      headers: { "Content-Type": "application/json" },
    });

    if (!refreshRes.ok) {
      localStorage.clear();
      window.location.href = "/login";
      throw new Error("Session expired");
    }

    const { accessToken } = await refreshRes.json();
    localStorage.setItem(AUTH.TOKEN_KEY, accessToken);

    // Retry original request
    return fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...options.headers,
      },
    });
  }

  return res;
};