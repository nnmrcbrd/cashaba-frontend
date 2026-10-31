"use client";
import { ValidatedForm, ValidatedInput } from "@/app/components/ui/ValidatedForm";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Goal, Gauge } from "lucide-react";
import { ROUTES } from "@/constants";
import apiClient from "@/lib/apiClient";
import { incomeSetupService } from "@/services/incomeSetupService";
import OnboardingShell, {
  onboardingInputClass,
  onboardingPrimaryButtonClass,
} from "@/app/components/onboarding/OnboardingShell";
import { useAuth } from "@/context/Authcontext";
import { dashboardSafeToSpend } from "@/lib/dashboardMetrics";

export default function OnboardingBudgetPage() {
  const router = useRouter();
  const [budgetLimit, setBudgetLimit] = useState("");
  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [monthlyAllocation, setMonthlyAllocation] = useState("");
  const [existingGoalId, setExistingGoalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [review, setReview] = useState({ income: 0, obligations: 0, safeToSpend: 0 });
  const { user, refreshUser } = useAuth();
  const suggestedGoal = user?.role?.includes("Student") ? "Tuition or school expenses" : user?.role?.includes("Married") ? "Household emergency fund" : user?.role?.includes("Freelance") ? "Income buffer" : "Emergency fund";

  useEffect(() => {
    let active = true;
    Promise.all([
      incomeSetupService.getIncomeSetup(),
      incomeSetupService.getFixedExpenses(),
      incomeSetupService.getSavingsGoals(),
      apiClient.get("/budget"),
    ]).then(([setup, obligations, goals, budget]) => {
      if (!active) return;
      setReview({ income: setup.setup?.totalIncome || 0, obligations: obligations.reduce((sum, item) => sum + item.amount, 0), safeToSpend: dashboardSafeToSpend(setup.setup, setup.breakdown ?? null, setup.safeToSpend).safeToSpend });
      if (budget.data.configured) setBudgetLimit(String(budget.data.targetAmount));
      const goal = goals[0];
      if (goal) {
        setExistingGoalId(goal.id);
        setGoalName(goal.name);
        setTargetAmount(String(goal.targetAmount));
        setMonthlyAllocation(goal.monthlyAllocation ? String(goal.monthlyAllocation) : "");
      }
    }).catch(() => setError("Unable to load your existing plan. You can retry or continue without changing it."));
    return () => { active = false; };
  }, []);

  async function handleFinish(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (budgetLimit && Number.parseFloat(budgetLimit) > 0) {
        await apiClient.put("/budget", {
          targetAmount: Number.parseFloat(budgetLimit),
        });
      }

      if (goalName.trim() && targetAmount && Number.parseFloat(targetAmount) > 0) {
        const goal = {
          name: goalName.trim(),
          targetAmount: Number.parseFloat(targetAmount),
          monthlyAllocation: monthlyAllocation ? Number.parseFloat(monthlyAllocation) : 0,
        };
        if (existingGoalId) await incomeSetupService.updateSavingsGoal(existingGoalId, goal);
        else {
          const created = await incomeSetupService.addSavingsGoal(goal.name, goal.targetAmount, goal.monthlyAllocation);
          setExistingGoalId(created.goal.id);
        }
      }

      await apiClient.patch("/users/me/onboarding", { step: 5, complete: true });
      await refreshUser();
      router.push(ROUTES.DASHBOARD);
    } catch (reason) {
      console.error("Failed to save budget and goals setup:", reason);
      setError("Unable to save your budget settings. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function finishWithoutPlan() {
    setError("");
    setLoading(true);
    try {
      await apiClient.patch("/users/me/onboarding", { step: 5, complete: true });
      await refreshUser();
      router.push(ROUTES.DASHBOARD);
    } catch (reason) {
      console.error("Failed to complete onboarding:", reason);
      setError("Unable to complete onboarding. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <OnboardingShell
      step={4}
      title="Set a budget and first goal"
      description="Create a spending ceiling and, if useful, one savings target. Both values can be changed after onboarding."
      asideTitle="Turn your baseline into a practical plan."
      asideDescription="A budget sets a spending boundary. A savings allocation reserves part of your income before Safe-to-Spend is calculated."
      onBack={() => router.push(ROUTES.ONBOARDING_RECURRING)}
      onSkip={() => void finishWithoutPlan()}
    >
      <ValidatedForm onSubmit={handleFinish} className="space-y-5">
        <section className="grid grid-cols-3 gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center"><div><p className="text-[10px] font-bold uppercase text-emerald-700">Income</p><p className="mt-1 text-sm font-extrabold text-slate-900">₱{review.income.toLocaleString()}</p></div><div><p className="text-[10px] font-bold uppercase text-amber-700">Obligations</p><p className="mt-1 text-sm font-extrabold text-slate-900">₱{review.obligations.toLocaleString()}</p></div><div><p className="text-[10px] font-bold uppercase text-blue-700">Remaining</p><p className="mt-1 text-sm font-extrabold text-slate-900">₱{review.safeToSpend.toLocaleString()}</p></div>{review.obligations > review.income && <p className="col-span-3 mt-2 rounded-lg bg-red-50 p-2 text-xs font-semibold text-red-700">Your obligations exceed your configured income. Reduce commitments before finishing.</p>}</section>
        <section className="rounded-2xl border border-slate-200 p-5">
          <div className="flex gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
              <Gauge size={19} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Monthly spending limit</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">The maximum total you plan to spend during a month.</p>
            </div>
          </div>
          <label htmlFor="budget-limit" className="sr-only">Monthly spending limit</label>
          <div className="relative mt-4">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base font-semibold text-emerald-800">₱</span>
            <ValidatedInput
              id="budget-limit"
              className={`${onboardingInputClass} pl-10 text-base font-semibold`}
              type="number"
              inputMode="decimal"
              placeholder="20,000.00"
              value={budgetLimit}
              onChange={(event) => setBudgetLimit(event.target.value)}
              min="0"
              step="0.01"
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 p-5">
          <div className="flex gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700">
              <Goal size={19} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                First savings goal <span className="font-medium text-slate-400">(optional)</span>
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">Based on your role, a useful starting point could be: {suggestedGoal}.</p>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="goal-name" className="text-xs font-semibold text-slate-700">Goal name</label>
              <ValidatedInput
                id="goal-name"
                className={`${onboardingInputClass} mt-2`}
                type="text"
                placeholder={`e.g. ${suggestedGoal}`}
                value={goalName}
                required={Boolean(targetAmount || monthlyAllocation)}
                onChange={(event) => setGoalName(event.target.value)}
                maxLength={80}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <CurrencyField
                id="target-amount"
                required={Boolean(goalName.trim() || monthlyAllocation)}
                min="0.01"
                label="Target amount"
                placeholder="10,000.00"
                value={targetAmount}
                onChange={setTargetAmount}
              />
              <CurrencyField
                id="monthly-allocation"
                label="Monthly set-aside"
                placeholder="1,000.00"
                value={monthlyAllocation}
                onChange={setMonthlyAllocation}
              />
            </div>
          </div>
        </section>

        {error && (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-700">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className={onboardingPrimaryButtonClass}>
          {loading ? "Completing setup..." : "Finish and open dashboard"}
          {!loading && <ArrowRight size={17} />}
        </button>
      </ValidatedForm>
    </OnboardingShell>
  );
}

function CurrencyField({
  id,
  label,
  placeholder,
  value,
  onChange,
  required = false,
  min = '0',
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  min?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-xs font-semibold text-slate-700">{label}</label>
      <div className="relative mt-2">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-emerald-800">₱</span>
        <ValidatedInput
          id={id}
          className={`${onboardingInputClass} pl-8`}
          type="number"
          inputMode="decimal"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          min={min}
          max="999999999999.99"
          required={required}
          step="0.01"
        />
      </div>
    </div>
  );
}
