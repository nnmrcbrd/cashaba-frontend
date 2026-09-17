"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, LoaderCircle } from "lucide-react";
import AuthShell from "@/app/components/auth/AuthShell";
import { useAuth } from "@/context/Authcontext";
import { ROUTES } from "@/constants";

export default function GoogleOAuthCallbackPage() {
  return (
    <Suspense fallback={<OAuthStatus />}>
      <GoogleOAuthCallbackContent />
    </Suspense>
  );
}

function GoogleOAuthCallbackContent() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || "";
  const resolvedError = error || (!loading && !user ? "Casha-Ba could not establish your Google session. Please try again." : "");

  useEffect(() => {
    if (loading || resolvedError || !user) return;
    if (user.accountRole === "ADMIN") {
      window.location.replace(ROUTES.ADMIN_MANAGE_USERS);
      return;
    }
    if (!user.onboardingComplete) {
      const onboardingRoutes: Record<number, string> = {
        1: ROUTES.ONBOARDING_ROLE,
        2: ROUTES.ONBOARDING_INCOME,
        3: ROUTES.ONBOARDING_RECURRING,
        4: ROUTES.ONBOARDING_BUDGET,
      };
      window.location.replace(onboardingRoutes[user.onboardingStep || 1] || ROUTES.ONBOARDING_ROLE);
      return;
    }
    window.location.replace(ROUTES.DASHBOARD);
  }, [loading, resolvedError, user]);

  return (
    <AuthShell
      eyebrow="Google authentication"
      title={resolvedError ? "Google sign-in failed" : "Completing sign-in"}
      description={resolvedError ? "Your account was not changed." : "Please wait while Casha-Ba securely prepares your session."}
    >
      {resolvedError ? (
        <div className="space-y-4">
          <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 shrink-0" size={18} />
            <span>{resolvedError}</span>
          </div>
          <Link href={ROUTES.LOGIN} className="flex h-12 w-full items-center justify-center rounded-xl bg-[#0b6b4f] text-sm font-semibold text-white transition hover:bg-[#084f3b]">
            Return to sign in
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800" aria-live="polite">
          <LoaderCircle className="animate-spin" size={19} />
          Verifying your Google account…
        </div>
      )}
    </AuthShell>
  );
}

function OAuthStatus() {
  return (
    <AuthShell eyebrow="Google authentication" title="Completing sign-in" description="Please wait while Casha-Ba securely prepares your session.">
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800" aria-live="polite">
        <LoaderCircle className="animate-spin" size={19} />
        Verifying your Google account…
      </div>
    </AuthShell>
  );
}
