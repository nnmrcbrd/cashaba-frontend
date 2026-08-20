"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";

interface Insight {
  id: string;
  icon: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "tip";
}

const typeStyles: Record<string, string> = {
  info: "from-blue-50 to-indigo-50 border-blue-200 text-blue-900",
  success: "from-emerald-50 to-teal-50 border-emerald-200 text-emerald-900",
  warning: "from-amber-50 to-orange-50 border-amber-200 text-amber-900",
  tip: "from-purple-50 to-violet-50 border-purple-200 text-purple-900",
};

export default function InsightCards() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInsights() {
      try {
        const res = await apiClient.get("/ai/insights");
        if (res.data?.insights) setInsights(res.data.insights);
      } catch (err) {
        console.warn("Insights fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-gray-100 h-24 rounded-2xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (insights.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
          ✨ AI Insights
        </span>
        <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
          Personalized
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {insights.map((insight, idx) => (
          <div
            key={insight.id}
            className={`bg-gradient-to-br ${typeStyles[insight.type] || typeStyles.info} border rounded-2xl p-4 flex gap-3 items-start shadow-sm
              transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <span className="text-xl shrink-0">{insight.icon}</span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-0.5">
                {insight.title}
              </p>
              <p className="text-xs font-medium leading-relaxed">{insight.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
