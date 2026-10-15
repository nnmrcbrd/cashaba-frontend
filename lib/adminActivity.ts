export interface AdminAuditEntry {
  id: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  actor: { firstName: string; lastName?: string | null; email: string };
}

export interface AuditUser {
  id: string;
  name: string;
  email: string;
}

const statusLabels: Record<string, string> = {
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
};

function recordedStatus(value: unknown) {
  return typeof value === "string" ? statusLabels[value] ?? "Not recorded" : "Not recorded";
}

export function adminActivityDetails(entry: AdminAuditEntry, users: ReadonlyMap<string, AuditUser>) {
  const target = entry.targetType === "User" && entry.targetId ? users.get(entry.targetId) : undefined;
  const action = entry.action === "USER_STATUS_CHANGED" ? "User status changed"
    : entry.action === "SUBSCRIPTION_CANCELLED" ? "Subscription cancelled"
    : entry.action.replaceAll("_", " ").toLowerCase();
  return {
    action,
    targetName: target?.name || (entry.targetType === "User" ? "User unavailable" : entry.targetType),
    targetEmail: target?.email ?? null,
    targetId: entry.targetId ?? null,
    change: entry.action === "USER_STATUS_CHANGED"
      ? `${recordedStatus(entry.metadata?.previousStatus)} → ${recordedStatus(entry.metadata?.newStatus)}`
      : entry.action === "SUBSCRIPTION_CANCELLED" ? "Subscription cancellation recorded" : "—",
  };
}
