"use client";

import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { AlertCircle, ArrowRight, CheckCircle2, TerminalSquare } from "lucide-react";
import { ROUTES } from "@/constants";
import apiClient from "@/lib/apiClient";
import AuthShell from "@/app/components/auth/AuthShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [developmentHint, setDevelopmentHint] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.post("/auth/forgot-password", { email });
      setDevelopmentHint(Boolean(response.data.developmentHint));
      setSubmitted(true);
    } catch (requestError) {
      setError(axios.isAxiosError<{ message?: string }>(requestError)
        ? requestError.response?.data?.message || "Unable to process the request."
        : "Unable to process the request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Account recovery"
      title={submitted ? "Check the next step" : "Reset your password"}
      description={submitted
        ? "For security, the response is the same whether or not an account exists."
        : "Enter the email address connected to your Casha-Ba account."}
    >
      {submitted ? (
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
            <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
            <p>If an account exists for <strong>{email}</strong>, a password-reset request has been created.</p>
          </div>
          {developmentHint && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
              <TerminalSquare className="mt-0.5 shrink-0" size={17} />
              <p><strong>Development mode:</strong> email delivery is not configured. Open the reset link printed in the backend terminal.</p>
            </div>
          )}
          <button type="button" onClick={() => setSubmitted(false)} className="h-11 w-full rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            Try another email
          </button>
          <Link href={ROUTES.LOGIN} className="block text-center text-sm font-semibold text-[#0b6b4f] hover:underline">Return to sign in</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="recoveryEmail" className="mb-1.5 block text-sm font-semibold text-slate-700">Email address</label>
            <input id="recoveryEmail" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" required className="h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none placeholder:text-slate-400 focus:border-[#0b6b4f] focus:ring-4 focus:ring-emerald-600/10" />
          </div>
          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 shrink-0" size={16} />
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0b6b4f] text-sm font-semibold text-white transition hover:bg-[#084f3b] disabled:opacity-60">
            {loading ? "Processing..." : "Continue"}
            {!loading && <ArrowRight size={17} />}
          </button>
          <Link href={ROUTES.LOGIN} className="block text-center text-sm font-semibold text-slate-500 hover:text-[#0b6b4f]">Back to sign in</Link>
        </form>
      )}
    </AuthShell>
  );
}
