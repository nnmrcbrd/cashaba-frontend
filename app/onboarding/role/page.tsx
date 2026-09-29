"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  GraduationCap,
  Laptop,
  UsersRound,
} from "lucide-react";
import { ROUTES } from "@/constants";
import { useAuth } from "@/context/Authcontext";
import apiClient from "@/lib/apiClient";
import OnboardingShell, {
  onboardingPrimaryButtonClass,
} from "@/app/components/onboarding/OnboardingShell";

const ROLES = [
  { value: "Student", description: "Allowance, school costs, and study goals", icon: GraduationCap },
  { value: "Working", description: "Salary, bills, and regular savings", icon: BriefcaseBusiness },
  { value: "Freelance", description: "Variable income and flexible planning", icon: Laptop },
  { value: "Married", description: "Shared obligations and household goals", icon: UsersRound },
] as const;

export default function OnboardingRolePage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [selected, setSelected] = useState<string[]>(() =>
    (user?.role || []).filter((role) => ROLES.some((item) => item.value === role)),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [customRole, setCustomRole] = useState(user?.customRole || "");

  function toggle(role: string) {
    setSelected((current) =>
      current.includes(role)
        ? current.filter((item) => item !== role)
        : [...current, role],
    );
  }

  async function handleContinue(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || (selected.length === 0 && !customRole.trim())) return;

    setSaving(true);
    setError("");
    const nameParts = user.name.trim().split(/\s+/);
    const firstName = nameParts.shift() || "User";
    const lastName = nameParts.join(" ") || "User";

    try {
      await apiClient.patch("/users/me", {
        firstName,
        lastName,
        gender: user.gender || null,
        roles: selected.map((role) => role.toUpperCase()),
        customRole: customRole.trim() || null,
      });
      await refreshUser();
      router.push(ROUTES.ONBOARDING_INCOME);
    } catch {
      setError("Unable to save your profile type. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <OnboardingShell
      step={1}
      title="Tell us what best describes you"
      description="Choose every option that applies. This helps Casha-Ba present setup guidance in a way that fits your situation."
      asideTitle="Start with the way you manage money."
      asideDescription="Your profile type provides context for the setup experience. It does not change your access or lock features behind a plan."
    >
      <form onSubmit={handleContinue}>
        <fieldset>
          <legend className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            Select all that apply
          </legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {ROLES.map((role) => {
              const selectedRole = selected.includes(role.value);
              const RoleIcon = role.icon;
              return (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => toggle(role.value)}
                  aria-pressed={selectedRole}
                  className={`flex min-h-24 items-center gap-4 rounded-2xl border p-4 text-left transition ${
                    selectedRole
                      ? "border-emerald-600 bg-emerald-50 shadow-[0_8px_24px_rgba(5,150,105,0.08)]"
                      : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40"
                  }`}
                >
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
                    selectedRole ? "bg-[#0b6b4f] text-white" : "bg-slate-100 text-slate-600"
                  }`}>
                    <RoleIcon size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-900">{role.value}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">{role.description}</span>
                  </span>
                  <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                    selectedRole ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300"
                  }`}>
                    {selectedRole && <Check size={12} strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
        <div className="mt-4">
          <label htmlFor="custom-role" className="text-xs font-semibold text-slate-700">Another role (optional)</label>
          <input id="custom-role" value={customRole} onChange={(event) => setCustomRole(event.target.value)} maxLength={80} placeholder="e.g. Small business owner or homemaker" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={(selected.length === 0 && !customRole.trim()) || saving || !user}
          className={`${onboardingPrimaryButtonClass} mt-7`}
        >
          {saving ? "Saving profile..." : "Continue to income"}
          {!saving && <ArrowRight size={17} />}
        </button>
      </form>
    </OnboardingShell>
  );
}
