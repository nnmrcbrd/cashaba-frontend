"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";
import { useAuth } from "@/context/Authcontext";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fullName = `${firstName} ${lastName}`.trim();
    const ok = await signup(fullName, email, password);
    setLoading(false);
    if (ok) {
      router.push(ROUTES.ONBOARDING_ROLE);
    } else {
      setError("Registration failed. Please make sure the email is unique.");
    }
  }

  return (
    <div className="min-h-screen bg-[#eef2ef] flex flex-col font-sans">
      {/* Top Banner Tag */}
      <div className="bg-[#dcdfdc] px-8 py-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
        SIGN UP
      </div>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl border border-gray-200/80 shadow-lg">
          <h1 className="text-xl font-bold text-gray-900 mb-6">
            Get started on Casha- Ba
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Name</label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
                <input
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Gender</label>
              <select
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-xs text-gray-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                required
              >
                <option value="" disabled>Select your gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
              <input
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
              <input
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
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
                {loading ? "Submitting..." : "Submit"}
              </button>
            </div>

            <div className="text-center pt-2">
              <Link href={ROUTES.LOGIN} className="text-xs text-gray-500 hover:text-gray-700">
                Already have an account? <span className="text-emerald-600 font-semibold underline">Log in</span>
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}