"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calculator, X } from "lucide-react";
import Sidebar from "../components/ui/sidebar";
import { useAuth } from "@/context/Authcontext";
import { Transaction } from "../types";
import { transactionService } from "@/services/transactionService";
import {
  incomeSetupService,
  IncomeSetup,
  SavingsGoal,
  FixedExpense,
  SafeToSpendBreakdown,
} from "@/services/incomeSetupService";
import { loanService, LoanSummary } from "@/services/loanService";
import apiClient from "@/lib/apiClient";
import { walletService } from "@/services/walletService";
import type { Wallet } from "../types";
import { ROUTES } from "@/constants";
import { calculateNetWorth } from "@/lib/netWorth";

// Financial insight components
import InsightCards from "../components/InsightCards";
import HealthScoreWidget from "../components/HealthScoreWidget";
import SpendingAlert from "../components/SpendingAlert";
import RecurringDetectionBanner from "../components/RecurringDetectionBanner";
import SafeToSpendWhatIf from "../components/SafeToSpendWhatIf";

interface BudgetData {
  configured?: boolean;
  targetAmount: number;
  amountSpent: number;
  remaining: number;
  spentPct: number;
  overallStatus: "NOT_CONFIGURED" | "NORMAL" | "WARNING_80" | "EXCEEDED_100";
}

