"use client";

import { useState } from "react";
import Sidebar from "../components/ui/sidebar";
import { Budget, Goal } from "../types";

const BUDGETS: Budget[] = [
  { id: "1", category: "Food", limit: 6000, spent: 4200 },
  { id: "2", category: "Transport", limit: 3000, spent: 1500 },
  { id: "3", category: "Shopping", limit: 4000, spent: 3900 },
];

const GOALS: Goal[] = [
  { id: "1", name: "Emergency fund", target: 50000, saved: 21000 },
  { id: "2", name: "New laptop", target: 60000, saved: 12000, deadline: "2026-12-01" },
];

export default function BudgetPage() {
  const [tab, setTab] = useState<"budget" | "goals">("budget");

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-gray-50 p-8">
        <h1 className="text-2xl font-bold text-brand-900">Budget & Goals</h1>
        <p className="mb-6 text-sm text-gray-500">Track limits and save toward what matters.</p>

        <div className="mb-6 flex gap-2">
          {(["budget", "goals"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize ${
                tab === t ? "bg-brand-600 text-white" : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "budget" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {BUDGETS.map((b) => {
              const pct = Math.min(100, Math.round((b.spent / b.limit) * 100));
              return (
                <div key={b.id} className="card">
                  <div className="mb-2 flex justify-between text-sm font-semibold text-gray-700">
                    <span>{b.category}</span>
                    <span>
                      ₱{b.spent.toLocaleString()} / ₱{b.limit.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full ${pct >= 90 ? "bg-red-500" : "bg-brand-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {GOALS.map((g) => {
              const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
              return (
                <div key={g.id} className="card">
                  <div className="mb-2 flex justify-between text-sm font-semibold text-gray-700">
                    <span>{g.name}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-gray-500">
                    ₱{g.saved.toLocaleString()} saved of ₱{g.target.toLocaleString()}
                    {g.deadline ? ` · by ${g.deadline}` : ""}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}