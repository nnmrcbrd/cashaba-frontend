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
  location: string;
  joinedDate: string;
  status: "Active" | "Inactive";
}

interface AdminMetrics {
  totalUsers: number;
  totalTransactions: number;
  monthTransactions: number;
  activeUsers: number;
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

export default function AdminManageUsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([
    { id: "1", name: "Marian Rivera", email: "Cebu City, PH", location: "Cebu City, PH", joinedDate: "April 23, 2026", status: "Active" },
    { id: "2", name: "Mary Jane Lastimosa", email: "Lapu-Lapu City, PH", location: "Lapu-Lapu City, PH", joinedDate: "April 20, 2026", status: "Active" },
    { id: "3", name: "Mary Kris Msch", email: "Cordova PH", location: "Cordova PH", joinedDate: "April 20, 2026", status: "Inactive" },
    { id: "4", name: "Joy Jung", email: "Lapu-Lapu City, PH", location: "Lapu-Lapu City, PH", joinedDate: "April 20, 2026", status: "Active" },
  ]);

  const [metrics, setMetrics] = useState<AdminMetrics>({
    totalUsers: 1256,
    totalTransactions: 15320,
    monthTransactions: 6421,
    activeUsers: 892,
  });

  const [locations, setLocations] = useState<LocationCount[]>([
    { location: "Cordova", count: 240 },
    { location: "Cebu City", count: 210 },
    { location: "Lapu-Lapu City", count: 150 },
    { location: "Mandaue City", count: 120 },
  ]);

  const [chartData, setChartData] = useState<ChartBar[]>([
    { date: "April 1", green: 4500, gray: 2800 },
    { date: "April 15", green: 4200, gray: 2900 },
    { date: "April 22", green: 4000, gray: 2600 },
    { date: "April 30", green: 4600, gray: 3100 },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

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
        const res = await apiClient.get("/users/admin/manage-users");
        if (res.data) {
          if (res.data.users && res.data.users.length > 0) {
            setUsers(res.data.users);
          }
          if (res.data.metrics) setMetrics(res.data.metrics);
          if (res.data.locationBreakdown) setLocations(res.data.locationBreakdown);
          if (res.data.chartData) setChartData(res.data.chartData);
        }
      } catch (err) {
        console.error("Failed to load admin management data", err);
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, []);

  function toggleUserStatus(userId: string) {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, status: u.status === "Active" ? "Inactive" : "Active" } : u
      )
    );
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#f7faf8] font-sans">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header matching Figma */}
        <div className="mb-6 pb-2">
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">{u.name}</td>
                    <td className="py-3.5 px-4 text-gray-600">{u.email}</td>
                    <td className="py-3.5 px-4 text-gray-600">{u.joinedDate}</td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => toggleUserStatus(u.id)}
                        className={`font-bold text-xs cursor-pointer ${
                          u.status === "Active" ? "text-emerald-600 hover:text-emerald-700" : "text-red-500 hover:text-red-600"
                        }`}
                      >
                        {u.status}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: 4 Summary Cards matching Figma 1:1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">Total Users</p>
            <p className="mt-2 text-2xl font-extrabold text-gray-900">{metrics.totalUsers.toLocaleString()}</p>
            <p className="mt-1 text-[10px] text-emerald-600 font-semibold">↑ +12 this week</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">Total Transactions</p>
            <p className="mt-2 text-2xl font-extrabold text-gray-900">{metrics.totalTransactions.toLocaleString()}</p>
            <p className="mt-1 text-[10px] text-emerald-600 font-semibold">↑ +323 this week</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">Transactions (This Month)</p>
            <p className="mt-2 text-2xl font-extrabold text-gray-900">{metrics.monthTransactions.toLocaleString()}</p>
            <p className="mt-1 text-[10px] text-gray-400">Current month volume</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">Active Users</p>
            <p className="mt-2 text-2xl font-extrabold text-gray-900">{metrics.activeUsers.toLocaleString()}</p>
            <p className="mt-1 text-[10px] text-emerald-600 font-semibold">↑ 71% of total</p>
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
                      style={{ height: `${(bar.green / 8000) * 100}%` }}
                    />
                    <div
                      className="w-8 bg-gray-200 rounded-t-md transition-all group-hover:bg-gray-300"
                      style={{ height: `${(bar.gray / 8000) * 100}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-gray-600 font-semibold">{bar.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Users by Location */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200/90 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Users by Location</h3>

            <div className="divide-y divide-gray-100 text-xs">
              {locations.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-3">
                  <span className="font-semibold text-gray-800">{item.location}</span>
                  <span className="font-bold text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
