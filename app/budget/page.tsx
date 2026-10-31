"use client";
import { ValidatedForm, ValidatedInput } from "@/app/components/ui/ValidatedForm";

import { useState, useEffect } from "react";
import Sidebar from "../components/ui/sidebar";
import apiClient from "@/lib/apiClient";
import { incomeSetupService, SavingsGoal } from "@/services/incomeSetupService";
import SavingsGoalCard from "../components/SavingsGoalCard";
import WalletSelector from "../components/WalletSelector";
import { CATEGORIES } from "@/constants";

interface CategoryBreakdown {
  category: string;
  icon: string;
  allocated: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: "UNSET" | "NORMAL" | "WARNING_80" | "EXCEEDED_100";
}

interface BudgetResponse {
  configured: boolean;
  month: number;
  year: number;
  targetAmount: number;
  amountSpent: number;
  remaining: number;
  spentPct: number;
  overallStatus: "NOT_CONFIGURED" | "NORMAL" | "WARNING_80" | "EXCEEDED_100";
  categoryBreakdown: CategoryBreakdown[];
}

export default function BudgetPage() {
  const [tab, setTab] = useState<"budget" | "goals">("budget");
  const [budgetData, setBudgetData] = useState<BudgetResponse | null>(null);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTarget, setNewTarget] = useState("");
  const [updating, setUpdating] = useState(false);
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  const [categoryLimits, setCategoryLimits] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  // Modals for Savings Goals
  const [addGoalModalOpen, setAddGoalModalOpen] = useState(false);
  const [depositModalGoal, setDepositModalGoal] = useState<SavingsGoal | null>(null);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [bRes, gRes] = await Promise.all([
          apiClient.get(`/budget?month=${Number(selectedMonth.slice(5))}&year=${Number(selectedMonth.slice(0, 4))}`),
          incomeSetupService.getSavingsGoals(),
        ]);
        setBudgetData(bRes.data);
        setNewTarget(bRes.data.targetAmount?.toString() || "");
        setGoals(gRes);
        setCategoryLimits(Object.fromEntries((bRes.data.categoryBreakdown || []).map((item: CategoryBreakdown) => [item.category, String(item.allocated || "")])));
      } catch (err) {
        console.error("Failed to load budget/goals data", err);
      } finally {
        setLoading(false);
      }
    }
    void loadInitialData();
  }, [selectedMonth]);

  async function handleUpdateBudget(e?: React.FormEvent) {
    e?.preventDefault();
    if (!newTarget) return;
    try {
      setUpdating(true);
      const month = Number(selectedMonth.slice(5));
      const year = Number(selectedMonth.slice(0, 4));
      await apiClient.put("/budget", { targetAmount: Number(newTarget), month, year, categories: Object.entries(categoryLimits).filter(([, value]) => Number(value) >= 0).map(([category, value]) => ({ category, limitAmount: Number(value) })) });
      const res = await apiClient.get(`/budget?month=${month}&year=${year}`);
      setBudgetData(res.data);
      setMessage("Budget and category limits saved.");
    } catch (err) {
      console.error("Failed to update budget", err);
    } finally {
      setUpdating(false);
    }
  }

  async function handleCreateGoal(data: { name: string; targetAmount: number; monthlyAllocation: number }) {
    try {
      await incomeSetupService.addSavingsGoal(data.name, data.targetAmount, data.monthlyAllocation);
      setAddGoalModalOpen(false);
      const updated = await incomeSetupService.getSavingsGoals();
      setGoals(updated);
    } catch (err) {
      console.error("Failed to add savings goal", err);
    }
  }

  async function handleDeposit(goalId: string, addAmount: number, walletId: string) {
    try {
      await incomeSetupService.updateSavingsGoal(goalId, { addAmount, walletId });
      setDepositModalGoal(null);
      const updated = await incomeSetupService.getSavingsGoals();
      setGoals(updated);
    } catch (err) {
      console.error("Failed to add deposit", err);
    }
  }

  async function copyPrevious() {
    const month = Number(selectedMonth.slice(5));
    const year = Number(selectedMonth.slice(0, 4));
    try {
      await apiClient.post("/budget/copy-previous", { month, year });
      const res = await apiClient.get(`/budget?month=${month}&year=${year}`);
      setBudgetData(res.data);
      setNewTarget(String(res.data.targetAmount || ""));
      setCategoryLimits(Object.fromEntries((res.data.categoryBreakdown || []).map((item: CategoryBreakdown) => [item.category, String(item.allocated || "")])));
      setMessage("Previous month’s plan copied.");
    } catch { setMessage("There is no previous-month budget to copy."); }
  }

  async function handleDeleteGoal(goalId: string) {
    if (!confirm("Are you sure you want to delete this savings goal?")) return;
    try {
      await incomeSetupService.deleteSavingsGoal(goalId);
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
    } catch (err) {
      console.error("Failed to delete goal", err);
    }
  }

  const spentPct = budgetData?.spentPct || 0;
  const overallStatus = budgetData?.overallStatus || "NORMAL";

  return (
    <div className="flex min-h-screen bg-[#f7f9f8]">
      <Sidebar />
      <main className="app-main">
        {/* Header */}
        <div className="app-page-header mb-6 flex flex-col gap-4 border-b border-gray-200/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1>Budget & Goals</h1>
            <p className="text-xs text-gray-500 mt-1">Set spending limits and track mandatory savings commitments.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700" />
            <button type="button" onClick={() => void copyPrevious()} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700">Copy previous month</button>
          </div>
          {tab === "goals" && (
            <button
              onClick={() => setAddGoalModalOpen(true)}
              className="bg-[#186849] hover:bg-[#13543b] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition"
            >
              + New Savings Goal
            </button>
          )}
        </div>
        {message && <p className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">{message}</p>}

        {/* Tab Switcher */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {(["budget", "goals"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-5 py-2 text-xs font-bold capitalize transition shadow-sm ${tab === t
                  ? "bg-[#186849] text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
            >
              {t === "budget" ? "Monthly Budget & Categories" : "Savings Goals"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-gray-400">Loading budget intelligence data...</div>
        ) : tab === "budget" ? (
          <div className="space-y-6 max-w-4xl">
            {/* Overall Status Alert Banners */}
            {overallStatus === "EXCEEDED_100" && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center gap-3 text-xs text-red-800 font-semibold">
                <span>🚨</span>
                <span><strong>Budget Exceeded Alert:</strong> You have reached 100% of your total monthly limit! Safe-to-Spend has been adjusted.</span>
              </div>
            )}
            {overallStatus === "WARNING_80" && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3 text-xs text-amber-800 font-semibold">
                <span>⚠️</span>
                <span><strong>Budget Warning Alert:</strong> You have spent over 80% of your monthly budget limit. Watch your spending!</span>
              </div>
            )}

            {/* Overall Monthly Budget Card */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-900">Overall Monthly Budget</h2>
                <span className="text-xs font-semibold text-gray-500">
                  {spentPct}% Used
                </span>
              </div>

              <div className="flex justify-between text-xs font-semibold text-gray-700 mb-2">
                <span>Spent: ₱{(budgetData?.amountSpent || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                <span>Target: ₱{(budgetData?.targetAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100 mb-3">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${spentPct >= 100 ? "bg-red-500" : spentPct >= 80 ? "bg-amber-500" : "bg-emerald-600"
                    }`}
                  style={{ width: `${spentPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Remaining: <strong className="text-emerald-700">₱{(budgetData?.remaining || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>
                <span className="text-[11px] italic">Resets monthly</span>
              </div>
            </div>

            {/* Category Breakdown Section */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-4">Category Spending Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(budgetData?.categoryBreakdown || []).map((cat) => (
                  <div key={cat.category} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cat.icon}</span>
                        <span className="text-xs font-bold text-gray-800">{cat.category}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cat.status === "EXCEEDED_100"
                          ? "bg-red-100 text-red-700"
                          : cat.status === "WARNING_80"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}>
                        {cat.status === "UNSET" ? "No limit set" : `${cat.percentage}%`}
                      </span>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 my-2">
                      <div
                        className={`h-full rounded-full ${cat.status === "EXCEEDED_100"
                            ? "bg-red-500"
                            : cat.status === "WARNING_80"
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-gray-500 mt-2">
                      <span>Spent: ₱{cat.spent.toLocaleString()}</span>
                      <span>Allocated: ₱{cat.allocated.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Target Budget Form */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm max-w-md">
              <h3 className="mb-2 text-xs font-bold text-gray-800">Update Target Monthly Budget</h3>
              <ValidatedForm onSubmit={handleUpdateBudget} className="min-w-0">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
                <ValidatedInput
                  type="number"
                  className="min-w-0 flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="New monthly target (₱)"
                  min="0.01" step="0.01" max="999999999999.99"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  disabled={updating}
                  className="bg-[#186849] hover:bg-[#13543b] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition"
                >
                  {updating ? "Saving..." : "Update"}
                </button>
              </div>
              <div className="mt-5 border-t border-gray-100 pt-4">
                <h4 className="text-xs font-bold text-gray-800">Planned category limits</h4>
                <p className="mt-1 text-[10px] text-gray-500">Set your own limits</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {CATEGORIES.EXPENSE.map((category) => <label key={category} className="text-[10px] font-semibold text-gray-600">{category}<ValidatedInput aria-label={`${category} limit`} type="number" min="0" max="999999999999.99" step="0.01" value={categoryLimits[category] || ""} onChange={(event) => setCategoryLimits((current) => ({ ...current, [category]: event.target.value }))} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-xs" placeholder="0.00" /></label>)}
                </div>
                <button type="submit" disabled={updating} className="mt-4 w-full rounded-xl bg-emerald-700 py-2.5 text-xs font-bold text-white disabled:opacity-50">Save budget and category limits</button>
              </div>
              </ValidatedForm>
            </div>
          </div>
        ) : (
          /* Savings Goals Tab */
          <div>
            {goals.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center max-w-md mx-auto">
                <p className="text-3xl mb-2">🎯</p>
                <h3 className="text-sm font-bold text-gray-800 mb-1">No Savings Goals Yet</h3>
                <p className="text-xs text-gray-500 mb-4">Create mandatory savings allocations like an Emergency Fund or Vacation Fund.</p>
                <button
                  onClick={() => setAddGoalModalOpen(true)}
                  className="bg-[#186849] text-white px-5 py-2.5 rounded-xl text-xs font-semibold"
                >
                  + Add Savings Goal
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {goals.map((g) => (
                  <SavingsGoalCard
                    key={g.id}
                    goal={g}
                    onDeposit={(goal) => setDepositModalGoal(goal)}
                    onDelete={handleDeleteGoal}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add Savings Goal Modal */}
      {addGoalModalOpen && (
        <AddGoalModal onClose={() => setAddGoalModalOpen(false)} onSave={handleCreateGoal} />
      )}

      {/* Add Funds/Deposit Modal */}
      {depositModalGoal && (
        <DepositModal goal={depositModalGoal} onClose={() => setDepositModalGoal(null)} onSave={handleDeposit} />
      )}
    </div>
  );
}

function AddGoalModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (data: { name: string; targetAmount: number; monthlyAllocation: number }) => void;
}) {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [monthlyAllocation, setMonthlyAllocation] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      name: name.trim(),
      targetAmount: Number(targetAmount),
      monthlyAllocation: Number(monthlyAllocation || 0),
    });
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 px-4 z-50">
      <ValidatedForm onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg text-xs">
        <h2 className="mb-4 text-sm font-bold text-gray-900">Add Savings Goal</h2>

        <label className="mb-1 block font-semibold text-gray-700">Goal Name</label>
        <ValidatedInput
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="e.g. Emergency Fund, New Laptop"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <label className="mb-1 block font-semibold text-gray-700">Target Amount (₱)</label>
        <ValidatedInput
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          type="number"
          placeholder="50000"
          min="0.01" max="999999999999.99" step="0.01"
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
          required
        />

        <label className="mb-1 block font-semibold text-gray-700">Monthly Allocation (₱)</label>
        <ValidatedInput
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-6 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          type="number"
          placeholder="2000 (Deducted from Safe-to-Spend)"
          min="0" max="999999999999.99" step="0.01"
          value={monthlyAllocation}
          onChange={(e) => setMonthlyAllocation(e.target.value)}
        />

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2 font-semibold text-gray-600">
            Cancel
          </button>
          <button type="submit" className="flex-1 bg-[#186849] hover:bg-[#13543b] text-white rounded-xl py-2 font-semibold">
            Save Goal
          </button>
        </div>
      </ValidatedForm>
    </div>
  );
}

function DepositModal({
  goal,
  onClose,
  onSave,
}: {
  goal: SavingsGoal;
  onClose: () => void;
  onSave: (goalId: string, amount: number, walletId: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [walletId, setWalletId] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || !walletId) return;
    onSave(goal.id, Number(amount), walletId);
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 px-4 z-50">
      <ValidatedForm onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg text-xs">
        <h2 className="mb-1 text-sm font-bold text-gray-900">Add Funds to &quot;{goal.name}&quot;</h2>
        <p className="text-gray-500 text-[11px] mb-4">Current saved: ₱{goal.currentAmount.toLocaleString()}</p>

        <label className="mb-1 block font-semibold text-gray-700">Deposit Amount (₱)</label>
        <ValidatedInput
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 mb-6 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
          type="number"
          placeholder="1000"
          min="0.01" max="999999999999.99" step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <div className="mb-6"><WalletSelector value={walletId} onChange={setWalletId} label="Move funds from" /></div>

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 font-semibold text-gray-600">
            Cancel
          </button>
          <button type="submit" disabled={!walletId} className="flex-1 bg-[#186849] hover:bg-[#13543b] disabled:opacity-50 text-white rounded-xl py-2.5 font-semibold">
            Confirm Deposit
          </button>
        </div>
      </ValidatedForm>
    </div>
  );
}
