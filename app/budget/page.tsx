"use client";

import { useState, useEffect } from "react";
import Sidebar from "../components/ui/sidebar";
import apiClient from "@/lib/apiClient";
import { incomeSetupService, SavingsGoal } from "@/services/incomeSetupService";

interface CategoryBreakdown {
  category: string;
  icon: string;
  allocated: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: "NORMAL" | "WARNING_80" | "EXCEEDED_100";
}

interface BudgetResponse {
  month: number;
  year: number;
  targetAmount: number;
  amountSpent: number;
  remaining: number;
  spentPct: number;
  overallStatus: "NORMAL" | "WARNING_80" | "EXCEEDED_100";
  categoryBreakdown: CategoryBreakdown[];
}

export default function BudgetPage() {
  const [tab, setTab] = useState<"budget" | "goals">("budget");
  const [budgetData, setBudgetData] = useState<BudgetResponse | null>(null);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTarget, setNewTarget] = useState("");
  const [updating, setUpdating] = useState(false);

  // Modals for Savings Goals
  const [addGoalModalOpen, setAddGoalModalOpen] = useState(false);
  const [depositModalGoal, setDepositModalGoal] = useState<SavingsGoal | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [bRes, gRes] = await Promise.all([
        apiClient.get("/budget"),
        incomeSetupService.getSavingsGoals(),
      ]);
      setBudgetData(bRes.data);
      setNewTarget(bRes.data.targetAmount?.toString() || "20000");
      setGoals(gRes);
    } catch (err) {
      console.error("Failed to load budget/goals data", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateBudget(e: React.FormEvent) {
    e.preventDefault();
    if (!newTarget) return;
    try {
      setUpdating(true);
      await apiClient.put("/budget", { targetAmount: Number(newTarget) });
      const res = await apiClient.get("/budget");
      setBudgetData(res.data);
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

  async function handleDeposit(goalId: string, addAmount: number) {
    try {
      await incomeSetupService.updateSavingsGoal(goalId, { addAmount });
      setDepositModalGoal(null);
      const updated = await incomeSetupService.getSavingsGoals();
      setGoals(updated);
    } catch (err) {
      console.error("Failed to add deposit", err);
    }
  }

  async function handleToggleComplete(goal: SavingsGoal) {
    try {
      await incomeSetupService.updateSavingsGoal(goal.id, { isCompleted: !goal.isCompleted });
      const updated = await incomeSetupService.getSavingsGoals();
      setGoals(updated);
    } catch (err) {
      console.error("Failed to update goal", err);
    }
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
    <div className="flex min-h-screen bg-[#f7faf8]">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200/60">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">BUDGET & GOALS</h1>
            <p className="text-xs text-gray-500 mt-1">Set spending limits and track mandatory savings commitments.</p>
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

        {/* Tab Switcher */}
        <div className="mb-6 flex gap-2">
          {(["budget", "goals"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-5 py-2 text-xs font-bold capitalize transition shadow-sm ${
                tab === t
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
                <span>Spent: ₱{(budgetData?.amountSpent || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                <span>Target: ₱{(budgetData?.targetAmount || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>

              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100 mb-3">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    spentPct >= 100 ? "bg-red-500" : spentPct >= 80 ? "bg-amber-500" : "bg-emerald-600"
                  }`}
                  style={{ width: `${spentPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Remaining: <strong className="text-emerald-700">₱{(budgetData?.remaining || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</strong></span>
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
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        cat.status === "EXCEEDED_100"
                          ? "bg-red-100 text-red-700"
                          : cat.status === "WARNING_80"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {cat.percentage}%
                      </span>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 my-2">
                      <div
                        className={`h-full rounded-full ${
                          cat.status === "EXCEEDED_100"
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
              <form onSubmit={handleUpdateBudget} className="flex gap-3">
                <input
                  type="number"
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="New monthly target (₱)"
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
              </form>
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
                {goals.map((g) => {
                  const pct = Math.min(100, Math.round((g.currentAmount / (g.targetAmount || 1)) * 100));
                  return (
                    <div key={g.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between relative group">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <span>🎯</span> {g.name}
                          </h3>
                          <button
                            onClick={() => handleDeleteGoal(g.id)}
                            className="text-gray-400 hover:text-red-600 text-xs opacity-0 group-hover:opacity-100 transition"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="flex justify-between text-xs font-semibold text-gray-600 mb-2">
                          <span>₱{g.currentAmount.toLocaleString()} saved</span>
                          <span className="text-emerald-700 font-bold">{pct}%</span>
                        </div>

                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 mb-3">
                          <div
                            className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        <p className="text-[11px] text-gray-500 mb-4">
                          Target: <strong>₱{g.targetAmount.toLocaleString()}</strong>
                          {g.monthlyAllocation > 0 && ` · ₱${g.monthlyAllocation.toLocaleString()}/mo allocation`}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                        <button
                          onClick={() => setDepositModalGoal(g)}
                          className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl py-2 text-xs font-semibold transition"
                        >
                          + Add Funds
                        </button>
                        <button
                          onClick={() => handleToggleComplete(g)}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold transition border ${
                            g.isCompleted
                              ? "bg-gray-100 text-gray-600 border-gray-200"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {g.isCompleted ? "✓ Completed" : "Complete"}
                        </button>
                      </div>
                    </div>
                  );
                })}
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
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg text-xs">
        <h2 className="mb-4 text-sm font-bold text-gray-900">Add Savings Goal</h2>

        <label className="mb-1 block font-semibold text-gray-700">Goal Name</label>
        <input
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="e.g. Emergency Fund, New Laptop"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <label className="mb-1 block font-semibold text-gray-700">Target Amount (₱)</label>
        <input
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          type="number"
          placeholder="50000"
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
          required
        />

        <label className="mb-1 block font-semibold text-gray-700">Monthly Allocation (₱)</label>
        <input
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-6 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          type="number"
          placeholder="2000 (Deducted from Safe-to-Spend)"
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
      </form>
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
  onSave: (goalId: string, amount: number) => void;
}) {
  const [amount, setAmount] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    onSave(goal.id, Number(amount));
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 px-4 z-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg text-xs">
        <h2 className="mb-1 text-sm font-bold text-gray-900">Add Funds to "{goal.name}"</h2>
        <p className="text-gray-500 text-[11px] mb-4">Current saved: ₱{goal.currentAmount.toLocaleString()}</p>

        <label className="mb-1 block font-semibold text-gray-700">Deposit Amount (₱)</label>
        <input
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 mb-6 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
          type="number"
          placeholder="1000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 font-semibold text-gray-600">
            Cancel
          </button>
          <button type="submit" className="flex-1 bg-[#186849] hover:bg-[#13543b] text-white rounded-xl py-2.5 font-semibold">
            Confirm Deposit
          </button>
        </div>
      </form>
    </div>
  );
}