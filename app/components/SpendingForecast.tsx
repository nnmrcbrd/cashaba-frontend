"use client";

interface SpendingForecastProps {
  transactions: {
    type: string;
    amount: number;
    date?: string;
    createdAt?: string;
  }[];
  totalIncome: number;
}

export default function SpendingForecast({ transactions, totalIncome }: SpendingForecastProps) {
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = daysInMonth - dayOfMonth;

  // Current month expenses only
  const monthlyExpenses = transactions.filter((t) => {
    const d = new Date(t.date || t.createdAt || "");
    return (
      (t.type === "EXPENSE" || t.type === "expense") &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  });

  const totalSpentSoFar = monthlyExpenses.reduce((s, t) => s + t.amount, 0);
  const dailyAvg = dayOfMonth > 0 ? totalSpentSoFar / dayOfMonth : 0;
  const projectedTotal = totalSpentSoFar + dailyAvg * daysRemaining;
  const projectedPct = totalIncome > 0 ? Math.min(Math.round((projectedTotal / totalIncome) * 100), 150) : 0;
  const isOnTrack = projectedTotal <= totalIncome;

  const barColor = isOnTrack ? "#10b981" : projectedPct >= 120 ? "#ef4444" : "#f59e0b";
  const barWidth = Math.min(projectedPct, 100);

  return (
    <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-900">📈 Spending Forecast</h2>
        <span
          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
            isOnTrack
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }`}
        >
          {isOnTrack ? "ON TRACK ✅" : "OVER BUDGET ⚠️"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="text-center">
          <p className="text-[11px] text-gray-500 font-medium mb-1">Spent So Far</p>
          <p className="text-xl font-extrabold text-gray-900">
            ₱{totalSpentSoFar.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-gray-400">Day {dayOfMonth} of {daysInMonth}</p>
        </div>
        <div className="text-center">
          <p className="text-[11px] text-gray-500 font-medium mb-1">Daily Average</p>
          <p className="text-xl font-extrabold text-blue-700">
            ₱{dailyAvg.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-gray-400">per day</p>
        </div>
        <div className="text-center">
          <p className="text-[11px] text-gray-500 font-medium mb-1">Projected Month-End</p>
          <p className="text-xl font-extrabold" style={{ color: barColor }}>
            ₱{projectedTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-gray-400">{projectedPct}% of income</p>
        </div>
      </div>

      {/* Forecast Progress Bar */}
      <div className="relative">
        <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
          {/* Actual spent */}
          <div
            className="h-full rounded-l-full transition-all duration-700"
            style={{
              width: `${Math.min(Math.round((totalSpentSoFar / (totalIncome || 1)) * 100), 100)}%`,
              backgroundColor: "#10b981",
            }}
          />
        </div>
        {/* Projected marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-gray-700"
          style={{ left: `${barWidth}%` }}
          title={`Projected: ${projectedPct}%`}
        />
      </div>

      <div className="flex items-center justify-between mt-2 text-[10px] text-gray-400">
        <span>₱0</span>
        <span className="font-medium text-gray-600">
          {daysRemaining} days remaining this month
        </span>
        <span>₱{totalIncome.toLocaleString()}</span>
      </div>

      <p className="mt-3 text-[11px] text-gray-500 bg-gray-50 rounded-xl p-3 border border-gray-100">
        {isOnTrack
          ? `At your current daily average of ₱${dailyAvg.toLocaleString("en-US", { minimumFractionDigits: 0 })}, you're projected to spend ₱${projectedTotal.toLocaleString("en-US", { minimumFractionDigits: 0 })} by month-end — within your income. 🎉`
          : `At your current rate, you're projected to overspend by ₱${(projectedTotal - totalIncome).toLocaleString("en-US", { minimumFractionDigits: 0 })} this month. Consider reducing discretionary expenses.`}
      </p>
    </div>
  );
}
