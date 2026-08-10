"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "../components/ui/sidebar";
import { useAuth } from "@/context/Authcontext";
import { ROUTES } from "@/constants/index";
import { incomeSetupService } from "@/services/incomeSetupService";
import apiClient from "@/lib/apiClient";

const TABS = ["Profile", "Income", "Preferences", "Security"] as const;
const ROLE_OPTIONS = ["Student", "Freelance", "Working", "Married"] as const;

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Profile");

  // Profile Form state matching Figma fields
  const [fullName, setFullName] = useState(user?.name ?? "");
  const [phoneOrEmail, setPhoneOrEmail] = useState(user?.phone || user?.email || "");
  const [gender, setGender] = useState(user?.gender ?? "");
  const [address, setAddress] = useState(user?.address ?? "");
  const [selectedRoles, setSelectedRoles] = useState<string[]>(user?.role || ["Working"]);
  const [profileMsg, setProfileMsg] = useState("");

  // Income Form state
  const [income, setIncome] = useState("25000");
  const [period, setPeriod] = useState<"weekly" | "monthly">("monthly");
  const [incomeLoading, setIncomeLoading] = useState(false);
  const [incomeMsg, setIncomeMsg] = useState("");

  // Preferences state
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [prefMsg, setPrefMsg] = useState("");

  useEffect(() => {
    if (user) {
      setFullName(user.name || "");
      setPhoneOrEmail(user.phone || user.email || "");
      setGender(user.gender || "");
      setAddress(user.address || "");
      setSelectedRoles(user.role || ["Working"]);
    }
  }, [user]);

  useEffect(() => {
    async function loadIncome() {
      try {
        const data = await incomeSetupService.getIncomeSetup();
        if (data.setup) {
          setIncome(data.setup.totalIncome.toString());
          setPeriod((data.setup.incomePeriod as any) || "monthly");
        }
      } catch (err) {
        console.error("Failed to load income setup", err);
      }
    }
    loadIncome();
  }, []);

  function toggleRole(roleName: string) {
    setSelectedRoles((prev) =>
      prev.includes(roleName) ? prev.filter((r) => r !== roleName) : [...prev, roleName]
    );
  }

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg("Profile settings updated!");
    setTimeout(() => setProfileMsg(""), 3000);
  }

  async function handleSaveIncome(e: React.FormEvent) {
    e.preventDefault();
    if (!income || Number(income) <= 0) return;
    try {
      setIncomeLoading(true);
      setIncomeMsg("");
      await incomeSetupService.saveIncomeSetup(Number(income), period);
      setIncomeMsg("Income baseline updated!");
      setTimeout(() => setIncomeMsg(""), 3000);
    } catch (err) {
      console.error("Failed to save income setup", err);
      setIncomeMsg("Failed to update income. Try again.");
    } finally {
      setIncomeLoading(false);
    }
  }

  function handleSavePref(e: React.FormEvent) {
    e.preventDefault();
    setPrefMsg("Preferences saved!");
    setTimeout(() => setPrefMsg(""), 3000);
  }

  // Format member since date like "May 2026"
  const memberSinceFormatted = user?.memberSince
    ? new Date(user.memberSince).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "May 2026";

  return (
    <div className="flex min-h-screen bg-[#f7faf8] font-sans">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-2">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 uppercase">SETTINGS</h1>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-gray-200/60 text-gray-600 transition" title="Notifications">
              🔔
            </button>
          </div>
        </div>

        {/* Horizontal Navigation Tabs matching Figma */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-8">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`pb-3 text-xs font-semibold transition relative ${tab === t
                    ? "text-[#186849] font-bold border-b-2 border-[#186849]"
                    : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: Profile Settings matching Figma 1:1 */}
        {tab === "Profile" && (
          <div className="space-y-6">
            {/* Top Card: Profile Settings */}
            <div className="bg-white rounded-3xl border border-gray-200/90 p-8 shadow-sm">
              <div className="mb-6">
                <h2 className="text-base font-bold text-[#186849]">Profile Settings</h2>
                <p className="text-xs text-gray-400 mt-0.5">Manage your personal information.</p>
              </div>

              <form onSubmit={handleSaveProfile}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left Column: Avatar */}
                  <div className="lg:col-span-3 flex flex-col items-center gap-4">
                    <div className="h-28 w-28 rounded-full overflow-hidden border-2 border-gray-200 shadow-sm relative bg-gray-100 flex items-center justify-center">
                      <span className="text-3xl font-bold text-[#186849]">
                        {user?.name ? user.name.split(" ").map(n => n[0]).join("") : "AC"}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="border border-emerald-600 text-emerald-700 bg-white hover:bg-emerald-50 px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
                    >
                      <span>📤</span> Upload Photo
                    </button>
                  </div>

                  {/* Middle Column: Inputs */}
                  <div className="lg:col-span-5 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number / Email Address</label>
                      <input
                        type="text"
                        value={phoneOrEmail}
                        onChange={(e) => setPhoneOrEmail(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Gender</label>
                      <input
                        type="text"
                        placeholder="Female / Male / Prefer not to say"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition"
                      />
                    </div>

                    {profileMsg && <p className="text-xs text-emerald-700 font-semibold">{profileMsg}</p>}

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="bg-[#186849] hover:bg-[#13543b] text-white text-xs font-semibold px-6 py-2 rounded-lg shadow-sm transition"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Roles & Address */}
                  <div className="lg:col-span-4 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Role</label>
                      <div className="grid grid-cols-2 gap-3">
                        {ROLE_OPTIONS.map((r) => {
                          const checked = selectedRoles.includes(r);
                          return (
                            <button
                              type="button"
                              key={r}
                              onClick={() => toggleRole(r)}
                              className={`border rounded-lg px-3 py-2 text-xs font-medium text-left flex items-center gap-2 transition ${checked
                                  ? "border-emerald-600 bg-emerald-50/50 text-gray-900"
                                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                              <span className={`h-3.5 w-3.5 rounded border flex items-center justify-center text-[10px] ${checked ? "bg-emerald-600 border-emerald-600 text-white" : "border-gray-400"
                                }`}>
                                {checked ? "✓" : ""}
                              </span>
                              <span>{r}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Address</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition"
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Bottom Card: Account Summary matching Figma 1:1 */}
            <div className="bg-white rounded-3xl border border-gray-200/90 p-6 shadow-sm max-w-xl">
              <div className="mb-4">
                <h2 className="text-base font-bold text-gray-900">Account Summary</h2>
                <p className="text-xs text-gray-400">Your account overview</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200/80 p-4 divide-y divide-gray-100 text-xs">
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2 text-gray-700 font-medium">
                    <span>📅</span>
                    <span>Member Since</span>
                  </div>
                  <span className="font-semibold text-gray-900">{memberSinceFormatted}</span>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2 text-gray-700 font-medium">
                    <span>👤</span>
                    <span>Account Type</span>
                  </div>
                  <span className="font-semibold text-gray-900">{user?.accountType || "Standard User"}</span>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2 text-gray-700 font-medium">
                    <span>🛡️</span>
                    <span>Status</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold text-gray-900">
                    <span>Active</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Income Setup */}
        {tab === "Income" && (
          <div className="bg-white rounded-3xl border border-gray-200/90 p-8 shadow-sm max-w-xl">
            <h2 className="text-base font-bold text-[#186849] mb-1">Income & Allowance Setup</h2>
            <p className="text-xs text-gray-400 mb-6">Manage total income and allocation period for Safe-to-Spend calculations.</p>

            <form onSubmit={handleSaveIncome} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Income Amount (₱)</label>
                <input
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Allocation Period</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPeriod("weekly")}
                    className={`py-2.5 rounded-lg text-xs font-bold border transition ${period === "weekly"
                        ? "bg-emerald-50 border-emerald-600 text-emerald-900 shadow-sm"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                  >
                    Weekly
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeriod("monthly")}
                    className={`py-2.5 rounded-lg text-xs font-bold border transition ${period === "monthly"
                        ? "bg-emerald-50 border-emerald-600 text-emerald-900 shadow-sm"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                  >
                    Monthly
                  </button>
                </div>
              </div>

              {incomeMsg && (
                <p className={`text-xs font-semibold ${incomeMsg.includes("Failed") ? "text-red-600" : "text-emerald-700"}`}>
                  {incomeMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={incomeLoading}
                className="bg-[#186849] hover:bg-[#13543b] disabled:opacity-50 text-white text-xs font-semibold px-6 py-2.5 rounded-lg shadow-sm transition"
              >
                {incomeLoading ? "Saving..." : "Save Income Baseline"}
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Preferences */}
        {tab === "Preferences" && (
          <div className="bg-white rounded-3xl border border-gray-200/90 p-8 shadow-sm max-w-xl">
            <h2 className="text-base font-bold text-[#186849] mb-1">Preferences</h2>
            <p className="text-xs text-gray-400 mb-6">Manage notification and budget alert preferences.</p>

            <form onSubmit={handleSavePref} className="space-y-4">
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 hover:bg-gray-50 cursor-pointer">
                <div>
                  <p>Budget Threshold Alerts</p>
                  <p className="text-[11px] text-gray-400 font-normal">Notify when spending reaches 80% or 100% of limits</p>
                </div>
                <input
                  type="checkbox"
                  checked={budgetAlerts}
                  onChange={(e) => setBudgetAlerts(e.target.checked)}
                  className="h-4 w-4 accent-emerald-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 hover:bg-gray-50 cursor-pointer">
                <div>
                  <p>Weekly Summary Email</p>
                  <p className="text-[11px] text-gray-400 font-normal">Receive weekly breakdown of Safe-to-Spend</p>
                </div>
                <input
                  type="checkbox"
                  checked={weeklySummary}
                  onChange={(e) => setWeeklySummary(e.target.checked)}
                  className="h-4 w-4 accent-emerald-600 rounded cursor-pointer"
                />
              </label>

              {prefMsg && <p className="text-xs text-emerald-700 font-semibold">{prefMsg}</p>}

              <button
                type="submit"
                className="bg-[#186849] hover:bg-[#13543b] text-white text-xs font-semibold px-6 py-2.5 rounded-lg shadow-sm transition"
              >
                Save Preferences
              </button>
            </form>
          </div>
        )}

        {/* Tab 4: Security */}
        {tab === "Security" && (
          <div className="bg-white rounded-3xl border border-gray-200/90 p-8 shadow-sm max-w-xl space-y-4">
            <h2 className="text-base font-bold text-[#186849]">Security Settings</h2>
            <p className="text-xs text-gray-400">Keep your account and data safe.</p>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-emerald-900">Change Password</p>
                <p className="text-emerald-700 text-[11px]">Update password for security</p>
              </div>
              <Link
                href={ROUTES.CHANGE_PASSWORD}
                className="bg-[#186849] hover:bg-[#13543b] text-white font-semibold px-4 py-2 rounded-lg text-xs transition shadow-sm"
              >
                Update Password
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

async function handleUpgradeToPro() {
  const res = await apiClient.post('/payments/checkout-pro');
  if (res.data.checkoutUrl) {
    window.location.href = res.data.checkoutUrl; // Redirects to PayMongo GCash/Maya page
  }
}
