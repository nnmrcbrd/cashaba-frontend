"use client";

import Sidebar from "../components/ui/sidebar";
import { useAuth } from "@/context/Authcontext";

const STATS = [
  { label: "Balance", value: "₱24,580" },
  { label: "Income this month", value: "₱45,000" },
  { label: "Spent this month", value: "₱18,420" },
];

const RECENT = [
  { label: "Groceries", amount: "-₱1,240", date: "Jul 6" },
  { label: "Salary", amount: "+₱45,000", date: "Jul 1" },
  { label: "Electric bill", amount: "-₱2,100", date: "Jun 29" },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-gray-50 p-8">
        <h1 className="text-2xl font-bold text-brand-900">
          Welcome back, {user?.name?.split(" ")[0] ?? "there"} 👋
        </h1>
        <p className="mb-6 text-sm text-gray-500">Here&apos;s your financial snapshot.</p>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STATS.map((s) => (
            <div key={s.label} className="card">
              <p className="text-xs font-medium text-gray-500">{s.label}</p>
              <p className="mt-1 text-xl font-bold text-brand-900">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="card">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Recent transactions</h2>
          <ul className="divide-y divide-gray-100">
            {RECENT.map((t) => (
              <li key={t.label} className="flex items-center justify-between py-2 text-sm">
                <span className="text-gray-700">{t.label}</span>
                <span className="text-gray-400">{t.date}</span>
                <span
                  className={`font-semibold ${
                    t.amount.startsWith("+") ? "text-brand-600" : "text-red-500"
                  }`}
                >
                  {t.amount}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}