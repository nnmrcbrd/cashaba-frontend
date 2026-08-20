"use client";

import { useState } from "react";
import ConfettiCelebration from "./ConfettiCelebration";

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  monthlyAllocation: number;
  isCompleted: boolean;
  createdAt?: string;
}

interface SavingsGoalCardProps {
  goal: SavingsGoal;
  onDeposit: (goal: SavingsGoal) => void;
  onDelete: (id: string) => void;
}

const MILESTONE_PTS = [25, 50, 75, 100];

function getMilestoneLabel(pct: number): string | null {
  if (pct >= 100) return "🏆 Goal Complete!";
  if (pct >= 75) return "🔥 Almost There!";
  if (pct >= 50) return "⚡ Halfway!";
  if (pct >= 25) return "🌱 Great Start!";
  return null;
}

export default function SavingsGoalCard({ goal, onDeposit, onDelete }: SavingsGoalCardProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  const pct = goal.targetAmount > 0
    ? Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100)
    : 0;

  const milestoneLabel = getMilestoneLabel(pct);
  const hitMilestone = MILESTONE_PTS.includes(pct);

  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
  const monthsToComplete =
    goal.monthlyAllocation > 0 && remaining > 0
      ? Math.ceil(remaining / goal.monthlyAllocation)
      : null;

  // Color based on progress
  const progressColor = pct >= 100
    ? "#10b981"
    : pct >= 75
    ? "#3b82f6"
    : pct >= 50
    ? "#8b5cf6"
    : "#f59e0b";

  // SVG ring values
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <>
      <ConfettiCelebration active={showConfetti} onComplete={() => setShowConfetti(false)} />

      <div
        className={`bg-white border rounded-2xl p-5 shadow-sm transition-all duration-300 hover:shadow-md
          ${goal.isCompleted ? "border-emerald-300 bg-emerald-50/30" : "border-gray-100"}`}
      >
        <div className="flex items-start gap-4">
          {/* Circular Progress Ring */}
          <div className="relative shrink-0">
            <svg width="72" height="72" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="6" />
              <circle
                cx="36"
                cy="36"
                r={radius}
                fill="none"
                stroke={progressColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 36 36)"
                style={{ transition: "stroke-dashoffset 0.8s ease-in-out" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-extrabold" style={{ color: progressColor }}>
                {pct}%
              </span>
            </div>
          </div>

          {/* Goal Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-gray-900 truncate">{goal.name}</h3>
                {milestoneLabel && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 inline-block"
                    style={{ backgroundColor: `${progressColor}20`, color: progressColor }}
                  >
                    {milestoneLabel}
                  </span>
                )}
              </div>
              {goal.isCompleted && (
                <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full shrink-0">
                  ✅ Done
                </span>
              )}
            </div>

            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span>
                  <strong className="text-gray-900">
                    ₱{goal.currentAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </strong>{" "}
                  saved
                </span>
                <span className="text-gray-400">
                  of ₱{goal.targetAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>

              {monthsToComplete && !goal.isCompleted && (
                <p className="text-[10px] text-gray-400">
                  ~{monthsToComplete} month{monthsToComplete !== 1 ? "s" : ""} to complete at ₱{goal.monthlyAllocation.toLocaleString()} /mo
                </p>
              )}
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  onDeposit(goal);
                  if (hitMilestone) setShowConfetti(true);
                }}
                disabled={goal.isCompleted}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-[11px] font-bold py-1.5 rounded-lg transition"
              >
                + Add Funds
              </button>
              <button
                onClick={() => onDelete(goal.id)}
                className="px-2.5 py-1.5 border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 text-[11px] rounded-lg transition"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
