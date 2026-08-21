"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { AUTH, ROUTES } from "../constants/index";
import { User } from "../app/types/index";
import apiClient from "@/lib/apiClient";
import axios from "axios";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loginError: string | null;
  loading: boolean;
}

interface BackendUser {
  id: string;
  firstName: string;
  lastName?: string | null;
  email: string;
  gender?: string | null;
  roles?: string[];
  role?: string[];
  createdAt?: string;
  accountRole?: string;
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
  return normalized.length > 0 ? normalized : ["Working"];
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const router = useRouter();

  // Helper to map backend user to frontend User type
  const mapBackendUser = (dbUser: BackendUser): User => {
    return {
      id: dbUser.id,
      name: `${dbUser.firstName} ${dbUser.lastName || ""}`.trim(),
      email: dbUser.email,
      gender: dbUser.gender || undefined,
      role: normalizeRoles(dbUser.roles || dbUser.role),
      memberSince: dbUser.createdAt ? new Date(dbUser.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      accountType: dbUser.accountRole === "ADMIN" ? "Premium" : "Standard User",
      accountRole: dbUser.accountRole || "USER",
      status: "Active",
    };
  };

  useEffect(() => {
    const initializeAuth = async () => {
      let savedToken = window.localStorage.getItem(AUTH.TOKEN_KEY);

      try {
        if (!savedToken) {
          const refreshRes = await apiClient.post("/auth/refresh");
          savedToken = refreshRes.data.accessToken;
          window.localStorage.setItem(AUTH.TOKEN_KEY, savedToken!);
        }

        setToken(savedToken);
        const res = await apiClient.get("/users/me");
        const freshUser = mapBackendUser(res.data);
        setUser(freshUser);
        window.localStorage.setItem("casha_user", JSON.stringify(freshUser));
      } catch {
        window.localStorage.removeItem(AUTH.TOKEN_KEY);
        window.localStorage.removeItem("casha_user");
        setToken(null);
        setUser(null);
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  async function login(email: string, password: string): Promise<User | null> {
    setLoginError(null);
    try {
      const res = await apiClient.post("/auth/login", { email, password });
      const { accessToken, user: dbUser } = res.data;
      
      const mappedUser = mapBackendUser(dbUser);
      setUser(mappedUser);
      setToken(accessToken);
      
      window.localStorage.setItem(AUTH.TOKEN_KEY, accessToken);
      window.localStorage.setItem("casha_user", JSON.stringify(mappedUser));
      return mappedUser;
    } catch (error) {
      const message = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : null;
      setLoginError(message || "Unable to log in. Please try again.");
      return null;
    }
  }

  async function signup(name: string, email: string, password: string) {
    try {
      const [firstName, ...lastNameParts] = name.trim().split(" ");
      const lastName = lastNameParts.join(" ") || "User";

      const res = await apiClient.post("/auth/signup", {
        firstName,
        lastName,
        email,
        password,
      });

      if (res.status === 201) {
        // Automatically login the user after successful registration
        const loggedUser = await login(email, password);
        return !!loggedUser;
      }
      return false;
    } catch (err) {
      console.error("Signup failed", err);
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
      window.localStorage.removeItem(AUTH.TOKEN_KEY);
      window.localStorage.removeItem("casha_user");
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
        logout,
        loginError,
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
