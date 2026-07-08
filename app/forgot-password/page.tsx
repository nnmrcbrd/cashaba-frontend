"use client";

import { useState } from "react";
import Link from "next/link";
import { ROUTES } from "@/constants";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Replace with a real "send reset email" API call when ready.
    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold text-brand-900">Find your account</h1>
        <p className="mb-6 text-sm text-gray-500">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        {sent ? (
          <p className="rounded-lg bg-brand-50 p-3 text-sm text-brand-700">
            If an account exists for {email}, a reset link is on its way.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Email</label>
            <input
              className="input mb-6"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button className="btn-primary">Send reset link</button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-600">
          <Link href={ROUTES.LOGIN} className="font-semibold text-brand-600 hover:underline">
            Back to log in
          </Link>
        </p>
      </div>
    </div>
  );
}