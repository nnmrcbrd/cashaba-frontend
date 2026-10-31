"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/Authcontext";
import HeaderThemeToggle from "@/app/components/ui/HeaderThemeToggle";
import AccessDenied from "@/app/components/auth/AccessDenied";
import { getRouteAccess } from '@/lib/routeAccess';

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, loading, logout, user } = useAuth();
  const { isProtected, isAdmin, hasWrongRole } = getRouteAccess(pathname, user?.accountRole);

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
