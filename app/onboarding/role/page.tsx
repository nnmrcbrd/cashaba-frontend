"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";

const ROLES = ["Student", "Working", "Freelance", "Married"] as const;

export default function OnboardingRolePage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(role: string) {
    setSelected((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }

  function handleContinue() {
    router.push(ROUTES.ONBOARDING_INCOME);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#eff2f0] px-4 font-sans">
      <div className="w-full max-w-lg rounded-[28px] bg-white p-10 shadow-lg border border-gray-100 text-center">
        <h1 className="mb-2 text-xl font-bold text-gray-900 tracking-tight">Get started on Casha- Ba</h1>
        <p className="mb-8 text-xs font-semibold text-gray-700 text-left">Role (Select all that apply)</p>

        <div className="space-y-4 mb-8 text-left">
          {ROLES.map((role) => {
            const isChecked = selected.includes(role);
            return (
              <div
                key={role}
                onClick={() => toggle(role)}
                className="w-full border border-gray-400 p-4 rounded-sm flex items-center gap-4 cursor-pointer hover:border-emerald-600 transition"
              >
                <div className={`h-5 w-5 border border-gray-500 rounded-sm flex items-center justify-center ${isChecked ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white"}`}>
                  {isChecked && "✓"}
                </div>
                <span className="text-sm font-semibold text-gray-900">{role}</span>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleContinue}
          disabled={selected.length === 0}
          className="w-48 rounded-full bg-[#2bb673] hover:bg-[#24a164] text-white font-medium py-3 text-sm shadow-sm transition-all duration-200 cursor-pointer disabled:opacity-50 mx-auto block"
        >
          Next
        </button>
      </div>
    </div>
  );
}