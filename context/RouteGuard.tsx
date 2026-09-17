"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/Authcontext";

const PUBLIC_ROUTES = new Set([
  "/",
  "/landing",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/google/callback",
]);

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const isPublic = PUBLIC_ROUTES.has(pathname);

  useEffect(() => {
    if (!loading && !isPublic && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isPublic, loading, router]);

  if (!isPublic && (loading || !isAuthenticated)) return null;
  return <>{children}</>;
}
