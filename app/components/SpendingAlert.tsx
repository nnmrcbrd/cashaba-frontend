"use client";

interface SpendingAlertProps {
  status?: "NORMAL" | "WARNING_80" | "EXCEEDED_100" | null;
  notifications?: {
    id: string;
    type: "warning" | "danger" | "info";
    title: string;
    message: string;
  }[];
  dismissedIds?: string[];
  onDismiss?: (id: string) => void;
}

export default function SpendingAlert({ status, notifications = [], dismissedIds = [], onDismiss }: SpendingAlertProps) {
  const visibleAlerts = notifications.filter(Boolean);

  const statusAlert =
    status === "EXCEEDED_100"
      ? {
          id: "budget-status",
          type: "danger" as const,
          title: "🚨 Budget Exceeded!",
          message: "You've exceeded your monthly budget limit. Pause discretionary spending immediately.",
        }
      : status === "WARNING_80"
      ? {
          id: "budget-status",
          type: "warning" as const,
          title: "⚠️ Approaching Budget Limit",
          message: "You've used 80% of your monthly budget. Slow down spending to stay on track.",
        }
      : null;

  const allAlerts = [
    ...(statusAlert ? [statusAlert] : []),
    ...visibleAlerts,
  ].filter(
    (alert, index, self) => !dismissedIds.includes(alert.id) && index === self.findIndex((a) => a.id === alert.id)
  );

  if (allAlerts.length === 0) return null;

  const alertStyles = {
    danger: {
      wrapper: "bg-rose-50 border-rose-200",
      title: "text-rose-800",
      message: "text-rose-700",
      dismiss: "text-rose-400 hover:text-rose-700",
    },
    warning: {
      wrapper: "bg-amber-50 border-amber-200",
      title: "text-amber-800",
      message: "text-amber-700",
      dismiss: "text-amber-400 hover:text-amber-700",
    },
    info: {
      wrapper: "bg-blue-50 border-blue-200",
      title: "text-blue-800",
      message: "text-blue-700",
      dismiss: "text-blue-400 hover:text-blue-700",
    },
  };

  return (
    <div className="space-y-2 mb-5">
      {allAlerts.map((alert) => {
        const s = alertStyles[alert.type];
        return (
          <div
            key={alert.id}
            className={`flex items-start justify-between gap-3 px-4 py-3 rounded-xl border ${s.wrapper} transition-all duration-300`}
          >
            <div className="flex-1">
              <p className={`text-xs font-bold ${s.title}`}>{alert.title}</p>
              <p className={`text-[11px] mt-0.5 ${s.message}`}>{alert.message}</p>
            </div>
            {onDismiss && (
              <button
                type="button"
                onClick={() => onDismiss(alert.id)}
                className={`text-sm shrink-0 transition ${s.dismiss}`}
                aria-label="Dismiss"
              >
                ✕
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
