"use client";

import Sidebar from "../components/ui/sidebar";

const SPENDING = [
  { category: "Food", amount: 4200 },
  { category: "Transport", amount: 1500 },
  { category: "Housing", amount: 8000 },
  { category: "Shopping", amount: 3900 },
  { category: "Entertainment", amount: 1200 },
];

export default function AnalyticsPage() {
  const max = Math.max(...SPENDING.map((s) => s.amount));

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-gray-50 p-8">
        <h1 className="text-2xl font-bold text-brand-900">Analytics</h1>
        <p className="mb-6 text-sm text-gray-500">Where your money went this month.</p>

        <div className="card">
          <h2 className="mb-6 text-sm font-semibold text-gray-700">Spending by category</h2>
          <div className="flex items-end gap-6" style={{ height: 200 }}>
            {SPENDING.map((s) => (
              <div key={s.category} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full max-w-[48px] rounded-t-lg bg-brand-500"
                  style={{ height: `${(s.amount / max) * 160}px` }}
                  title={`₱${s.amount.toLocaleString()}`}
                />
                <span className="text-xs text-gray-500">{s.category}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}