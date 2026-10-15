import Link from "next/link";
import { ROUTES } from "@/constants";
import type { FixedExpense, IncomeSetup, SavingsGoal } from "@/services/incomeSetupService";

interface DashboardSetupSummaryProps {
  incomeSetup: IncomeSetup | null;
  receivedIncome: number;
  budget: { configured?: boolean; targetAmount: number } | null;
  fixedExpenses: FixedExpense[];
  savingsGoals: SavingsGoal[];
}

const pesos = (amount: number) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);

export default function DashboardSetupSummary({ incomeSetup, receivedIncome, budget, fixedExpenses, savingsGoals }: DashboardSetupSummaryProps) {
  const period = incomeSetup?.incomePeriod === "weekly" ? "week" : "month";

  return (
    <section aria-labelledby="saved-setup-heading" className="mb-6 rounded-2xl border border-emerald-200 bg-white p-5">
      <h2 id="saved-setup-heading" className="text-sm font-bold text-gray-900">Your saved setup</h2>
      <p className="mt-1 text-xs leading-5 text-gray-500">Your income plan, budget, bills and savings targets are saved separately from money received or spent.</p>
      <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <h3 className="text-xs font-semibold text-gray-500">Expected income per {period}</h3>
          <p className="mt-1 text-xl font-bold text-emerald-700">{incomeSetup ? pesos(incomeSetup.totalIncome) : "Not set"}</p>
          <p className="mt-2 text-xs text-gray-500">Received this {period}: <strong className="text-gray-800">{pesos(receivedIncome)}</strong></p>
          <Link href={ROUTES.SETTINGS} className="mt-2 inline-block text-xs font-semibold text-emerald-700 hover:underline">Manage income plan →</Link>
        </div>
        <div>
          <h3 className="text-xs font-semibold text-gray-500">Monthly spending limit</h3>
          <p className="mt-1 text-xl font-bold text-gray-900">{budget && budget.configured !== false ? pesos(budget.targetAmount) : "Not set"}</p>
          <p className="mt-2 text-xs text-gray-500">A budget limit is a spending plan, not a wallet balance.</p>
          <Link href={ROUTES.BUDGET} className="mt-2 inline-block text-xs font-semibold text-emerald-700 hover:underline">Manage budget →</Link>
        </div>
        <div>
          <h3 className="text-xs font-semibold text-gray-500">Saved bills ({fixedExpenses.length})</h3>
          {fixedExpenses.length ? <ul className="mt-2 max-h-36 space-y-2 overflow-y-auto text-xs">
            {fixedExpenses.map(expense => <li key={expense.id}>
              <p className="font-semibold text-gray-800">{expense.name}</p>
              <p className="text-gray-500">{pesos(expense.amount)} · {expense.frequency.toLowerCase().replaceAll("_", " ")}</p>
            </li>)}
          </ul> : <p className="mt-2 text-xs text-gray-500">No bills saved.</p>}
          <Link href={ROUTES.LOANS} className="mt-2 inline-block text-xs font-semibold text-emerald-700 hover:underline">Manage bills →</Link>
        </div>
        <div>
          <h3 className="text-xs font-semibold text-gray-500">Saved savings goals ({savingsGoals.length})</h3>
          {savingsGoals.length ? <ul className="mt-2 max-h-36 space-y-2 overflow-y-auto text-xs">
            {savingsGoals.map(goal => <li key={goal.id}>
              <p className="font-semibold text-gray-800">{goal.name}</p>
              <p className="text-gray-500">Target: {pesos(goal.targetAmount)} · Saved: {pesos(goal.currentAmount)}</p>
              <p className="text-gray-500">Monthly set-aside: {pesos(goal.monthlyAllocation)}</p>
            </li>)}
          </ul> : <p className="mt-2 text-xs text-gray-500">No savings goals saved.</p>}
          <Link href={ROUTES.BUDGET} className="mt-2 inline-block text-xs font-semibold text-emerald-700 hover:underline">Manage goals →</Link>
        </div>
      </div>
      {incomeSetup && receivedIncome === 0 && <p role="note" className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-900">
        Your expected income is saved. No income has been recorded as received this {period}, so it is not yet included in Safe-to-Spend. Wallet balances come from the accounts and money movements you record. <Link href={ROUTES.TRANSACTIONS} className="font-bold underline">Open transactions</Link> when you receive income.
      </p>}
    </section>
  );
}
