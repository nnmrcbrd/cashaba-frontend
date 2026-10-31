"use client";
import { ValidatedForm } from "@/app/components/ui/ValidatedForm";

import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { AlertCircle, Check, CheckCircle2 } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { ROUTES } from "@/constants";
import AuthShell from "@/app/components/auth/AuthShell";
import PasswordInput from "@/app/components/auth/PasswordInput";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const validPassword = password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!token) {
      setError("Verify a new email code before resetting your password.");
      return;
    }
    if (!validPassword) {
      setError("Use at least 8 characters with a letter and a number.");
      return;
    }
    if (password !== confirm) {
      setError("The passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await apiClient.post("/auth/reset-password", { token, newPassword: password });
      setCompleted(true);
    } catch (requestError) {
      setError(axios.isAxiosError<{ message?: string }>(requestError)
        ? requestError.response?.data?.message || "Unable to reset the password."
        : "Unable to reset the password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Account recovery"
      title={completed ? "Password updated" : "Choose a new password"}
      description={completed ? "Your previous sessions have been closed for security." : "Create a password you have not used for this account before."}
    >
      {completed ? (
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
            Your password was reset successfully.
          </div>
          <Link href={ROUTES.LOGIN} className="flex h-12 items-center justify-center rounded-xl bg-[#0b6b4f] text-sm font-semibold text-white hover:bg-[#084f3b]">Continue to sign in</Link>
        </div>
      ) : (
        <ValidatedForm onSubmit={handleSubmit} className="space-y-5">
          <PasswordInput id="newPassword" label="New password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" />
          <PasswordInput id="confirmPassword" label="Confirm new password" value={confirm} validate={value => value !== password ? 'Passwords do not match.' : ''} onChange={(event) => setConfirm(event.target.value)} autoComplete="new-password" />
          <p className={`flex items-center gap-2 text-xs ${validPassword ? "text-emerald-700" : "text-slate-500"}`}><Check size={14} /> At least 8 characters with a letter and a number</p>
          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 shrink-0" size={16} />
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} className="h-12 w-full rounded-xl bg-[#0b6b4f] text-sm font-semibold text-white hover:bg-[#084f3b] disabled:opacity-60">
            {loading ? "Updating password..." : "Reset password"}
          </button>
          <Link href={ROUTES.FORGOT_PASSWORD} className="block text-center text-sm font-semibold text-slate-500 hover:text-[#0b6b4f]">Request a new code</Link>
        </ValidatedForm>
      )}
    </AuthShell>
  );
}
