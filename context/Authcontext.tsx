"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "../constants/index";
import { User } from "../app/types/index";
import apiClient, { refreshApiAccessToken, setApiAccessToken } from "@/lib/apiClient";
import axios from "axios";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  signup: (firstName: string, lastName: string, email: string, password: string, gender: string) => Promise<boolean>;
  refreshUser: () => Promise<User | null>;
  logout: () => Promise<void>;
  loginError: string | null;
  signupError: string | null;
  loading: boolean;
}

interface BackendUser {
  id: string;
  firstName: string;
  lastName?: string | null;
  email: string;
  gender?: string | null;
  avatarUrl?: string | null;
  roles?: string[];
  role?: string[];
  createdAt?: string;
  accountRole?: string;
  onboardingComplete?: boolean;
  onboardingStep?: number;
  customRole?: string | null;
  region?: string | null;
  accountStatus?: string;
  lastActiveAt?: string;
  authMethod?: "LOCAL" | "GOOGLE";
}

function normalizeRoles(roles?: string[]): User["role"] {
  const roleMap: Record<string, User["role"][number]> = {
    STUDENT: "Student",
    WORKING: "Working",
    FREELANCE: "Freelance",
    MARRIED: "Married",
  };
  const normalized = (roles || [])
    .map((role) => roleMap[role.toUpperCase()])
    .filter((role): role is User["role"][number] => Boolean(role));
  return normalized;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [signupError, setSignupError] = useState<string | null>(null);
  const router = useRouter();

  // Helper to map backend user to frontend User type
  const mapBackendUser = (dbUser: BackendUser): User => {
    return {
      id: dbUser.id,
      name: `${dbUser.firstName} ${dbUser.lastName || ""}`.trim(),
      email: dbUser.email,
      gender: dbUser.gender || undefined,
      avatar: dbUser.avatarUrl || undefined,
      role: normalizeRoles(dbUser.roles || dbUser.role),
      memberSince: dbUser.createdAt ? new Date(dbUser.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      accountRole: dbUser.accountRole || "USER",
      status: "Active",
      onboardingComplete: dbUser.onboardingComplete,
      onboardingStep: dbUser.onboardingStep,
      customRole: dbUser.customRole || undefined,
      region: dbUser.region || undefined,
      accountStatus: dbUser.accountStatus === "SUSPENDED" ? "SUSPENDED" : "ACTIVE",
      lastActiveAt: dbUser.lastActiveAt,
      authMethod: dbUser.authMethod,
    };
  };

  useEffect(() => {
    let active = true;
    const initializeAuth = async () => {
      try {
        const savedToken = await refreshApiAccessToken();
        if (!active) return;
        setToken(savedToken);
        const res = await apiClient.get("/users/me");
        if (!active) return;
        const freshUser = mapBackendUser(res.data);
        setUser(freshUser);
      } catch {
        if (!active) return;
        setApiAccessToken(null);
        setToken(null);
        setUser(null);
      }
      setLoading(false);
    };

    initializeAuth();
    return () => { active = false; };
  }, []);

  async function login(email: string, password: string): Promise<User | null> {
    setLoginError(null);
    try {
      const res = await apiClient.post("/auth/login", { email, password });
      const { accessToken, user: dbUser } = res.data;
      
      const mappedUser = mapBackendUser(dbUser);
      setUser(mappedUser);
      setToken(accessToken);
      setApiAccessToken(accessToken);
      window.localStorage.setItem("casha_last_activity", String(Date.now()));
      return mappedUser;
    } catch (error) {
      const message = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : null;
      setLoginError(message || "Unable to log in. Please try again.");
      return null;
    }
  }

  async function refreshUser(): Promise<User | null> {
    try {
      const res = await apiClient.get("/users/me");
      const freshUser = mapBackendUser(res.data);
      setUser(freshUser);
      return freshUser;
    } catch {
      return null;
    }
  }

  async function signup(firstName: string, lastName: string, email: string, password: string, gender: string) {
    setSignupError(null);
    try {
      const res = await apiClient.post("/auth/signup", {
        firstName,
        lastName,
        email,
        password,
        gender,
      });

      if (res.status === 201) {
        return true;
      }
      return false;
    } catch (error) {
      const message = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : null;
      setSignupError(message || "Unable to create your account. Please try again.");
      return false;
    }
  }

  async function logout() {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Local logout must still complete if the backend is unavailable.
    } finally {
      setUser(null);
      setToken(null);
      setApiAccessToken(null);
      window.localStorage.removeItem("casha_last_activity");
      router.push(ROUTES.LOGIN);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        signup,
        refreshUser,
        logout,
        loginError,
        signupError,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
