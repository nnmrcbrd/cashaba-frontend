"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, CalendarRange } from "lucide-react";
import { ROUTES } from "@/constants";
import { incomeSetupService } from "@/services/incomeSetupService";
import OnboardingShell, {
  onboardingInputClass,
  onboardingPrimaryButtonClass,
} from "@/app/components/onboarding/OnboardingShell";

export default function OnboardingIncomePage() {
  const router = useRouter();
  const [income, setIncome] = useState("");
  const [period, setPeriod] = useState<"Weekly" | "Monthly">("Monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    incomeSetupService.getIncomeSetup().then(({ setup }) => {
      if (!active || !setup) return;
      setIncome(String(setup.totalIncome));
      setPeriod(setup.incomePeriod.toLowerCase() === "weekly" ? "Weekly" : "Monthly");
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  async function handleFinish(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await incomeSetupService.saveIncomeSetup(
        Number.parseFloat(income),
        period.toLowerCase(),
      );
      router.push(ROUTES.ONBOARDING_RECURRING);
    } catch (reason) {
      console.error("Failed to save income setup:", reason);
      setError("Unable to save your income setup. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <OnboardingShell
      step={2}
      title="Set your income baseline"
      description="Enter your expected income and choose a planning period. Safe-to-Spend uses income you record as received, after subtracting commitments and spending."
      asideTitle="Give every peso a realistic starting point."
      asideDescription="Choose the period that matches how you normally receive or plan your income. Calculations will follow that period."
      onBack={() => router.push(ROUTES.ONBOARDING_ROLE)}
    >
      <form onSubmit={handleFinish}>
        <label htmlFor="income" className="text-xs font-semibold text-slate-700">
          Income or allowance per period
        </label>
        <div className="relative mt-2">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-emerald-800">₱</span>
          <input
            id="income"
            className={`${onboardingInputClass} pl-10 text-lg font-semibold`}
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={income}
            onChange={(event) => setIncome(event.target.value)}
            min="0.01"
            step="0.01"
            required
          />
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Use demonstration values while developing this capstone.
        </p>

        <fieldset className="mt-6">
          <legend className="text-xs font-semibold text-slate-700">Income period</legend>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {[
              { value: "Weekly" as const, description: "Plan Monday to Sunday", icon: CalendarDays },
              { value: "Monthly" as const, description: "Plan by calendar month", icon: CalendarRange },
            ].map((option) => {
              const active = period === option.value;
              const PeriodIcon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPeriod(option.value)}
                  aria-pressed={active}
                  className={`rounded-2xl border p-4 text-left transition ${
                    active
                      ? "border-emerald-600 bg-emerald-50"
                      : "border-slate-200 bg-white hover:border-emerald-300"
                  }`}
                >
                  <PeriodIcon className={active ? "text-emerald-700" : "text-slate-500"} size={20} />
                  <span className="mt-3 block text-sm font-semibold text-slate-900">{option.value}</span>
                  <span className="mt-1 block text-xs text-slate-500">{option.description}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-700">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className={`${onboardingPrimaryButtonClass} mt-7`}>
          {loading ? "Saving income..." : "Continue to obligations"}
          {!loading && <ArrowRight size={17} />}
        </button>
      </form>
    </OnboardingShell>
  );
}
