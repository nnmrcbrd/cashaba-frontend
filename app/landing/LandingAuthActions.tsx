"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/context/Authcontext";
import { ROUTES } from "@/constants";

function useLandingSession() {
  const { isAuthenticated, loading, user } = useAuth();
  return {
    isAuthenticated,
    loading,
    dashboardHref: user?.accountRole === "ADMIN" ? ROUTES.ADMIN_MANAGE_USERS : ROUTES.DASHBOARD,
  };
}

export function LandingAccountLink({ className, guestLabel = "Create account", arrow = false }: {
  className: string;
  guestLabel?: string;
  arrow?: boolean;
}) {
  const { isAuthenticated, loading, dashboardHref } = useLandingSession();
  // Wait for the existing cookie-session check before showing guest actions.
  if (loading) return <button type="button" disabled aria-busy="true" className={className}>Loading…</button>;
  return (
    <Link href={isAuthenticated ? dashboardHref : ROUTES.SIGNUP} className={className}>
      {isAuthenticated ? "Open dashboard" : guestLabel}
      {arrow && <ArrowRight size={17} strokeWidth={1.75} aria-hidden="true" />}
    </Link>
  );
}

export default function LandingAuthActions({ variant = "header" }: { variant?: "header" | "footer" }) {
  const { isAuthenticated, loading, dashboardHref } = useLandingSession();
  const primaryClass = variant === "footer" ? "hover:text-white" : "whitespace-nowrap rounded-full bg-[#17694d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#10583f] active:scale-[0.98] sm:px-5";
  if (loading) return <button type="button" disabled aria-busy="true" className={primaryClass}>Loading…</button>;
  if (isAuthenticated) return <Link href={dashboardHref} className={primaryClass}>Open dashboard</Link>;
  return (
    <>
      <Link href={ROUTES.LOGIN} className={variant === "footer" ? "hover:text-white" : "rounded-full px-3 py-2 text-sm font-semibold text-[#20382f] transition hover:bg-[#e5ebe5] active:scale-[0.98] dark:text-[#dce8e1] dark:hover:bg-white/10 sm:px-4"}>Sign in</Link>
      <Link href={ROUTES.SIGNUP} className={primaryClass}>Create account</Link>
    </>
  );
}
