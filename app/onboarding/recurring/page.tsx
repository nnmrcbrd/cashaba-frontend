"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";
import { incomeSetupService } from "@/services/incomeSetupService";

interface ExpenseItem {
  id: string;
  name: string;
  amount: number;
}

const PRESETS = [
  { name: "House Rent", icon: "🏠" },
  { name: "Electricity Bill", icon: "⚡" },
  { name: "WiFi / Internet", icon: "📶" },
  { name: "Water Bill", icon: "💧" },
  { name: "Streaming / Subs", icon: "📺" },
  { name: "Phone / Mobile", icon: "📱" },
];

export default function OnboardingRecurringPage() {
  const router = useRouter();

  const [items, setItems] = useState<ExpenseItem[]>([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleAddExpense(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!name.trim() || !amount || parseFloat(amount) <= 0) return;

    const newItem: ExpenseItem = {
      id: Date.now().toString(),
      name: name.trim(),
      amount: parseFloat(amount),
    };

    setItems((prev) => [...prev, newItem]);
    setName("");
    setAmount("");
  }

  function handleSelectPreset(presetName: string) {
    setName(presetName);
  }

  function handleRemoveItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleContinue() {
    setError("");
    setLoading(true);

    try {
      // Save all added recurring expenses to backend
      for (const item of items) {
        await incomeSetupService.addFixedExpense(item.name, item.amount);
      }
      router.push(ROUTES.ONBOARDING_BUDGET);
    } catch (err) {
      console.error("Failed to save recurring expenses:", err);
      setError("Failed to save recurring expenses. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSkip() {
    router.push(ROUTES.ONBOARDING_BUDGET);
  }

  const totalRecurring = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#eff2f0] px-4 py-8 font-sans">
      <div className="w-full max-w-lg rounded-[28px] bg-white p-8 sm:p-10 shadow-lg border border-gray-100">
        {/* Header bar */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider">
            Step 3 of 4
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
          Recurring Expenses
        </h1>
        <p className="mb-6 text-xs text-gray-600">
          Add your mandatory weekly or monthly bills, rent, and subscriptions.
        </p>

        {/* Preset chips */}
        <div className="mb-6">
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">
            Quick Suggestions
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => handleSelectPreset(p.name)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition flex items-center gap-1.5 ${
                  name === p.name
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-emerald-50 hover:border-emerald-300"
                }`}
              >
                <span>{p.icon}</span>
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Add item form */}
        <form onSubmit={handleAddExpense} className="space-y-3 mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-200/80">
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
              Expense / Bill Name
            </label>
            <input
              className="w-full bg-white border border-gray-300 px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-emerald-600 rounded-lg transition"
              type="text"
              placeholder="e.g. Electric Bill, Rent, Spotify"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-600">₱</span>
              <input
                className="w-full bg-white border border-gray-300 pl-7 pr-3 py-2.5 text-xs font-semibold text-gray-900 focus:outline-none focus:border-emerald-600 rounded-lg transition"
                type="number"
                placeholder="1,500.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="any"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleAddExpense()}
            disabled={!name.trim() || !amount}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-semibold py-2.5 text-xs rounded-lg transition shadow-sm"
          >
            + Add Expense to List
          </button>
        </form>

        {/* List of Added Recurring Expenses */}
        {items.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-800">Added Expenses ({items.length})</span>
              <span className="text-xs font-extrabold text-emerald-700">
                Total: ₱{totalRecurring.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <ul className="divide-y divide-gray-100 max-h-40 overflow-y-auto pr-1">
              {items.map((item) => (
                <li key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-800">{item.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-red-600">
                      ₱{item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-gray-400 hover:text-red-600 text-sm font-bold"
                      title="Remove expense"
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <p className="mb-4 text-center text-xs text-red-600 font-medium">{error}</p>
        )}

        <div className="text-center">
          <button
            type="button"
            onClick={handleContinue}
            disabled={loading}
            className="w-full rounded-full bg-[#186849] hover:bg-[#13543b] disabled:opacity-50 text-white font-semibold py-3.5 text-sm shadow-md transition-all duration-200 cursor-pointer block"
          >
            {loading ? "Saving..." : "Next: Budget & Goals →"}
          </button>
        </div>
      </div>
    </div>
  );
}