interface DashboardNotification {
  id: string;
  type: "warning" | "danger" | "info";
  title: string;
  message: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");
  const [reloadAttempt, setReloadAttempt] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [incomeSetup, setIncomeSetup] = useState<IncomeSetup | null>(null);
  const [safeToSpend, setSafeToSpend] = useState<number>(0);
  const [safeToSpendBreakdown, setSafeToSpendBreakdown] = useState<SafeToSpendBreakdown | null>(null);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [loanSummary, setLoanSummary] = useState<LoanSummary | null>(null);
  const [loansLoading, setLoansLoading] = useState(true);
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [showSafeToSpendBreakdown, setShowSafeToSpendBreakdown] = useState(false);
  const [showWhatIfCalculator, setShowWhatIfCalculator] = useState(false);
  const [budgetAlertsEnabled] = useState(() => typeof window === "undefined" || localStorage.getItem("casha_budget_alerts") !== "false");
  const [insightCardsEnabled] = useState(() => typeof window === "undefined" || localStorage.getItem("casha_weekly_summary") !== "false");

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    async function loadData() {
      try {
        const [txData, setupData, goalsData, fixedData, loansData, budgetRes, notificationRes, walletData] = await Promise.all([
          transactionService.getTransactions(),
          incomeSetupService.getIncomeSetup(),
          incomeSetupService.getSavingsGoals(),
          incomeSetupService.getFixedExpenses(),
          loanService.getLoans(),
          apiClient.get("/budget"),
          apiClient.get("/notifications").catch(() => ({ data: { notifications: [] } })),
          walletService.getWallets(),
        ]);
        if (!active) return;
        setTransactions(txData);
        setIncomeSetup(setupData.setup);
        setSafeToSpend(setupData.safeToSpend);
        setSafeToSpendBreakdown(setupData.breakdown || null);
        setSavingsGoals(goalsData);
        setFixedExpenses(fixedData);
        setLoanSummary(loansData?.summary ?? null);
        setBudgetData(budgetRes.data);
        setNotifications(notificationRes.data.notifications || []);
        setWallets(walletData);
        setLoadError("");
      } catch (err) {
        console.error("Failed to load dashboard data", err);
        if (active) setLoadError("We couldn't load your saved setup and balances. Retry to fetch your account data.");
      } finally {
        if (active) {
          setLoansLoading(false);
          setDashboardLoading(false);
          setLoadedUserId(user?.id ?? null);
        }
      }
    }
    loadData();
    return () => { active = false; };
  }, [user?.id, reloadAttempt]);

  useEffect(() => {
    if (!showSafeToSpendBreakdown) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setShowSafeToSpendBreakdown(false);
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showSafeToSpendBreakdown]);

  useEffect(() => {
    if (!showWhatIfCalculator) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setShowWhatIfCalculator(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showWhatIfCalculator]);

  const userIncome = safeToSpendBreakdown?.totalIncome ?? 0;

  const totalSpent = safeToSpendBreakdown?.totalExpenses ?? transactions
    .filter((t) => ["expense", "bill_payment", "debt_payment"].includes(t.type))
    .reduce((sum, t) => sum + t.amount, 0);
  const balanceSummary = calculateNetWorth(wallets, loanSummary ?? {});

  const incomePeriod = incomeSetup?.incomePeriod || "monthly";
  const plannedWeeklyIncome = Math.round((incomePeriod === "weekly" ? (incomeSetup?.totalIncome ?? 0) : (incomeSetup?.totalIncome ?? 0) / (52 / 12)) * 100) / 100;

  const totalSaved = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalSavingsAllocations = savingsGoals
    .filter((g) => !g.isCompleted)
    .reduce((sum, g) => sum + (g.monthlyAllocation || 0), 0);
  const totalFixedReserve = safeToSpendBreakdown?.totalFixed ?? 0;
  const totalSavingsReserve = safeToSpendBreakdown?.totalSavings ?? 0;
  const loanRepaymentsDue = safeToSpendBreakdown?.totalLoanRepayments ?? 0;
  const totalObligations = totalFixedReserve + totalSavingsReserve + loanRepaymentsDue;
  const periodExpenses = safeToSpendBreakdown?.totalExpenses ?? 0;

  const recentTransactions = transactions.length > 0 ? transactions.slice(0, 5) : [];

  // Budget calculations
  const targetBudget = budgetData?.targetAmount || 0;
  const budgetSpent = budgetData?.amountSpent ?? totalSpent;
  const budgetRemaining = budgetData?.remaining ?? (targetBudget - budgetSpent);
  const spentPct = budgetData?.spentPct ?? Math.min(Math.round((budgetSpent / (targetBudget || 1)) * 100), 100);

  const getStatusBadge = () => {
    if (spentPct >= 100) {
      return { label: "EXCEEDED 🚨", bg: "bg-red-100 text-red-700 border-red-200", bar: "bg-red-500" };
    }
    if (spentPct >= 80) {
      return { label: "NEAR LIMIT ⚠️", bg: "bg-amber-100 text-amber-700 border-amber-200", bar: "bg-amber-500" };
    }
    return { label: "ON TRACK ✅", bg: "bg-emerald-100 text-emerald-800 border-emerald-200", bar: "bg-emerald-500" };
  };

  const statusInfo = getStatusBadge();
  const roleLabel = user?.customRole || user?.role?.[0] || "personal finance tracker";

  return (
    <div className="flex min-h-screen bg-[#f7f9f8]">
      <Sidebar />
      <main className="app-main">
        {/* Header Bar */}
        <div className="app-page-header flex items-center justify-between mb-4 pb-4 border-b border-gray-200/60">
          <div>
            <h1>Dashboard</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Welcome back, <span className="font-bold text-gray-800">{user?.name ? user.name.split(" ")[0] : "User"}</span>! Your {roleLabel.toLowerCase()} view prioritizes cash available after upcoming commitments.
            </p>
          </div>
        </div>
        {dashboardLoading || loadedUserId !== user?.id ? (
          <div role="status" className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">Loading your saved setup and balances…</div>
        ) : loadError ? (
          <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            <p>{loadError}</p>
            <button type="button" onClick={() => { setDashboardLoading(true); setLoadError(""); setReloadAttempt(attempt => attempt + 1); }} className="mt-3 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white">Retry loading dashboard</button>
          </div>
        ) : <>
        {/* Smart Spending Alert Banner */}
        <SpendingAlert
          status={!budgetAlertsEnabled || budgetData?.overallStatus === "NOT_CONFIGURED" ? null : budgetData?.overallStatus}
          notifications={notifications.filter((notification) => budgetAlertsEnabled || !notification.id.startsWith("budget-"))}
          dismissedIds={dismissedAlerts}
          onDismiss={(id) => setDismissedAlerts((prev) => prev.includes(id) ? prev : [...prev, id])}
        />
        {/* Recurring Expense Detection */}
        <RecurringDetectionBanner />

        {/* PRIMARY DASHBOARD METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          {/* 1. SAFE TO SPEND HERO CARD */}
          <button
            type="button"
            onClick={() => setShowSafeToSpendBreakdown(true)}
            disabled={!safeToSpendBreakdown}
            className="bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 p-6 rounded-2xl text-white shadow-md relative overflow-hidden flex flex-col justify-between text-left transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
             aria-label={safeToSpendBreakdown ? "View Safe-to-Spend breakdown" : "Complete income setup to see Safe-to-Spend"}
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200">Safe-to-Spend</p>
                <span className="text-[10px] bg-white/20 text-white px-2.5 py-0.5 rounded-full font-bold">
                  Recorded cash
                </span>
              </div>
              <p className="text-3xl font-extrabold tracking-tight my-2">
                ₱{safeToSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-emerald-600/40 text-[11px] text-emerald-100">
              {incomeSetup ? (
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">Income minus reserved amounts and spending.</p>
                  <span className="font-bold whitespace-nowrap">View breakdown →</span>
                </div>
              ) : (
                 <p className="font-medium">Complete income setup to calculate your available amount.</p>
              )}
            </div>
          </button>

          {/* 2. MONTHLY BUDGET & PROGRESS TRACKER */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">Monthly Budget</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.bg}`}>
                  {statusInfo.label}
                </span>
              </div>

              <div className="flex items-baseline justify-between mt-1 mb-2">
                <p className="text-2xl font-bold text-gray-900">
                  ₱{budgetSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-xs text-gray-500 font-medium">
                  of ₱{targetBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })} limit
                </span>
              </div>

              {/* Visual Progress Bar */}
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden my-2">
                <div
                  className={`h-full ${statusInfo.bar} transition-all duration-500 rounded-full`}
                  style={{ width: `${Math.min(spentPct, 100)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 text-xs">
              <span className="text-gray-500 font-medium">
                Remaining: <strong className="text-emerald-700">₱{budgetRemaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
              </span>
              <Link href={ROUTES.BUDGET} className="font-bold text-emerald-600 hover:underline">
                Manage →
              </Link>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div><p className="text-xs font-bold uppercase tracking-wide text-gray-800">Wallet balances</p><p className="mt-3 text-2xl font-extrabold text-emerald-700">₱{balanceSummary.walletAssets.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p><p className="mt-1 text-xs text-gray-500">Cash in accounts{loanSummary && <> · ₱{balanceSummary.totalLiabilities.toLocaleString("en-US", { minimumFractionDigits: 2 })} total owed</>}</p></div>
            <Link href={ROUTES.ACCOUNTS} className="mt-4 text-xs font-bold text-emerald-700 hover:underline">Manage wallets →</Link>
          </div>

          {/* OUTSTANDING BORROWED MONEY */}
          <div className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm flex flex-col justify-between" aria-busy={loansLoading}>
            <div>
              <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">Borrowed Money Owed</p>
              <p className={`mt-3 text-2xl font-extrabold ${loanSummary?.totalBorrowed ? "text-rose-600" : "text-gray-900"}`}>
                {loanSummary
                  ? `₱${loanSummary.totalBorrowed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : loansLoading ? "Loading…" : "Unavailable"}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {loanSummary
                  ? loanSummary.totalBorrowed > 0 ? "Remaining balance after recorded repayments." : "No outstanding borrowed money."
                  : loansLoading ? "Checking your recorded loans." : "Could not load your loans. Please refresh."}
              </p>
            </div>
            <Link href={`${ROUTES.LOANS}?tab=debts`} className="mt-4 text-xs font-bold text-rose-600 hover:underline">View borrowed money →</Link>
          </div>
        </div>

        {showSafeToSpendBreakdown && safeToSpendBreakdown && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setShowSafeToSpendBreakdown(false);
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="safe-to-spend-dialog-title"
              className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-7"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">Your available amount</p>
                  <h2 id="safe-to-spend-dialog-title" className="mt-1 text-2xl font-extrabold text-slate-950">Why your Safe-to-Spend is ₱{safeToSpend.toLocaleString("en-US", { minimumFractionDigits: 2 })}</h2>
                  <p className="mt-1 text-xs text-slate-500">This uses the same calculation as the backend.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSafeToSpendBreakdown(false)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/[0.06] dark:hover:text-white"
                  aria-label="Close breakdown"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 text-sm">
                  <span className="font-semibold text-slate-700">Income for this {incomePeriod === "weekly" ? "week" : "month"}</span>
                  <strong className="text-emerald-700">+ ₱{userIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3 text-sm">
                  <span className="font-semibold text-slate-700">Bills still reserved this period</span>
                  <strong className="text-amber-700">− ₱{totalFixedReserve.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3 text-sm">
                  <span className="font-semibold text-slate-700">Savings reserved this period</span>
                  <strong className="text-blue-700">− ₱{totalSavingsReserve.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-violet-50 px-4 py-3 text-sm">
                  <span className="font-semibold text-slate-700">Loan repayments due</span>
                  <strong className="text-violet-700">− ₱{loanRepaymentsDue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-rose-50 px-4 py-3 text-sm">
                  <span className="font-semibold text-slate-700">Expenses logged this {incomePeriod === "weekly" ? "week" : "month"}</span>
                  <strong className="text-rose-700">− ₱{periodExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-900 px-4 py-4 text-sm text-white">
                  <span className="font-bold">Safe-to-Spend</span>
                  <strong className="text-lg text-emerald-300">₱{safeToSpend.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>
                </div>
                {safeToSpendBreakdown && safeToSpendBreakdown.rawSafeToSpend < 0 && <p className="text-xs font-semibold text-rose-700">Commitments exceed received income by ₱{Math.abs(safeToSpendBreakdown.rawSafeToSpend).toLocaleString("en-US", { minimumFractionDigits: 2 })}; Safe-to-Spend is shown as ₱0.</p>}
                <button
                  type="button"
                  onClick={() => {
                    setShowSafeToSpendBreakdown(false);
                    setShowWhatIfCalculator(true);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
                >
                  <Calculator className="h-4 w-4" aria-hidden="true" />
                  Try a Safe-to-Spend What-If
                </button>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-extrabold text-slate-900">Recurring expenses entered during onboarding</h3>
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-800">{fixedExpenses.length} recorded</span>
                </div>

                {fixedExpenses.length === 0 ? (
                  <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
                    <p className="text-sm font-semibold text-slate-700">No onboarding recurring expenses were found.</p>
                    <p className="mt-1 text-xs text-slate-500">Only expenses successfully saved to your account appear here.</p>
                  </div>
                ) : (
                  <ul className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
                    {fixedExpenses.map((expense) => (
                      <li key={expense.id} className="flex items-center justify-between gap-4 px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-800">{expense.name}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {expense.dueDate
                              ? `Due ${new Date(expense.dueDate).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}`
                              : "Saved during recurring-expense setup"}
                          </p>
                        </div>
                        <strong className="whitespace-nowrap text-sm text-amber-700">₱{expense.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <p className="mt-5 text-[11px] leading-5 text-slate-500">
                Scheduled borrowed-debt repayments due in this period are reserved automatically. Collections on money you lent are counted only after you record them.
              </p>
            </section>
          </div>
        )}

        {showWhatIfCalculator && (
          <SafeToSpendWhatIf
            currentSafeToSpend={safeToSpendBreakdown?.safeToSpend ?? safeToSpend}
            rawSafeToSpend={safeToSpendBreakdown?.rawSafeToSpend ?? safeToSpend}
            periodLabel={incomePeriod === "weekly" ? "week" : "month"}
            onClose={() => setShowWhatIfCalculator(false)}
          />
        )}

        {/* AI INSIGHT CARDS */}
        {insightCardsEnabled && <InsightCards />}

        {/* MAIN DASHBOARD CONTENT GRID (2 COLUMNS) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT 2-COLUMNS: GOALS, CASH FLOW & TRANSACTIONS */}
          <div className="lg:col-span-2 space-y-6">
            {/* SAVINGS & CASH FLOW SUMMARY ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Savings Goals Progress</p>
                  <h3 className="text-2xl font-extrabold text-emerald-700 mb-1">
                    ₱{totalSaved.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </h3>
                  <p className="text-xs text-gray-500">{savingsGoals.length} active savings goals</p>
                </div>
                <Link href={ROUTES.BUDGET} className="mt-3 text-xs font-bold text-emerald-600 hover:underline">
                  View Savings Goals →
                </Link>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <p className="text-xs font-bold text-gray-800 uppercase tracking-wide mb-3">Cash Flow Overview</p>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-3 text-xs pb-2 border-b border-gray-100">
                    <span className="text-gray-500 font-medium">Income received this period</span>
                    <span className="font-bold text-gray-900">₱{userIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-xs pb-2 border-b border-gray-100">
                    <span className="text-gray-500 font-medium">Expenses Logged</span>
                    <span className="font-bold text-rose-600">₱{totalSpent.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-gray-500 font-medium">Planned weekly income</span>
                    <span className="font-bold text-blue-600">₱{plannedWeeklyIncome.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SAFE-TO-SPEND OBLIGATIONS BREAKDOWN */}
            {safeToSpendBreakdown && <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm" aria-labelledby="obligations-heading">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-5">
                <div>
                  <h3 id="obligations-heading" className="text-sm font-bold text-gray-900">Safe-to-Spend Breakdown</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    These amounts are deducted from your income before your available amount is shown.
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Reserved obligations</p>
                  <p className="text-lg font-extrabold text-amber-700">
                    ₱{totalObligations.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
                   <p className="text-[11px] font-semibold text-amber-800">Bills still reserved</p>
                   <p className="mt-1 text-base font-extrabold text-gray-900">₱{totalFixedReserve.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                   <p className="text-[11px] font-semibold text-emerald-800">Savings reserved</p>
                   <p className="mt-1 text-base font-extrabold text-gray-900">₱{totalSavingsReserve.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-4">
                  <p className="text-[11px] font-semibold text-rose-800">Spent this {incomePeriod === "weekly" ? "week" : "month"}</p>
                  <p className="mt-1 text-base font-extrabold text-gray-900">₱{periodExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              {fixedExpenses.length === 0 && totalSavingsAllocations === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 px-4 py-6 text-center">
                  <p className="text-xs font-semibold text-gray-700">No recurring obligations have been recorded.</p>
                  <p className="text-[11px] text-gray-500 mt-1">Recurring expenses entered during onboarding will appear here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2">Recurring expenses from onboarding</p>
                    {fixedExpenses.length === 0 ? (
                      <p className="text-xs text-gray-400 py-2">None recorded</p>
                    ) : (
                      <ul className="divide-y divide-gray-100">
                        {fixedExpenses.map((expense) => (
                          <li key={expense.id} className="flex items-center justify-between gap-3 py-2.5 text-xs">
                            <div className="min-w-0">
                              <p className="font-bold text-gray-800 truncate">{expense.name}</p>
                              <p className="text-[10px] text-gray-400">
                                {expense.dueDate
                                  ? `Due ${new Date(expense.dueDate).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}`
                                  : "Recurring fixed expense"}
                              </p>
                            </div>
                            <span className="font-extrabold text-amber-700 whitespace-nowrap">₱{expense.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2">Active savings allocations</p>
                    {savingsGoals.filter((goal) => !goal.isCompleted && goal.monthlyAllocation > 0).length === 0 ? (
                      <p className="text-xs text-gray-400 py-2">None reserved</p>
                    ) : (
                      <ul className="divide-y divide-gray-100">
                        {savingsGoals
                          .filter((goal) => !goal.isCompleted && goal.monthlyAllocation > 0)
                          .map((goal) => (
                            <li key={goal.id} className="flex items-center justify-between gap-3 py-2.5 text-xs">
                              <div className="min-w-0">
                                <p className="font-bold text-gray-800 truncate">{goal.name}</p>
                                <p className="text-[10px] text-gray-400">Monthly savings commitment</p>
                              </div>
                              <span className="font-extrabold text-emerald-700 whitespace-nowrap">₱{goal.monthlyAllocation.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-gray-500">
                   ₱{userIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })} received income − ₱{totalFixedReserve.toLocaleString("en-US", { minimumFractionDigits: 2 })} bills − ₱{totalSavingsReserve.toLocaleString("en-US", { minimumFractionDigits: 2 })} savings − ₱{loanRepaymentsDue.toLocaleString("en-US", { minimumFractionDigits: 2 })} loan payments − ₱{periodExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })} spending
                </span>
                 <strong className="text-emerald-700">= {safeToSpendBreakdown && safeToSpendBreakdown.rawSafeToSpend < 0 ? `₱${Math.abs(safeToSpendBreakdown.rawSafeToSpend).toLocaleString("en-US", { minimumFractionDigits: 2 })} shortfall; ₱0 safe` : `₱${safeToSpend.toLocaleString("en-US", { minimumFractionDigits: 2 })} safe`}</strong>
              </div>
            </section>}

            {/* RECENT TRANSACTIONS CARD */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900">Recent Transactions</h3>
                <Link href={ROUTES.TRANSACTIONS} className="text-xs font-bold text-emerald-600 hover:underline">
                  View all
                </Link>
              </div>

              {recentTransactions.length === 0 ? (
                <div className="py-8 text-center bg-gray-50/60 rounded-xl border border-dashed border-gray-200">
                  <p className="text-xs text-gray-500 font-medium">No transactions recorded yet.</p>
                  <Link href={ROUTES.TRANSACTIONS} className="inline-block mt-2 text-xs font-bold text-emerald-600 hover:underline">
                    + Log your first transaction
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {recentTransactions.map((t) => (
                    <li key={t.id} className="py-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-base font-bold border border-emerald-100">
                          {t.category === "Food" ? "🍱" : t.category === "Income" ? "💸" : t.category === "Transport" ? "🚗" : "🛍️"}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{t.description || t.category}</p>
                          <p className="text-[10px] text-gray-400">{t.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-extrabold ${t.type === "income" ? "text-emerald-600" : "text-gray-900"}`}>
                          {t.type === "income" ? "+" : "-"}₱{t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-[10px] text-gray-400">{t.date}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* RIGHT 1-COLUMN: HEALTH SCORE + QUICK ACTIONS */}
          <div className="space-y-6">
            {/* Financial Health Score Widget */}
            <HealthScoreWidget />

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href={ROUTES.TRANSACTIONS}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-emerald-50 hover:border-emerald-200 dark:hover:bg-white/[0.04] dark:hover:border-white/20 transition font-bold text-xs"
                >
                  <span className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">💵</span>
                  <span>Add Transaction</span>
                </Link>

                <Link
                  href={ROUTES.AI_ASSISTANT}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-purple-50 hover:border-purple-200 dark:hover:bg-white/[0.04] dark:hover:border-white/20 transition font-bold text-xs"
                >
                  <span className="h-8 w-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold">🤖</span>
                  <span>Ask AI Assistant</span>
                </Link>

                <Link
                  href={ROUTES.ANALYTICS}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-white/[0.04] dark:hover:border-white/20 transition font-bold text-xs"
                >
                  <span className="h-8 w-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">📊</span>
                  <span>View Analytics</span>
                </Link>

                <Link
                  href={ROUTES.BUDGET}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-amber-50 hover:border-amber-200 dark:hover:bg-white/[0.04] dark:hover:border-white/20 transition font-bold text-xs"
                >
                  <span className="h-8 w-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold">🎯</span>
                  <span>Manage Budget & Goals</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
        </>}
      </main>
    </div>
  );
}
