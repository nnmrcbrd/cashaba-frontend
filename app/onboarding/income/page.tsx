"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";
import { incomeSetupService } from "@/services/incomeSetupService";

export default function OnboardingIncomePage() {
  const router = useRouter();
  const [income, setIncome] = useState("");
  const [period, setPeriod] = useState<"Weekly" | "Monthly">("Monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFinish(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await incomeSetupService.saveIncomeSetup(
        parseFloat(income),
        period.toLowerCase()
      );
      router.push(ROUTES.ONBOARDING_RECURRING);
    } catch (err) {
      console.error("Failed to save income setup:", err);
      setError("Failed to save income. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#eff2f0] px-4 font-sans">
      <form
        onSubmit={handleFinish}
        className="w-full max-w-lg rounded-[28px] bg-white p-10 shadow-lg border border-gray-100"
      >
        <h1 className="mb-8 text-2xl font-bold text-gray-900 tracking-tight">Get started on Casha- Ba</h1>

        <label className="block text-xs font-semibold text-gray-700 mb-3">
          Income / Allowance
        </label>

        <div className="relative mb-8">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-800">₱</span>
          <input
            className="w-full border border-gray-400 pl-10 pr-4 py-6 text-xl font-bold text-gray-900 focus:outline-none focus:border-emerald-600 rounded-sm"
            type="number"
            placeholder="0.00"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-6 mb-10">
          <button
            type="button"
            onClick={() => setPeriod("Weekly")}
            className={`py-8 rounded-sm text-sm font-semibold transition border ${
              period === "Weekly"
                ? "bg-[#ffc2c7] border-red-300 text-gray-900 shadow-sm"
                : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
          >
            Weekly
          </button>

          <button
            type="button"
            onClick={() => setPeriod("Monthly")}
            className={`py-8 rounded-sm text-sm font-semibold transition border ${
              period === "Monthly"
                ? "bg-[#9eb7e5] border-blue-400 text-gray-900 shadow-sm"
                : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
          >
            Monthly
          </button>
        </div>

        {error && <p className="mb-4 text-center text-xs text-red-600 font-medium">{error}</p>}

        <div className="text-center">
          <button
            type="submit"
            disabled={loading}
            className="w-64 rounded-full bg-[#b9e7cf] hover:bg-[#a6dec0] disabled:opacity-50 border border-emerald-300 text-gray-900 font-semibold py-3.5 text-sm shadow-sm transition-all duration-200 cursor-pointer mx-auto block"
          >
            {loading ? "Saving..." : "Confirm Income"}
          </button>
        </div>
      </form>
    </div>
  );
}