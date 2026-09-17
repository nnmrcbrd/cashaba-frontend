"use client";

import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { AlertCircle, ArrowLeft, Check, KeyRound, ShieldCheck } from "lucide-react";
import { ROUTES } from "@/constants";
import { useAuth } from "@/context/Authcontext";
import apiClient from "@/lib/apiClient";
import Sidebar from "@/app/components/ui/sidebar";
import PasswordInput from "@/app/components/auth/PasswordInput";

export default function ChangePasswordPage() {
  const { user, logout } = useAuth();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const validPassword = form.next.length >= 8 && /[A-Za-z]/.test(form.next) && /\d/.test(form.next);
  const signedInWithGoogle = user?.authMethod === "GOOGLE";

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!validPassword) {
      setError("Use at least 8 characters with a letter and a number.");
      return;
    }
    if (form.next !== form.confirm) {
      setError("The new passwords do not match.");
      return;
    }
    if (!signedInWithGoogle && form.current === form.next) {
      setError("Your new password must be different from your current password.");
      return;
    }

    setLoading(true);
    try {
      await apiClient.post("/auth/change-password", {
        currentPassword: signedInWithGoogle ? undefined : form.current,
        newPassword: form.next,
      });
      sessionStorage.setItem("casha_auth_notice", "Password changed successfully. Sign in with your new password.");
      await logout();
    } catch (requestError) {
      setError(axios.isAxiosError<{ message?: string }>(requestError)
        ? requestError.response?.data?.message || "Unable to change the password."
        : "Unable to change the password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#f6f8f7]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-5 py-7 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <Link href={ROUTES.SETTINGS} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#0b6b4f]">
            <ArrowLeft size={16} />
            Back to settings
          </Link>

          <div className="mt-6 grid overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.07)] lg:grid-cols-[0.8fr_1.2fr]">
            <section className="bg-[#073f30] p-7 text-white sm:p-9">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-emerald-200"><KeyRound size={23} /></span>
              <h1 className="mt-6 text-2xl font-semibold tracking-tight">{signedInWithGoogle ? "Set your password" : "Change your password"}</h1>
              <p className="mt-3 text-sm leading-6 text-emerald-100/70">
                {signedInWithGoogle
                  ? "Create a separate Casha-Ba password so you can also sign in using your email."
                  : "After the password is changed, Casha-Ba closes your refresh sessions and asks you to sign in again."}
              </p>
              <div className="mt-8 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-xs leading-5 text-emerald-100/75">
                <ShieldCheck className="mt-0.5 shrink-0 text-emerald-300" size={17} />
                {signedInWithGoogle
                  ? "Google never shares your Google password with Casha-Ba. Choose a new, separate password here."
                  : "Never reuse your email password or share your Casha-Ba password with anyone."}
              </div>
            </section>

            <section className="p-6 sm:p-9">
              <form onSubmit={handleSubmit} className="space-y-5">
                {!signedInWithGoogle && (
                  <PasswordInput id="currentPassword" name="current" label="Current password" value={form.current} onChange={handleChange} autoComplete="current-password" />
                )}
                <PasswordInput id="nextPassword" name="next" label="New password" value={form.next} onChange={handleChange} autoComplete="new-password" />
                <PasswordInput id="confirmPassword" name="confirm" label="Confirm new password" value={form.confirm} onChange={handleChange} autoComplete="new-password" />

                <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                  <p className={`flex items-center gap-2 ${validPassword ? "text-emerald-700" : ""}`}><Check size={14} /> At least 8 characters, including a letter and number</p>
                </div>

                {error && (
                  <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 shrink-0" size={16} />
                    {error}
                  </div>
                )}

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                  <Link href={ROUTES.SETTINGS} className="flex h-11 items-center justify-center rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</Link>
                  <button type="submit" disabled={loading} className="h-11 rounded-xl bg-[#0b6b4f] px-6 text-sm font-semibold text-white hover:bg-[#084f3b] disabled:opacity-60">
                    {loading ? "Updating..." : signedInWithGoogle ? "Set password" : "Update password"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
