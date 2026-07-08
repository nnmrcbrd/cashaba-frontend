"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/Authcontext";
import { ROUTES } from "@/constants";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("anna@example.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (ok) {
      router.push(ROUTES.DASHBOARD);
    } else {
      setError("Invalid email or password.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm"
      >
        <h1 className="mb-1 text-2xl font-bold text-brand-900">Casha-Ba</h1>
        <p className="mb-6 text-sm text-gray-500">Welcome back. Log in to continue.</p>

        <label className="mb-1 block text-xs font-semibold text-gray-600">Email</label>
        <input
          className="input mb-4"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="mb-1 block text-xs font-semibold text-gray-600">Password</label>
        <input
          className="input mb-2"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="mb-4 flex justify-end">
          <Link href={ROUTES.FORGOT_PASSWORD} className="text-xs text-brand-600 hover:underline">
            Forgot password?
          </Link>
        </div>

        {error && <p className="mb-4 text-xs text-red-600">{error}</p>}

        <button className="btn-primary" disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </button>

        <p className="mt-4 text-center text-xs text-gray-500">
          Test credentials: anna@example.com / password
        </p>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link href={ROUTES.SIGNUP} className="font-semibold text-brand-600 hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}