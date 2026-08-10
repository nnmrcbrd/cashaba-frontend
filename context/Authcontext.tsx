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

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Helper to map backend user to frontend User type
  const mapBackendUser = (dbUser: any): User => {
    return {
      id: dbUser.id,
      name: `${dbUser.firstName} ${dbUser.lastName || ""}`.trim(),
      email: dbUser.email,
      gender: dbUser.gender || undefined,
      role: dbUser.roles || dbUser.role || ["Working"],
      memberSince: dbUser.createdAt ? new Date(dbUser.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      accountType: dbUser.accountRole === "ADMIN" ? "Premium" : "Standard User",
      accountRole: dbUser.accountRole || "USER",
      status: "Active",
    };
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = window.localStorage.getItem(AUTH.TOKEN_KEY);
      const savedUser = window.localStorage.getItem("casha_user");
      
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        
        try {
          // Fetch fresh user profile from backend
          const res = await apiClient.get("/users/me");
          const freshUser = mapBackendUser(res.data);
          setUser(freshUser);
          window.localStorage.setItem("casha_user", JSON.stringify(freshUser));
        } catch (err) {
          console.error("Failed to fetch fresh profile, signing out", err);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  async function login(email: string, password: string): Promise<User | null> {
    try {
      const res = await apiClient.post("/auth/login", { email, password });
      const { accessToken, user: dbUser } = res.data;
      
      const mappedUser = mapBackendUser(dbUser);
      setUser(mappedUser);
      setToken(accessToken);
      
      window.localStorage.setItem(AUTH.TOKEN_KEY, accessToken);
      window.localStorage.setItem("casha_user", JSON.stringify(mappedUser));
      return mappedUser;
    } catch (err) {
      console.error("Login failed", err);
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

  function logout() {
    setUser(null);
    setToken(null);
    window.localStorage.removeItem(AUTH.TOKEN_KEY);
    window.localStorage.removeItem("casha_user");
    router.push(ROUTES.LOGIN);
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