"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/Authcontext";
import { ROUTES } from "@/constants";
import PasswordInput from "./PasswordInput";

export default function LoginForm() {
  const { login, loginError } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    // Keep the server and first browser render identical. Consume the notice
    // after hydration, with cancellation for Strict Mode's effect replay.
    const frame = window.requestAnimationFrame(() => {
      try {
        const savedNotice = window.sessionStorage.getItem("casha_auth_notice");
        if (savedNotice) {
          setNotice(savedNotice);
          window.sessionStorage.removeItem("casha_auth_notice");
        }
      } catch {
        // A blocked storage API must not prevent the user from signing in.
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setEmailTouched(true);
    if (!emailValid) return;
    setLoading(true);
    const loggedInUser = await login(email, password);
    setLoading(false);
    if (!loggedInUser) return;
    // Extension point for a future requires-MFA authentication result.
    if (loggedInUser.accountRole === "ADMIN") router.push(ROUTES.ADMIN_MANAGE_USERS);
    else if (!loggedInUser.onboardingComplete) {
      const routes: Record<number, string> = { 1: ROUTES.ONBOARDING_ROLE, 2: ROUTES.ONBOARDING_INCOME, 3: ROUTES.ONBOARDING_RECURRING, 4: ROUTES.ONBOARDING_BUDGET };
      router.push(routes[loggedInUser.onboardingStep || 1] || ROUTES.ONBOARDING_ROLE);
    }
    else router.push(ROUTES.DASHBOARD);
  }

  return (
    <>
      {notice && (
        <div role="status" className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 shrink-0" size={17} />
          {notice}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate autoComplete="off">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">Email address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onBlur={() => setEmailTouched(true)}
            autoComplete="off"
            placeholder="you@example.com"
            aria-invalid={emailTouched && !emailValid}
            required
            className={`h-12 w-full rounded-xl border px-4 text-sm outline-none transition placeholder:text-slate-400 focus:ring-4 ${
              emailTouched && !emailValid
                ? "border-red-300 focus:border-red-400 focus:ring-red-500/10"
                : "border-slate-300 focus:border-[#0b6b4f] focus:ring-emerald-600/10"
            }`}
          />
          {emailTouched && !emailValid && <p className="mt-1.5 text-xs text-red-600">Enter a valid email address.</p>}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Password</span>
            <Link href={ROUTES.FORGOT_PASSWORD} className="text-xs font-semibold text-[#0b6b4f] hover:underline">Forgot password?</Link>
          </div>
          <PasswordInput id="password" label="" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="off" placeholder="Enter your password" />
        </div>

        {loginError && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 shrink-0" size={16} />
            {loginError}
          </div>
        )}

        <button type="submit" disabled={loading || !email || !password} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0b6b4f] text-sm font-semibold text-white transition hover:bg-[#084f3b] disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? "Signing in..." : "Sign in"}
          {!loading && <ArrowRight size={17} />}
        </button>
      </form>
    </>
  );
}
