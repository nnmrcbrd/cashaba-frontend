"use client";

import { useState } from "react";
import Link from "next/link";
import Sidebar from "../components/ui/sidebar";
import { useAuth } from "@/context/Authcontext";
import { ROUTES } from "@/constants/index";

const TABS = ["Profile", "Income", "Preferences", "Security"] as const;

export default function SettingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Profile");

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-gray-50 p-8">
        <h1 className="text-2xl font-bold text-brand-900">Settings</h1>
        <p className="mb-6 text-sm text-gray-500">Manage your account and preferences.</p>

        <div className="mb-6 flex gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                tab === t ? "bg-brand-600 text-white" : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="card max-w-lg">
          {tab === "Profile" && (
            <div className="space-y-4">
              <Field label="Full name" defaultValue={user?.name ?? ""} />
              <Field label="Email" defaultValue={user?.email ?? ""} />
              <Field label="Phone" defaultValue={user?.phone ?? ""} />
              <button className="btn-primary w-auto px-5">Save changes</button>
            </div>
          )}

          {tab === "Income" && (
            <div className="space-y-4">
              <Field label="Monthly income" defaultValue="45000" type="number" />
              <Field label="Income source" defaultValue="Salary" />
              <button className="btn-primary w-auto px-5">Save changes</button>
            </div>
          )}

          {tab === "Preferences" && (
            <div className="space-y-4">
              <label className="flex items-center justify-between text-sm text-gray-700">
                Budget alerts
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </label>
              <label className="flex items-center justify-between text-sm text-gray-700">
                Weekly summary email
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </label>
              <label className="flex items-center justify-between text-sm text-gray-700">
                Dark mode
                <input type="checkbox" className="h-4 w-4" />
              </label>
            </div>
          )}

          {tab === "Security" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Keep your account secure.</p>
              <Link href={ROUTES.CHANGE_PASSWORD} className="btn-primary block w-auto px-5 text-center">
                Change password
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  defaultValue,
  type = "text",
}: {
  label: string;
  defaultValue: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-gray-600">{label}</label>
      <input className="input" type={type} defaultValue={defaultValue} />
    </div>
  );
}