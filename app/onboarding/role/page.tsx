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
    <div className="flex min-h-screen items-center justify-center bg-brand-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <p className="mb-1 text-xs font-semibold text-brand-600">Step 1 of 2</p>
        <h1 className="mb-1 text-2xl font-bold text-brand-900">What describes you best?</h1>
        <p className="mb-6 text-sm text-gray-500">Select all that apply. This helps us tailor your budget.</p>

        <div className="mb-6 grid grid-cols-2 gap-3">
          {ROLES.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => toggle(role)}
              className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                selected.includes(role)
                  ? "border-brand-600 bg-brand-50 text-brand-700"
                  : "border-gray-200 text-gray-600 hover:border-brand-300"
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        <button
          onClick={handleContinue}
          disabled={selected.length === 0}
          className="btn-primary"
        >
          Continue
        </button>
      </div>
    </div>
  );
}