"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";

export default function OnboardingIncomePage() {
  const router = useRouter();
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [budgetLimit, setBudgetLimit] = useState("");
  const [alertsOn, setAlertsOn] = useState(true);

  function handleFinish(e: React.FormEvent) {
    e.preventDefault();
    // Replace with a real "save onboarding data" API call when ready.
    router.push(ROUTES.DASHBOARD);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 px-4">
      <form
        onSubmit={handleFinish}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm"
      >
        <p className="mb-1 text-xs font-semibold text-brand-600">Step 2 of 2</p>
        <h1 className="mb-1 text-2xl font-bold text-brand-900">Set up your budget</h1>
        <p className="mb-6 text-sm text-gray-500">
          We&apos;ll use this to give you a monthly spending picture.
        </p>

        <label className="mb-1 block text-xs font-semibold text-gray-600">
          Monthly income
        </label>
        <input
          className="input mb-4"
          type="number"
          placeholder="e.g. 45000"
          value={monthlyIncome}
          onChange={(e) => setMonthlyIncome(e.target.value)}
          required
        />

        <label className="mb-1 block text-xs font-semibold text-gray-600">
          Monthly spending limit
        </label>
        <input
          className="input mb-4"
          type="number"
          placeholder="e.g. 30000"
          value={budgetLimit}
          onChange={(e) => setBudgetLimit(e.target.value)}
          required
        />

        <label className="mb-6 flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={alertsOn}
            onChange={(e) => setAlertsOn(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand-600"
          />
          Notify me when I&apos;m close to my budget limit
        </label>

        <button className="btn-primary">Finish setup</button>
      </form>
    </div>
  );
}