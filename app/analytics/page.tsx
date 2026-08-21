"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/ui/sidebar";
import apiClient from "@/lib/apiClient";
import { incomeSetupService } from "@/services/incomeSetupService";
import { useAuth } from "@/context/Authcontext";
import { exportFinancialReport } from "@/lib/pdfExport";
import { exportTransactionsCSV } from "@/lib/csvExport";
import SpendingForecast from "../components/SpendingForecast";
import { TransactionType } from "../types";

interface CategoryStat {
  name: string;
  pct: number;
  amount: number;
  color: string;
}

interface TrendPoint {
  label: string;
  amount: number;
}

interface BackendTransaction {
  id: string;
  date?: string;
  createdAt?: string;
  description?: string;
  category?: string;
  type: string;
  amount: number;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [safeToSpend, setSafeToSpend] = useState(0);
  const [transactions, setTransactions] = useState<BackendTransaction[]>([]);
  const [categories, setCategories] = useState<CategoryStat[]>([]);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const [txRes, setupRes] = await Promise.all([
          apiClient.get("/transactions"),
          incomeSetupService.getIncomeSetup(),
        ]);

        setSafeToSpend(setupRes.safeToSpend);

        if (txRes.data && txRes.data.length > 0) {
          setTransactions(txRes.data);

          const responseTransactions = txRes.data as BackendTransaction[];
          const expenses = responseTransactions.filter((t) => (t.type || "").toUpperCase() === "EXPENSE");
          const incomes = responseTransactions.filter((t) => (t.type || "").toUpperCase() === "INCOME");

          const totalExp = expenses.reduce((sum, t) => sum + t.amount, 0);
          const totalInc = incomes.reduce((sum, t) => sum + t.amount, 0);

          setTotalSpent(totalExp);
          setTotalIncome(totalInc || setupRes.setup?.totalIncome || 0);

          if (totalExp > 0) {
            const catMap: Record<string, number> = {};
            expenses.forEach((t) => {
              const cat = t.category || "Others";
              catMap[cat] = (catMap[cat] || 0) + t.amount;
            });

            const palette = ["#1e6b52", "#b09e2e", "#81c798", "#f15b5b", "#5c9edd", "#9c27b0", "#ff9800"];
            let idx = 0;
            const computed: CategoryStat[] = Object.keys(catMap).map((catName) => {
              const amt = catMap[catName];
              const pct = Math.round((amt / totalExp) * 100);
              const color = palette[idx % palette.length];
              idx++;
              return { name: catName, pct, amount: amt, color };
            });

            computed.sort((a, b) => b.amount - a.amount);
            setCategories(computed);
          }
        }
      } catch (err) {
        console.error("Analytics fetch error", err);
      }
    }
    loadAnalytics();
  }, []);

  const categorySegments = useMemo(
    () => categories.map((category, index) => ({
      ...category,
      offset: -categories
        .slice(0, index)
        .reduce((sum, item) => sum + item.pct, 0),
    })),
    [categories],
  );

  const weeklyTrend = useMemo<TrendPoint[]>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const weekCount = Math.ceil(new Date(year, month + 1, 0).getDate() / 7);
    const weeklyTotals = Array.from({ length: weekCount }, () => 0);

    transactions.forEach((transaction) => {
      if ((transaction.type || "").toUpperCase() !== "EXPENSE") return;
      const date = new Date(transaction.date || transaction.createdAt || "");
      if (Number.isNaN(date.getTime()) || date.getFullYear() !== year || date.getMonth() !== month) return;
      const weekIndex = Math.min(Math.floor((date.getDate() - 1) / 7), weekCount - 1);
      weeklyTotals[weekIndex] += transaction.amount;
    });

    return weeklyTotals.map((amount, index) => ({ label: `Week ${index + 1}`, amount }));
  }, [transactions]);

  const trendMax = Math.max(...weeklyTrend.map((point) => point.amount), 1);
  const trendPoints = weeklyTrend.map((point, index) => ({
    ...point,
    x: weeklyTrend.length === 1 ? 260 : 50 + (index * 430) / (weeklyTrend.length - 1),
    y: 130 - (point.amount / trendMax) * 110,
  }));
  const trendPointString = trendPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const trendGrid = [1, 0.75, 0.5, 0.25, 0].map((ratio, index) => ({
    ratio,
    y: 20 + index * 27.5,
    label: Math.round(trendMax * ratio),
  }));

  const topCategory = categories[0] || { name: "Expenses", pct: 0, amount: 0 };

  function handleExportPDF() {
    exportFinancialReport({
      userName: user?.name || "User",
      userEmail: user?.email || "",
      safeToSpend,
      totalIncome,
      totalExpense: totalSpent,
      netBalance: totalIncome - totalSpent,
      transactions: transactions.map(t => ({
        id: t.id,
        date: t.date ? t.date.split("T")[0] : "",
        description: t.description || t.category || "Transaction",
        category: t.category || "Others",
        type: (t.type || "expense").toLowerCase() as TransactionType,
        amount: t.amount,
      })),
    });
  }

  return (
    <div className="flex min-h-screen bg-[#f7faf8]">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200/60">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">ANALYTICS</h1>
            <p className="text-xs text-gray-500 mt-1">Visualize category distributions, spending trends, and export report.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                exportTransactionsCSV(
                  transactions.map((t) => ({
                    date: t.date ? t.date.split("T")[0] : "",
                    description: t.description || t.category || "Transaction",
                    category: t.category || "Others",
                    type: (t.type || "expense").toLowerCase() as TransactionType,
                    amount: t.amount,
                  }))
                )
              }
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
            >
              <span>📊</span> Export CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="bg-[#186849] hover:bg-[#13543b] text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
            >
              <span>📄</span> Export PDF Report
            </button>
          </div>
        </div>

        {/* Top Card: Spending by Category */}
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm mb-8">
          <h2 className="text-base font-bold text-gray-900 mb-6">Spending by Category</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* SVG Donut Chart */}
            <div className="relative flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-56 h-56 transform -rotate-90">
                {categorySegments.map((category) => (
                  <circle
                    key={category.name}
                    cx="50"
                    cy="50"
                    r="35"
                    fill="transparent"
                    stroke={category.color}
                    strokeWidth="12"
                    strokeDasharray={`${category.pct} ${100 - category.pct}`}
                    strokeDashoffset={category.offset}
                    pathLength="100"
                  />
                ))}
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-xl font-bold text-gray-900">₱{totalSpent.toLocaleString()}</span>
                <span className="text-xs text-gray-400 font-medium">Total Spent</span>
              </div>
            </div>

            {/* Category Breakdown Table/Legend */}
            <div className="space-y-3 text-xs">
              {categories.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition border border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="h-4 w-4 rounded-md shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="font-bold text-gray-800 text-sm">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="font-semibold text-gray-600">{c.pct}%</span>
                    <span className="font-bold text-gray-900 w-24 text-right">₱{c.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                  </div>
                </div>
              ))}
              <p className="text-[10px] text-gray-400 pt-2 border-t border-gray-100">
                Percentages calculated based on overall expenses logged.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Card: Spending Trend */}
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-gray-900">Spending Trend</h2>

          {/* SVG Trend Line Graph */}
          <div className="relative h-56 w-full pt-4">
            <svg viewBox="0 0 500 150" className="w-full h-full overflow-visible">
              {trendGrid.map((gridLine) => (
                <g key={gridLine.ratio}>
                  <line
                    x1="40"
                    y1={gridLine.y}
                    x2="480"
                    y2={gridLine.y}
                    stroke={gridLine.ratio === 0 ? "#e0e0e0" : "#f0f0f0"}
                    strokeWidth="1"
                  />
                  <text x="2" y={gridLine.y + 4} fill="#999" fontSize="9" fontWeight="600">
                    ₱{gridLine.label.toLocaleString("en-US")}
                  </text>
                </g>
              ))}

              <polyline
                points={trendPointString}
                fill="none"
                stroke="#16a34a"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {trendPoints.map((point) => (
                <g key={point.label}>
                  <circle cx={point.x} cy={point.y} r="4" fill="#ffffff" stroke="#16a34a" strokeWidth="2" />
                  <title>{`${point.label}: ₱${point.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}</title>
                  <text x={point.x} y="146" textAnchor="middle" fill="#666" fontSize="9">
                    {point.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* Interpretation Callout Banner */}
          <div className="bg-[#eaf8f0] border border-emerald-200 p-4 rounded-2xl text-xs text-emerald-900 font-medium">
            <span className="font-bold text-emerald-800 block mb-1">Financial Analysis Interpretation</span>
            <strong>{topCategory.name}</strong> accounts for <strong>{topCategory.pct}%</strong> of your total spending because you spent ₱{topCategory.amount.toLocaleString()} out of ₱{totalSpent.toLocaleString()} this period. Your current Safe-to-Spend is <strong>₱{safeToSpend.toLocaleString('en-US', {minimumFractionDigits: 2})}</strong>.
          </div>
        </div>
        {/* Spending Forecast */}
        <SpendingForecast transactions={transactions} totalIncome={totalIncome} />
      </main>
    </div>
  );
}
