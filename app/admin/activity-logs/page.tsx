"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/app/components/ui/AdminSidebar";
import { useAuth } from "@/context/Authcontext";
import apiClient from "@/lib/apiClient";
import { adminActivityDetails, type AdminAuditEntry, type AuditUser } from "@/lib/adminActivity";

export default function AdminActivityLogsPage() {
  const { user, loading: authLoading } = useAuth();
  const [result, setResult] = useState<{ userId: string; entries: AdminAuditEntry[]; users: AuditUser[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [query, setQuery] = useState("");
  const userId = user?.id;
  const isAdmin = user?.accountRole === "ADMIN";

  useEffect(() => {
    if (authLoading || !isAdmin || !userId) return;
    let active = true;
    async function loadActivity() {
      setLoading(true);
      setError("");
      try {
        const [audit, directory] = await Promise.all([
          apiClient.get<AdminAuditEntry[]>("/users/admin/audit-log"),
          apiClient.get<{ users: AuditUser[] }>("/users/admin/manage-users"),
        ]);
        if (active) setResult({ userId: userId!, entries: audit.data, users: directory.data.users });
      } catch {
        if (active) setError("Unable to load activity logs. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadActivity();
    return () => { active = false; };
  }, [authLoading, isAdmin, userId, revision]);

  // RouteGuard and the API restrict this page to administrators.
  if (!isAdmin) return null;
  const current = result?.userId === userId ? result : null;
  const pending = authLoading || loading || (!current && !error);
  const users = new Map((current?.users ?? []).map((entry) => [entry.id, entry]));
  const rows = (current?.entries ?? []).map((entry) => ({ entry, ...adminActivityDetails(entry, users) }));
  const search = query.trim().toLowerCase();
  const filtered = rows.filter((row) => [row.action, row.targetName, row.targetEmail, row.targetId, row.change, row.entry.actor.firstName, row.entry.actor.lastName, row.entry.actor.email]
    .some((value) => value?.toLowerCase().includes(search)));

  return (
    <div className="flex min-h-screen font-sans">
      <AdminSidebar />
      <main className="app-main">
        <div className="app-page-header mb-6 pb-2">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 uppercase">Activity Logs</h1>
          <p className="mt-2 text-sm text-gray-500">Administrator actions, newest first. Showing the latest 100 records.</p>
        </div>
        <section aria-label="Administrator activity" className="rounded-3xl border border-gray-200/90 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div className="w-full sm:w-80">
              <label htmlFor="activity-search" className="mb-2 block text-xs font-semibold text-gray-700">Search activity</label>
              <input id="activity-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="User, administrator, action or status" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
            </div>
            <button type="button" disabled={pending} onClick={() => setRevision((value) => value + 1)} className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">{pending ? "Loading…" : "Refresh logs"}</button>
          </div>
          {error ? <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>
            : pending ? <p role="status" className="py-10 text-center text-sm text-gray-500">Loading administrator activity…</p>
            : <>
              <p role="status" className="mb-3 text-xs text-gray-500">{filtered.length} of {rows.length} loaded records · Times shown in Philippine time (Asia/Manila).</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <caption className="sr-only">Recent administrator actions and recorded changes</caption>
                  <thead className="border-b border-gray-100 text-gray-900"><tr>{["Date & time (PHT)", "Administrator", "Action", "Affected user", "Recorded change"].map((label) => <th key={label} scope="col" className="px-3 py-3 font-bold">{label}</th>)}</tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((row) => <tr key={row.entry.id} className="align-top hover:bg-gray-50/50">
                      <td className="whitespace-nowrap px-3 py-4 text-gray-600"><time dateTime={row.entry.createdAt}>{new Date(row.entry.createdAt).toLocaleString("en-PH", { timeZone: "Asia/Manila", year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit" })}</time></td>
                      <td className="px-3 py-4"><p className="font-semibold text-gray-900">{[row.entry.actor.firstName, row.entry.actor.lastName].filter(Boolean).join(" ")}</p><p className="mt-1 break-all text-gray-500">{row.entry.actor.email}</p></td>
                      <td className="px-3 py-4 font-semibold text-gray-800">{row.action}</td>
                      <td className="px-3 py-4"><p className="font-semibold text-gray-900">{row.targetName}</p>{row.targetEmail ? <p className="mt-1 break-all text-gray-500">{row.targetEmail}</p> : row.targetId && <p className="mt-1 break-all text-gray-500">ID: {row.targetId}</p>}</td>
                      <td className="px-3 py-4 font-semibold text-gray-700">{row.change}</td>
                    </tr>)}
                    {filtered.length === 0 && <tr><td colSpan={5} className="px-3 py-10 text-center text-gray-500">{rows.length === 0 ? "No administrator actions recorded yet." : "No activity matches your search."}</td></tr>}
                  </tbody>
                </table>
              </div>
            </>}
        </section>
      </main>
    </div>
  );
}
