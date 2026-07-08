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
import { AuthState, User } from "../types/index";

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedToken = window.localStorage.getItem(AUTH.TOKEN_KEY);
    const savedUser = window.localStorage.getItem("casha_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setUser(data.user);
    setToken(data.token);
    window.localStorage.setItem(AUTH.TOKEN_KEY, data.token);
    window.localStorage.setItem("casha_user", JSON.stringify(data.user));
    return true;
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