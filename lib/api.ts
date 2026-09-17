// lib/api.ts - Base API client with token rotation

import apiClient from "@/lib/apiClient";

export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const response = await apiClient.request({
    url,
    method: options.method || "GET",
    data: typeof options.body === "string" ? JSON.parse(options.body) : options.body,
    headers: Object.fromEntries(new Headers(options.headers).entries()),
  });
  return new Response(JSON.stringify(response.data), { status: response.status, headers: { "Content-Type": "application/json" } });
};
