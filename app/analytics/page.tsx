"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/ui/sidebar";
import apiClient from "@/lib/apiClient";
import { incomeSetupService } from "@/services/incomeSetupService";
import { useAuth } from "@/context/Authcontext";
import { exportFinancialReport } from "@/lib/pdfExport";
import { exportTransactionsCSV } from "@/lib/csvExport";
import SpendingForecast from "../components/SpendingForecast";

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

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [safeToSpend, setSafeToSpend] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<CategoryStat[]>([
    { name: "Food & Dining", pct: 40, amount: 4000, color: "#1e6b52" },
    { name: "Transport", pct: 20, amount: 2000, color: "#b09e2e" },
    { name: "Utilities", pct: 15, amount: 1500, color: "#81c798" },
    { name: "Shopping", pct: 15, amount: 1500, color: "#f15b5b" },
    { name: "Others", pct: 10, amount: 1000, color: "#5c9edd" },
  ]);

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

          const expenses = txRes.data.filter((t: any) => (t.type || "").toUpperCase() === "EXPENSE");
          const incomes = txRes.data.filter((t: any) => (t.type || "").toUpperCase() === "INCOME");

          const totalExp = expenses.reduce((sum: number, t: any) => sum + t.amount, 0);
          const totalInc = incomes.reduce((sum: number, t: any) => sum + t.amount, 0);

          setTotalSpent(totalExp);
          setTotalIncome(totalInc || setupRes.setup?.totalIncome || 25000);

          if (totalExp > 0) {
            const catMap: Record<string, number> = {};
            expenses.forEach((t: any) => {
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
        description: t.description || t.category,
        category: t.category,
        type: (t.type || "expense").toLowerCase() as any,
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
                    description: t.description || t.category,
                    category: t.category,
                    type: (t.type || "expense").toLowerCase() as any,
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
                {(() => {
                  let accumulatedPct = 0;
                  return categories.map((c, i) => {
                    const strokeDasharray = `${c.pct} ${100 - c.pct}`;
                    const strokeDashoffset = -accumulatedPct;
                    accumulatedPct += c.pct;
                    return (
                      <circle
                        key={i}
                        cx="50"
                        cy="50"
                        r="35"
                        fill="transparent"
                        stroke={c.color}
                        strokeWidth="12"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        pathLength="100"
                      />
                    );
                  });
                })()}
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
              {/* Grid lines */}
              <line x1="40" y1="20" x2="480" y2="20" stroke="#f0f0f0" strokeWidth="1" />
              <line x1="40" y1="50" x2="480" y2="50" stroke="#f0f0f0" strokeWidth="1" />
              <line x1="40" y1="80" x2="480" y2="80" stroke="#f0f0f0" strokeWidth="1" />
              <line x1="40" y1="110" x2="480" y2="110" stroke="#f0f0f0" strokeWidth="1" />
              <line x1="40" y1="130" x2="480" y2="130" stroke="#e0e0e0" strokeWidth="1" />

              {/* Y Axis Labels */}
              <text x="5" y="24" fill="#999" fontSize="9" fontWeight="600">₱ 5,000</text>
              <text x="5" y="54" fill="#999" fontSize="9" fontWeight="600">₱ 3,500</text>
              <text x="5" y="84" fill="#999" fontSize="9" fontWeight="600">₱ 2,000</text>
              <text x="5" y="114" fill="#999" fontSize="9" fontWeight="600">₱ 500</text>
              <text x="5" y="134" fill="#999" fontSize="9" fontWeight="600">₱ 0</text>

              {/* Trend Path */}
              <path
                d="M 50 120 C 100 90, 150 110, 200 60 C 250 80, 300 40, 350 70 C 400 30, 440 50, 480 25"
                fill="none"
                stroke="#16a34a"
                strokeWidth="2.5"
              />

              {/* Data points */}
              {[
                { x: 50, y: 120 },
                { x: 200, y: 60 },
                { x: 350, y: 70 },
                { x: 480, y: 25 },
              ].map((pt, i) => (
                <circle key={i} cx={pt.x} cy={pt.y} r="4" fill="#ffffff" stroke="#16a34a" strokeWidth="2" />
              ))}

              {/* X Axis Labels */}
              <text x="45" y="146" fill="#666" fontSize="9">Week 1</text>
              <text x="185" y="146" fill="#666" fontSize="9">Week 2</text>
              <text x="335" y="146" fill="#666" fontSize="9">Week 3</text>
              <text x="465" y="146" fill="#666" fontSize="9">Week 4</text>
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