"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { AlertCircle, CheckCircle2, Mail } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { ROUTES } from "@/constants";
import AuthShell from "./AuthShell";
import ResetPasswordForm from "@/app/reset-password/ResetPasswordForm";

type Purpose = "verification" | "recovery";
interface Props {
  purpose: Purpose;
  initialEmail?: string;
  initialChallengeId?: string;
  onResetToken?: (token: string) => void;
}

function formatWait(seconds: number) {
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export function EmailOtpForm({ purpose, initialEmail = "", initialChallengeId = "", onResetToken }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [challengeId, setChallengeId] = useState(initialChallengeId);
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(initialChallengeId ? 60 : 0);
  const [verificationCountdown, setVerificationCountdown] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (countdown <= 0 && verificationCountdown <= 0) return;
    const timer = window.setTimeout(() => {
      setCountdown(value => Math.max(0, value - 1));
      setVerificationCountdown(value => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [countdown, verificationCountdown]);

  function showError(requestError: unknown, verifying = false) {
    if (!axios.isAxiosError<{ message?: string; retryAfterSeconds?: number }>(requestError)) {
      setError("Unable to complete the request. Please try again.");
      return;
    }
    setError(requestError.response?.data?.message || "Unable to complete the request. Please try again.");
    if (requestError.response?.status === 429) {
      // The JSON field is readable across origins even when Retry-After is not.
      const seconds = Number(requestError.response.data.retryAfterSeconds ?? requestError.response.headers["retry-after"]);
      const wait = Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : 60;
      if (verifying) setVerificationCountdown(wait);
      else setCountdown(wait);
    }
  }

  async function requestCode(event?: React.FormEvent) {
    event?.preventDefault();
    if (loading || countdown > 0) return;
    setLoading(true); setError("");
    try {
      const response = await apiClient.post(purpose === "verification" ? "/auth/resend-verification" : "/auth/forgot-password", { email: email.trim() });
      if (typeof response.data.challengeId !== "string") throw new Error("Missing challenge");
      setEmail(email.trim()); setChallengeId(response.data.challengeId); setCode("");
      setCountdown(response.data.resendAfterSeconds || 60);
    } catch (requestError) { showError(requestError); }
    finally { setLoading(false); }
  }

  async function verifyCode(event: React.FormEvent) {
    event.preventDefault();
    if (loading || verificationCountdown > 0 || !/^\d{6}$/.test(code)) return;
    setLoading(true); setError("");
    try {
      const response = await apiClient.post(purpose === "verification" ? "/auth/verify" : "/auth/verify-reset-code", { challengeId, code });
      if (purpose === "recovery") {
        if (typeof response.data.resetToken !== "string" || !onResetToken) throw new Error("Missing recovery confirmation");
        onResetToken(response.data.resetToken);
      } else setCompleted(true);
    } catch (requestError) { showError(requestError, true); }
    finally { setLoading(false); }
  }

  if (completed) return <div className="space-y-5"><div role="status" className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><CheckCircle2 size={18} className="shrink-0" />Email verified. Sign in to continue to your financial setup.</div><Link href={ROUTES.LOGIN} className="flex h-12 items-center justify-center rounded-xl bg-[#0b6b4f] text-sm font-semibold text-white">Continue to sign in</Link></div>;

  return <div className="space-y-5">
    {challengeId ? <>
      <div role="status" className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900"><Mail size={18} className="mt-1 shrink-0" /><p>{purpose === "recovery" ? "If an eligible account exists, check your inbox for" : "Check your inbox for"} the six-digit code for <strong>{email}</strong>. It expires in 10 minutes. Check your spam folder too.</p></div>
      <form onSubmit={verifyCode} className="space-y-4">
        <label htmlFor="emailOtp" className="block text-sm font-semibold text-slate-700">Verification code
          <input id="emailOtp" value={code} onChange={event => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required placeholder="000000" className="mt-2 h-14 w-full rounded-xl border border-slate-300 px-4 text-center text-2xl tracking-[0.5em] outline-none focus:border-[#0b6b4f] focus:ring-4 focus:ring-emerald-600/10" />
        </label>
        <button disabled={loading || verificationCountdown > 0 || code.length !== 6} className="h-12 w-full rounded-xl bg-[#0b6b4f] text-sm font-semibold text-white hover:bg-[#084f3b] disabled:opacity-60">{loading ? "Verifying…" : verificationCountdown > 0 ? `Try again in ${formatWait(verificationCountdown)}` : purpose === "recovery" ? "Verify code and continue" : "Verify email"}</button>
      </form>
      <button type="button" onClick={() => void requestCode()} disabled={loading || countdown > 0} className="w-full text-center text-sm font-semibold text-[#0b6b4f] disabled:text-slate-500">{countdown > 0 ? `Resend code in ${formatWait(countdown)}` : "Resend code"}</button>
      <button type="button" disabled={loading} onClick={() => { setChallengeId(""); setCode(""); setError(""); }} className="w-full text-center text-sm text-slate-600">Use another email</button>
    </> : <form onSubmit={requestCode} className="space-y-5">
      <label htmlFor="otpEmail" className="block text-sm font-semibold text-slate-700">Email address<input id="otpEmail" type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" required placeholder="you@example.com" className="mt-2 h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-[#0b6b4f] focus:ring-4 focus:ring-emerald-600/10" /></label>
      <button disabled={loading || countdown > 0} className="h-12 w-full rounded-xl bg-[#0b6b4f] text-sm font-semibold text-white hover:bg-[#084f3b] disabled:opacity-60">{loading ? "Requesting code…" : countdown > 0 ? `Try again in ${formatWait(countdown)}` : "Send verification code"}</button>
    </form>}
    {error && <div role="alert" className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle size={16} className="shrink-0" />{error}</div>}
    <Link href={ROUTES.LOGIN} className="block text-center text-sm font-semibold text-slate-500 hover:text-[#0b6b4f]">Back to sign in</Link>
  </div>;
}

export default function EmailOtpFlow({ purpose }: { purpose: Purpose }) {
  const [resetToken, setResetToken] = useState("");
  if (resetToken) return <ResetPasswordForm token={resetToken} />;
  return <AuthShell eyebrow={purpose === "recovery" ? "Account recovery" : "Email verification"} title={purpose === "recovery" ? "Reset your password" : "Verify your email"} description={purpose === "recovery" ? "Verify your email with a six-digit code, then choose a new password." : "Enter the code from your email before signing in. Onboarding starts after verification."}><EmailOtpForm purpose={purpose} onResetToken={setResetToken} /></AuthShell>;
}
