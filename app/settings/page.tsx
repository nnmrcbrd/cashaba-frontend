"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import Sidebar from "../components/ui/sidebar";
import { useAuth } from "@/context/Authcontext";
import { ROUTES } from "@/constants/index";
import { incomeSetupService } from "@/services/incomeSetupService";
import apiClient from "@/lib/apiClient";
import axios from "axios";
import { saveExportFile } from '@/lib/nativeFiles';
import { subscriptionService, type SubscriptionSummary } from "@/services/subscriptionService";

const TABS = ["Profile", "Income", "Preferences", "Security"] as const;
const ROLE_OPTIONS = ["Student", "Freelance", "Working", "Married"] as const;

function prepareProfilePhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      reject(new Error("Choose a PNG, JPG, or WebP image."));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error("Choose an image smaller than 5 MB."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The selected image could not be read."));
    reader.onload = () => {
      const source = new window.Image();
      source.onerror = () => reject(new Error("The selected image could not be opened."));
      source.onload = () => {
        const size = 256;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Photo processing is not available in this browser."));
          return;
        }
        const scale = Math.max(size / source.width, size / source.height);
        const width = source.width * scale;
        const height = source.height * scale;
        context.drawImage(source, (size - width) / 2, (size - height) / 2, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      source.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Profile");
  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(null);
  const [planError, setPlanError] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadPlan = () => {
      void subscriptionService.getMine().then((summary) => {
        if (mounted) { setSubscription(summary); setPlanError(false); }
      }).catch(() => { if (mounted) setPlanError(true); });
    };
    loadPlan();
    window.addEventListener("focus", loadPlan);
    return () => { mounted = false; window.removeEventListener("focus", loadPlan); };
  }, []);

  // Profile Form state matching Figma fields
  const [fullName, setFullName] = useState(user?.name ?? "");
  const [gender, setGender] = useState(user?.gender ?? "");
  const [selectedRoles, setSelectedRoles] = useState<string[]>(user?.role || ["Working"]);
  const [customRole, setCustomRole] = useState(user?.customRole ?? "");
  const [region, setRegion] = useState(user?.region ?? "");
  const [avatar, setAvatar] = useState(user?.avatar ?? "");
  const [profileMsg, setProfileMsg] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [privacyMsg, setPrivacyMsg] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Income Form state
  const [income, setIncome] = useState("25000");
  const [period, setPeriod] = useState<"weekly" | "monthly">("monthly");
  const [incomeLoading, setIncomeLoading] = useState(false);
  const [incomeMsg, setIncomeMsg] = useState("");

  // Preferences state
  const [budgetAlerts, setBudgetAlerts] = useState(() =>
    typeof window === "undefined" ? true : localStorage.getItem("casha_budget_alerts") !== "false"
  );
  const [weeklySummary, setWeeklySummary] = useState(() =>
    typeof window === "undefined" ? true : localStorage.getItem("casha_weekly_summary") !== "false"
  );
  const [prefMsg, setPrefMsg] = useState("");

  useEffect(() => {
    async function loadIncome() {
      try {
        const data = await incomeSetupService.getIncomeSetup();
        if (data.setup) {
          setIncome(data.setup.totalIncome.toString());
          setPeriod(data.setup.incomePeriod === "weekly" ? "weekly" : "monthly");
        }
      } catch (err) {
        console.error("Failed to load income setup", err);
      }
    }
    loadIncome();
  }, []);

  useEffect(() => {
    if (!user) return;
    const timer = window.setTimeout(() => {
      setFullName(user.name);
      setGender(user.gender ?? "");
      setSelectedRoles(user.role);
      setCustomRole(user.customRole ?? "");
      setRegion(user.region ?? "");
      setAvatar(user.avatar ?? "");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [user]);

  useEffect(() => {
    if (!showDeleteModal) return;
    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !deleting) {
        setShowDeleteModal(false);
        setDeletePassword("");
        setDeleteConfirm("");
        setPrivacyMsg("");
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [showDeleteModal, deleting]);

  function toggleRole(roleName: string) {
    setSelectedRoles((prev) =>
      prev.includes(roleName) ? prev.filter((r) => r !== roleName) : [...prev, roleName]
    );
  }

  async function handlePhotoSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      setAvatar(await prepareProfilePhoto(file));
      setProfileMsg("Photo ready. Save your changes to keep it.");
    } catch (error) {
      setProfileMsg(error instanceof Error ? error.message : "Unable to prepare that photo.");
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts.shift() || "";
    const lastName = nameParts.join(" ");
    if (!firstName || !lastName || (selectedRoles.length === 0 && !customRole.trim())) {
      setProfileMsg("Enter a first and last name and select or describe your role.");
      return;
    }
    try {
      await apiClient.patch("/users/me", {
        firstName,
        lastName,
        gender: gender.trim() || null,
        avatarUrl: avatar || null,
        roles: selectedRoles.map((role) => role.toUpperCase()),
        customRole: customRole.trim() || null,
        region: region.trim() || null,
      });
      await refreshUser();
      setProfileMsg("Profile settings updated.");
    } catch {
      setProfileMsg("Unable to update profile. Please try again.");
    }
  }

  async function handleSaveIncome(e: React.FormEvent) {
    e.preventDefault();
    if (!income || Number(income) <= 0) return;
    try {
      setIncomeLoading(true);
      setIncomeMsg("");
      await incomeSetupService.saveIncomeSetup(Number(income), period);
      setIncomeMsg("Income plan updated!");
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
    localStorage.setItem("casha_budget_alerts", String(budgetAlerts));
    localStorage.setItem("casha_weekly_summary", String(weeklySummary));
    setPrefMsg("Preferences saved on this device.");
  }

  async function handleExportData() {
    try {
      const response = await apiClient.get("/users/me/export", { responseType: "blob" });
      const blob = response.data instanceof Blob
        ? response.data
        : new Blob([response.data], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          });
      const destination = await saveExportFile(blob, `casha-ba-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
      setPrivacyMsg(destination === 'shared' ? 'Your Excel export is ready in the Android save/share sheet.' : 'Your Excel data export has been downloaded.');
    } catch {
      setPrivacyMsg("Unable to export your data right now.");
    }
  }

  async function handleDeleteAccount() {
    const googleAccount = user?.authMethod === "GOOGLE";
    if (deleteConfirm !== "DELETE" || (!googleAccount && !deletePassword)) {
      setPrivacyMsg(googleAccount ? "Type DELETE to confirm." : "Enter your password and type DELETE to confirm.");
      return;
    }
    try {
      setDeleting(true);
      await apiClient.delete("/users/me", { data: { password: deletePassword, confirmation: deleteConfirm } });
      await logout();
    } catch (error) {
      setPrivacyMsg(axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message || "Account deletion failed. Please try again." : "Account deletion failed. Please try again.");
      setDeleting(false);
    }
  }

  function closeDeleteModal() {
    if (deleting) return;
    setShowDeleteModal(false);
    setDeletePassword("");
    setDeleteConfirm("");
    setPrivacyMsg("");
  }

  // Format member since date like "May 2026"
  const memberSinceFormatted = user?.memberSince
    ? new Date(user.memberSince).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "May 2026";

  return (
    <div className="flex min-h-screen bg-[#f7f9f8] font-sans">
      <Sidebar />
      <main className="app-main">
        {/* Header */}
        <div className="app-page-header flex items-center justify-between mb-6 pb-2">
          <h1>Settings</h1>
        </div>

        {/* Horizontal Navigation Tabs matching Figma */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-8 overflow-x-auto">
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
                      {avatar ? (
                        <Image src={avatar} alt="Profile photo" fill sizes="112px" unoptimized className="object-cover" />
                      ) : (
                        <span className="text-3xl font-bold text-[#186849]">
                          {user?.name ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "AC"}
                        </span>
                      )}
                    </div>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handlePhotoSelected}
                      className="sr-only"
                      aria-label="Choose profile photo"
                    />
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="rounded-lg border border-emerald-600 bg-white px-5 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                    >
                      Upload Photo
                    </button>
                    {avatar && (
                      <button type="button" onClick={() => setAvatar("")} className="text-[11px] font-semibold text-gray-400 hover:text-red-600">
                        Remove photo
                      </button>
                    )}
                    <p className="text-center text-[10px] text-gray-400">PNG, JPG, or WebP up to 5 MB</p>
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
                        value={user?.email || ""}
                        readOnly
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3.5 py-2 text-xs text-gray-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Gender</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        required
                        className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition"
                      >
                        <option value="" disabled>Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
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
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Other role (optional)</label>
                      <input
                        type="text"
                        value={customRole}
                        onChange={(e) => setCustomRole(e.target.value)}
                        placeholder="e.g. Small business owner"
                        className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2 text-xs text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">General region (optional)</label>
                      <input type="text" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="e.g. Metro Manila" className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2 text-xs text-gray-900" />
                      <p className="mt-1 text-[10px] text-gray-400">Used only in aggregated administrator reports. Do not enter a street address.</p>
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
                    <span>Access</span>
                  </div>
                  <Link href={ROUTES.SUBSCRIPTION} className="font-semibold text-emerald-700 hover:underline">
                    {planError ? "View plan" : subscription ? subscription.planName : "Loading plan…"}
                  </Link>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2 text-gray-700 font-medium">
                    <span>🛡️</span>
                    <span>Status</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold text-gray-900">
                    <span>{user?.accountStatus === "SUSPENDED" ? "Suspended" : "Active"}</span>
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
            <p className="text-xs text-gray-400 mb-6">Manage expected income and the planning period. Safe-to-Spend uses only income recorded as received.</p>

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
                {incomeLoading ? "Saving..." : "Save Income Plan"}
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
                  <p>Financial Insight Cards</p>
                  <p className="text-[11px] text-gray-400 font-normal">Show personalized summary cards on the dashboard</p>
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
          <div className="bg-white rounded-3xl border border-gray-200/90 p-8 shadow-sm max-w-2xl space-y-4">
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
            <div className="p-4 rounded-xl border border-gray-200 space-y-3 text-xs">
              <div><p className="font-bold text-gray-900">Your data and privacy</p><p className="mt-1 text-[11px] text-gray-500">Casha-ba stores the records you enter or import. AI assistance sends your message and a minimized financial summary to Google Gemini; receipt scanning sends the selected image. Avoid sharing account numbers and unrelated personal details. Casha-ba does not save scanner images. Provider processing follows its service terms. Subscription checkout uses PayMongo; financial records do not connect to bank or e-wallet balances.</p></div>
              <button type="button" onClick={handleExportData} className="rounded-lg border border-emerald-600 px-4 py-2 font-semibold text-emerald-700">Download my data (Excel)</button>
              <div className="border-t border-gray-100 pt-3 space-y-2">
                <p className="font-bold text-red-700">Permanently delete account</p>
                <p className="text-[11px] text-gray-500">This permanently removes your profile and associated financial records and cannot be undone.</p>
                <button
                  type="button"
                  onClick={() => {
                    setPrivacyMsg("");
                    setShowDeleteModal(true);
                  }}
                  className="rounded-lg bg-red-700 px-4 py-2 font-semibold text-white transition hover:bg-red-800"
                >
                  Delete my account
                </button>
              </div>
              {privacyMsg && <p className="font-semibold text-gray-700">{privacyMsg}</p>}
            </div>
          </div>
        )}
      </main>

      {showDeleteModal && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/65 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDeleteModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            aria-describedby="delete-account-description"
            className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-6 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-600">Permanent action</p>
                <h2 id="delete-account-title" className="mt-2 text-xl font-bold text-gray-900">Delete your account?</h2>
              </div>
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                aria-label="Close delete account confirmation"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xl text-gray-500 transition hover:bg-gray-100 disabled:opacity-40"
              >
                ×
              </button>
            </div>

            <p id="delete-account-description" className="mt-3 text-sm leading-6 text-gray-600">
              Your profile, wallets, transactions, budgets, goals, obligations, and other financial records will be permanently removed. Any PayMongo subscription must be cancelled first; if cancellation fails, your account will remain available. This cannot be undone.
            </p>

            <form
              className="mt-5 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void handleDeleteAccount();
              }}
            >
              {user?.authMethod !== "GOOGLE" && <div>
                <label htmlFor="delete-password" className="field-label">Current password</label>
                <input
                  id="delete-password"
                  type="password"
                  value={deletePassword}
                  onChange={(event) => setDeletePassword(event.target.value)}
                  autoComplete="current-password"
                  className="modal-input"
                  autoFocus
                  required
                />
              </div>}
              {user?.authMethod === "GOOGLE" && <p className="rounded-xl bg-blue-50 p-3 text-xs text-blue-800">You signed in with Google. Your current authenticated session confirms your identity.</p>}
              <div>
                <label htmlFor="delete-confirm" className="field-label">Type DELETE to confirm</label>
                <input
                  id="delete-confirm"
                  type="text"
                  value={deleteConfirm}
                  onChange={(event) => setDeleteConfirm(event.target.value)}
                  className="modal-input"
                  placeholder="DELETE"
                  required
                />
              </div>

              {privacyMsg && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{privacyMsg}</p>}

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button type="button" onClick={closeDeleteModal} disabled={deleting} className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-40">
                  Cancel
                </button>
                <button type="submit" disabled={deleting || deleteConfirm !== "DELETE" || (user?.authMethod !== "GOOGLE" && !deletePassword)} className="rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-40">
                  {deleting ? "Deleting..." : "Delete permanently"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
