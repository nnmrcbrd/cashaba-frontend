"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.next !== form.confirm) {
      setError("New passwords do not match.");
      return;
    }
    setError("");
    setSuccessMsg("Password changed successfully!");
    setTimeout(() => {
      router.push(ROUTES.SETTINGS);
    }, 1500);
  }

  return (
    <div className="min-h-screen bg-[#eef2ef] flex flex-col font-sans">
      {/* Top Banner Tag */}
      <div className="bg-[#dcdfdc] px-8 py-2 text-xs font-bold text-gray-500 uppercase tracking-wide flex justify-between items-center">
        <span>CHANGE PASSWORD</span>
        <Link href={ROUTES.SETTINGS} className="text-gray-500 hover:text-gray-800 text-xs">
          ← Back to Settings
        </Link>
      </div>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl border border-gray-200/80 shadow-lg">
          <h1 className="text-lg font-bold text-gray-900 text-center mb-6">
            Change Password
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                type="password"
                name="current"
                placeholder="Current password (Updated 04/30/2026)"
                value={form.current}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <input
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                type="password"
                name="next"
                placeholder="New Password"
                value={form.next}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <input
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                type="password"
                name="confirm"
                placeholder="Retype new password"
                value={form.confirm}
                onChange={handleChange}
                required
              />
            </div>

            {error && <p className="text-xs text-red-600 font-medium text-center">{error}</p>}
            {successMsg && <p className="text-xs text-emerald-700 font-medium text-center">{successMsg}</p>}

            <div className="pt-4 flex justify-center">
              <button
                type="submit"
                className="w-4/5 bg-[#22c55e] hover:bg-[#16a34a] text-white font-medium py-3 rounded-full text-sm shadow-sm transition-all duration-200 cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}