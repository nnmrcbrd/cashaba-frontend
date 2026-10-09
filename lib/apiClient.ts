import axios from "axios";
let refreshRequest: Promise<string> | null = null;
let accessToken: string | null = null;

export function setApiAccessToken(token: string | null) {
  accessToken = token;
}

export function getApiAccessToken() {
  return accessToken;
}

// Startup and expired API requests must share the same one-use cookie rotation.
export function refreshApiAccessToken(): Promise<string> {
  if (!refreshRequest) {
    refreshRequest = axios.post(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/auth/refresh`,
      {},
      { withCredentials: true },
    ).then((response) => {
      const token = response.data.accessToken as string;
      setApiAccessToken(token);
      return token;
    }).finally(() => {
      refreshRequest = null;
    });
  }
  return refreshRequest;
}

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config) => {
    if (['post', 'put', 'patch', 'delete'].includes(config.method || '') && !config.headers['Idempotency-Key']) {
      config.headers['Idempotency-Key'] = crypto.randomUUID();
    }
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    if (status === 402 && error.response?.data?.code === 'TRIAL_EXPIRED' && typeof window !== 'undefined') window.dispatchEvent(new Event('casha-trial-expired'));
    const isAuthRequest = originalRequest?.url?.startsWith("/auth/");
    if (status === 401 && !isAuthRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const accessToken = await refreshApiAccessToken();
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        if (typeof window !== "undefined") {
          setApiAccessToken(null);
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
