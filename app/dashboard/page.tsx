"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "../components/ui/sidebar";
import { useAuth } from "@/context/Authcontext";
import { Transaction } from "../types";
import { transactionService } from "@/services/transactionService";
import { incomeSetupService, IncomeSetup, SavingsGoal, FixedExpense } from "@/services/incomeSetupService";
import { loanService, LoanSummary } from "@/services/loanService";
import apiClient from "@/lib/apiClient";
import { ROUTES } from "@/constants";

// Premium feature components
import InsightCards from "../components/InsightCards";
import HealthScoreWidget from "../components/HealthScoreWidget";
import SpendingAlert from "../components/SpendingAlert";
import RecurringDetectionBanner from "../components/RecurringDetectionBanner";

interface BudgetData {
  targetAmount: number;
  amountSpent: number;
  remaining: number;
  spentPct: number;
  overallStatus: "NORMAL" | "WARNING_80" | "EXCEEDED_100";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [incomeSetup, setIncomeSetup] = useState<IncomeSetup | null>(null);
  const [safeToSpend, setSafeToSpend] = useState<number>(0);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [loanSummary, setLoanSummary] = useState<LoanSummary>({ totalBorrowed: 0, totalLent: 0, overdueCount: 0 });
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [txData, setupData, goalsData, fixedData, loansData, budgetRes] = await Promise.all([
          transactionService.getTransactions(),
          incomeSetupService.getIncomeSetup(),
          incomeSetupService.getSavingsGoals().catch(() => []),
          incomeSetupService.getFixedExpenses().catch(() => []),
          loanService.getLoans().catch(() => ({ loans: [], summary: { totalBorrowed: 0, totalLent: 0, overdueCount: 0 } })),
          apiClient.get("/budget").catch(() => ({ data: null })),
        ]);
        setTransactions(txData);
        setIncomeSetup(setupData.setup);
        setSafeToSpend(setupData.safeToSpend);
        setSavingsGoals(goalsData);
        setFixedExpenses(fixedData);
        setLoanSummary(loansData.summary);
        if (budgetRes?.data) {
          setBudgetData(budgetRes.data);
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const userIncome = incomeSetup?.totalIncome || 
    transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0) || 0;

  const totalSpent = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const incomePeriod = incomeSetup?.incomePeriod || "monthly";
  const weeklyAllowance = incomePeriod === "weekly" ? userIncome : (userIncome / 4);

  const totalSaved = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalSavingsAllocations = savingsGoals
    .filter((g) => !g.isCompleted)
    .reduce((sum, g) => sum + (g.monthlyAllocation || 0), 0);
  const totalFixedBills = fixedExpenses.reduce((sum, fe) => sum + fe.amount, 0);
  const totalObligations = totalFixedBills + totalSavingsAllocations;

  const recentTransactions = transactions.length > 0 ? transactions.slice(0, 5) : [];

  // Budget calculations
  const targetBudget = budgetData?.targetAmount || 20000;
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

  return (
    <div className="flex min-h-screen bg-[#f7faf8]">
      <Sidebar />
      <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
        {/* Smart Spending Alert Banner */}
        <SpendingAlert
          status={budgetData?.overallStatus}
          notifications={[]}
          onDismiss={(id) => setDismissedAlerts((prev) => [...prev, id])}
        />
        {/* Recurring Expense Detection */}
        <RecurringDetectionBanner />
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200/60">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">DASHBOARD</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Welcome back, <span className="font-bold text-gray-800">{user?.name ? user.name.split(" ")[0] : "User"}</span>! Here is your real-time financial snapshot.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-gray-200/60 text-gray-600 transition" title="Notifications">
              🔔
            </button>
          </div>
        </div>

        {/* PRIMARY 3-COLUMN HERO METRICS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {/* 1. SAFE TO SPEND HERO CARD */}
          <div className="bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 p-6 rounded-2xl text-white shadow-md relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200">Safe-to-Spend</p>
                <span className="text-[10px] bg-white/20 text-white px-2.5 py-0.5 rounded-full font-bold">
                  Real-time
                </span>
              </div>
              <p className="text-3xl font-extrabold tracking-tight my-2">
                ₱{safeToSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-emerald-600/40 text-[11px] text-emerald-100">
              {totalObligations > 0 ? (
                <p className="font-medium">
                  Formula: <span className="font-bold">₱{userIncome.toLocaleString()}</span> Income − <span className="font-bold">₱{totalObligations.toLocaleString()}</span> Obligations
                </p>
              ) : (
                <p className="font-medium">Available balance after reserved obligations & fixed expenses.</p>
              )}
            </div>
          </div>

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

          {/* 3. CASH FLOW SUMMARY CARD */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <p className="text-xs font-bold text-gray-800 uppercase tracking-wide mb-3">Cash Flow Overview</p>
            
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-gray-100">
                <span className="text-gray-500 font-medium">Total Income</span>
                <span className="font-bold text-gray-900">₱{userIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex items-center justify-between text-xs pb-2 border-b border-gray-100">
                <span className="text-gray-500 font-medium">Expenses Logged</span>
                <span className="font-bold text-rose-600">₱{totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-medium">Weekly Allowance</span>
                <span className="font-bold text-blue-600">₱{weeklyAllowance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI INSIGHT CARDS */}
        <InsightCards />

        {/* MAIN DASHBOARD CONTENT GRID (2 COLUMNS) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT 2-COLUMNS: GOALS, DEBTS & TRANSACTIONS */}
          <div className="lg:col-span-2 space-y-6">
            {/* SAVINGS & DEBTS SUMMARY ROW */}
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
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Active Debts Owed</p>
                  <h3 className="text-2xl font-extrabold text-rose-600 mb-1">
                    ₱{loanSummary.totalBorrowed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {loanSummary.overdueCount > 0 ? (
                      <span className="text-red-600 font-bold">⚠️ {loanSummary.overdueCount} overdue payments</span>
                    ) : (
                      "All payments on schedule"
                    )}
                  </p>
                </div>
                <Link href={ROUTES.LOANS} className="mt-3 text-xs font-bold text-rose-600 hover:underline">
                  View Debts & Loans →
                </Link>
              </div>
            </div>

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
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-emerald-50 hover:border-emerald-200 transition font-bold text-xs"
                >
                  <span className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">💵</span>
                  <span>Add Transaction</span>
                </Link>

                <Link
                  href={ROUTES.AI_ASSISTANT}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-purple-50 hover:border-purple-200 transition font-bold text-xs"
                >
                  <span className="h-8 w-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold">🤖</span>
                  <span>Ask AI Assistant</span>
                </Link>

                <Link
                  href={ROUTES.ANALYTICS}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-200 transition font-bold text-xs"
                >
                  <span className="h-8 w-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">📊</span>
                  <span>View Analytics</span>
                </Link>

                <Link
                  href={ROUTES.BUDGET}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-amber-50 hover:border-amber-200 transition font-bold text-xs"
                >
                  <span className="h-8 w-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold">🎯</span>
                  <span>Manage Budget & Goals</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}