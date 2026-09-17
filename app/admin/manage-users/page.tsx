"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/app/components/ui/AdminSidebar";
import apiClient from "@/lib/apiClient";
import { useAuth } from "@/context/Authcontext";
import { ROUTES } from "@/constants/index";

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  joinedDate: string;
  status: "Active" | "Inactive";
  lastActiveAt?: string | null;
}

interface AdminMetrics {
  totalUsers: number;
  totalTransactions: number;
  monthTransactions: number;
  activeUsers: number;
  newUsersThisWeek?: number;
  weekTransactions?: number;
}

interface LocationCount {
  location: string;
  count: number;
}

interface ChartBar {
  date: string;
  green: number;
  gray: number;
}

interface AuditEntry {
  id: string;
  action: string;
  targetId?: string | null;
  createdAt: string;
  actor: { firstName: string; lastName?: string | null; email: string };
}

export default function AdminManageUsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);

  const [metrics, setMetrics] = useState<AdminMetrics>({
    totalUsers: 0,
    totalTransactions: 0,
    monthTransactions: 0,
    activeUsers: 0,
  });

  const [locations, setLocations] = useState<LocationCount[]>([]);

  const [chartData, setChartData] = useState<ChartBar[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [adminMessage, setAdminMessage] = useState("");
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user && user.accountRole !== "ADMIN") {
      router.push(ROUTES.DASHBOARD);
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadAdminData() {
      try {
        setLoading(true);
        const [res, audit] = await Promise.all([
          apiClient.get("/users/admin/manage-users"),
          apiClient.get("/users/admin/audit-log"),
        ]);
        if (res.data) {
          setUsers(res.data.users || []);
          if (res.data.metrics) setMetrics(res.data.metrics);
          if (res.data.locationBreakdown) setLocations(res.data.locationBreakdown);
          if (res.data.chartData) setChartData(res.data.chartData);
        }
        setAuditLog(audit.data || []);
      } catch (err) {
        console.error("Failed to load admin management data", err);
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const chartMaximum = Math.max(1, ...chartData.flatMap((bar) => [bar.green, bar.gray]));

  async function toggleStatus(managedUser: ManagedUser) {
    const nextStatus = managedUser.status === "Active" ? "SUSPENDED" : "ACTIVE";
    try {
      setBusyUserId(managedUser.id);
      setAdminMessage("");
      await apiClient.patch(`/users/admin/users/${managedUser.id}/status`, { status: nextStatus });
      setUsers((current) => current.map((item) => item.id === managedUser.id ? { ...item, status: nextStatus === "ACTIVE" ? "Active" : "Inactive" } : item));
      setAdminMessage(`${managedUser.name} is now ${nextStatus === "ACTIVE" ? "active" : "suspended"}.`);
      const audit = await apiClient.get("/users/admin/audit-log");
      setAuditLog(audit.data || []);
    } catch {
      setAdminMessage("Unable to change this account status.");
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <div className="flex min-h-screen font-sans">
      <AdminSidebar />
      <main className="app-main">
        {/* Header matching Figma */}
        <div className="app-page-header mb-6 pb-2">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 uppercase">MANAGE USERS</h1>
        </div>

        {/* Section 1: Manage Users Table matching Figma 1:1 */}
        <div className="bg-white rounded-3xl border border-gray-200/90 p-6 shadow-sm mb-6">
          <div className="flex justify-end mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search user"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-10 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-gray-700 font-bold border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4 font-bold text-gray-900">Name</th>
                  <th className="py-3 px-4 font-bold text-gray-900">Email</th>
                  <th className="py-3 px-4 font-bold text-gray-900">Joined Date</th>
                  <th className="py-3 px-4 font-bold text-gray-900">Status</th>
                  <th className="py-3 px-4 font-bold text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading users...</td></tr>
                )}
                {!loading && filteredUsers.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No users found.</td></tr>
                )}
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">{u.name}</td>
                    <td className="py-3.5 px-4 text-gray-600">{u.email}</td>
                    <td className="py-3.5 px-4 text-gray-600">{u.joinedDate}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-bold text-xs ${
                          u.status === "Active" ? "text-emerald-600 hover:text-emerald-700" : "text-red-500 hover:text-red-600"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4"><button type="button" disabled={busyUserId === u.id || u.id === user?.id} onClick={() => toggleStatus(u)} className={`rounded-lg px-3 py-1.5 font-bold text-white disabled:opacity-40 ${u.status === "Active" ? "bg-red-600" : "bg-emerald-700"}`}>{busyUserId === u.id ? "Saving..." : u.status === "Active" ? "Suspend" : "Reactivate"}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {adminMessage && <p className="mt-3 text-xs font-semibold text-gray-700">{adminMessage}</p>}
        </div>

        {/* Section 2: 4 Summary Cards matching Figma 1:1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">Total Users</p>
            <p className="mt-2 text-2xl font-extrabold text-gray-900">{metrics.totalUsers.toLocaleString()}</p>
            <p className="mt-1 text-[10px] text-emerald-600 font-semibold">+{metrics.newUsersThisWeek || 0} this week</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">Total Transactions</p>
            <p className="mt-2 text-2xl font-extrabold text-gray-900">{metrics.totalTransactions.toLocaleString()}</p>
            <p className="mt-1 text-[10px] text-emerald-600 font-semibold">+{metrics.weekTransactions || 0} this week</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">Transactions (This Month)</p>
            <p className="mt-2 text-2xl font-extrabold text-gray-900">{metrics.monthTransactions.toLocaleString()}</p>
            <p className="mt-1 text-[10px] text-gray-400">Current month volume</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">Active Users</p>
            <p className="mt-2 text-2xl font-extrabold text-gray-900">{metrics.activeUsers.toLocaleString()}</p>
            <p className="mt-1 text-[10px] text-gray-400">Signed in during the last 30 days</p>
          </div>
        </div>

        {/* Section 3: Bottom Analytics Grid matching Figma 1:1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Transactions Overview Bar Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-200/90 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Transactions Overview (Count Only)</h3>

            {/* Bar Chart Graphics */}
            <div className="h-56 w-full flex items-end justify-around border-b border-gray-200 pb-4 pt-6 px-4">
              {chartData.map((bar, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 group">
                  <div className="flex items-end gap-1.5 h-40">
                    <div
                      className="w-8 bg-[#186849] rounded-t-md transition-all group-hover:bg-[#13543b]"
                      style={{ height: `${(bar.green / chartMaximum) * 100}%` }}
                    />
                    <div
                      className="w-8 bg-gray-200 rounded-t-md transition-all group-hover:bg-gray-300"
                      style={{ height: `${(bar.gray / chartMaximum) * 100}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-gray-600 font-semibold">{bar.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Users by Location */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200/90 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-1">Users by General Region</h3>
            <p className="mb-4 text-[10px] text-gray-400">Only aggregated, optional region data is shown; single-user groups are suppressed.</p>

            <div className="divide-y divide-gray-100 text-xs">
              {locations.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-3">
                  <span className="font-semibold text-gray-800">{item.location}</span>
                  <span className="font-bold text-gray-900">{item.count}</span>
                </div>
              ))}
              {locations.length === 0 && (
                <p className="py-6 text-center text-[11px] text-gray-400">Location data is not collected.</p>
              )}
            </div>
          </div>
        </div>
        <div className="mt-6 rounded-3xl border border-gray-200/90 bg-white p-6 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-gray-900">Recent Administrator Actions</h3>
          <div className="divide-y divide-gray-100 text-xs">
            {auditLog.slice(0, 10).map((entry) => <div key={entry.id} className="flex flex-wrap justify-between gap-2 py-3"><span className="font-semibold text-gray-800">{entry.action.replaceAll("_", " ")}</span><span className="text-gray-500">{entry.actor.email} · {new Date(entry.createdAt).toLocaleString()}</span></div>)}
            {!loading && auditLog.length === 0 && <p className="py-4 text-gray-400">No administrator actions recorded yet.</p>}
          </div>
        </div>
      </main>
    </div>
  );
}
