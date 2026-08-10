"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/Authcontext";
import { ROUTES } from "@/constants";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const loggedInUser = await login(email, password);
    setLoading(false);
    if (loggedInUser) {
      if (loggedInUser.accountRole === "ADMIN") {
        router.push(ROUTES.ADMIN_MANAGE_USERS);
      } else {
        router.push(ROUTES.DASHBOARD);
      }
    } else {
      setError("Invalid email or password.");
    }
  }

  return (
    <div className="min-h-screen bg-[#eef2ef] flex flex-col font-sans">
      {/* Top Banner Tag */}
      <div className="bg-[#dcdfdc] px-8 py-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
        USER LOGIN
      </div>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl border border-gray-200/80 shadow-lg">
          <h1 className="text-xl font-bold text-gray-900 mb-6">
            Log into Casha- Ba
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-xs font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <input
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-xs font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-xs text-red-600 font-medium text-center">{error}</p>}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white font-medium py-3 rounded-full text-sm shadow-sm transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </div>

            <div className="text-center py-1">
              <Link
                href={ROUTES.FORGOT_PASSWORD}
                className="text-xs text-gray-400 hover:text-gray-600 transition"
              >
                Forgot Password?
              </Link>
            </div>

            <div>
              <Link
                href={ROUTES.SIGNUP}
                className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white font-medium py-3 rounded-full text-sm shadow-sm transition-all duration-200 block text-center"
              >
                Create new account
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}