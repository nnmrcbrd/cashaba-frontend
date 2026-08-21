import axios from "axios";
import { AUTH } from "@/constants";

let refreshRequest: Promise<string> | null = null;

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem(AUTH.TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
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
    const isAuthRequest = originalRequest?.url?.startsWith("/auth/");
    if (status === 401 && !isAuthRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        if (!refreshRequest) {
          refreshRequest = axios
            .post(
              `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/auth/refresh`,
              {},
              { withCredentials: true },
            )
            .then((response) => response.data.accessToken as string)
            .finally(() => {
              refreshRequest = null;
            });
        }

        const accessToken = await refreshRequest;
        if (typeof window !== "undefined") {
          localStorage.setItem(AUTH.TOKEN_KEY, accessToken);
        }
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        if (typeof window !== "undefined") {
          localStorage.removeItem(AUTH.TOKEN_KEY);
          localStorage.removeItem("casha_user");
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
