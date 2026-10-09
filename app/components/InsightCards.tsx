"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";
import FinancialInsightCard, { type FinancialInsightTone } from "./FinancialInsightCard";

interface Insight {
  id: string;
  icon: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "tip";
}

const insightTones: Record<Insight["type"], FinancialInsightTone> = {
  info: "blue",
  success: "emerald",
  warning: "amber",
  tip: "violet",
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
          <FinancialInsightCard
            key={insight.id}
            title={insight.title}
            message={insight.message}
            icon={insight.icon}
            tone={insightTones[insight.type] || insightTones.info}
            className="transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
            style={{ animationDelay: `${idx * 100}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
