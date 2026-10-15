"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/Authcontext";
import HeaderThemeToggle from "@/app/components/ui/HeaderThemeToggle";
import AccessDenied from "@/app/components/auth/AccessDenied";

const ADMIN_ALLOWED_ROUTES = new Set(["/admin/manage-users", "/admin/activity-logs", "/admin/appearance", "/change-password"]);
const PROTECTED_ROUTES = new Set([
  "/accounts",
  "/admin/appearance",
  "/admin/manage-users",
  "/admin/activity-logs",
  "/ai-assistant",
  "/analytics",
  "/budget",
  "/change-password",
  "/dashboard",
  "/loans",
  "/obligations",
  "/onboarding/budget",
  "/onboarding/income",
  "/onboarding/recurring",
  "/onboarding/role",
  "/settings",
  "/subscription",
  "/transactions",
]);

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, loading, logout, user } = useAuth();
  const isProtected = PROTECTED_ROUTES.has(pathname);
  const isAdminRoute = pathname.startsWith("/admin/");
  const isAdmin = user?.accountRole === "ADMIN";
  const hasWrongRole = Boolean(
    isProtected && user && (
      (isAdminRoute && !isAdmin) ||
      (isAdmin && !ADMIN_ALLOWED_ROUTES.has(pathname))
    )
  );

  useEffect(() => {
    if (!loading && isProtected && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isProtected, loading, router]);

  if (isProtected && (loading || !isAuthenticated)) return null;
  if (hasWrongRole) return <AccessDenied isAdmin={isAdmin} onLogout={logout} />;
  return (
    <>
      {isProtected && (
        <HeaderThemeToggle />
      )}
      {children}
    </>
  );
}
