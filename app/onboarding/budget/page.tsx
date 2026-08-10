"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";
import apiClient from "@/lib/apiClient";
import { incomeSetupService } from "@/services/incomeSetupService";

export default function OnboardingBudgetPage() {
  const router = useRouter();

  // Monthly Budget limit state
  const [budgetLimit, setBudgetLimit] = useState("");

  // Initial Savings Goal state (optional)
  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [monthlyAllocation, setMonthlyAllocation] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFinish(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Update overall monthly target budget if provided
      if (budgetLimit && parseFloat(budgetLimit) > 0) {
        await apiClient.put("/budget", {
          targetAmount: parseFloat(budgetLimit),
        });
      }

      // 2. Add initial savings goal if name & target amount provided
      if (goalName.trim() && targetAmount && parseFloat(targetAmount) > 0) {
        await incomeSetupService.addSavingsGoal(
          goalName.trim(),
          parseFloat(targetAmount),
          monthlyAllocation ? parseFloat(monthlyAllocation) : 0
        );
      }

      // 3. Complete onboarding -> navigate to Dashboard
      router.push(ROUTES.DASHBOARD);
    } catch (err) {
      console.error("Failed to save budget & goals setup:", err);
      setError("Failed to save budget settings. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSkip() {
    router.push(ROUTES.DASHBOARD);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#eff2f0] px-4 py-8 font-sans">
      <div className="w-full max-w-lg rounded-[28px] bg-white p-8 sm:p-10 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider">
            Step 4 of 4
          </span>
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-semibold text-gray-500 hover:text-gray-800 transition underline"
          >
            Skip for now
          </button>
        </div>

        <h1 className="mb-1 text-2xl font-bold text-gray-900 tracking-tight">
          Budget & Goals Setup
        </h1>
        <p className="mb-6 text-xs text-gray-600">
          Set your overall monthly budget limit and kickstart your first savings goal.
        </p>

        <form onSubmit={handleFinish} className="space-y-6">
          {/* Section 1: Monthly Budget Target */}
          <div className="border-t border-gray-100 pt-4">
            <label className="block text-xs font-bold text-gray-800 uppercase tracking-wide mb-1">
              Monthly Spend Budget Limit
            </label>
            <p className="text-[11px] text-gray-500 mb-3">
              Maximum total amount you plan to spend per month.
            </p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-700">
                ₱
              </span>
              <input
                className="w-full border border-gray-300 pl-10 pr-4 py-3 text-lg font-bold text-gray-900 focus:outline-none focus:border-emerald-600 rounded-lg transition"
                type="number"
                placeholder="20,000.00"
                value={budgetLimit}
                onChange={(e) => setBudgetLimit(e.target.value)}
                min="0"
                step="any"
              />
            </div>
          </div>

          {/* Section 2: Initial Savings Goal (Optional) */}
          <div className="border-t border-gray-100 pt-4">
            <label className="block text-xs font-bold text-gray-800 uppercase tracking-wide mb-1">
              First Savings Goal <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <p className="text-[11px] text-gray-500 mb-3">
              Set a target for emergency fund, gadgets, or travel.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Goal Name
                </label>
                <input
                  className="w-full border border-gray-300 px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-emerald-600 rounded-lg transition"
                  type="text"
                  placeholder="e.g. Emergency Fund"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Target Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-600">₱</span>
                    <input
                      className="w-full border border-gray-300 pl-7 pr-3 py-2.5 text-xs font-semibold text-gray-900 focus:outline-none focus:border-emerald-600 rounded-lg transition"
                      type="number"
                      placeholder="10,000"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      min="0"
                      step="any"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Monthly Set-Aside
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-600">₱</span>
                    <input
                      className="w-full border border-gray-300 pl-7 pr-3 py-2.5 text-xs font-semibold text-gray-900 focus:outline-none focus:border-emerald-600 rounded-lg transition"
                      type="number"
                      placeholder="1,000"
                      value={monthlyAllocation}
                      onChange={(e) => setMonthlyAllocation(e.target.value)}
                      min="0"
                      step="any"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <p className="text-center text-xs text-red-600 font-medium">
              {error}
            </p>
          )}

          <div className="pt-2 text-center">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#186849] hover:bg-[#13543b] disabled:opacity-50 text-white font-semibold py-3.5 text-sm shadow-md transition-all duration-200 cursor-pointer block"
            >
              {loading ? "Completing Setup..." : "Finish & Launch Dashboard 🚀"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
