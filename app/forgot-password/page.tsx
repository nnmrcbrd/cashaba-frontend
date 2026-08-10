"use client";

import { useState } from "react";
import Link from "next/link";
import { ROUTES } from "@/constants";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-[#eef2ef] flex flex-col font-sans">
      {/* Top Banner Tag */}
      <div className="bg-[#dcdfdc] px-8 py-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
        FORGOT PASSWORD
      </div>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl border border-gray-200/80 shadow-lg">
          <p className="text-xs font-bold text-gray-800 mb-4">Forgot password</p>
          <h1 className="text-sm font-bold text-gray-900 mb-1">Find your account</h1>
          <p className="text-xs text-gray-500 mb-6">Enter your mobile or email</p>

          {sent ? (
            <div className="space-y-4 text-center">
              <p className="rounded-xl bg-emerald-50 p-4 text-xs font-medium text-emerald-800 border border-emerald-200">
                If an account exists for <strong>{email}</strong>, password reset instructions have been sent.
              </p>
              <Link
                href={ROUTES.LOGIN}
                className="inline-block text-xs font-semibold text-emerald-600 hover:underline"
              >
                ← Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-xs font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  type="text"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white font-medium py-3 rounded-full text-sm shadow-sm transition-all duration-200 cursor-pointer"
                >
                  Continue
                </button>
              </div>

              <div className="text-center pt-2">
                <Link href={ROUTES.LOGIN} className="text-xs text-gray-400 hover:text-gray-600 transition">
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}