"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";
import { incomeSetupService } from "@/services/incomeSetupService";

interface RecurringSuggestion {
  description: string;
  amount: number;
  category: string;
  occurrences: number;
  suggestion: string;
}

export default function RecurringDetectionBanner() {
  const [suggestions, setSuggestions] = useState<RecurringSuggestion[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [adding, setAdding] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function fetchRecurring() {
      try {
        const res = await apiClient.get("/transactions/recurring");
        if (res.data?.suggestions) setSuggestions(res.data.suggestions);
      } catch (err) {
        console.warn("Recurring detection failed:", err);
      } finally {
        setLoaded(true);
      }
    }
    fetchRecurring();
  }, []);

  async function handleAddAsFixed(sug: RecurringSuggestion) {
    setAdding(sug.description);
    try {
      await incomeSetupService.addFixedExpense(sug.description, sug.amount);
      setDismissed((prev) => [...prev, sug.description]);
    } catch (err) {
      console.error("Failed to add fixed expense:", err);
    } finally {
      setAdding(null);
    }
  }

  const visible = suggestions.filter((s) => !dismissed.includes(s.description));

  if (!loaded || visible.length === 0) return null;

  return (
    <div className="mb-5 bg-violet-50 border border-violet-200 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm">🔁</span>
        <p className="text-xs font-bold text-violet-900">Recurring Expenses Detected</p>
        <span className="text-[10px] bg-violet-200 text-violet-800 px-2 py-0.5 rounded-full font-semibold">
          {visible.length} pattern{visible.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="space-y-2">
        {visible.map((sug) => (
          <div
            key={sug.description}
            className="flex items-center justify-between gap-3 bg-white border border-violet-100 rounded-xl px-4 py-3"
          >
            <div>
              <p className="text-xs font-bold text-gray-800">{sug.description}</p>
              <p className="text-[10px] text-gray-500">
                ₱{sug.amount.toLocaleString()} · {sug.occurrences}x this month · {sug.category}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => handleAddAsFixed(sug)}
                disabled={adding === sug.description}
                className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition"
              >
                {adding === sug.description ? "Adding..." : "+ Add as Fixed"}
              </button>
              <button
                onClick={() => setDismissed((prev) => [...prev, sug.description])}
                className="text-gray-400 hover:text-gray-600 text-[10px] font-medium transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
