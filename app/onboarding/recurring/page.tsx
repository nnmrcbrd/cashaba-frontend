"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Home,
  Plus,
  Smartphone,
  Trash2,
  Tv,
  Wifi,
  Zap,
} from "lucide-react";
import { ROUTES } from "@/constants";
import { incomeSetupService } from "@/services/incomeSetupService";
import OnboardingShell, {
  onboardingInputClass,
  onboardingPrimaryButtonClass,
} from "@/app/components/onboarding/OnboardingShell";

interface ExpenseItem {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  frequency: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
}

const PRESETS: Array<{ name: string; icon: LucideIcon }> = [
  { name: "House rent", icon: Home },
  { name: "Electricity bill", icon: Zap },
  { name: "Wi-Fi / internet", icon: Wifi },
  { name: "Water bill", icon: Droplets },
  { name: "Streaming subscriptions", icon: Tv },
  { name: "Phone / mobile", icon: Smartphone },
];

const ITEMS_PER_PAGE = 3;

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function OnboardingRecurringPage() {
  const router = useRouter();
  const [items, setItems] = useState<ExpenseItem[]>([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [frequency, setFrequency] = useState<ExpenseItem["frequency"]>("MONTHLY");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  function handleAddExpense(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericAmount = Number.parseFloat(amount);
    if (!name.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) return;

    const nextItemCount = items.length + 1;
    setItems((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        amount: numericAmount,
        dueDate,
        frequency,
      },
    ]);
    setCurrentPage(Math.ceil(nextItemCount / ITEMS_PER_PAGE));
    setName("");
    setAmount("");
    setDueDate("");
  }

  async function handleContinue() {
    setError("");
    setLoading(true);
    try {
      for (const item of items) {
        await incomeSetupService.addFixedExpense(item.name, item.amount, item.dueDate || undefined, { frequency: item.frequency });
      }
      router.push(ROUTES.ONBOARDING_BUDGET);
    } catch (reason) {
      console.error("Failed to save recurring expenses:", reason);
      setError("Unable to save your recurring expenses. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const totalRecurring = items.reduce((sum, item) => sum + item.amount, 0);
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const visibleItems = items.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  function removeExpense(id: string) {
    const remainingItems = items.filter((item) => item.id !== id);
    const lastAvailablePage = Math.max(1, Math.ceil(remainingItems.length / ITEMS_PER_PAGE));
    setItems(remainingItems);
    setCurrentPage((page) => Math.min(page, lastAvailablePage));
  }

  return (
    <OnboardingShell
      step={3}
      title="Add recurring obligations"
      description="Record mandatory bills that reduce the amount you can safely spend. Add only expenses you expect to pay regularly."
      asideTitle="Separate obligations from everyday spending."
      asideDescription="Rent, utilities, and recurring bills are reserved before Casha-Ba calculates what remains available."
      onSkip={() => router.push(ROUTES.ONBOARDING_BUDGET)}
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Quick suggestions</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PRESETS.map((preset) => {
            const PresetIcon = preset.icon;
            const active = name === preset.name;
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => setName(preset.name)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                  active
                    ? "border-emerald-700 bg-emerald-700 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50"
                }`}
              >
                <PresetIcon size={14} />
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleAddExpense} className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="expense-name" className="text-xs font-semibold text-slate-700">Expense or bill name</label>
            <input
              id="expense-name"
              className={`${onboardingInputClass} mt-2`}
              type="text"
              placeholder="e.g. Electricity bill"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={80}
            />
          </div>
          <div><label htmlFor="expense-due" className="text-xs font-semibold text-slate-700">Next due date</label><input id="expense-due" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className={`${onboardingInputClass} mt-2`} required /></div>
          <div><label htmlFor="expense-frequency" className="text-xs font-semibold text-slate-700">Frequency</label><select id="expense-frequency" value={frequency} onChange={(event) => setFrequency(event.target.value as ExpenseItem["frequency"])} className={`${onboardingInputClass} mt-2`}><option value="WEEKLY">Weekly</option><option value="MONTHLY">Monthly</option><option value="QUARTERLY">Quarterly</option><option value="YEARLY">Yearly</option></select></div>
          <div>
            <label htmlFor="expense-amount" className="text-xs font-semibold text-slate-700">Amount per period</label>
            <div className="relative mt-2">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-emerald-800">₱</span>
              <input
                id="expense-amount"
                className={`${onboardingInputClass} pl-8`}
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                min="0.01"
                step="0.01"
              />
            </div>
          </div>
        </div>
        <button
          type="submit"
          disabled={!name.trim() || !amount || !dueDate}
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={15} /> Add to recurring expenses
        </button>
      </form>

      {items.length > 0 && (
        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between bg-white px-4 py-3">
            <span className="text-xs font-semibold text-slate-700">{items.length} obligation{items.length === 1 ? "" : "s"} added</span>
            <span className="text-xs font-bold text-emerald-700">{formatCurrency(totalRecurring)} total</span>
          </div>
          <ul className="divide-y divide-slate-100 bg-slate-50/60">
            {visibleItems.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{item.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{formatCurrency(item.amount)} · {item.frequency.toLowerCase()} · due {new Date(`${item.dueDate}T12:00:00`).toLocaleDateString("en-PH")}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeExpense(item.id)}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                  aria-label={`Remove ${item.name}`}
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <nav
              aria-label="Obligations pagination"
              className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3"
            >
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <span className="text-xs font-semibold text-slate-500">
                Page <span className="text-slate-800">{currentPage}</span> of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next <ChevronRight size={14} />
              </button>
            </nav>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-700">
          {error}
        </p>
      )}

      <button type="button" onClick={() => void handleContinue()} disabled={loading} className={`${onboardingPrimaryButtonClass} mt-6`}>
        {loading ? "Saving obligations..." : "Continue to budget & goals"}
        {!loading && <ArrowRight size={17} />}
      </button>
    </OnboardingShell>
  );
}
