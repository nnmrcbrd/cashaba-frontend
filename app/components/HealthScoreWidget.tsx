"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";

interface HealthScore {
  score: number;
  grade: string;
  label: string;
  color: string;
  breakdown: {
    safeToSpend: number;
    savings: number;
    spending: number;
    debt: number;
  };
}

export default function HealthScoreWidget() {
  const [data, setData] = useState<HealthScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    async function fetchScore() {
      try {
        const res = await apiClient.get("/user/health-score");
        setData(res.data);
      } catch (err) {
        console.warn("Health score fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchScore();
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-pulse h-40" />
    );
  }

  if (!data) return null;

  // SVG circle gauge values
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (data.score / 100) * circumference;

  const breakdownItems = [
    { label: "Safe-to-Spend", pts: data.breakdown.safeToSpend, max: 30 },
    { label: "Savings", pts: data.breakdown.savings, max: 30 },
    { label: "Spending Control", pts: data.breakdown.spending, max: 25 },
    { label: "Debt Load", pts: data.breakdown.debt, max: 15 },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">
          Financial Health
        </p>
        <button
          onClick={() => setShowBreakdown((p) => !p)}
          className="text-[10px] font-semibold text-gray-400 hover:text-gray-700 transition"
        >
          {showBreakdown ? "Hide" : "Details"}
        </button>
      </div>

      {/* Circular Gauge */}
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <svg width="88" height="88" viewBox="0 0 88 88">
            {/* Background circle */}
            <circle
              cx="44"
              cy="44"
              r={radius}
              fill="none"
              stroke="#f3f4f6"
              strokeWidth="8"
            />
            {/* Score arc */}
            <circle
              cx="44"
              cy="44"
              r={radius}
              fill="none"
              stroke={data.color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 44 44)"
              style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
            />
          </svg>
          {/* Score text center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-extrabold" style={{ color: data.color }}>
              {data.grade}
            </span>
            <span className="text-[10px] text-gray-400 font-semibold">{data.score}/100</span>
          </div>
        </div>

        <div>
          <p className="text-sm font-bold text-gray-900">{data.label}</p>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
            Your overall financial health score based on spending, savings, and debt.
          </p>
        </div>
      </div>

      {/* Breakdown */}
      {showBreakdown && (
        <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
          {breakdownItems.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-gray-600 font-medium">{item.label}</span>
                <span className="font-bold text-gray-800">
                  {item.pts}/{item.max}
                </span>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${(item.pts / item.max) * 100}%`,
                    backgroundColor: data.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
